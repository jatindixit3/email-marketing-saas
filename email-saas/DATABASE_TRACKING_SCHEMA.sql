-- Email Tracking Database Schema
-- Enhanced tracking with support for opens, clicks, bounces, complaints, and unsubscribes

-- =======================
-- Email Events Table
-- =======================
-- Stores all email tracking events (opens, clicks, bounces, complaints, unsubscribes)

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'delivered', 'sent'
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Click Tracking
  link_url TEXT, -- Original URL that was clicked
  link_text TEXT, -- Text of the link (extracted from anchor tag)
  link_position INTEGER, -- Position of link in email (1st, 2nd, etc.)

  -- Bounce/Complaint Details
  bounce_type VARCHAR(50), -- 'hard', 'soft', 'transient'
  bounce_sub_type VARCHAR(100), -- 'general', 'no-email', 'suppressed', etc.
  bounce_reason TEXT, -- Detailed bounce reason from SES

  -- Tracking Metadata
  user_agent TEXT, -- Browser/email client user agent
  ip_address VARCHAR(45), -- IPv4 or IPv6
  device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
  email_client VARCHAR(100), -- Detected email client (Gmail, Outlook, etc.)
  operating_system VARCHAR(100), -- Detected OS

  -- Prefetch Detection
  is_prefetch BOOLEAN DEFAULT FALSE, -- Whether this was likely a prefetch/preload
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 confidence that this is a real human interaction

  -- Geographic Data (optional)
  country_code VARCHAR(2), -- ISO 3166-1 alpha-2 country code
  region VARCHAR(100), -- State/province
  city VARCHAR(100), -- City

  -- Additional Metadata
  metadata JSONB DEFAULT '{}', -- Flexible field for additional data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT email_events_campaign_contact_idx UNIQUE NULLS NOT DISTINCT (campaign_id, contact_id, event_type, event_timestamp)
);

-- =======================
-- Indexes
-- =======================

-- Index for querying events by campaign
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id, event_type);

-- Index for querying events by contact
CREATE INDEX IF NOT EXISTS idx_email_events_contact ON email_events(contact_id, event_type);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(event_timestamp DESC);

-- Index for unique opens (first open per contact/campaign)
CREATE INDEX IF NOT EXISTS idx_email_events_unique_opens
ON email_events(campaign_id, contact_id, event_type)
WHERE event_type = 'opened';

-- Index for unique clicks (deduplicated)
CREATE INDEX IF NOT EXISTS idx_email_events_unique_clicks
ON email_events(campaign_id, contact_id, link_url, event_type)
WHERE event_type = 'clicked';

-- Index for filtering out prefetch events
CREATE INDEX IF NOT EXISTS idx_email_events_real_events
ON email_events(campaign_id, event_type, is_prefetch)
WHERE is_prefetch = FALSE;

-- =======================
-- Campaign Stats Update Trigger
-- =======================
-- Automatically update campaign stats when events are recorded

CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics
  IF NEW.event_type = 'sent' THEN
    UPDATE campaigns
    SET total_sent = total_sent + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;

  ELSIF NEW.event_type = 'delivered' THEN
    UPDATE campaigns
    SET total_delivered = total_delivered + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;

  ELSIF NEW.event_type = 'opened' AND NEW.is_prefetch = FALSE THEN
    -- Only count real (non-prefetch) opens
    UPDATE campaigns
    SET total_opened = total_opened + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;

  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE campaigns
    SET total_clicked = total_clicked + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;

  ELSIF NEW.event_type = 'bounced' THEN
    UPDATE campaigns
    SET total_bounced = total_bounced + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;

  ELSIF NEW.event_type = 'complained' THEN
    UPDATE campaigns
    SET total_complained = total_complained + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;

  ELSIF NEW.event_type = 'unsubscribed' THEN
    UPDATE campaigns
    SET total_unsubscribed = total_unsubscribed + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS email_events_update_stats ON email_events;
