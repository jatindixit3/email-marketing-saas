// Campaign Scheduler Service
// Manages scheduled campaigns and triggers sending

import { createClient } from '@/lib/supabase/server';
import { addCampaignToQueue } from '@/lib/queue/email-queue';
import { toUTC, fromUTC, isInPast } from './timezone';

/**
 * Campaign status types
 */
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled';

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  campaignId: string;
  scheduledTime: Date; // UTC
  timezone: string;
  userId: string;
}

/**
 * Reschedule request
 */
export interface RescheduleRequest {
  campaignId: string;
  newScheduledTime: Date; // In user's timezone
  timezone: string;
}

/**
 * Campaign Scheduler Service
 * Handles scheduling, triggering, and managing scheduled campaigns
 */
export class CampaignScheduler {
  /**
   * Schedule a campaign for future sending
   * @param config - Schedule configuration
   * @returns Success status
   */
  static async scheduleCampaign(config: ScheduleConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Validate scheduled time is not in the past
      if (isInPast(config.scheduledTime)) {
        return {
          success: false,
          error: 'Scheduled time cannot be in the past',
        };
      }

      // Update campaign status and scheduled time
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'scheduled',
          scheduled_at: config.scheduledTime.toISOString(),
          timezone: config.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.campaignId)
        .eq('user_id', config.userId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error scheduling campaign:', error);
      return {
        success: false,
        error: error.message || 'Failed to schedule campaign',
      };
    }
  }

  /**
   * Get campaigns that are due to be sent
   * Checks for campaigns with status 'scheduled' and scheduled_at <= now
   * @returns List of campaign IDs ready to send
   */
  static async getDueCampaigns(): Promise<string[]> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now)
        .is('deleted_at', null);

      if (error) {
        throw new Error(error.message);
      }

      return data?.map((c) => c.id) || [];
    } catch (error) {
      console.error('Error fetching due campaigns:', error);
      return [];
    }
  }

  /**
   * Trigger a scheduled campaign to start sending
   * Updates status to 'sending' and adds to email queue
   * @param campaignId - Campaign ID to trigger
   * @returns Success status and job ID
   */
  static async triggerCampaign(campaignId: string): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Get campaign details
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (fetchError || !campaign) {
        return {
          success: false,
          error: 'Campaign not found',
        };
      }

      // Validate campaign is ready to send
      if (!campaign.html_content) {
        return {
          success: false,
          error: 'Campaign has no email content',
        };
      }

      if (!campaign.list_id) {
        return {
          success: false,
          error: 'Campaign has no contact list',
        };
      }

      // Update status to sending
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'sending',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Add to email queue
      const jobId = await addCampaignToQueue({
        campaignId: campaign.id,
        userId: campaign.user_id,
        listId: campaign.list_id,
        subject: campaign.subject || 'No Subject',
        htmlContent: campaign.html_content,
        fromEmail: campaign.from_email || process.env.AWS_SES_FROM_EMAIL || '',
        fromName: campaign.from_name || process.env.AWS_SES_FROM_NAME || '',
        replyTo: campaign.reply_to || process.env.AWS_SES_REPLY_TO_EMAIL,
      });

      return {
        success: true,
        jobId,
      };
    } catch (error: any) {
      console.error('Error triggering campaign:', error);

      // Rollback: Update status back to scheduled
      try {
        const supabase = await createClient();
        await supabase
          .from('campaigns')
          .update({ status: 'scheduled' })
          .eq('id', campaignId);
      } catch (rollbackError) {
        console.error('Error rolling back campaign status:', rollbackError);
      }

      return {
        success: false,
        error: error.message || 'Failed to trigger campaign',
      };
    }
  }

  /**
   * Cancel a scheduled campaign
   * @param campaignId - Campaign ID to cancel
   * @param userId - User ID for authorization
   * @returns Success status
   */
  static async cancelScheduledCampaign(
    campaignId: string,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Get campaign to verify it's scheduled
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !campaign) {
        return {
          success: false,
          error: 'Campaign not found',
        };
      }

      if (campaign.status !== 'scheduled') {
        return {
          success: false,
          error: `Cannot cancel campaign with status: ${campaign.status}`,
        };
      }

      // Update status to cancelled
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'cancelled',
          scheduled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling campaign:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel campaign',
      };
    }
  }

  /**
   * Reschedule a campaign to a new time
   * @param request - Reschedule request with new time
   * @param userId - User ID for authorization
   * @returns Success status
   */
  static async rescheduleCampaign(
    request: RescheduleRequest,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Get campaign to verify it's scheduled
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', request.campaignId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !campaign) {
        return {
          success: false,
          error: 'Campaign not found',
        };
      }

      if (campaign.status !== 'scheduled') {
        return {
          success: false,
          error: `Cannot reschedule campaign with status: ${campaign.status}`,
        };
      }

      // Convert new time to UTC
      const utcTime = toUTC(request.newScheduledTime, request.timezone);

      // Validate new time is not in the past
      if (isInPast(utcTime)) {
        return {
          success: false,
          error: 'New scheduled time cannot be in the past',
        };
      }

      // Update scheduled time
      const { error } = await supabase
        .from('campaigns')
        .update({
          scheduled_at: utcTime.toISOString(),
          timezone: request.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.campaignId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error rescheduling campaign:', error);
      return {
        success: false,
        error: error.message || 'Failed to reschedule campaign',
      };
    }
  }

  /**
   * Get campaign scheduling info
   * @param campaignId - Campaign ID
   * @param userId - User ID for authorization
   * @returns Campaign schedule details
   */
  static async getCampaignSchedule(
    campaignId: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: {
      status: CampaignStatus;
      scheduledAt: Date | null;
      timezone: string | null;
      sentAt: Date | null;
    };
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('status, scheduled_at, timezone, sent_at')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (error || !campaign) {
        return {
          success: false,
          error: 'Campaign not found',
        };
      }

      return {
        success: true,
        data: {
          status: campaign.status as CampaignStatus,
          scheduledAt: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
          timezone: campaign.timezone,
          sentAt: campaign.sent_at ? new Date(campaign.sent_at) : null,
        },
      };
    } catch (error: any) {
      console.error('Error fetching campaign schedule:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch campaign schedule',
      };
    }
  }

  /**
   * Process all due campaigns
   * Called by cron job every minute
   * @returns Number of campaigns triggered
   */
  static async processDueCampaigns(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: { campaignId: string; error: string }[];
  }> {
    const dueCampaignIds = await this.getDueCampaigns();
    const results = {
      processed: dueCampaignIds.length,
      succeeded: 0,
      failed: 0,
      errors: [] as { campaignId: string; error: string }[],
    };

    for (const campaignId of dueCampaignIds) {
      const result = await this.triggerCampaign(campaignId);

      if (result.success) {
        results.succeeded++;
        console.log(`✓ Triggered campaign ${campaignId}, job ID: ${result.jobId}`);
      } else {
        results.failed++;
        results.errors.push({
          campaignId,
          error: result.error || 'Unknown error',
        });
        console.error(`✗ Failed to trigger campaign ${campaignId}:`, result.error);
      }
    }

    return results;
  }
}
