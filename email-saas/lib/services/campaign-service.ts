// Campaign Service
// Orchestrates campaign sending through the queue system

import { createClient } from '@/lib/supabase/server';
import { addCampaignToQueue, addCampaignBatchesToQueue } from '@/lib/queue/email-queue';
import { EmailRecipient } from '@/lib/email/ses-service';

/**
 * Campaign send options
 */
export interface SendCampaignOptions {
  sendImmediately?: boolean; // If false, will schedule for later
  scheduledAt?: Date; // When to send (if not immediate)
  batchSize?: number; // Size of batches (default: 500)
  priority?: number; // Job priority (lower = higher priority)
}

/**
 * Campaign send result
 */
export interface SendCampaignResult {
  success: boolean;
  jobIds: string[];
  message: string;
  totalRecipients: number;
  totalBatches: number;
}

/**
 * Service for managing email campaigns
 */
export class CampaignService {
  /**
   * Send a campaign by queuing it for processing
   */
  static async sendCampaign(
    campaignId: string,
    userId: string,
    options: SendCampaignOptions = {}
  ): Promise<SendCampaignResult> {
    try {
      const supabase = await createClient();

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Validate campaign status
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new Error(`Campaign cannot be sent. Current status: ${campaign.status}`);
      }

      // Get campaign lists
      const { data: campaignLists, error: listsError } = await supabase
        .from('campaign_lists')
        .select('list_id')
        .eq('campaign_id', campaignId);

      if (listsError || !campaignLists || campaignLists.length === 0) {
        throw new Error('No lists selected for campaign');
      }

      const listIds = campaignLists.map((cl) => cl.list_id);

      // Get all contacts from selected lists
      const recipients = await this.getRecipientsFromLists(listIds, userId);

      if (recipients.length === 0) {
        throw new Error('No recipients found in selected lists');
      }

      // Check user's email limit
      await this.checkEmailLimit(userId, recipients.length);

      // Prepare campaign job data
      const jobData = {
        campaignId,
        userId,
        subject: campaign.subject,
        htmlContent: campaign.html_content,
        textContent: campaign.text_content || undefined,
        recipients,
        fromName: campaign.from_name || undefined,
        fromEmail: campaign.from_email || undefined,
        replyToEmail: campaign.reply_to_email || undefined,
      };

      // Queue the campaign
      const batchSize = options.batchSize || 500;
      let jobIds: string[];

      if (recipients.length > batchSize) {
        // Split into multiple batches
        jobIds = await addCampaignBatchesToQueue(jobData, batchSize);
      } else {
        // Single batch
        const jobId = await addCampaignToQueue(jobData, options.priority);
        jobIds = [jobId];
      }

      // Update campaign status and recipient count
      const updateData: any = {
        recipient_count: recipients.length,
      };

      if (options.sendImmediately || !options.scheduledAt) {
        updateData.status = 'scheduled'; // Will be updated to 'sending' by worker
      } else {
        updateData.status = 'scheduled';
        updateData.scheduled_at = options.scheduledAt.toISOString();
      }

      await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId);

      // Update user's monthly email count
      await this.updateUserEmailCount(userId, recipients.length);

