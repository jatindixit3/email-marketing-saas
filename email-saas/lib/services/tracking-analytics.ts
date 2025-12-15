// Tracking Analytics Service
// Provides comprehensive analytics for email tracking data

import { createClient } from '@/lib/supabase/server';

/**
 * Campaign performance metrics
 */
export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  subject: string;
  status: string;

  // Send stats
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalComplained: number;
  totalUnsubscribed: number;

  // Engagement stats
  totalOpened: number;
  totalClicked: number;
  uniqueOpens: number;
  uniqueClicks: number;

  // Calculated rates
  deliveryRate: number; // delivered / sent
  openRate: number; // unique opens / delivered
  clickRate: number; // unique clicks / delivered
  clickToOpenRate: number; // unique clicks / unique opens
  bounceRate: number; // bounced / sent
  unsubscribeRate: number; // unsubscribed / delivered

  // Timestamps
  sentAt: string | null;
  createdAt: string;
}

/**
 * Link performance metrics
 */
export interface LinkPerformance {
  linkUrl: string;
  linkText: string;
  totalClicks: number;
  uniqueClicks: number;
  clickRate: number; // unique clicks / delivered
  firstClickAt: string | null;
  lastClickAt: string | null;
}

/**
 * Device breakdown
 */
export interface DeviceBreakdown {
  deviceType: string;
  totalOpens: number;
  uniqueOpens: number;
  percentage: number;
}

/**
 * Email client breakdown
 */
export interface EmailClientBreakdown {
  emailClient: string;
  totalOpens: number;
  uniqueOpens: number;
  percentage: number;
}

/**
 * Engagement timeline data point
 */
export interface EngagementTimelinePoint {
  timestamp: string;
  opens: number;
  clicks: number;
}

/**
 * Geographic data
 */
export interface GeographicData {
  countryCode: string;
  totalOpens: number;
  uniqueOpens: number;
  totalClicks: number;
  uniqueClicks: number;
}

/**
 * Contact engagement summary
 */
export interface ContactEngagement {
  contactId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  opened: boolean;
  openCount: number;
  clicked: boolean;
  clickCount: number;
  lastEngagedAt: string | null;
  deviceType: string | null;
  emailClient: string | null;
}

/**
 * Tracking Analytics Service
 */
