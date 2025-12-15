# Email Tracking System Guide

Complete guide for the email tracking system with open tracking, click tracking, prefetch detection, and analytics.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [Tracking Features](#tracking-features)
5. [Prefetch Detection](#prefetch-detection)
6. [Analytics API](#analytics-api)
7. [Database Schema](#database-schema)
8. [Components](#components)
9. [Best Practices](#best-practices)
10. [Privacy & Compliance](#privacy--compliance)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Email Tracking System provides comprehensive tracking and analytics for email campaigns:

### ✅ Features

- **Open Tracking**: 1x1 transparent pixel tracking
- **Click Tracking**: Link wrapping with redirect tracking
- **Prefetch Detection**: AI-powered detection of bot/automated opens
- **Device Detection**: Desktop, mobile, tablet breakdown
- **Email Client Detection**: Gmail, Outlook, Apple Mail, etc.
- **Unique vs Total Tracking**: Separate counts for unique and total events
- **Real-time Analytics**: Live dashboard updates
- **Link Performance**: Track individual link click rates
- **Engagement Timeline**: Hour/day/week engagement charts
- **Privacy-First**: IP anonymization and GDPR compliance

---

## Architecture

### System Flow

```
┌─────────────────┐
│  Email Content  │
│  (HTML + Links) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Tracking Preparation   │
│  - Wrap links           │
│  - Insert tracking pixel│
│  - Add merge tags       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│  Send Email     │
│  (AWS SES)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Recipient Actions      │
│  - Opens email          │
│  - Clicks links         │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Tracking Endpoints      │
│  /api/track/open/v2      │
│  /api/track/click/v2     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Detection & Analysis    │
│  - Prefetch detection    │
│  - Device detection      │
│  - Email client detection│
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Database Storage        │
│  - email_events table    │
│  - link_clicks table     │
│  - Auto-update campaigns │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Analytics Dashboard     │
│  - Performance metrics   │
│  - Charts & visualizations│
└──────────────────────────┘
```

---

## Setup

### 1. Database Migration

Run the SQL schema to create tracking tables:

```bash
psql -h your-db-host -U your-user -d your-db -f DATABASE_TRACKING_SCHEMA.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of [DATABASE_TRACKING_SCHEMA.sql](DATABASE_TRACKING_SCHEMA.sql)
3. Run the migration

### 2. Update Existing Routes

The new tracking endpoints are located at:
- `/api/track/open/v2/route.ts` - Enhanced open tracking
- `/api/track/click/v2/route.ts` - Enhanced click tracking

To use the new endpoints, update your tracking pixel generation:

```typescript
// Old (basic tracking)
const trackingUrl = `${baseUrl}/api/track/open?c=${campaignId}&ct=${contactId}`;

// New (enhanced tracking)
const trackingUrl = `${baseUrl}/api/track/open/v2?c=${campaignId}&ct=${contactId}&t=${Date.now()}`;
```

### 3. Environment Variables

No additional environment variables needed! Uses existing Supabase config.

---

## Tracking Features

### 1. Open Tracking

**How it works:**
- 1x1 transparent GIF pixel inserted at end of email HTML
- When email is opened, pixel loads and triggers tracking
- Records: timestamp, device, email client, IP (anonymized), user agent

**Implementation:**

```typescript
import { generateTrackingPixel, insertTrackingPixel } from '@/lib/email/tracking';

const pixel = generateTrackingPixel(campaignId, contactId, baseUrl);
const trackedHtml = insertTrackingPixel(htmlContent, pixel);
```

**Tracked Data:**
- Campaign ID
- Contact ID
- Timestamp
- Device type (desktop/mobile/tablet)
- Operating system
- Email client (Gmail, Outlook, Apple Mail, etc.)
- IP address (anonymized)
- User agent
- Prefetch likelihood score

### 2. Click Tracking

**How it works:**
- All links in email are wrapped with tracking URLs
- When clicked, redirects through tracking endpoint
- Records click event, then redirects to original URL

**Implementation:**

```typescript
import { wrapLinksWithTracking } from '@/lib/email/tracking';

const trackedHtml = wrapLinksWithTracking(
  htmlContent,
  campaignId,
  contactId,
  baseUrl
);
```

**Tracked Data:**
- Campaign ID
- Contact ID
- Link URL (original destination)
- Link text/domain
- Link position in email
- Timestamp
- Device/browser info
- User agent

**Unique vs Total Clicks:**
- **Total Clicks**: All clicks on any link (includes duplicates)
- **Unique Clicks**: First click per contact per link

### 3. Link Performance Tracking

Aggregated data stored in `link_clicks` table:

```typescript
interface LinkPerformance {
  linkUrl: string;
  linkText: string;
  totalClicks: number;      // All clicks
  uniqueClicks: number;     // Unique contacts
  clickRate: number;        // % of delivered emails
  firstClickAt: Date;
  lastClickAt: Date;
}
```

---

## Prefetch Detection

### Why Prefetch Detection?

Modern email clients (Apple Mail, Outlook) **prefetch images** to protect user privacy. This means:
- Opens are recorded even if user didn't actually view the email
- Can inflate open rates by 20-50%
- Makes it hard to know real engagement

### How We Detect Prefetch

Multi-signal analysis combines:

1. **Email Client Detection**
   - Apple Mail Privacy Protection → 40% prefetch score
   - Outlook SafeLink scanner → 30% prefetch score

2. **Timing Analysis**
   - Opened within 5 seconds of sending → 30% prefetch score
   - Opened within 30 seconds → 15% prefetch score

3. **User Agent Patterns**
   - Contains "bot", "crawler", "scanner" → 50% prefetch score
   - Privacy protection keywords → 25% prefetch score

4. **HTTP Headers**
   - `Purpose: prefetch` → 60% prefetch score
   - `Sec-Fetch-Mode: no-cors` → 20% prefetch score

5. **Image Proxy Detection**
   - Google Image Proxy → -20% score (likely real user)
   - Yahoo Image Proxy → -20% score

### Confidence Score

Each open event gets a confidence score (0.0 to 1.0):
- **>= 0.5**: Likely prefetch (is_prefetch = TRUE)
- **< 0.5**: Likely real open (is_prefetch = FALSE)

Only **real opens** (is_prefetch = FALSE) count toward campaign open rate.

### Usage

```typescript
import { detectPrefetch } from '@/lib/tracking/detection';

const prefetch = detectPrefetch(userAgent, headers, timing);

console.log(prefetch);
// {
//   isLikelyPrefetch: true,
//   confidenceScore: 0.75,
//   reasons: [
//     'Email client: Apple Mail (known for prefetching)',
//     'Opened within 5 seconds of sending',
//   ]
// }
```

---

## Analytics API

### GET /api/campaigns/[id]/analytics

Get comprehensive campaign performance.

**Response:**
```json
{
  "campaignId": "...",
  "campaignName": "Summer Sale 2025",
  "subject": "50% Off Everything!",
  "status": "sent",
  "totalSent": 10000,
  "totalDelivered": 9950,
  "totalOpened": 3200,
  "totalClicked": 850,
  "uniqueOpens": 2980,
  "uniqueClicks": 720,
  "deliveryRate": 99.5,
  "openRate": 29.95,
  "clickRate": 7.24,
  "clickToOpenRate": 24.16,
  "bounceRate": 0.5,
  "unsubscribeRate": 0.15,
  "sentAt": "2025-01-15T10:00:00Z",
  "createdAt": "2025-01-15T09:00:00Z"
}
```

### GET /api/campaigns/[id]/analytics/links

Get top performing links.

**Query Params:**
- `limit` (default: 10) - Number of links to return

**Response:**
```json
{
  "links": [
    {
      "linkUrl": "https://example.com/product/123",
      "linkText": "example.com",
      "totalClicks": 350,
      "uniqueClicks": 280,
      "clickRate": 2.81,
      "firstClickAt": "2025-01-15T10:05:00Z",
      "lastClickAt": "2025-01-16T14:30:00Z"
    }
  ]
}
```

### GET /api/campaigns/[id]/analytics/devices

Get device and email client breakdown.

**Response:**
```json
{
  "devices": [
    {
      "deviceType": "mobile",
      "totalOpens": 1800,
      "uniqueOpens": 1650,
      "percentage": 55.37
    },
    {
      "deviceType": "desktop",
      "totalOpens": 1200,
      "uniqueOpens": 1100,
      "percentage": 36.91
    },
    {
      "deviceType": "tablet",
      "totalOpens": 200,
      "uniqueOpens": 180,
      "percentage": 6.04
    }
  ],
  "emailClients": [
    {
      "emailClient": "Gmail",
      "totalOpens": 1500,
      "uniqueOpens": 1400,
      "percentage": 46.98
    },
    {
      "emailClient": "Apple Mail",
      "totalOpens": 900,
      "uniqueOpens": 850,
      "percentage": 28.52
    }
  ]
}
```

### GET /api/campaigns/[id]/analytics/timeline

Get engagement timeline (opens/clicks over time).

**Query Params:**
- `interval` - `hour`, `day`, or `week` (default: hour)

**Response:**
```json
{
  "timeline": [
    {
      "timestamp": "2025-01-15T10:00:00Z",
      "opens": 450,
      "clicks": 85
    },
    {
      "timestamp": "2025-01-15T11:00:00Z",
      "opens": 380,
      "clicks": 72
    }
  ],
  "interval": "hour"
}
```

### GET /api/campaigns/[id]/analytics/contacts

Get per-contact engagement data.

**Query Params:**
- `limit` (default: 100) - Number of contacts
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "contacts": [
    {
      "contactId": "...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "opened": true,
      "openCount": 2,
      "clicked": true,
      "clickCount": 1,
      "lastEngagedAt": "2025-01-15T14:30:00Z",
      "deviceType": "mobile",
      "emailClient": "Gmail"
    }
  ],
  "limit": 100,
  "offset": 0,
  "total": 1
}
```

---

## Database Schema

### email_events Table

Core tracking events table:

```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  event_type VARCHAR(50), -- 'opened', 'clicked', 'bounced', etc.
  event_timestamp TIMESTAMP WITH TIME ZONE,

  -- Click tracking
  link_url TEXT,
  link_text TEXT,
  link_position INTEGER,

  -- Device/client tracking
  user_agent TEXT,
  ip_address VARCHAR(45), -- Anonymized
  device_type VARCHAR(20),
  operating_system VARCHAR(100),
  email_client VARCHAR(100),

  -- Prefetch detection
  is_prefetch BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2),

  -- Additional data
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### link_clicks Table

Aggregated link performance:

```sql
CREATE TABLE link_clicks (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  link_url TEXT NOT NULL,
  link_text TEXT,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  first_click_at TIMESTAMP WITH TIME ZONE,
  last_click_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Automatic Updates

Database triggers automatically update `campaigns` table stats:

```sql
-- When open event is inserted
UPDATE campaigns SET total_opened = total_opened + 1
WHERE id = campaign_id AND is_prefetch = FALSE;

-- When click event is inserted
UPDATE campaigns SET total_clicked = total_clicked + 1
WHERE id = campaign_id;
```

### Useful Views

**unique_opens** - First open per contact per campaign:
```sql
SELECT DISTINCT ON (campaign_id, contact_id)
  id, campaign_id, contact_id, event_timestamp
FROM email_events
WHERE event_type = 'opened' AND is_prefetch = FALSE
ORDER BY campaign_id, contact_id, event_timestamp ASC;
```

**unique_clicks** - First click per contact per campaign per link:
```sql
SELECT DISTINCT ON (campaign_id, contact_id, link_url)
  id, campaign_id, contact_id, link_url, event_timestamp
FROM email_events
WHERE event_type = 'clicked'
ORDER BY campaign_id, contact_id, link_url, event_timestamp ASC;
```

**campaign_performance** - Aggregated metrics:
```sql
SELECT
  c.id AS campaign_id,
  c.total_sent,
  c.total_delivered,
  c.total_opened,
  c.total_clicked,
  ROUND((total_delivered::DECIMAL / total_sent) * 100, 2) AS delivery_rate,
  ROUND((total_opened::DECIMAL / total_delivered) * 100, 2) AS open_rate,
  ROUND((total_clicked::DECIMAL / total_delivered) * 100, 2) AS click_rate
FROM campaigns c
WHERE deleted_at IS NULL;
```

---

## Components

### CampaignStatsCards

Display key campaign metrics in cards:

```typescript
import { CampaignStatsCards } from '@/components/analytics/campaign-stats-cards';

<CampaignStatsCards performance={performanceData} />
```

Shows: Sent, Delivered, Opened, Clicked, Bounced, Unsubscribed

### LinkPerformanceTable

Table of top performing links:

```typescript
import { LinkPerformanceTable } from '@/components/analytics/link-performance-table';

<LinkPerformanceTable links={linksData} />
```

Shows: Link URL, Total Clicks, Unique Clicks, Click Rate

### DeviceBreakdownChart

Pie charts for device and email client breakdown:

```typescript
import { DeviceBreakdownChart } from '@/components/analytics/device-breakdown-chart';

<DeviceBreakdownChart
  devices={devicesData}
  emailClients={emailClientsData}
/>
```

---

## Best Practices

### 1. Always Use Enhanced Endpoints

Use `/api/track/open/v2` and `/api/track/click/v2` for:
- Better prefetch detection
- More detailed analytics
- Privacy-compliant IP handling

### 2. Filter Prefetch in Reports

When showing open rates, use real opens only:

```sql
SELECT COUNT(*) FROM email_events
WHERE event_type = 'opened'
  AND is_prefetch = FALSE;  -- Exclude prefetch
```

### 3. Track Link Position

Include link position when wrapping links:

```typescript
const trackingUrl = `${baseUrl}/api/track/click/v2?c=${campaignId}&ct=${contactId}&url=${encodedUrl}&pos=${linkIndex}`;
```

This helps identify which links perform best by position.

### 4. Use Unique Metrics

Focus on **unique opens** and **unique clicks** rather than totals:
- More accurate representation of engagement
- Not inflated by power users clicking multiple times

### 5. Monitor Prefetch Rate

High prefetch rate (>40%) may indicate:
- Large Apple Mail user base
- Good list quality (Apple users typically engaged)
- Need to adjust email timing

---

## Privacy & Compliance

### GDPR Compliance

✅ **IP Anonymization**: Last octet of IPv4 masked (e.g., 192.168.1.0)
✅ **Data Minimization**: Only collect necessary tracking data
✅ **Right to Erasure**: Delete events when contact is deleted (CASCADE)
✅ **Transparency**: Disclose tracking in privacy policy

### Best Practices

1. **Privacy Policy**: Inform users about email tracking
2. **Unsubscribe**: Always include unsubscribe link
3. **Data Retention**: Consider auto-deleting events after 1-2 years
4. **Consent**: Ensure users opted in to marketing emails

### IP Anonymization

Automatic in tracking endpoints:

```typescript
import { anonymizeIp } from '@/lib/tracking/detection';

const anonymized = anonymizeIp('192.168.1.123');
// Result: '192.168.1.0'
```

---

## Troubleshooting

### Opens Not Tracking

**Issue**: Email opened but no tracking event recorded

**Checklist:**
1. ✅ Is tracking pixel inserted? Check email HTML for `<img src=".../api/track/open/v2?..."`
2. ✅ Is email client blocking images? (Outlook, corporate clients)
3. ✅ Check browser console for blocked requests
4. ✅ Verify tracking endpoint is accessible (not blocked by firewall)

**Debug:**
```bash
curl "https://yourdomain.com/api/track/open/v2?c=campaign-id&ct=contact-id&t=12345"
# Should return 1x1 GIF
```

### Clicks Not Tracking

**Issue**: Link clicked but no click event recorded

**Checklist:**
1. ✅ Are links wrapped? Check email HTML for tracking URLs
2. ✅ Is redirect working? Test tracking URL in browser
3. ✅ Check database for click events: `SELECT * FROM email_events WHERE event_type = 'clicked'`

**Debug:**
```bash
# Test click tracking (should redirect)
curl -I "https://yourdomain.com/api/track/click/v2?c=campaign-id&ct=contact-id&url=https%3A%2F%2Fexample.com"
# Should return 302 redirect
```

### Prefetch Detection Not Working

**Issue**: All opens marked as real (is_prefetch = FALSE)

**Possible Causes:**
- Campaign `sent_at` not set (timing analysis fails)
- Headers not passed correctly to detection function
- Email client not detected (unknown user agent)

**Fix:**
1. Ensure campaign `sent_at` is set when sending
2. Verify headers are captured in tracking endpoint
3. Check detection logic in [lib/tracking/detection.ts](lib/tracking/detection.ts#L120)

### High Open Rate (>80%)

**Likely Cause**: Prefetch not being filtered

**Solution:**
```sql
-- Get real open rate (excluding prefetch)
SELECT
  COUNT(*) FILTER (WHERE is_prefetch = FALSE) AS real_opens,
  COUNT(*) AS total_opens,
  ROUND(
    (COUNT(*) FILTER (WHERE is_prefetch = FALSE)::DECIMAL /
     NULLIF(total_delivered, 0)) * 100,
    2
  ) AS real_open_rate
FROM email_events
WHERE campaign_id = 'your-campaign-id' AND event_type = 'opened';
```

### Low Click Rate (<2%)

**Possible Issues:**
- Links not prominent enough in email
- Poor call-to-action (CTA)
- Link text not compelling
- Mobile optimization issues

**Analysis:**
```sql
-- Check which links perform best
SELECT link_url, link_text, unique_clicks
FROM link_clicks
WHERE campaign_id = 'your-campaign-id'
ORDER BY unique_clicks DESC;
```

---

## Advanced Features

### Custom Event Tracking

Track custom events (e.g., video views, file downloads):

```typescript
await supabase.from('email_events').insert({
  campaign_id: campaignId,
  contact_id: contactId,
  event_type: 'video_viewed',
  metadata: {
    videoId: 'video-123',
    watchTime: 45, // seconds
  },
});
```

### A/B Testing Support

Track variant performance:

```sql
ALTER TABLE email_events
ADD COLUMN variant VARCHAR(50); -- 'A', 'B', 'control'

-- Compare variants
SELECT
  variant,
  COUNT(*) FILTER (WHERE event_type = 'opened') AS opens,
  COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicks
FROM email_events
WHERE campaign_id = 'your-campaign-id'
GROUP BY variant;
```

### Geographic Tracking (Optional)

Add IP geolocation:

```typescript
// Install: npm install geoip-lite
import geoip from 'geoip-lite';

const geo = geoip.lookup(ipAddress);
if (geo) {
  await supabase.from('email_events').update({
    country_code: geo.country,
    region: geo.region,
    city: geo.city,
  }).eq('id', eventId);
}
```

---

## File Reference

### Core Files

- [lib/tracking/detection.ts](lib/tracking/detection.ts) - Device, client, prefetch detection
- [lib/email/tracking.ts](lib/email/tracking.ts) - Pixel & link tracking utilities
- [lib/services/tracking-analytics.ts](lib/services/tracking-analytics.ts) - Analytics service

### API Endpoints

- [app/api/track/open/v2/route.ts](app/api/track/open/v2/route.ts) - Enhanced open tracking
- [app/api/track/click/v2/route.ts](app/api/track/click/v2/route.ts) - Enhanced click tracking
- [app/api/campaigns/[id]/analytics/route.ts](app/api/campaigns/[id]/analytics/route.ts) - Performance API
- [app/api/campaigns/[id]/analytics/links/route.ts](app/api/campaigns/[id]/analytics/links/route.ts) - Link API
- [app/api/campaigns/[id]/analytics/devices/route.ts](app/api/campaigns/[id]/analytics/devices/route.ts) - Device API
- [app/api/campaigns/[id]/analytics/timeline/route.ts](app/api/campaigns/[id]/analytics/timeline/route.ts) - Timeline API

### Components

- [components/analytics/campaign-stats-cards.tsx](components/analytics/campaign-stats-cards.tsx) - Stats cards
- [components/analytics/link-performance-table.tsx](components/analytics/link-performance-table.tsx) - Link table
- [components/analytics/device-breakdown-chart.tsx](components/analytics/device-breakdown-chart.tsx) - Device charts

### Database

- [DATABASE_TRACKING_SCHEMA.sql](DATABASE_TRACKING_SCHEMA.sql) - Complete schema

---

## Support

For issues or questions:
1. Check database indexes are created
2. Verify tracking endpoints return correct responses
3. Monitor prefetch detection accuracy
4. Review analytics queries in SQL Editor

---

**Happy Tracking! 📊**
