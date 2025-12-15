// Enhanced Email Open Tracking Endpoint v2
// Serves a 1x1 transparent pixel and logs the open event with prefetch detection

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  detectDevice,
  detectEmailClient,
  detectPrefetch,
  extractIpAddress,
  getTrackingHeaders,
  validateTrackingParams,
  calculateTimeSinceSent,
  anonymizeIp,
} from '@/lib/tracking/detection';

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  // Prevent caching
  'Last-Modified': new Date().toUTCString(),
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const contactId = searchParams.get('ct');
    const timestamp = searchParams.get('t'); // When pixel was generated

    // Validate parameters
    const validation = validateTrackingParams(campaignId, contactId);
    if (!validation.isValid) {
      console.error('Invalid tracking params:', validation.error);
      return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: PIXEL_HEADERS,
      });
    }

    // Get all tracking headers
    const trackingHeaders = getTrackingHeaders(request);
    const userAgent = trackingHeaders['user-agent'] || '';

    // Extract IP address
    const rawIp = extractIpAddress(trackingHeaders);
    const ipAddress = anonymizeIp(rawIp); // Anonymize for privacy

    // Detect device info
    const deviceInfo = detectDevice(userAgent);

    // Detect email client
    const emailClientInfo = detectEmailClient(userAgent);

    // Get campaign sent time for prefetch detection
    const supabase = await createClient();
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('sent_at')
      .eq('id', campaignId!)
      .single();

    // Calculate timing for prefetch detection
    let timing;
    if (campaign?.sent_at) {
      const sentAt = new Date(campaign.sent_at);
      timing = {
        timeSinceEmailSent: calculateTimeSinceSent(sentAt),
      };
    }

    // Detect if this is a prefetch
    const prefetchAnalysis = detectPrefetch(userAgent, trackingHeaders, timing);

    // Save open event to database (async, don't wait)
    saveOpenEvent({
      campaignId: campaignId!,
      contactId: contactId!,
      userAgent,
      ipAddress,
      deviceType: deviceInfo.type,
      operatingSystem: deviceInfo.os,
      emailClient: emailClientInfo.client,
      emailClientVersion: emailClientInfo.version,
      isPrefetch: prefetchAnalysis.isLikelyPrefetch,
      confidenceScore: prefetchAnalysis.confidenceScore,
      metadata: {
        browser: deviceInfo.browser,
        prefetchReasons: prefetchAnalysis.reasons,
        headers: {
          purpose: trackingHeaders['purpose'],
          secFetchMode: trackingHeaders['sec-fetch-mode'],
          acceptLanguage: trackingHeaders['accept-language'],
        },
      },
    }).catch((error) => {
      console.error('Error saving open event:', error);
    });

    // Return tracking pixel
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: PIXEL_HEADERS,
    });
  } catch (error) {
    console.error('Error in open tracking:', error);

    // Always return the pixel, even on error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: PIXEL_HEADERS,
    });
  }
}

/**
 * Save open event to database with enhanced tracking
 */
interface SaveOpenEventParams {
  campaignId: string;
  contactId: string;
  userAgent: string;
  ipAddress: string;
  deviceType: string;
  operatingSystem: string | null;
  emailClient: string | null;
  emailClientVersion: string | null;
  isPrefetch: boolean;
  confidenceScore: number;
  metadata: Record<string, any>;
}

async function saveOpenEvent(params: SaveOpenEventParams): Promise<void> {
  const supabase = await createClient();

  // Check if this is the first open (for unique open tracking)
  const { data: existingOpens, count } = await supabase
    .from('email_events')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', params.campaignId)
    .eq('contact_id', params.contactId)
    .eq('event_type', 'opened');

  const isFirstOpen = count === 0;

  // Insert open event
  const { error: insertError } = await supabase.from('email_events').insert({
    campaign_id: params.campaignId,
    contact_id: params.contactId,
    event_type: 'opened',
    user_agent: params.userAgent,
    ip_address: params.ipAddress,
    device_type: params.deviceType,
    operating_system: params.operatingSystem,
    email_client: params.emailClient,
    is_prefetch: params.isPrefetch,
    confidence_score: params.confidenceScore,
    metadata: params.metadata,
  });

  if (insertError) {
    console.error('Failed to save open event:', insertError);
    throw insertError;
  }

  console.log(
    `Open event recorded: Campaign ${params.campaignId}, Contact ${params.contactId}`,
    `(Prefetch: ${params.isPrefetch}, Confidence: ${params.confidenceScore}, First: ${isFirstOpen})`
  );

  // Update contact's last_engaged_at and increment total_opens
  // Only for real (non-prefetch) opens
  if (!params.isPrefetch || params.confidenceScore < 0.5) {
    await supabase
      .from('contacts')
      .update({
        last_engaged_at: new Date().toISOString(),
        total_opens: supabase.rpc('increment_total_opens', { contact_id: params.contactId }),
      })
      .eq('id', params.contactId);
  }

  // Note: Campaign stats are auto-updated by database trigger
  // The trigger only counts non-prefetch opens (is_prefetch = FALSE)
}