export class TrackingAnalytics {
  /**
   * Get comprehensive campaign performance
   */
  static async getCampaignPerformance(
    campaignId: string,
    userId: string
  ): Promise<CampaignPerformance | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('campaign_performance')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error || !data) {
        console.error('Error fetching campaign performance:', error);
        return null;
      }

      // Get unique opens and clicks
      const { count: uniqueOpens } = await supabase
        .from('unique_opens')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      const { count: uniqueClicks } = await supabase
        .from('unique_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      return {
        campaignId: data.campaign_id,
        campaignName: data.campaign_name,
        subject: data.subject,
        status: data.status,
        totalSent: data.total_sent || 0,
        totalDelivered: data.total_delivered || 0,
        totalBounced: data.total_bounced || 0,
        totalComplained: data.total_complained || 0,
        totalUnsubscribed: data.total_unsubscribed || 0,
        totalOpened: data.total_opened || 0,
        totalClicked: data.total_clicked || 0,
        uniqueOpens: uniqueOpens || 0,
        uniqueClicks: uniqueClicks || 0,
        deliveryRate: data.delivery_rate || 0,
        openRate: data.open_rate || 0,
        clickRate: data.click_through_rate || 0,
        clickToOpenRate: data.click_to_open_rate || 0,
        bounceRate: data.bounce_rate || 0,
        unsubscribeRate:
          data.total_delivered > 0
            ? ((data.total_unsubscribed || 0) / data.total_delivered) * 100
            : 0,
        sentAt: data.sent_at,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error in getCampaignPerformance:', error);
      return null;
    }
  }

  /**
   * Get top performing links for a campaign
   */
  static async getTopLinks(
    campaignId: string,
    limit: number = 10
  ): Promise<LinkPerformance[]> {
    try {
      const supabase = await createClient();

      // Get campaign total_delivered for rate calculation
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('total_delivered')
        .eq('id', campaignId)
        .single();

      const totalDelivered = campaign?.total_delivered || 1;

      const { data, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('total_clicks', { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.error('Error fetching top links:', error);
        return [];
      }

      return data.map((link) => ({
        linkUrl: link.link_url,
        linkText: link.link_text || link.link_url,
        totalClicks: link.total_clicks || 0,
        uniqueClicks: link.unique_clicks || 0,
        clickRate:
          totalDelivered > 0
            ? ((link.unique_clicks || 0) / totalDelivered) * 100
            : 0,
        firstClickAt: link.first_click_at,
        lastClickAt: link.last_click_at,
      }));
    } catch (error) {
      console.error('Error in getTopLinks:', error);
      return [];
    }
  }

  /**
   * Get device breakdown for opens
   */
  static async getDeviceBreakdown(
    campaignId: string
  ): Promise<DeviceBreakdown[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_device_breakdown', {
        p_campaign_id: campaignId,
      });

      if (error) {
        console.error('Error fetching device breakdown:', error);

        // Fallback query
        const { data: fallbackData } = await supabase
          .from('email_events')
          .select('device_type, contact_id')
          .eq('campaign_id', campaignId)
          .eq('event_type', 'opened')
          .eq('is_prefetch', false);

        if (!fallbackData) return [];

        // Manual aggregation
        const deviceMap = new Map<string, Set<string>>();
        let total = 0;

        fallbackData.forEach((row) => {
          const device = row.device_type || 'unknown';
          if (!deviceMap.has(device)) {
            deviceMap.set(device, new Set());
          }
          deviceMap.get(device)!.add(row.contact_id);
          total++;
        });

        return Array.from(deviceMap.entries()).map(([deviceType, contacts]) => ({
          deviceType,
          totalOpens: 0, // Not available in fallback
          uniqueOpens: contacts.size,
          percentage: total > 0 ? (contacts.size / total) * 100 : 0,
        }));
      }

      const total = data.reduce((sum: number, row: any) => sum + row.unique_opens, 0);

      return data.map((row: any) => ({
        deviceType: row.device_type || 'unknown',
        totalOpens: row.total_opens || 0,
        uniqueOpens: row.unique_opens || 0,
        percentage: total > 0 ? (row.unique_opens / total) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error in getDeviceBreakdown:', error);
      return [];
    }
  }

  /**
   * Get email client breakdown
   */
  static async getEmailClientBreakdown(
    campaignId: string
  ): Promise<EmailClientBreakdown[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('email_events')
        .select('email_client, contact_id')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'opened')
        .eq('is_prefetch', false)
        .not('email_client', 'is', null);

      if (error || !data) {
        console.error('Error fetching email client breakdown:', error);
        return [];
      }

      // Manual aggregation
      const clientMap = new Map<string, Set<string>>();

      data.forEach((row) => {
        const client = row.email_client || 'Unknown';
        if (!clientMap.has(client)) {
          clientMap.set(client, new Set());
        }
        clientMap.get(client)!.add(row.contact_id);
      });

      const total = data.length;

      return Array.from(clientMap.entries())
        .map(([emailClient, contacts]) => ({
          emailClient,
          totalOpens: data.filter((r) => r.email_client === emailClient).length,
          uniqueOpens: contacts.size,
          percentage: total > 0 ? (contacts.size / total) * 100 : 0,
        }))
        .sort((a, b) => b.totalOpens - a.totalOpens);
    } catch (error) {
      console.error('Error in getEmailClientBreakdown:', error);
      return [];
    }
  }

  /**
   * Get engagement timeline (hourly, daily, or weekly)
   */
  static async getEngagementTimeline(
    campaignId: string,
    interval: 'hour' | 'day' | 'week' = 'hour'
  ): Promise<EngagementTimelinePoint[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_engagement_timeline', {
        p_campaign_id: campaignId,
        p_interval: interval,
      });

      if (error) {
        console.error('Error fetching engagement timeline:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        timestamp: row.time_bucket,
        opens: row.opens || 0,
        clicks: row.clicks || 0,
      }));
    } catch (error) {
      console.error('Error in getEngagementTimeline:', error);
      return [];
    }
  }

  /**
   * Get contact engagement for a campaign
   */
  static async getContactEngagement(
    campaignId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ContactEngagement[]> {
    try {
      const supabase = await createClient();

      // Get all contacts who received the campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('list_id')
        .eq('id', campaignId)
        .single();

      if (!campaign?.list_id) {
        return [];
      }

      // Get contacts from the list
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('list_id', campaign.list_id)
        .range(offset, offset + limit - 1);

      if (contactsError || !contacts) {
        console.error('Error fetching contacts:', contactsError);
        return [];
      }

      // Get engagement data for each contact
      const contactIds = contacts.map((c) => c.id);

      const { data: events } = await supabase
        .from('email_events')
        .select('contact_id, event_type, device_type, email_client, event_timestamp')
        .eq('campaign_id', campaignId)
        .in('contact_id', contactIds);

      // Build engagement map
      const engagementMap = new Map<string, any>();
      contacts.forEach((contact) => {
        engagementMap.set(contact.id, {
          contactId: contact.id,
          email: contact.email,
          firstName: contact.first_name,
          lastName: contact.last_name,
          opened: false,
          openCount: 0,
          clicked: false,
          clickCount: 0,
          lastEngagedAt: null,
          deviceType: null,
          emailClient: null,
        });
      });

      // Process events
      events?.forEach((event) => {
        const engagement = engagementMap.get(event.contact_id);
        if (!engagement) return;

        if (event.event_type === 'opened') {
          engagement.opened = true;
          engagement.openCount++;
          if (!engagement.deviceType) engagement.deviceType = event.device_type;
          if (!engagement.emailClient) engagement.emailClient = event.email_client;
        } else if (event.event_type === 'clicked') {
          engagement.clicked = true;
          engagement.clickCount++;
        }

        if (
          !engagement.lastEngagedAt ||
          new Date(event.event_timestamp) > new Date(engagement.lastEngagedAt)
        ) {
          engagement.lastEngagedAt = event.event_timestamp;
        }
      });

      return Array.from(engagementMap.values());
    } catch (error) {
      console.error('Error in getContactEngagement:', error);
      return [];
    }
  }

  /**
   * Get real-time campaign stats (for live dashboards)
   */
  static async getRealTimeStats(campaignId: string) {
    try {
      const supabase = await createClient();

      // Get counts of each event type
      const { data: eventCounts } = await supabase
        .from('email_events')
        .select('event_type')
        .eq('campaign_id', campaignId);

      const stats = {
        totalOpens: 0,
        totalClicks: 0,
        totalBounces: 0,
        totalComplaints: 0,
        totalUnsubscribes: 0,
        lastEventAt: null as string | null,
      };

      eventCounts?.forEach((event) => {
        switch (event.event_type) {
          case 'opened':
            stats.totalOpens++;
            break;
          case 'clicked':
            stats.totalClicks++;
            break;
          case 'bounced':
            stats.totalBounces++;
            break;
          case 'complained':
            stats.totalComplaints++;
            break;
          case 'unsubscribed':
            stats.totalUnsubscribes++;
            break;
        }
      });

      // Get last event timestamp
      const { data: lastEvent } = await supabase
        .from('email_events')
        .select('event_timestamp')
        .eq('campaign_id', campaignId)
        .order('event_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (lastEvent) {
        stats.lastEventAt = lastEvent.event_timestamp;
      }

      return stats;
    } catch (error) {
      console.error('Error in getRealTimeStats:', error);
      return null;
    }
  }
}
