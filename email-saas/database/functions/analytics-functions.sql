-- Analytics Database Functions
-- Optimized stored procedures for common analytics queries

-- =======================
-- Event Aggregation Functions
-- =======================

-- Get event counts by type for a campaign
CREATE OR REPLACE FUNCTION get_event_counts_by_type(p_campaign_id UUID)
RETURNS TABLE (
  event_type VARCHAR,
  total_count BIGINT,
  unique_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.event_type,
    COUNT(*) AS total_count,
    COUNT(DISTINCT e.contact_id) AS unique_count
  FROM email_events e
  WHERE e.campaign_id = p_campaign_id
    AND (e.event_type != 'opened' OR e.is_prefetch = FALSE OR e.is_prefetch IS NULL)
  GROUP BY e.event_type
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get device breakdown for a campaign
CREATE OR REPLACE FUNCTION get_device_breakdown(p_campaign_id UUID)
RETURNS TABLE (
  device_type VARCHAR,
  total_opens BIGINT,
  unique_opens BIGINT,
  percentage DECIMAL
) AS $$
DECLARE
  total_unique_opens BIGINT;
BEGIN
  -- Get total unique opens for percentage calculation
  SELECT COUNT(DISTINCT contact_id)
  INTO total_unique_opens
  FROM email_events
  WHERE campaign_id = p_campaign_id
    AND event_type = 'opened'
    AND (is_prefetch = FALSE OR is_prefetch IS NULL);

  RETURN QUERY
  SELECT
    e.device_type,
    COUNT(*) AS total_opens,
    COUNT(DISTINCT e.contact_id) AS unique_opens,
    CASE
      WHEN total_unique_opens > 0 THEN
        ROUND((COUNT(DISTINCT e.contact_id)::DECIMAL / total_unique_opens) * 100, 2)
      ELSE 0
    END AS percentage
  FROM email_events e
  WHERE e.campaign_id = p_campaign_id
    AND e.event_type = 'opened'
    AND (e.is_prefetch = FALSE OR e.is_prefetch IS NULL)
    AND e.device_type IS NOT NULL
  GROUP BY e.device_type
  ORDER BY unique_opens DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get email client breakdown
CREATE OR REPLACE FUNCTION get_email_client_breakdown(p_campaign_id UUID)
RETURNS TABLE (
  email_client VARCHAR,
  total_opens BIGINT,
  unique_opens BIGINT,
  percentage DECIMAL
) AS $$
DECLARE
  total_unique_opens BIGINT;
BEGIN
  SELECT COUNT(DISTINCT contact_id)
  INTO total_unique_opens
  FROM email_events
  WHERE campaign_id = p_campaign_id
    AND event_type = 'opened'
    AND (is_prefetch = FALSE OR is_prefetch IS NULL);

  RETURN QUERY
  SELECT
    e.email_client,
    COUNT(*) AS total_opens,
    COUNT(DISTINCT e.contact_id) AS unique_opens,
    CASE
      WHEN total_unique_opens > 0 THEN
        ROUND((COUNT(DISTINCT e.contact_id)::DECIMAL / total_unique_opens) * 100, 2)
      ELSE 0
    END AS percentage
  FROM email_events e
  WHERE e.campaign_id = p_campaign_id
    AND e.event_type = 'opened'
    AND (e.is_prefetch = FALSE OR e.is_prefetch IS NULL)
    AND e.email_client IS NOT NULL
  GROUP BY e.email_client
  ORDER BY unique_opens DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- =======================
-- User Engagement Metrics
-- =======================

-- Get overall engagement metrics for a user
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(p_user_id UUID)
RETURNS TABLE (
  total_campaigns_sent BIGINT,
  total_emails_sent BIGINT,
  avg_open_rate DECIMAL,
  avg_click_rate DECIMAL,
  avg_bounce_rate DECIMAL,
  most_engaged_contacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id)::BIGINT AS total_campaigns_sent,
    SUM(c.emails_sent)::BIGINT AS total_emails_sent,
    ROUND(AVG(c.open_rate), 2) AS avg_open_rate,
    ROUND(AVG(c.click_rate), 2) AS avg_click_rate,
    ROUND(AVG(c.bounce_rate), 2) AS avg_bounce_rate,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'email', contacts.email,
          'total_opens', COUNT(*) FILTER (WHERE e.event_type = 'opened'),
          'total_clicks', COUNT(*) FILTER (WHERE e.event_type = 'clicked')
        )
      )
      FROM (
        SELECT contact_id, COUNT(*) as event_count
        FROM email_events
        WHERE event_type IN ('opened', 'clicked')
        AND campaign_id IN (SELECT id FROM campaigns WHERE user_id = p_user_id)
        GROUP BY contact_id
        ORDER BY event_count DESC
        LIMIT 10
      ) top_contacts
      JOIN contacts ON contacts.id = top_contacts.contact_id
      JOIN email_events e ON e.contact_id = contacts.id
      GROUP BY contacts.email
    ) AS most_engaged_contacts
  FROM campaigns c
  WHERE c.user_id = p_user_id
    AND c.status = 'sent'
    AND c.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =======================
