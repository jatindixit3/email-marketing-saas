-- Performance Optimization Indexes
-- Production-ready indexes for email marketing SaaS

-- =======================
-- CAMPAIGNS TABLE INDEXES
-- =======================

-- Composite index for common queries (user_id + status + scheduled_at)
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status_scheduled
ON campaigns(user_id, status, scheduled_at)
WHERE deleted_at IS NULL;

-- Index for finding campaigns ready to send
CREATE INDEX IF NOT EXISTS idx_campaigns_ready_to_send
ON campaigns(scheduled_at, status)
WHERE status = 'scheduled' AND deleted_at IS NULL;

-- Index for recent campaigns per user
CREATE INDEX IF NOT EXISTS idx_campaigns_user_recent
ON campaigns(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for campaign performance queries
CREATE INDEX IF NOT EXISTS idx_campaigns_performance
ON campaigns(user_id, sent_at DESC)
WHERE status = 'sent' AND deleted_at IS NULL;

-- =======================
-- CONTACTS TABLE INDEXES
-- =======================

-- Composite index for active subscribers per user
CREATE INDEX IF NOT EXISTS idx_contacts_user_status_active
ON contacts(user_id, status)
WHERE status = 'subscribed' AND deleted_at IS NULL;

-- Index for email lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower
ON contacts(LOWER(email));

-- Index for contact search by user
CREATE INDEX IF NOT EXISTS idx_contacts_user_search
ON contacts(user_id, email, first_name, last_name)
WHERE deleted_at IS NULL;

-- Index for finding recently engaged contacts
CREATE INDEX IF NOT EXISTS idx_contacts_recent_engagement
ON contacts(user_id, last_engaged_at DESC NULLS LAST)
WHERE status = 'subscribed' AND deleted_at IS NULL;

-- Index for bounced contacts
CREATE INDEX IF NOT EXISTS idx_contacts_bounced
ON contacts(user_id, status)
WHERE status = 'bounced';

-- Partial index for unsubscribed contacts (for cleanup/analysis)
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribed_date
ON contacts(user_id, unsubscribed_at DESC)
WHERE status = 'unsubscribed';

-- =======================
-- EMAIL_EVENTS TABLE INDEXES
-- =======================

-- Composite index for campaign event analysis
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_type_time
ON email_events(campaign_id, event_type, created_at DESC);

-- Index for contact event history
CREATE INDEX IF NOT EXISTS idx_email_events_contact_type_time
ON email_events(contact_id, event_type, created_at DESC);

-- Index for recent events across all campaigns
CREATE INDEX IF NOT EXISTS idx_email_events_recent
ON email_events(created_at DESC, event_type);

-- Index for unique opens (avoiding prefetch)
CREATE INDEX IF NOT EXISTS idx_email_events_real_opens
ON email_events(campaign_id, contact_id, created_at DESC)
WHERE event_type = 'opened' AND (is_prefetch = FALSE OR is_prefetch IS NULL);

-- Index for unique clicks
CREATE INDEX IF NOT EXISTS idx_email_events_clicks_by_link
ON email_events(campaign_id, link_url, contact_id, created_at DESC)
WHERE event_type = 'clicked';

-- Index for bounce analysis
CREATE INDEX IF NOT EXISTS idx_email_events_bounces
ON email_events(contact_id, bounce_type, created_at DESC)
WHERE event_type = 'bounced';

-- Index for device/client analytics
CREATE INDEX IF NOT EXISTS idx_email_events_device_analytics
ON email_events(campaign_id, device_type, email_client)
WHERE event_type IN ('opened', 'clicked');

-- Partial index for complaints (rare but important)
CREATE INDEX IF NOT EXISTS idx_email_events_complaints
ON email_events(campaign_id, contact_id, created_at DESC)
WHERE event_type = 'complained';

-- =======================
-- LIST_CONTACTS TABLE INDEXES
-- =======================

-- Reverse index for finding lists per contact
CREATE INDEX IF NOT EXISTS idx_list_contacts_contact_list
ON list_contacts(contact_id, list_id);

-- Index for bulk operations
CREATE INDEX IF NOT EXISTS idx_list_contacts_list_created
ON list_contacts(list_id, created_at DESC);

-- =======================
-- CAMPAIGN_LISTS TABLE INDEXES
-- =======================

-- Reverse index for finding campaigns using a list
CREATE INDEX IF NOT EXISTS idx_campaign_lists_list_campaign
ON campaign_lists(list_id, campaign_id);

-- =======================
-- TEMPLATES TABLE INDEXES
-- =======================

-- Index for finding user's templates by category
CREATE INDEX IF NOT EXISTS idx_templates_user_category
ON templates(user_id, category, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for public templates
CREATE INDEX IF NOT EXISTS idx_templates_public_category
ON templates(is_public, category, usage_count DESC)
WHERE is_public = TRUE AND deleted_at IS NULL;

-- Index for popular templates
CREATE INDEX IF NOT EXISTS idx_templates_popular
ON templates(usage_count DESC, created_at DESC)
WHERE deleted_at IS NULL;

-- =======================
-- USERS TABLE INDEXES
-- =======================

-- Index for subscription management
CREATE INDEX IF NOT EXISTS idx_users_subscription_expiry
ON users(subscription_ends_at)
WHERE subscription_status IN ('active', 'trialing');

-- Index for trial expiry monitoring
CREATE INDEX IF NOT EXISTS idx_users_trial_expiry
ON users(trial_ends_at)
WHERE subscription_status = 'trialing' AND trial_ends_at IS NOT NULL;

-- Index for usage tracking
CREATE INDEX IF NOT EXISTS idx_users_usage_limits
ON users(subscription_tier, monthly_emails_sent, monthly_email_limit)
WHERE deleted_at IS NULL;

-- =======================
-- SECURITY TABLES INDEXES
-- =======================

-- Audit logs: efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time
ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_time
ON audit_logs(event_type, created_at DESC);

-- User consents: find latest consent per type
CREATE INDEX IF NOT EXISTS idx_user_consents_latest
ON user_consents(user_id, consent_type, granted_at DESC NULLS LAST);

-- Failed login attempts: recent attempts per email/IP
CREATE INDEX IF NOT EXISTS idx_failed_logins_email_recent
ON failed_login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_logins_ip_recent
ON failed_login_attempts(ip_address, attempted_at DESC);

-- Security events: unresolved high-priority events
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved
ON security_events(severity, created_at DESC)
WHERE resolved = FALSE;

-- =======================
-- WARMUP TABLES INDEXES (if exists)
-- =======================

CREATE INDEX IF NOT EXISTS idx_email_warmup_user_status
ON email_warmup(user_id, status, current_day)
WHERE status = 'active';

-- =======================
-- COVERING INDEXES
-- =======================
-- These indexes include additional columns to avoid table lookups

-- Campaign list with key stats (covering index)
CREATE INDEX IF NOT EXISTS idx_campaigns_list_covering
ON campaigns(user_id, created_at DESC)
INCLUDE (name, status, emails_sent, open_rate, click_rate)
WHERE deleted_at IS NULL;

-- Contact list with key info (covering index)
CREATE INDEX IF NOT EXISTS idx_contacts_list_covering
ON contacts(user_id, created_at DESC)
INCLUDE (email, first_name, last_name, status)
WHERE deleted_at IS NULL;

-- =======================
-- EXPRESSION INDEXES
-- =======================

-- Case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm
ON contacts USING gin(LOWER(email) gin_trgm_ops);

-- Full-text search for contact names
CREATE INDEX IF NOT EXISTS idx_contacts_name_search
ON contacts USING gin(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  )
);

-- Campaign name search
CREATE INDEX IF NOT EXISTS idx_campaigns_name_search
ON campaigns USING gin(to_tsvector('english', name))
WHERE deleted_at IS NULL;

-- =======================
-- ANALYZE TABLES
-- =======================
-- Update table statistics for query planner

ANALYZE users;
ANALYZE contacts;
ANALYZE lists;
ANALYZE list_contacts;
ANALYZE campaigns;
ANALYZE campaign_lists;
ANALYZE email_events;
ANALYZE templates;
ANALYZE audit_logs;
ANALYZE user_consents;
ANALYZE user_sessions;
ANALYZE failed_login_attempts;
ANALYZE security_events;

-- =======================
-- INDEX MAINTENANCE NOTES
-- =======================

/*
REGULAR MAINTENANCE TASKS:

1. Reindex periodically (monthly):
   REINDEX TABLE email_events;
   REINDEX TABLE contacts;
   REINDEX TABLE campaigns;

2. Update statistics (weekly):
   ANALYZE email_events;
   ANALYZE contacts;
   ANALYZE campaigns;

3. Monitor index usage:
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan ASC;

4. Find unused indexes:
   SELECT schemaname, tablename, indexname
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   AND indexrelname NOT LIKE 'pg_toast%';

5. Check index bloat:
   SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/