      return {
        success: true,
        jobIds,
        message: `Campaign queued successfully with ${jobIds.length} batch(es)`,
        totalRecipients: recipients.length,
        totalBatches: jobIds.length,
      };
    } catch (error: any) {
      console.error('Error sending campaign:', error);

      return {
        success: false,
        jobIds: [],
        message: error.message || 'Failed to send campaign',
        totalRecipients: 0,
        totalBatches: 0,
      };
    }
  }

  /**
   * Get recipients from lists
   */
  private static async getRecipientsFromLists(
    listIds: string[],
    userId: string
  ): Promise<EmailRecipient[]> {
    const supabase = await createClient();

    // Get all contacts from the lists
    const { data: listContacts, error } = await supabase
      .from('list_contacts')
      .select('contact_id')
      .in('list_id', listIds);

    if (error) {
      throw new Error('Failed to fetch list contacts');
    }

    if (!listContacts || listContacts.length === 0) {
      return [];
    }

    // Get unique contact IDs
    const contactIds = [...new Set(listContacts.map((lc) => lc.contact_id))];

    // Get contact details (only subscribed contacts)
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name, company, custom_fields')
      .in('id', contactIds)
      .eq('user_id', userId)
      .eq('status', 'subscribed')
      .is('deleted_at', null);

    if (contactsError) {
      throw new Error('Failed to fetch contacts');
    }

    // Map to EmailRecipient format
    return (contacts || []).map((contact) => ({
      id: contact.id,
      email: contact.email,
      firstName: contact.first_name,
      lastName: contact.last_name,
      company: contact.company,
      customFields: contact.custom_fields || {},
    }));
  }

  /**
   * Check if user has enough email quota
   */
  private static async checkEmailLimit(
    userId: string,
    emailCount: number
  ): Promise<void> {
    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('monthly_email_limit, monthly_emails_sent')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    const remaining = user.monthly_email_limit - user.monthly_emails_sent;

    if (remaining < emailCount) {
      throw new Error(
        `Insufficient email quota. Need ${emailCount}, but only ${remaining} remaining.`
      );
    }
  }

  /**
   * Update user's monthly email count
   */
  private static async updateUserEmailCount(
    userId: string,
    emailCount: number
  ): Promise<void> {
    const supabase = await createClient();

    // Increment monthly_emails_sent
    const { error } = await supabase.rpc('increment_user_email_count', {
      user_id: userId,
      count: emailCount,
    });

    // If RPC doesn't exist, do manual update
    if (error) {
      const { data: user } = await supabase
        .from('users')
        .select('monthly_emails_sent')
        .eq('id', userId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            monthly_emails_sent: user.monthly_emails_sent + emailCount,
          })
          .eq('id', userId);
      }
    }
  }

  /**
   * Schedule a campaign for future sending
   */
  static async scheduleCampaign(
    campaignId: string,
    userId: string,
    scheduledAt: Date
  ): Promise<SendCampaignResult> {
    return this.sendCampaign(campaignId, userId, {
      sendImmediately: false,
      scheduledAt,
    });
  }

  /**
   * Cancel a scheduled campaign
   */
  static async cancelCampaign(
    campaignId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = await createClient();

      // Update campaign status to cancelled
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to cancel campaign');
      }

      // Note: Queue jobs would need to be cancelled separately
      // This requires additional logic in the queue system

      return {
        success: true,
        message: 'Campaign cancelled successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cancel campaign',
      };
    }
  }

  /**
   * Get campaign statistics
   */
  static async getCampaignStats(
    campaignId: string,
    userId: string
  ): Promise<any> {
    const supabase = await createClient();

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (error || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get event counts
    const { data: events } = await supabase
      .from('email_events')
      .select('event_type')
      .eq('campaign_id', campaignId);

    const eventCounts = (events || []).reduce((acc: any, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    return {
      ...campaign,
      events: eventCounts,
    };
  }

  /**
   * Test send campaign to a single email
   */
  static async sendTestEmail(
    campaignId: string,
    userId: string,
    testEmail: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = await createClient();

      // Get campaign details
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (error || !campaign) {
        throw new Error('Campaign not found');
      }

      // Create test recipient
      const testRecipient: EmailRecipient = {
        id: 'test-' + Date.now(),
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
      };

      // Queue test email
      const jobData = {
        campaignId: `test-${campaignId}`,
        userId,
        subject: `[TEST] ${campaign.subject}`,
        htmlContent: campaign.html_content,
        textContent: campaign.text_content || undefined,
        recipients: [testRecipient],
        fromName: campaign.from_name || undefined,
        fromEmail: campaign.from_email || undefined,
        replyToEmail: campaign.reply_to_email || undefined,
      };

      await addCampaignToQueue(jobData, 0); // Highest priority

      return {
        success: true,
        message: `Test email queued to ${testEmail}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send test email',
      };
    }
  }
}