-- Campaign Stats Update (Optimized)
-- =======================

-- Optimized function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats_optimized(p_campaign_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sent BIGINT;
  v_delivered BIGINT;
  v_opened BIGINT;
  v_clicked BIGINT;
  v_bounced BIGINT;
  v_unsubscribed BIGINT;
  v_complained BIGINT;
BEGIN
  -- Get all counts in a single query
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'sent'),
    COUNT(*) FILTER (WHERE event_type = 'delivered'),
    COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'opened' AND (is_prefetch = FALSE OR is_prefetch IS NULL)),
    COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'clicked'),
    COUNT(*) FILTER (WHERE event_type = 'bounced'),
    COUNT(*) FILTER (WHERE event_type = 'unsubscribed'),
    COUNT(*) FILTER (WHERE event_type = 'complained')
  INTO v_sent, v_delivered, v_opened, v_clicked, v_bounced, v_unsubscribed, v_complained
  FROM email_events
  WHERE campaign_id = p_campaign_id;

  -- Update campaign in a single statement
  UPDATE campaigns
  SET
    emails_sent = v_sent,
    emails_delivered = v_delivered,
    emails_opened = v_opened,
    emails_clicked = v_clicked,
    emails_bounced = v_bounced,
    emails_unsubscribed = v_unsubscribed,
    emails_complained = v_complained,
    open_rate = CASE WHEN v_delivered > 0 THEN ROUND((v_opened::DECIMAL / v_delivered) * 100, 2) ELSE 0 END,
    click_rate = CASE WHEN v_delivered > 0 THEN ROUND((v_clicked::DECIMAL / v_delivered) * 100, 2) ELSE 0 END,
    bounce_rate = CASE WHEN v_sent > 0 THEN ROUND((v_bounced::DECIMAL / v_sent) * 100, 2) ELSE 0 END,
    unsubscribe_rate = CASE WHEN v_delivered > 0 THEN ROUND((v_unsubscribed::DECIMAL / v_delivered) * 100, 2) ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- Contact Engagement Functions
-- =======================

