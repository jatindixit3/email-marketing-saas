// Enhanced Email Click Tracking Endpoint v2
// Logs click events (unique + total) and redirects to the original URL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  detectDevice,
  detectEmailClient,
  extractIpAddress,
  getTrackingHeaders,
  validateTrackingParams,
  anonymizeIp,
} from '@/lib/tracking/detection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const contactId = searchParams.get('ct');
    const encodedUrl = searchParams.get('url');
    const linkPosition = searchParams.get('pos'); // Optional: position of link in email

    // Validate parameters
    const validation = validateTrackingParams(campaignId, contactId);
    if (!validation.isValid || !encodedUrl) {
      console.error('Invalid tracking params:', validation.error || 'Missing URL');

      // If we have the URL, redirect anyway
      if (encodedUrl) {
        try {
          const originalUrl = decodeURIComponent(encodedUrl);
          return NextResponse.redirect(originalUrl, 302);
        } catch {
          return NextResponse.json(
            { error: 'Invalid URL encoding' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: validation.error || 'Missing URL' },
        { status: 400 }
      );
    }

    // Decode the original URL
    const originalUrl = decodeURIComponent(encodedUrl);

    // Get all tracking headers
    const trackingHeaders = getTrackingHeaders(request);
    const userAgent = trackingHeaders['user-agent'] || '';

    // Extract IP address
    const rawIp = extractIpAddress(trackingHeaders);
    const ipAddress = anonymizeIp(rawIp);

    // Detect device info
    const deviceInfo = detectDevice(userAgent);

    // Detect email client
    const emailClientInfo = detectEmailClient(userAgent);

    // Save click event to database (async, don't wait for redirect)
    saveClickEvent({
      campaignId: campaignId!,
      contactId: contactId!,
      linkUrl: originalUrl,
      linkPosition: linkPosition ? parseInt(linkPosition) : null,
      userAgent,
      ipAddress,
      deviceType: deviceInfo.type,
      operatingSystem: deviceInfo.os,
      emailClient: emailClientInfo.client,
      metadata: {
        browser: deviceInfo.browser,
        referer: trackingHeaders['referer'],
      },
    }).catch((error) => {
      console.error('Error saving click event:', error);
    });

    // Redirect to original URL immediately (don't wait for DB)
    return NextResponse.redirect(originalUrl, 302);
  } catch (error) {
    console.error('Error in click tracking:', error);

    // If we have the URL, redirect anyway
    const { searchParams } = new URL(request.url);
    const encodedUrl = searchParams.get('url');

    if (encodedUrl) {
      try {
        const originalUrl = decodeURIComponent(encodedUrl);
        return NextResponse.redirect(originalUrl, 302);
      } catch {
        return NextResponse.json(
          { error: 'Failed to decode URL' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid tracking link' }, { status: 400 });
  }
}

/**
 * Save click event to database with unique/total tracking
 */
interface SaveClickEventParams {
  campaignId: string;
  contactId: string;
  linkUrl: string;
  linkPosition: number | null;
  userAgent: string;
  ipAddress: string;
  deviceType: string;
  operatingSystem: string | null;
  emailClient: string | null;
  metadata: Record<string, any>;
}

async function saveClickEvent(params: SaveClickEventParams): Promise<void> {
  const supabase = await createClient();

  // Extract link text/domain for display
  const linkText = extractDomainFromUrl(params.linkUrl);

  // Check if this is a unique click (first click on this link by this contact)
  const { data: existingClicks, count } = await supabase
    .from('email_events')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', params.campaignId)
    .eq('contact_id', params.contactId)
    .eq('event_type', 'clicked')
    .eq('link_url', params.linkUrl);

  const isUniqueClick = count === 0;

  // Insert click event
  const { error: insertError } = await supabase.from('email_events').insert({
    campaign_id: params.campaignId,
    contact_id: params.contactId,
    event_type: 'clicked',
    link_url: params.linkUrl,
    link_text: linkText,
    link_position: params.linkPosition,
    user_agent: params.userAgent,
    ip_address: params.ipAddress,
    device_type: params.deviceType,
    operating_system: params.operatingSystem,
    email_client: params.emailClient,
    is_prefetch: false, // Clicks are generally not prefetched
    confidence_score: 0.95, // High confidence for user interaction
    metadata: params.metadata,
  });

  if (insertError) {
    console.error('Failed to save click event:', insertError);
    throw insertError;
  }

  console.log(
    `Click event recorded: Campaign ${params.campaignId}, Contact ${params.contactId}`,
    `URL: ${params.linkUrl} (Unique: ${isUniqueClick})`
  );

  // Update link_clicks summary table
  await updateLinkClicksSummary(
    params.campaignId,
    params.linkUrl,
    linkText,
    params.linkPosition,
    isUniqueClick
  );

  // Update contact's last_engaged_at and increment total_clicks
  await supabase
    .from('contacts')
    .update({
      last_engaged_at: new Date().toISOString(),
      total_clicks: supabase.rpc('increment_total_clicks', { contact_id: params.contactId }),
    })
    .eq('id', params.contactId);

  // Note: Campaign total_clicked is auto-updated by database trigger
}

/**
 * Update link_clicks summary table for analytics
 */
async function updateLinkClicksSummary(
  campaignId: string,
  linkUrl: string,
  linkText: string,
  linkPosition: number | null,
  isUniqueClick: boolean
): Promise<void> {
  const supabase = await createClient();

  // Check if link already exists in summary
  const { data: existing } = await supabase
    .from('link_clicks')
    .select('id, total_clicks, unique_clicks')
    .eq('campaign_id', campaignId)
    .eq('link_url', linkUrl)
    .single();

  const now = new Date().toISOString();

  if (existing) {
    // Update existing record
    await supabase
      .from('link_clicks')
      .update({
        total_clicks: existing.total_clicks + 1,
        unique_clicks: isUniqueClick
          ? existing.unique_clicks + 1
          : existing.unique_clicks,
        last_click_at: now,
        updated_at: now,
      })
      .eq('id', existing.id);
  } else {
    // Insert new record
    await supabase.from('link_clicks').insert({
      campaign_id: campaignId,
      link_url: linkUrl,
      link_text: linkText,
      link_position: linkPosition,
      total_clicks: 1,
      unique_clicks: 1, // First click is always unique
      first_click_at: now,
      last_click_at: now,
    });
  }
}

/**
 * Extract domain from URL for display purposes
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.substring(0, 100); // Fallback to truncated URL
  }
}
