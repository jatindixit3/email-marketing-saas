// BullMQ Email Queue Configuration
// Manages email campaign sending jobs

import { Queue, QueueOptions } from 'bullmq';
import { getRedisConnection } from './redis';
import { EmailRecipient } from '../email/ses-service';

/**
 * Job data for campaign email sending
 */
export interface CampaignEmailJob {
  campaignId: string;
  userId: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  recipients: EmailRecipient[];
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  batchNumber?: number;
  totalBatches?: number;
}

/**
 * Job progress data
 */
export interface JobProgress {
  total: number;
  sent: number;
  failed: number;
  currentBatch?: number;
  totalBatches?: number;
}

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  EMAIL_CAMPAIGN: 'email-campaign',
} as const;

/**
 * Create BullMQ queue instance
 */
export function createEmailQueue(): Queue<CampaignEmailJob> {
  const connection = getRedisConnection();

  const queueOptions: QueueOptions = {
    connection,
    defaultJobOptions: {
      attempts: 3, // Retry failed jobs up to 3 times
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 second delay
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  };

  return new Queue<CampaignEmailJob>(QUEUE_NAMES.EMAIL_CAMPAIGN, queueOptions);
}

/**
 * Shared email queue instance
 */
let emailQueue: Queue<CampaignEmailJob> | null = null;

export function getEmailQueue(): Queue<CampaignEmailJob> {
  if (!emailQueue) {
    emailQueue = createEmailQueue();

    // Log queue events
    emailQueue.on('error', (err) => {
      console.error('Email queue error:', err);
    });

    emailQueue.on('waiting', (job) => {
      console.log(`Job ${job.id} is waiting`);
    });

    console.log('Email queue initialized');
  }

  return emailQueue;
}

/**
 * Add campaign to email queue
 */
export async function addCampaignToQueue(
  jobData: CampaignEmailJob,
  priority?: number
): Promise<string> {
  const queue = getEmailQueue();

  const job = await queue.add(
    `campaign-${jobData.campaignId}`,
    jobData,
    {
      priority: priority || 1, // Lower number = higher priority
      jobId: `${jobData.campaignId}-${Date.now()}`, // Unique job ID
    }
  );

  console.log(`Campaign ${jobData.campaignId} added to queue with job ID: ${job.id}`);

  return job.id || '';
}

/**
 * Add campaign in batches to queue
 * Useful for very large campaigns that need to be split
 */
export async function addCampaignBatchesToQueue(
  jobData: CampaignEmailJob,
  batchSize: number = 500
): Promise<string[]> {
  const jobIds: string[] = [];
  const totalRecipients = jobData.recipients.length;
  const totalBatches = Math.ceil(totalRecipients / batchSize);

  console.log(
    `Splitting campaign ${jobData.campaignId} into ${totalBatches} batches of ${batchSize}`
  );

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalRecipients);
    const batchRecipients = jobData.recipients.slice(start, end);

    const batchJob: CampaignEmailJob = {
      ...jobData,
      recipients: batchRecipients,
      batchNumber: i + 1,
      totalBatches,
    };

    const jobId = await addCampaignToQueue(batchJob, i + 1); // Priority increases with batch number
    jobIds.push(jobId);
  }

  console.log(`Added ${totalBatches} batch jobs for campaign ${jobData.campaignId}`);

  return jobIds;
}

/**
 * Get job status and progress
 */
export async function getJobStatus(jobId: string): Promise<{
  state: string;
  progress: JobProgress | null;
  result: any;
}> {
  const queue = getEmailQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const state = await job.getState();
  const progress = (await job.progress) as JobProgress | null;
  const result = job.returnvalue;

  return {
    state,
    progress,
    result,
  };
}

/**
 * Get all jobs for a campaign
 */
export async function getCampaignJobs(campaignId: string): Promise<any[]> {
  const queue = getEmailQueue();

  // Get all jobs (active, waiting, delayed, completed, failed)
  const [active, waiting, delayed, completed, failed] = await Promise.all([
    queue.getActive(),
    queue.getWaiting(),
    queue.getDelayed(),
    queue.getCompleted(),
    queue.getFailed(),
  ]);

  const allJobs = [...active, ...waiting, ...delayed, ...completed, ...failed];

  // Filter jobs for this campaign
  return allJobs.filter((job) => job.data.campaignId === campaignId);
}

/**
 * Cancel a campaign (remove all pending jobs)
 */
export async function cancelCampaign(campaignId: string): Promise<number> {
  const jobs = await getCampaignJobs(campaignId);
  let cancelledCount = 0;

  for (const job of jobs) {
    const state = await job.getState();

    // Only cancel jobs that haven't started yet
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      cancelledCount++;
    }
  }

  console.log(`Cancelled ${cancelledCount} pending jobs for campaign ${campaignId}`);

  return cancelledCount;
}

/**
 * Pause the email queue
 */
export async function pauseEmailQueue(): Promise<void> {
  const queue = getEmailQueue();
  await queue.pause();
  console.log('Email queue paused');
}

/**
 * Resume the email queue
 */
export async function resumeEmailQueue(): Promise<void> {
  const queue = getEmailQueue();
  await queue.resume();
  console.log('Email queue resumed');
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getEmailQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

/**
 * Close the email queue (for graceful shutdown)
 */
export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
    console.log('Email queue closed');
  }
}
