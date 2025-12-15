// Email Click Tracking Endpoint
// Logs click events and redirects to the original URL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const contactId = searchParams.get('ct');
    const encodedUrl = searchParams.get('url');

    if (!campaignId || !contactId || !encodedUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Decode the original URL
    const originalUrl = decodeURIComponent(encodedUrl);

    // Get user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // Detect device type
    const deviceType = detectDeviceType(userAgent);

    // Save click event to database (async, don't wait for redirect)
    saveClickEvent(
      campaignId,
      contactId,
      originalUrl,
      userAgent,
      ipAddress,
      deviceType
    ).catch((error) => {
      console.error('Error saving click event:', error);
    });

    // Redirect to original URL
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
        // Fall through to error response
      }
    }

    return NextResponse.json({ error: 'Invalid tracking link' }, { status: 400 });
  }
}

/**
 * Save click event to database
 */
async function saveClickEvent(
  campaignId: string,
  contactId: string,
  linkUrl: string,
  userAgent: string,
  ipAddress: string,
  deviceType: string
): Promise<void> {
  const supabase = await createClient();

  // Extract link text (optional - would need to be included in URL params)
  const linkText = extractDomainFromUrl(linkUrl);

  // Insert click event
  const { error } = await supabase.from('email_events').insert({
    campaign_id: campaignId,
    contact_id: contactId,
    event_type: 'clicked',
    user_agent: userAgent,
    ip_address: ipAddress,
    device_type: deviceType,
    link_url: linkUrl,
    link_text: linkText,
    metadata: {},
  });

  if (error) {
    console.error('Failed to save click event:', error);
  } else {
    console.log(
      `Click event recorded: Campaign ${campaignId}, Contact ${contactId}, URL ${linkUrl}`
    );

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
