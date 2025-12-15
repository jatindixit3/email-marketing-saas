// BullMQ Worker for Processing Email Campaign Jobs
// Runs as a separate process to send emails

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis';
import { CampaignEmailJob, JobProgress, QUEUE_NAMES } from './email-queue';
import { createSESService, BatchSendResult } from '../email/ses-service';
import { createClient } from '../supabase/server';

/**
 * Process a single email campaign job
 */
async function processCampaignJob(job: Job<CampaignEmailJob>): Promise<BatchSendResult> {
  const {
    campaignId,
    userId,
    subject,
    htmlContent,
    textContent,
    recipients,
    fromName,
    fromEmail,
    replyToEmail,
    batchNumber,
    totalBatches,
  } = job.data;

  console.log(
    `Processing job ${job.id}: Campaign ${campaignId}${
      batchNumber ? ` (Batch ${batchNumber}/${totalBatches})` : ''
    }`
  );
  console.log(`Recipients: ${recipients.length}`);

  // Update campaign status to 'sending' in database
  await updateCampaignStatus(campaignId, 'sending');

  // Create SES service
  const sesService = createSESService();

  // Base URL for tracking links
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Send emails with progress tracking
  const result = await sesService.sendCampaign(
    {
      campaignId,
      subject,
      htmlContent,
      textContent,
      recipients,
      fromName,
      fromEmail,
      replyToEmail,
      baseUrl,
    },
    (currentBatch, batchResult) => {
      // Update job progress
      const progress: JobProgress = {
        total: recipients.length,
        sent: batchResult.successful,
        failed: batchResult.failed,
        currentBatch: batchNumber || currentBatch,
        totalBatches: totalBatches || 1,
      };

      job.updateProgress(progress);

      // Update campaign stats in database
      updateCampaignStats(campaignId, batchResult);
    }
  );

  console.log(
    `Job ${job.id} completed: ${result.successful} sent, ${result.failed} failed`
  );

  // Save email events to database
  await saveEmailEvents(campaignId, result);

  // Update campaign status to 'sent' if this was the last batch
  if (!batchNumber || batchNumber === totalBatches) {
    await updateCampaignStatus(campaignId, 'sent');
  }

  return result;
}

/**
 * Update campaign status in database
 */
async function updateCampaignStatus(
  campaignId: string,
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('campaigns')
      .update({
        status,
        ...(status === 'sent' && { sent_at: new Date().toISOString() }),
      })
      .eq('id', campaignId);

    if (error) {
      console.error(`Failed to update campaign status:`, error);
    } else {
      console.log(`Campaign ${campaignId} status updated to: ${status}`);
    }
  } catch (error) {
    console.error('Error updating campaign status:', error);
  }
}

/**
 * Update campaign statistics in database
 */
async function updateCampaignStats(
  campaignId: string,
  result: BatchSendResult
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get current stats
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('emails_sent, emails_delivered')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      console.error(`Campaign ${campaignId} not found`);
      return;
    }

    // Update stats (increment by batch results)
    const { error } = await supabase
      .from('campaigns')
      .update({
        emails_sent: (campaign.emails_sent || 0) + result.successful,
        recipient_count: result.total,
      })
      .eq('id', campaignId);

    if (error) {
      console.error('Failed to update campaign stats:', error);
    }
  } catch (error) {
    console.error('Error updating campaign stats:', error);
  }
}

/**
 * Save email events to database
 */
async function saveEmailEvents(
  campaignId: string,
  result: BatchSendResult
): Promise<void> {
  try {
    const supabase = await createClient();

    // Create email events for all sent emails
    const events = result.results
      .filter((r) => r.success)
      .map((r) => ({
        campaign_id: campaignId,
        contact_id: r.recipientId,
        event_type: 'sent',
        metadata: {
          message_id: r.messageId,
        },
        created_at: new Date().toISOString(),
      }));

    if (events.length > 0) {
      // Insert in batches of 1000 (Supabase limit)
      const batchSize = 1000;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);

        const { error } = await supabase.from('email_events').insert(batch);

        if (error) {
          console.error('Failed to save email events:', error);
        }
      }

      console.log(`Saved ${events.length} email events for campaign ${campaignId}`);
    }

    // Log failed emails
    const failedEmails = result.results.filter((r) => !r.success);
    if (failedEmails.length > 0) {
      console.error(
        `Failed to send ${failedEmails.length} emails:`,
        failedEmails.map((r) => ({ email: r.email, error: r.error }))
      );
    }
  } catch (error) {
    console.error('Error saving email events:', error);
  }
}

/**
 * Create and start the email worker
 */
export function createEmailWorker(): Worker<CampaignEmailJob> {
  const connection = getRedisConnection();

  const worker = new Worker<CampaignEmailJob>(
    QUEUE_NAMES.EMAIL_CAMPAIGN,
    async (job) => {
      try {
        return await processCampaignJob(job);
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection,
      concurrency: 1, // Process one campaign at a time to respect rate limits
      limiter: {
        max: 1, // Maximum 1 job per duration
        duration: 1000, // 1 second (adjust based on your needs)
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job, result: BatchSendResult) => {
    console.log(
      `Job ${job.id} completed successfully: ${result.successful}/${result.total} emails sent`
    );
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);

    // Update campaign status to failed
    if (job?.data?.campaignId) {
      updateCampaignStatus(job.data.campaignId, 'draft');
    }
  });

  worker.on('progress', (job, progress: JobProgress) => {
    console.log(
      `Job ${job.id} progress: ${progress.sent}/${progress.total} sent, ${progress.failed} failed`
    );
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('Email worker started and listening for jobs...');

  return worker;
}

/**
 * Graceful shutdown of worker
 */
export async function shutdownWorker(worker: Worker): Promise<void> {
  console.log('Shutting down worker...');
  await worker.close();
  console.log('Worker shut down gracefully');
}

// For running as standalone worker process
if (require.main === module) {
  const worker = createEmailWorker();

  // Graceful shutdown on SIGTERM or SIGINT
  process.on('SIGTERM', async () => {
    await shutdownWorker(worker);
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await shutdownWorker(worker);
    process.exit(0);
  });
}