CREATE TRIGGER email_events_update_stats
  AFTER INSERT ON email_events
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- =======================
-- Link Clicks Summary Table
-- =======================
-- Aggregated view of click tracking per link

CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Link Details
  link_url TEXT NOT NULL,
  link_text TEXT,
  link_position INTEGER,

  -- Click Stats
  total_clicks INTEGER DEFAULT 0, -- Total clicks (including duplicates)
  unique_clicks INTEGER DEFAULT 0, -- Unique contacts who clicked

  -- Timestamps
  first_click_at TIMESTAMP WITH TIME ZONE,
  last_click_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT link_clicks_campaign_url_unique UNIQUE(campaign_id, link_url)
);

-- Index for link performance queries
CREATE INDEX IF NOT EXISTS idx_link_clicks_campaign ON link_clicks(campaign_id);

-- =======================
-- Update Campaigns Table
-- =======================
-- Add tracking stats columns if they don't exist

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clicked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bounced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_complained INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_unsubscribed INTEGER DEFAULT 0;

-- =======================
-- Update Contacts Table
-- =======================
-- Add engagement tracking columns if they don't exist

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS last_engaged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_opens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bounced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bounce_type VARCHAR(50);

-- Index for engagement queries
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON contacts(last_engaged_at DESC) WHERE last_engaged_at IS NOT NULL;

-- =======================
-- Helper Views
-- =======================

-- View: Unique Opens (first open per contact per campaign)
CREATE OR REPLACE VIEW unique_opens AS
SELECT DISTINCT ON (campaign_id, contact_id)
  id,
  campaign_id,
  contact_id,
  event_timestamp,
  user_agent,
  device_type,
  email_client
FROM email_events
WHERE event_type = 'opened' AND is_prefetch = FALSE
ORDER BY campaign_id, contact_id, event_timestamp ASC;

-- View: Unique Clicks (first click per contact per campaign per link)
CREATE OR REPLACE VIEW unique_clicks AS
SELECT DISTINCT ON (campaign_id, contact_id, link_url)
  id,
  campaign_id,
  contact_id,
  link_url,
  link_text,
  event_timestamp,
  user_agent,
  device_type
FROM email_events
WHERE event_type = 'clicked'
ORDER BY campaign_id, contact_id, link_url, event_timestamp ASC;

-- View: Campaign Performance Summary
CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.subject,
  c.status,
  c.total_sent,
  c.total_delivered,
  c.total_opened,
  c.total_clicked,
  c.total_bounced,
  c.total_complained,
  c.total_unsubscribed,

  -- Calculated Rates
  CASE WHEN c.total_sent > 0
    THEN ROUND((c.total_delivered::DECIMAL / c.total_sent) * 100, 2)
    ELSE 0
  END AS delivery_rate,

  CASE WHEN c.total_delivered > 0
    THEN ROUND((c.total_opened::DECIMAL / c.total_delivered) * 100, 2)
    ELSE 0
  END AS open_rate,

  CASE WHEN c.total_opened > 0
    THEN ROUND((c.total_clicked::DECIMAL / c.total_opened) * 100, 2)
    ELSE 0
  END AS click_through_rate,

  CASE WHEN c.total_delivered > 0
    THEN ROUND((c.total_clicked::DECIMAL / c.total_delivered) * 100, 2)
    ELSE 0
  END AS click_to_open_rate,

  CASE WHEN c.total_sent > 0
    THEN ROUND((c.total_bounced::DECIMAL / c.total_sent) * 100, 2)
    ELSE 0
  END AS bounce_rate,

  c.sent_at,
  c.created_at
FROM campaigns c
WHERE c.deleted_at IS NULL;

-- =======================
-- Analytics Functions
-- =======================

