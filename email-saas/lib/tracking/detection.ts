// Enhanced Tracking Detection Utilities
// Handles prefetch detection, email client detection, and device fingerprinting

/**
 * Device type detection result
 */
export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string | null;
  browser: string | null;
}

/**
 * Email client detection result
 */
export interface EmailClientInfo {
  client: string | null;
  version: string | null;
  isPrefetchLikely: boolean;
  confidenceScore: number; // 0.0 to 1.0
}

/**
 * Prefetch detection signals
 */
interface PrefetchSignals {
  isLikelyPrefetch: boolean;
  confidenceScore: number;
  reasons: string[];
}

/**
 * Detect device type and OS from user agent
 */
export function detectDevice(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect device type
  let type: DeviceInfo['type'] = 'unknown';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    type = 'tablet';
  } else if (
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(
      ua
    )
  ) {
    type = 'mobile';
  } else if (/windows|mac|linux|cros/i.test(ua)) {
    type = 'desktop';
  }

  // Detect OS
  let os: string | null = null;
  if (/windows nt 10/i.test(ua)) os = 'Windows 10';
  else if (/windows nt 11/i.test(ua)) os = 'Windows 11';
  else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6.2/i.test(ua)) os = 'Windows 8';
  else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os x 10[._](\d+)/i.test(ua)) {
    const match = ua.match(/mac os x 10[._](\d+)/i);
    os = match ? `macOS 10.${match[1]}` : 'macOS';
  } else if (/mac/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os (\d+)_(\d+)/i);
    os = match ? `iOS ${match[1]}.${match[2]}` : 'iOS';
  } else if (/android (\d+\.\d+)/i.test(ua)) {
    const match = ua.match(/android (\d+\.\d+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'Chrome OS';

  // Detect browser
  let browser: string | null = null;
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opera|opr\//i.test(ua)) browser = 'Opera';
  else if (/trident|msie/i.test(ua)) browser = 'Internet Explorer';

  return {
    type,
    os,
    browser,
  };
}

/**
 * Detect email client from user agent
 */
export function detectEmailClient(userAgent: string): EmailClientInfo {
  const ua = userAgent.toLowerCase();
  let client: string | null = null;
  let version: string | null = null;
  let isPrefetchLikely = false;
  let confidenceScore = 1.0;

  // Gmail
  if (/gmail/i.test(ua)) {
    client = 'Gmail';
    // Gmail image proxy - likely real user
    if (/google.*image.*proxy/i.test(ua)) {
      isPrefetchLikely = false;
      confidenceScore = 0.95;
    }
  }
  // Outlook.com / Office 365
  else if (/outlook|office365/i.test(ua)) {
    client = 'Outlook.com';
    // Outlook SafeLink scanner
    if (/safelink/i.test(ua)) {
      isPrefetchLikely = true;
      confidenceScore = 0.3;
    }
  }
  // Apple Mail
  else if (/applemail|apple.*mail/i.test(ua)) {
    client = 'Apple Mail';
    // Apple Mail Privacy Protection prefetches images
    if (/mail privacy protection/i.test(ua)) {
      isPrefetchLikely = true;
      confidenceScore = 0.4;
    }
  }
  // Outlook Desktop
  else if (/microsoft outlook/i.test(ua)) {
    client = 'Outlook Desktop';
    const match = ua.match(/microsoft outlook (\d+)/i);
    if (match) version = match[1];
  }
  // Yahoo Mail
  else if (/yahoo/i.test(ua)) {
    client = 'Yahoo Mail';
  }
  // AOL Mail
  else if (/aol/i.test(ua)) {
    client = 'AOL Mail';
  }
  // Thunderbird
  else if (/thunderbird/i.test(ua)) {
    client = 'Thunderbird';
    const match = ua.match(/thunderbird\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }
  // ProtonMail
  else if (/protonmail/i.test(ua)) {
    client = 'ProtonMail';
  }
  // Samsung Mail
  else if (/samsung.*mail/i.test(ua)) {
    client = 'Samsung Mail';
  }
  // Spark
  else if (/spark/i.test(ua)) {
    client = 'Spark';
  }
  // Edison Mail
  else if (/edison/i.test(ua)) {
    client = 'Edison Mail';
  }
  // Unknown - check if it's likely a bot/prefetch
  else if (
    /bot|crawler|spider|scraper|validator|checker|monitor|scanner/i.test(ua)
  ) {
    client = 'Bot/Scanner';
    isPrefetchLikely = true;
    confidenceScore = 0.1;
  }

  return {
    client,
    version,
    isPrefetchLikely,
    confidenceScore,
  };
}

/**
 * Comprehensive prefetch detection
 * Analyzes multiple signals to determine if an event is likely a prefetch
 */
export function detectPrefetch(
  userAgent: string,
  headers: Record<string, string | null>,
  timing?: {
    timeSinceEmailSent: number; // milliseconds
    timeSinceLastEvent?: number; // milliseconds
  }
): PrefetchSignals {
  const reasons: string[] = [];
  let prefetchScore = 0; // 0-100, higher = more likely prefetch

  const ua = userAgent.toLowerCase();

  // 1. Check email client signals
  const emailClient = detectEmailClient(userAgent);
  if (emailClient.isPrefetchLikely) {
    prefetchScore += 40;
    reasons.push(`Email client: ${emailClient.client} (known for prefetching)`);
  }

  // 2. Check for bot/crawler patterns
  if (/bot|crawler|spider|scraper|validator|checker|monitor|scanner/i.test(ua)) {
    prefetchScore += 50;
    reasons.push('User agent contains bot/crawler keywords');
  }

  // 3. Check for suspicious timing (opened within seconds of sending)
  if (timing && timing.timeSinceEmailSent < 5000) {
    // Less than 5 seconds
    prefetchScore += 30;
    reasons.push('Opened within 5 seconds of sending (likely automated)');
  } else if (timing && timing.timeSinceEmailSent < 30000) {
    // Less than 30 seconds
    prefetchScore += 15;
    reasons.push('Opened very quickly (within 30 seconds)');
  }

  // 4. Check for missing/suspicious headers
  const purpose = headers['purpose'];
  const secFetchMode = headers['sec-fetch-mode'];

  if (purpose === 'prefetch' || purpose === 'preview') {
    prefetchScore += 60;
    reasons.push(`Purpose header: ${purpose}`);
  }

  if (secFetchMode === 'no-cors') {
    prefetchScore += 20;
    reasons.push('Sec-Fetch-Mode indicates prefetch');
  }

  // 5. Check for link prefetch hints
  if (headers['x-moz'] === 'prefetch' || headers['x-purpose'] === 'preview') {
    prefetchScore += 50;
    reasons.push('Prefetch hint header detected');
  }

  // 6. Check for privacy protection services
  if (/privacy.*protection|mail.*privacy/i.test(ua)) {
    prefetchScore += 25;
    reasons.push('Privacy protection service detected');
  }

  // 7. Check for image proxy services (these are usually real users viewing through proxy)
  if (/google.*image.*proxy|yahoo.*image.*proxy/i.test(ua)) {
    prefetchScore -= 20; // Reduce score - likely real user
    reasons.push('Image proxy detected (likely real user)');
  }

  // 8. Check for empty/missing user agent
  if (!userAgent || userAgent.trim() === '') {
    prefetchScore += 30;
    reasons.push('Empty user agent');
  }

  // 9. Check for repeated rapid events (if timing data available)
  if (timing && timing.timeSinceLastEvent && timing.timeSinceLastEvent < 100) {
    prefetchScore += 25;
    reasons.push('Rapid repeated events (< 100ms apart)');
  }

  // Normalize score to 0-1 confidence
  const normalizedScore = Math.max(0, Math.min(100, prefetchScore));
  const isLikelyPrefetch = normalizedScore >= 50;
  const confidenceScore = isLikelyPrefetch
    ? normalizedScore / 100
    : 1 - normalizedScore / 100;

  return {
    isLikelyPrefetch,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    reasons,
  };
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(
  headers: Record<string, string | null>
): string {
  // Check common proxy headers in order of preference
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers['cf-connecting-ip']; // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Get all tracking headers from request
 */
export function getTrackingHeaders(request: Request): Record<string, string | null> {
  const headers: Record<string, string | null> = {};

  // Get common headers
  const headerNames = [
    'user-agent',
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'purpose',
    'sec-fetch-mode',
    'sec-fetch-site',
    'sec-fetch-dest',
    'x-moz',
    'x-purpose',
    'accept',
    'accept-language',
    'referer',
  ];

  headerNames.forEach((name) => {
    // Type assertion needed due to Headers API
    const value = (request.headers as any).get(name);
    headers[name] = value;
  });

  return headers;
}

/**
 * Generate unique tracking ID
 * Combines campaign, contact, and timestamp for deduplication
 */
export function generateTrackingId(
  campaignId: string,
  contactId: string,
  eventType: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  return `${campaignId}:${contactId}:${eventType}:${ts}`;
}

/**
 * Validate tracking parameters
 */
export function validateTrackingParams(
  campaignId: string | null,
  contactId: string | null
): { isValid: boolean; error?: string } {
  if (!campaignId) {
    return { isValid: false, error: 'Missing campaign ID' };
  }

  if (!contactId) {
    return { isValid: false, error: 'Missing contact ID' };
  }

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(campaignId)) {
    return { isValid: false, error: 'Invalid campaign ID format' };
  }

  if (!uuidRegex.test(contactId)) {
    return { isValid: false, error: 'Invalid contact ID format' };
  }

  return { isValid: true };
}

/**
 * Calculate time since email was sent
 * Used for prefetch detection
 */
export function calculateTimeSinceSent(
  emailSentAt: Date,
  eventTimestamp: Date = new Date()
): number {
  return eventTimestamp.getTime() - emailSentAt.getTime();
}

/**
 * Anonymize IP address for privacy
 * Masks last octet of IPv4 or last 80 bits of IPv6
 */
export function anonymizeIp(ipAddress: string): string {
  // IPv4
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ipAddress)) {
    const parts = ipAddress.split('.');
    parts[3] = '0';
    return parts.join('.');
  }

  // IPv6
  if (ipAddress.includes(':')) {
    const parts = ipAddress.split(':');
    // Keep first 48 bits (3 groups), mask the rest
    return parts.slice(0, 3).join(':') + '::';
  }

  return 'unknown';
}
