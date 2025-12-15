// Email Open Tracking Endpoint
// Serves a 1x1 transparent pixel and logs the open event

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const contactId = searchParams.get('ct');

    if (!campaignId || !contactId) {
      console.error('Missing campaign or contact ID');
      return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Get user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // Detect device type
    const deviceType = detectDeviceType(userAgent);

    // Save open event to database (async, don't wait)
    saveOpenEvent(campaignId, contactId, userAgent, ipAddress, deviceType).catch(
      (error) => {
        console.error('Error saving open event:', error);
      }
    );

    // Return tracking pixel
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in open tracking:', error);

    // Always return the pixel, even on error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}

/**
 * Save open event to database
 */
async function saveOpenEvent(
  campaignId: string,
  contactId: string,
  userAgent: string,
  ipAddress: string,
  deviceType: string
): Promise<void> {
  const supabase = await createClient();

  // Check if this contact has already opened this campaign
  const { data: existingEvent } = await supabase
    .from('email_events')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('contact_id', contactId)
    .eq('event_type', 'opened')
    .single();

  // Only record the first open (unique opens)
  if (existingEvent) {
    console.log(`Contact ${contactId} already opened campaign ${campaignId}`);
    return;
  }

  // Insert open event
  const { error } = await supabase.from('email_events').insert({
    campaign_id: campaignId,
    contact_id: contactId,
    event_type: 'opened',
    user_agent: userAgent,
    ip_address: ipAddress,
    device_type: deviceType,
    metadata: {},
  });

  if (error) {
    console.error('Failed to save open event:', error);
  } else {
    console.log(`Open event recorded: Campaign ${campaignId}, Contact ${contactId}`);

    // Update contact's last_engaged_at
    await supabase
      .from('contacts')
      .update({ last_engaged_at: new Date().toISOString() })
      .eq('id', contactId);
  }
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}
