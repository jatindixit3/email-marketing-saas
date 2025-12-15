# Email Marketing SaaS Database Schema

Complete PostgreSQL database schema for a full-featured email marketing platform.

## Table of Contents

- [Overview](#overview)
- [Database Models](#database-models)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Triggers](#triggers)
- [Setup Instructions](#setup-instructions)

## Overview

This schema supports:
- Multi-tenant architecture (user-based isolation)
- Contact management with custom fields
- List segmentation
- Campaign creation and scheduling
- Email event tracking (opens, clicks, bounces)
- Template library
- Soft deletes
- Automatic timestamp management

## Database Models

### 1. Users
Primary table for account management and subscription tracking.

**Key Fields:**
- `email` - Unique user email (login)
- `subscription_tier` - free, starter, growth, pro, scale
- `subscription_status` - active, cancelled, past_due, trialing
- `monthly_email_limit` - Emails allowed per month
- `monthly_emails_sent` - Counter for current month
- `contact_limit` - Maximum contacts allowed

**Metadata:**
- `metadata` - Custom JSON data
- `settings` - User preferences (timezone, notifications, defaults)

### 2. Lists
Contact grouping for segmentation.

**Key Fields:**
- `name` - List name
- `contact_count` - Auto-updated via trigger
- `user_id` - Foreign key to users

**Features:**
- Soft delete support
- Automatic contact count maintenance
- Many-to-many relationship with contacts

### 3. Contacts
Individual email recipients.

**Key Fields:**
- `email` - Contact email (unique per user)
- `status` - subscribed, unsubscribed, bounced, complained
- `subscription_source` - How they joined (website, import, api, manual)
- `email_verified` - Email verification status
- `custom_fields` - JSON for custom data
- `tags` - Array of tags for categorization

**Constraints:**
- Unique email per user (not globally unique)
- Indexed for fast lookups

### 4. ListContacts
Junction table for list-contact many-to-many relationship.

**Features:**
- Triggers update list contact_count
- Ensures unique contacts per list
- Cascade deletes

### 5. Templates
Reusable email designs.

**Key Fields:**
- `html_content` - Email HTML
- `text_content` - Plain text version
- `category` - newsletter, promotion, welcome, etc.
- `is_public` - Available to all users
- `usage_count` - Tracks template usage

**Features:**
- Can be user-owned or public
- Categorized for easy filtering
- Thumbnail support

### 6. Campaigns
Email campaigns with full tracking.

**Key Fields:**
- `status` - draft, scheduled, sending, sent, paused, cancelled
- `scheduled_at` - When to send
- `sent_at` - When actually sent

**Stats Fields (Auto-updated):**
- `emails_sent`, `emails_delivered`, `emails_bounced`
- `emails_opened`, `emails_clicked`
- `emails_unsubscribed`, `emails_complained`
- `open_rate`, `click_rate`, `bounce_rate`, `unsubscribe_rate`

**Features:**
- Links to template (optional)
- Multiple list targeting via CampaignLists
- Automatic stats calculation via triggers

### 7. CampaignLists
Junction table for campaign-list many-to-many relationship.

### 8. EmailEvents
Detailed event tracking for all email interactions.

**Event Types:**
- `sent` - Email sent
- `delivered` - Successfully delivered
- `opened` - Email opened (tracking pixel)
- `clicked` - Link clicked
- `bounced` - Delivery failed
- `unsubscribed` - User unsubscribed
- `complained` - Marked as spam

**Tracking Data:**
- `user_agent`, `ip_address`, `location`, `device_type`
- `link_url`, `link_text` (for clicks)
- `bounce_type`, `bounce_reason` (for bounces)

## Relationships

```
users (1) ----< (many) lists
users (1) ----< (many) contacts
users (1) ----< (many) templates
users (1) ----< (many) campaigns

lists (many) ----< (junction: list_contacts) >---- (many) contacts
campaigns (many) ----< (junction: campaign_lists) >---- (many) lists

campaigns (1) ----< (many) email_events
contacts (1) ----< (many) email_events
templates (1) ----< (many) campaigns (optional)
```

## Indexes

### Performance Optimizations

**users:**
- `idx_users_email` - Fast login lookups
- `idx_users_subscription_tier` - Filter by tier
- `idx_users_subscription_status` - Active users queries

**contacts:**
- `idx_contacts_user_id` - User's contacts
- `idx_contacts_email` - Email lookups
- `idx_contacts_status` - Status filtering
- `idx_contacts_tags` - GIN index for array searches
- `idx_contacts_custom_fields` - GIN index for JSON queries

**campaigns:**
- `idx_campaigns_status` - Filter by status
- `idx_campaigns_scheduled_at` - Scheduled campaigns queue
- `idx_campaigns_sent_at` - Historical queries

**email_events:**
- `idx_email_events_campaign_id` - Campaign stats
- `idx_email_events_contact_id` - Contact engagement
- `idx_email_events_event_type` - Event filtering
- `idx_email_events_campaign_contact` - Composite for unique tracking

## Triggers

### 1. Automatic Timestamps
```sql
update_updated_at_column()
```
Automatically updates `updated_at` field on UPDATE for:
- users, lists, contacts, templates, campaigns

### 2. List Contact Count
```sql
update_list_contact_count()
```
Maintains accurate `contact_count` on lists table when:
- Contacts added to list
- Contacts removed from list

### 3. Campaign Stats
```sql
update_campaign_stats()
```
Automatically recalculates campaign statistics when email_events are inserted:
- Counts for each event type
- Calculated rates (open, click, bounce, unsubscribe)

## Setup Instructions

### 1. Create Database

```bash
# Create PostgreSQL database
createdb email_marketing_saas

# Or via psql
psql -U postgres -c "CREATE DATABASE email_marketing_saas;"
```

### 2. Run SQL Schema

```bash
psql -U postgres -d email_marketing_saas -f database/schema.sql
```

### 3. Setup Prisma (Optional)

```bash
# Install Prisma
npm install prisma @prisma/client

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate dev --name init
```

### 4. Verify Installation

```sql
-- Check tables
\dt

-- Check views
\dv

-- Check triggers
\dy
```

## Common Queries

### Get User's Active Contacts

```sql
SELECT * FROM contacts
WHERE user_id = 'user-uuid'
  AND status = 'subscribed'
  AND deleted_at IS NULL;
```

### Get Campaign Performance

```sql
SELECT
  c.name,
  c.subject,
  c.emails_sent,
  c.open_rate,
  c.click_rate,
  c.sent_at
FROM campaigns c
WHERE c.user_id = 'user-uuid'
  AND c.status = 'sent'
  AND c.deleted_at IS NULL
ORDER BY c.sent_at DESC
LIMIT 10;
```

### Get Contact Engagement History

```sql
SELECT
  ee.event_type,
  ee.created_at,
  c.name as campaign_name
FROM email_events ee
JOIN campaigns c ON c.id = ee.campaign_id
WHERE ee.contact_id = 'contact-uuid'
ORDER BY ee.created_at DESC;
```

### Get Subscriber Growth

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_subscribers
FROM contacts
WHERE user_id = 'user-uuid'
  AND status = 'subscribed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Data Retention & Cleanup

### Soft Deletes

Most tables support soft deletes via `deleted_at` timestamp:
- Users can "delete" records without losing historical data
- Queries filter by `deleted_at IS NULL`
- Periodic cleanup can permanently delete old soft-deleted records

### Archive Old Email Events

```sql
-- Archive events older than 1 year
CREATE TABLE email_events_archive AS
SELECT * FROM email_events
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM email_events
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Security Considerations

1. **Row-Level Security**: Consider implementing RLS for multi-tenant isolation
2. **Encrypted Fields**: Hash/encrypt sensitive data (password_hash is already hashed)
3. **API Keys**: Store API keys in separate table with encryption
4. **Audit Log**: Consider adding audit_log table for compliance
5. **Backup**: Regular automated backups of production database

## Performance Tips

1. **Partitioning**: Consider partitioning `email_events` by date for large volumes
2. **Materialized Views**: Create for dashboard statistics
3. **Connection Pooling**: Use PgBouncer for connection management
4. **Query Optimization**: Monitor slow queries with `pg_stat_statements`
5. **Vacuum**: Regular VACUUM ANALYZE for optimal performance

## Migrations

When making schema changes:

1. Create migration file
2. Test on staging
3. Backup production
4. Run migration
5. Verify data integrity

Example migration structure:
```
migrations/
  001_initial_schema.sql
  002_add_campaign_tags.sql
  003_add_contact_source.sql
```

## License

This schema is part of the Email Marketing SaaS project.
