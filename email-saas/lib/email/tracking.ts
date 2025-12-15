// Email Tracking Utilities
// Handles open tracking (pixel) and click tracking (link wrapping)

/**
 * Generate a 1x1 transparent tracking pixel
 * @param campaignId - Campaign identifier
 * @param contactId - Contact identifier
 * @param baseUrl - Base URL of the application
 * @returns HTML string for tracking pixel
 */
export function generateTrackingPixel(
  campaignId: string,
  contactId: string,
  baseUrl: string
): string {
  const trackingUrl = `${baseUrl}/api/track/open?c=${campaignId}&ct=${contactId}&t=${Date.now()}`;

  return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;border:0;outline:none;text-decoration:none;" />`;
}

/**
 * Wrap all links in HTML content with click tracking
 * @param htmlContent - Original HTML content
 * @param campaignId - Campaign identifier
 * @param contactId - Contact identifier
 * @param baseUrl - Base URL of the application
 * @returns HTML with tracked links
 */
export function wrapLinksWithTracking(
  htmlContent: string,
  campaignId: string,
  contactId: string,
  baseUrl: string
): string {
  // Regex to match href attributes in <a> tags
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;

  return htmlContent.replace(linkRegex, (match, before, originalUrl, after) => {
    // Skip if it's already a tracking link or an anchor link
    if (originalUrl.startsWith('#') || originalUrl.includes('/api/track/click')) {
      return match;
    }

    // Create tracking URL
    const encodedUrl = encodeURIComponent(originalUrl);
    const trackingUrl = `${baseUrl}/api/track/click?c=${campaignId}&ct=${contactId}&url=${encodedUrl}`;

    return `<a ${before}href="${trackingUrl}"${after}>`;
  });
}

/**
 * Extract link text from HTML anchor tag (for logging purposes)
 * @param htmlLink - HTML anchor tag
 * @returns Text content of the link
 */
export function extractLinkText(htmlLink: string): string {
  const textMatch = htmlLink.match(/>([^<]+)</);
  return textMatch ? textMatch[1].trim() : '';
}

/**
 * Insert tracking pixel at the end of HTML body
 * @param htmlContent - Original HTML content
 * @param trackingPixel - Tracking pixel HTML
 * @returns HTML with tracking pixel inserted
 */
export function insertTrackingPixel(
  htmlContent: string,
  trackingPixel: string
): string {
  // Try to insert before closing </body> tag
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${trackingPixel}</body>`);
  }

  // If no body tag, append at the end
  return htmlContent + trackingPixel;
}

/**
 * Prepare email HTML with all tracking (pixel + link wrapping)
 * @param htmlContent - Original HTML content
 * @param campaignId - Campaign identifier
 * @param contactId - Contact identifier
 * @param baseUrl - Base URL of the application
 * @returns Fully tracked HTML content
 */
export function prepareTrackedEmail(
  htmlContent: string,
  campaignId: string,
  contactId: string,
  baseUrl: string
): string {
  // First, wrap all links with click tracking
  let trackedHtml = wrapLinksWithTracking(htmlContent, campaignId, contactId, baseUrl);

  // Then, insert tracking pixel
  const trackingPixel = generateTrackingPixel(campaignId, contactId, baseUrl);
  trackedHtml = insertTrackingPixel(trackedHtml, trackingPixel);

  return trackedHtml;
}

/**
 * Generate unsubscribe link
 * @param contactId - Contact identifier
 * @param campaignId - Campaign identifier
 * @param baseUrl - Base URL of the application
 * @returns Unsubscribe URL
 */
export function generateUnsubscribeLink(
  contactId: string,
  campaignId: string,
  baseUrl: string
): string {
  return `${baseUrl}/unsubscribe?ct=${contactId}&c=${campaignId}`;
}

/**
 * Add unsubscribe footer to email HTML
 * @param htmlContent - Original HTML content
 * @param unsubscribeUrl - Unsubscribe URL
 * @returns HTML with unsubscribe footer
 */
export function addUnsubscribeFooter(
  htmlContent: string,
  unsubscribeUrl: string
): string {
  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color: #2dd4bf; text-decoration: underline;">unsubscribe here</a>.</p>
    </div>
  `;

  // Insert before closing body tag or at the end
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${footer}</body>`);
  }

  return htmlContent + footer;
}

/**
 * Replace merge tags in email content
 * @param content - Email content (HTML or text)
 * @param contact - Contact data with custom fields
 * @returns Content with merge tags replaced
 */
export function replaceMergeTags(
  content: string,
  contact: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    customFields?: Record<string, any>;
  }
): string {
  let result = content;

  // Standard merge tags
  result = result.replace(/\{\{email\}\}/g, contact.email);
  result = result.replace(/\{\{firstName\}\}/g, contact.firstName || '');
  result = result.replace(/\{\{lastName\}\}/g, contact.lastName || '');
  result = result.replace(/\{\{company\}\}/g, contact.company || '');
  result = result.replace(/\{\{fullName\}\}/g,
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'there'
  );

  // Custom field merge tags
  if (contact.customFields) {
    Object.keys(contact.customFields).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(contact.customFields![key] || ''));
    });
  }

  return result;
}