-- Get most engaged contacts for a user
CREATE OR REPLACE FUNCTION get_most_engaged_contacts(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  contact_id UUID,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  total_opens BIGINT,
  total_clicks BIGINT,
  engagement_score INTEGER,
  last_engaged_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS contact_id,
    c.email,
    c.first_name,
    c.last_name,
    COUNT(*) FILTER (WHERE e.event_type = 'opened') AS total_opens,
    COUNT(*) FILTER (WHERE e.event_type = 'clicked') AS total_clicks,
    (
      COUNT(*) FILTER (WHERE e.event_type = 'opened') +
      (COUNT(*) FILTER (WHERE e.event_type = 'clicked') * 2)
    )::INTEGER AS engagement_score,
    MAX(e.created_at) AS last_engaged_at
  FROM contacts c
  LEFT JOIN email_events e ON e.contact_id = c.id
  WHERE c.user_id = p_user_id
    AND c.status = 'subscribed'
    AND c.deleted_at IS NULL
  GROUP BY c.id, c.email, c.first_name, c.last_name
  HAVING COUNT(*) FILTER (WHERE e.event_type IN ('opened', 'clicked')) > 0
  ORDER BY engagement_score DESC, last_engaged_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get inactive contacts (no engagement in N days)
CREATE OR REPLACE FUNCTION get_inactive_contacts(
  p_user_id UUID,
  p_days INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  contact_id UUID,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  last_engaged_at TIMESTAMP WITH TIME ZONE,
  days_inactive INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS contact_id,
    c.email,
    c.first_name,
    c.last_name,
    c.last_engaged_at,
    EXTRACT(DAY FROM NOW() - COALESCE(c.last_engaged_at, c.created_at))::INTEGER AS days_inactive
  FROM contacts c
  WHERE c.user_id = p_user_id
    AND c.status = 'subscribed'
    AND c.deleted_at IS NULL
    AND (
      c.last_engaged_at IS NULL
      OR c.last_engaged_at < NOW() - (p_days || ' days')::INTERVAL
    )
  ORDER BY c.last_engaged_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =======================
-- Time-based Analytics
-- =======================

-- Get campaign performance over time
CREATE OR REPLACE FUNCTION get_campaign_performance_timeline(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_interval VARCHAR DEFAULT 'day' -- 'hour', 'day', 'week', 'month'
)
RETURNS TABLE (
  time_bucket TIMESTAMP WITH TIME ZONE,
  campaigns_sent BIGINT,
  total_recipients BIGINT,
  avg_open_rate DECIMAL,
  avg_click_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC(p_interval, c.sent_at) AS time_bucket,
    COUNT(DISTINCT c.id)::BIGINT AS campaigns_sent,
    SUM(c.recipient_count)::BIGINT AS total_recipients,
    ROUND(AVG(c.open_rate), 2) AS avg_open_rate,
    ROUND(AVG(c.click_rate), 2) AS avg_click_rate
  FROM campaigns c
  WHERE c.user_id = p_user_id
    AND c.status = 'sent'
    AND c.sent_at BETWEEN p_start_date AND p_end_date
    AND c.deleted_at IS NULL
  GROUP BY time_bucket
  ORDER BY time_bucket ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =======================
-- List Analytics
-- =======================

-- Get list growth over time
CREATE OR REPLACE FUNCTION get_list_growth(
  p_list_id UUID,
  p_interval VARCHAR DEFAULT 'day'
)
RETURNS TABLE (
  time_bucket TIMESTAMP WITH TIME ZONE,
  new_subscribers BIGINT,
  cumulative_total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_additions AS (
    SELECT
      DATE_TRUNC(p_interval, lc.created_at) AS bucket,
      COUNT(*) AS additions
    FROM list_contacts lc
    WHERE lc.list_id = p_list_id
    GROUP BY bucket
  )
  SELECT
    bucket AS time_bucket,
    additions::BIGINT AS new_subscribers,
    SUM(additions) OVER (ORDER BY bucket)::BIGINT AS cumulative_total
  FROM daily_additions
  ORDER BY bucket ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =======================
-- A/B Testing Functions
-- =======================

-- Compare two campaigns (A/B test results)
CREATE OR REPLACE FUNCTION compare_campaigns(
  p_campaign_a_id UUID,
  p_campaign_b_id UUID
)
RETURNS TABLE (
  metric VARCHAR,
  campaign_a_value DECIMAL,
  campaign_b_value DECIMAL,
  difference_pct DECIMAL,
  winner VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH campaign_stats AS (
    SELECT
      id,
      open_rate,
      click_rate,
      bounce_rate,
      unsubscribe_rate
    FROM campaigns
    WHERE id IN (p_campaign_a_id, p_campaign_b_id)
  )
  SELECT
    'Open Rate'::VARCHAR AS metric,
    MAX(open_rate) FILTER (WHERE id = p_campaign_a_id) AS campaign_a_value,
    MAX(open_rate) FILTER (WHERE id = p_campaign_b_id) AS campaign_b_value,
    ROUND(
      (MAX(open_rate) FILTER (WHERE id = p_campaign_b_id) -
       MAX(open_rate) FILTER (WHERE id = p_campaign_a_id)) /
      NULLIF(MAX(open_rate) FILTER (WHERE id = p_campaign_a_id), 0) * 100,
      2
    ) AS difference_pct,
    CASE
      WHEN MAX(open_rate) FILTER (WHERE id = p_campaign_a_id) >
           MAX(open_rate) FILTER (WHERE id = p_campaign_b_id) THEN 'Campaign A'
      WHEN MAX(open_rate) FILTER (WHERE id = p_campaign_b_id) >
           MAX(open_rate) FILTER (WHERE id = p_campaign_a_id) THEN 'Campaign B'
      ELSE 'Tie'
    END AS winner
  FROM campaign_stats
  UNION ALL
  SELECT
    'Click Rate'::VARCHAR,
    MAX(click_rate) FILTER (WHERE id = p_campaign_a_id),
    MAX(click_rate) FILTER (WHERE id = p_campaign_b_id),
    ROUND(
      (MAX(click_rate) FILTER (WHERE id = p_campaign_b_id) -
       MAX(click_rate) FILTER (WHERE id = p_campaign_a_id)) /
      NULLIF(MAX(click_rate) FILTER (WHERE id = p_campaign_a_id), 0) * 100,
      2
    ),
    CASE
      WHEN MAX(click_rate) FILTER (WHERE id = p_campaign_a_id) >
           MAX(click_rate) FILTER (WHERE id = p_campaign_b_id) THEN 'Campaign A'
      WHEN MAX(click_rate) FILTER (WHERE id = p_campaign_b_id) >
           MAX(click_rate) FILTER (WHERE id = p_campaign_a_id) THEN 'Campaign B'
      ELSE 'Tie'
    END
  FROM campaign_stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- =======================
-- Performance Monitoring
-- =======================

-- Get slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  max_time DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    query,
    calls,
    total_exec_time AS total_time,
    mean_exec_time AS mean_time,
    max_exec_time AS max_time
  FROM pg_stat_statements
  WHERE query NOT LIKE '%pg_stat_statements%'
  ORDER BY mean_exec_time DESC
  LIMIT p_limit;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_stat_statements extension not enabled';
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  total_size TEXT,
  table_size TEXT,
  indexes_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;