-- Function: Get top performing links for a campaign
CREATE OR REPLACE FUNCTION get_top_links(
  p_campaign_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  link_url TEXT,
  link_text TEXT,
  total_clicks BIGINT,
  unique_clicks BIGINT,
  click_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.link_url,
    e.link_text,
    COUNT(*) AS total_clicks,
    COUNT(DISTINCT e.contact_id) AS unique_clicks,
    ROUND(
      (COUNT(DISTINCT e.contact_id)::DECIMAL /
       NULLIF((SELECT total_delivered FROM campaigns WHERE id = p_campaign_id), 0)) * 100,
      2
    ) AS click_rate
  FROM email_events e
  WHERE e.campaign_id = p_campaign_id
    AND e.event_type = 'clicked'
    AND e.link_url IS NOT NULL
  GROUP BY e.link_url, e.link_text
  ORDER BY total_clicks DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get engagement timeline for a campaign
CREATE OR REPLACE FUNCTION get_engagement_timeline(
  p_campaign_id UUID,
  p_interval VARCHAR DEFAULT 'hour' -- 'hour', 'day', 'week'
)
RETURNS TABLE (
  time_bucket TIMESTAMP WITH TIME ZONE,
  opens BIGINT,
  clicks BIGINT
) AS $$
BEGIN
  IF p_interval = 'hour' THEN
    RETURN QUERY
    SELECT
      DATE_TRUNC('hour', event_timestamp) AS time_bucket,
      COUNT(*) FILTER (WHERE event_type = 'opened') AS opens,
      COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicks
    FROM email_events
    WHERE campaign_id = p_campaign_id
      AND event_type IN ('opened', 'clicked')
    GROUP BY time_bucket
    ORDER BY time_bucket ASC;

  ELSIF p_interval = 'day' THEN
    RETURN QUERY
    SELECT
      DATE_TRUNC('day', event_timestamp) AS time_bucket,
      COUNT(*) FILTER (WHERE event_type = 'opened') AS opens,
      COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicks
    FROM email_events
    WHERE campaign_id = p_campaign_id
      AND event_type IN ('opened', 'clicked')
    GROUP BY time_bucket
    ORDER BY time_bucket ASC;

  ELSE -- week
    RETURN QUERY
    SELECT
      DATE_TRUNC('week', event_timestamp) AS time_bucket,
      COUNT(*) FILTER (WHERE event_type = 'opened') AS opens,
      COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicks
    FROM email_events
    WHERE campaign_id = p_campaign_id
      AND event_type IN ('opened', 'clicked')
    GROUP BY time_bucket
    ORDER BY time_bucket ASC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- Sample Queries
-- =======================

/*
-- Get campaign performance
SELECT * FROM campaign_performance WHERE campaign_id = 'your-campaign-id';

-- Get top performing links
SELECT * FROM get_top_links('your-campaign-id', 10);

-- Get engagement timeline (hourly)
SELECT * FROM get_engagement_timeline('your-campaign-id', 'hour');

-- Get all opens for a campaign
SELECT * FROM unique_opens WHERE campaign_id = 'your-campaign-id';

-- Get click-through contacts
SELECT DISTINCT c.email, c.first_name, c.last_name, e.link_url, e.event_timestamp
FROM email_events e
JOIN contacts c ON e.contact_id = c.id
WHERE e.campaign_id = 'your-campaign-id'
  AND e.event_type = 'clicked'
ORDER BY e.event_timestamp DESC;

-- Get device breakdown
SELECT
  device_type,
  COUNT(*) AS total_opens,
  COUNT(DISTINCT contact_id) AS unique_opens
FROM email_events
WHERE campaign_id = 'your-campaign-id'
  AND event_type = 'opened'
  AND is_prefetch = FALSE
GROUP BY device_type;

-- Get email client breakdown
SELECT
  email_client,
  COUNT(*) AS total_opens
FROM email_events
WHERE campaign_id = 'your-campaign-id'
  AND event_type = 'opened'
  AND is_prefetch = FALSE
  AND email_client IS NOT NULL
GROUP BY email_client
ORDER BY total_opens DESC;
*/
