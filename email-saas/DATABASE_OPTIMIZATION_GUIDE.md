# Database Optimization Guide

Complete guide to PostgreSQL database optimization for production SaaS.

## Table of Contents

1. [Performance Indexes](#performance-indexes)
2. [Optimized Queries](#optimized-queries)
3. [Connection Pooling](#connection-pooling)
4. [Database Backups](#database-backups)
5. [Migrations](#migrations)
6. [Maintenance](#maintenance)
7. [Monitoring](#monitoring)

---

## Performance Indexes

### Overview

Indexes are critical for query performance. We've created comprehensive indexes for all high-traffic queries.

### Index Files

- **[database/migrations/performance-indexes.sql](database/migrations/performance-indexes.sql)** - All performance indexes

### Key Indexes Created

#### Campaigns Table
```sql
-- User + status + scheduled (for finding campaigns to send)
CREATE INDEX idx_campaigns_user_status_scheduled
ON campaigns(user_id, status, scheduled_at)
WHERE deleted_at IS NULL;

-- Ready to send (scheduled campaigns)
CREATE INDEX idx_campaigns_ready_to_send
ON campaigns(scheduled_at, status)
WHERE status = 'scheduled' AND deleted_at IS NULL;

-- Recent campaigns per user
CREATE INDEX idx_campaigns_user_recent
ON campaigns(user_id, created_at DESC)
WHERE deleted_at IS NULL;
```

#### Contacts Table
```sql
-- Active subscribers per user
CREATE INDEX idx_contacts_user_status_active
ON contacts(user_id, status)
WHERE status = 'subscribed' AND deleted_at IS NULL;

-- Case-insensitive email search
CREATE INDEX idx_contacts_email_lower
ON contacts(LOWER(email));

-- Recent engagement
CREATE INDEX idx_contacts_recent_engagement
ON contacts(user_id, last_engaged_at DESC NULLS LAST)
WHERE status = 'subscribed' AND deleted_at IS NULL;
```

#### Email Events Table
```sql
-- Campaign event analysis
CREATE INDEX idx_email_events_campaign_type_time
ON email_events(campaign_id, event_type, created_at DESC);

-- Contact event history
CREATE INDEX idx_email_events_contact_type_time
ON email_events(contact_id, event_type, created_at DESC);

-- Real opens (excluding prefetch)
CREATE INDEX idx_email_events_real_opens
ON email_events(campaign_id, contact_id, created_at DESC)
WHERE event_type = 'opened' AND (is_prefetch = FALSE OR is_prefetch IS NULL);

-- Click tracking
CREATE INDEX idx_email_events_clicks_by_link
ON email_events(campaign_id, link_url, contact_id, created_at DESC)
WHERE event_type = 'clicked';
```

### Apply Indexes

```bash
# Apply all performance indexes
psql $DATABASE_URL -f database/migrations/performance-indexes.sql
```

### Covering Indexes

Covering indexes include additional columns to avoid table lookups:

```sql
-- Campaign list with key stats
CREATE INDEX idx_campaigns_list_covering
ON campaigns(user_id, created_at DESC)
INCLUDE (name, status, emails_sent, open_rate, click_rate)
WHERE deleted_at IS NULL;

-- Contact list with key info
CREATE INDEX idx_contacts_list_covering
ON contacts(user_id, created_at DESC)
INCLUDE (email, first_name, last_name, status)
WHERE deleted_at IS NULL;
```

### Full-Text Search Indexes

```sql
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Case-insensitive email search
CREATE INDEX idx_contacts_email_trgm
ON contacts USING gin(LOWER(email) gin_trgm_ops);

-- Full-text search for contact names
CREATE INDEX idx_contacts_name_search
ON contacts USING gin(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  )
);

-- Campaign name search
CREATE INDEX idx_campaigns_name_search
ON campaigns USING gin(to_tsvector('english', name))
WHERE deleted_at IS NULL;
```

---

## Optimized Queries

### Overview

All queries are optimized to:
- Select specific fields (no `SELECT *`)
- Use pagination
- Prevent N+1 queries with eager loading
- Use batch operations

### Query Files

- **[lib/database/optimized-queries.ts](lib/database/optimized-queries.ts)** - Optimized TypeScript queries
- **[database/functions/analytics-functions.sql](database/functions/analytics-functions.sql)** - Database functions

### Example: Paginated Campaigns

```typescript
import { getCampaigns } from '@/lib/database/optimized-queries'

// Get campaigns with pagination
const result = await getCampaigns(userId, {
  status: 'sent',
  page: 1,
  limit: 25,
  sortBy: 'created_at',
  sortOrder: 'desc'
})

console.log(result.data) // Campaign array
console.log(result.pagination) // { page, limit, total, hasNext, hasPrev }
```

### Example: Eager Loading (Prevent N+1)

```typescript
import { getCampaignWithRelations } from '@/lib/database/optimized-queries'

// Single query with all relations
const campaign = await getCampaignWithRelations(campaignId, userId)

console.log(campaign.template) // Template data (no extra query)
console.log(campaign.campaign_lists) // Lists data (no extra query)
```

### Example: Batch Operations

```typescript
import { bulkAddContactsToList } from '@/lib/database/optimized-queries'

// Add 1000 contacts to list in batches
const contactIds = [...] // 1000 IDs
const result = await bulkAddContactsToList(contactIds, listId)

console.log(result.success) // Number successfully added
console.log(result.failed) // Number failed
```

### Database Functions

Install analytics functions:

```bash
psql $DATABASE_URL -f database/functions/analytics-functions.sql
```

Key functions:
- `get_event_counts_by_type(campaign_id)` - Event aggregation
- `get_device_breakdown(campaign_id)` - Device analytics
- `get_user_engagement_metrics(user_id)` - User metrics
- `update_campaign_stats_optimized(campaign_id)` - Update stats
- `get_most_engaged_contacts(user_id, limit)` - Top contacts
- `get_inactive_contacts(user_id, days, limit)` - Inactive contacts

Usage:

```sql
-- Get event counts for campaign
SELECT * FROM get_event_counts_by_type('campaign-id');

-- Get device breakdown
SELECT * FROM get_device_breakdown('campaign-id');

-- Get engagement metrics for user
SELECT * FROM get_user_engagement_metrics('user-id');
```

---

## Connection Pooling

### Overview

Connection pooling prevents database connection exhaustion and improves performance.

### Configuration Files

- **[lib/database/connection-pool.ts](lib/database/connection-pool.ts)** - Pool configuration
- **[database/functions/connection-pool-functions.sql](database/functions/connection-pool-functions.sql)** - Pool management functions

### Environment Variables

```env
# Direct connection (migrations, admin)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Pooled connection (application queries)
DATABASE_POOL_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true

# Pool Configuration
DATABASE_POOL_MAX=20                    # Max connections
DATABASE_POOL_MIN=2                     # Min connections
DATABASE_POOL_IDLE_TIMEOUT=30000        # 30s idle timeout
DATABASE_POOL_CONNECTION_TIMEOUT=10000  # 10s connection timeout
DATABASE_POOL_MAX_LIFETIME=1800000      # 30min max lifetime
DATABASE_STATEMENT_TIMEOUT=60000        # 60s statement timeout
```

### Supabase Connection Pooling

For Supabase, use the **Session** or **Transaction** pooling mode:

1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the "Connection Pooling" connection string
3. Use port **6543** (pooler) instead of **5432** (direct)

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Pool Size Recommendations

| Traffic Level | Max Connections | Min Connections |
|--------------|-----------------|-----------------|
| Low | 10 | 2 |
| Medium | 20 | 2 |
| High | 40 | 5 |
| Very High | 100 | 10 |

**Formula:** `(CPU cores × 2) + effective spindles`

### Monitoring Connection Pool

```typescript
import { monitorConnectionPool } from '@/lib/database/connection-pool'

const health = await monitorConnectionPool()

console.log(health.healthy) // true/false
console.log(health.stats) // { total, idle, active, waiting }
console.log(health.warnings) // Array of warnings
```

SQL monitoring:

```sql
-- Install pool management functions
\i database/functions/connection-pool-functions.sql

-- Check pool stats
SELECT * FROM get_connection_pool_stats();

-- Get active connections
SELECT * FROM get_active_connections();

-- Find long-running queries
SELECT * FROM find_long_running_queries(60);

-- Find idle connections
SELECT * FROM find_idle_connections(300);

-- Check connection limits
SELECT * FROM get_connection_limits();

-- Comprehensive health check
SELECT * FROM check_connection_pool_health();
```

### Cleanup Commands

```sql
-- Kill queries running > 5 minutes
SELECT * FROM kill_long_running_queries(300000);

-- Close idle connections > 10 minutes
SELECT * FROM close_idle_connections(600000);
```

---

## Database Backups

### Overview

Automated daily backups with 30-day retention and point-in-time recovery.

### Backup Scripts

- **[scripts/backup-database.sh](scripts/backup-database.sh)** - Automated backup
- **[scripts/restore-database.sh](scripts/restore-database.sh)** - Safe restore

### Setup Automated Backups

#### 1. Configure Environment

```env
# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# S3 Backup (optional)
S3_BACKUP_BUCKET=my-saas-backups
AWS_REGION=us-east-1

# Notifications (optional)
BACKUP_WEBHOOK_URL=https://hooks.slack.com/...
```

#### 2. Make Scripts Executable

```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
```

#### 3. Test Manual Backup

```bash
./scripts/backup-database.sh
```

This creates:
- `email_saas_backup_YYYYMMDD_HHMMSS.dump` - Full backup (custom format)
- `email_saas_backup_YYYYMMDD_HHMMSS.sql.gz` - SQL backup (compressed)
- `email_saas_backup_YYYYMMDD_HHMMSS_schema.sql` - Schema only

#### 4. Schedule Daily Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup-database.sh

# Or use systemd timer (Linux)
```

#### 5. S3 Upload (Optional)

Backups are automatically uploaded to S3 if configured:

```bash
# Install AWS CLI
brew install awscli  # macOS
apt-get install awscli  # Ubuntu

# Configure AWS credentials
aws configure
```

### Restore from Backup

```bash
# Interactive restore
./scripts/restore-database.sh

# Follow prompts to:
# 1. Select backup file
# 2. Confirm restore
# 3. Create safety backup
# 4. Restore database
# 5. Verify restoration
```

### Backup Strategy

**Daily Backups:**
- Full database backup every day at 2 AM
- Retention: 30 days local, 90 days S3

**Pre-Migration Backups:**
- Automatic before each migration
- Quick rollback if migration fails

**Manual Backups:**
- Before major changes
- Before data cleanup
- Before production deployments

### Point-in-Time Recovery (Supabase)

Supabase includes automatic PITR:
1. Go to Database → Backups
2. Select restore point
3. Restore to new project or overwrite

---

## Migrations

### Overview

Version-controlled schema changes with rollback support.

### Migration Scripts

- **[scripts/migrate-database.sh](scripts/migrate-database.sh)** - Apply migrations

### Migration Directory Structure

```
database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_tracking.sql
│   ├── 003_add_security_tables.sql
│   ├── 004_performance_indexes.sql
│   └── 005_analytics_functions.sql
└── functions/
    ├── analytics-functions.sql
    └── connection-pool-functions.sql
```

### Create a Migration

```bash
# Create new migration file
TIMESTAMP=$(date +%Y%m%d%H%M%S)
touch database/migrations/${TIMESTAMP}_description.sql
```

Migration file template:

```sql
-- Migration: Add column to campaigns table
-- Date: 2025-01-15
-- Author: Your Name

BEGIN;

-- Add new column
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);

-- Create index
CREATE INDEX IF NOT EXISTS idx_campaigns_new_column
ON campaigns(new_column);

-- Update existing data (if needed)
UPDATE campaigns SET new_column = 'default_value'
WHERE new_column IS NULL;

COMMIT;
```

### Apply Migrations

```bash
# Make script executable
chmod +x scripts/migrate-database.sh

# Run migrations
./scripts/migrate-database.sh
```

The script will:
1. ✅ Create `schema_migrations` tracking table
2. ✅ Check for pending migrations
3. ✅ Create safety backup
4. ✅ Apply each migration in transaction
5. ✅ Record migration in tracking table
6. ✅ Update statistics

### Migration Tracking

```sql
-- View applied migrations
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- Check current version
SELECT migration_name, applied_at
FROM schema_migrations
ORDER BY applied_at DESC
LIMIT 1;

-- Find pending migrations (manually)
SELECT 'pending_migration.sql' AS migration
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations
  WHERE migration_name = 'pending_migration.sql'
);
```

### Test Migrations (Staging First)

```bash
# 1. Test on staging database
export DATABASE_URL=$STAGING_DATABASE_URL
./scripts/migrate-database.sh

# 2. Verify migration worked
psql $STAGING_DATABASE_URL -c "SELECT * FROM schema_migrations;"

# 3. Test application functionality

# 4. If successful, apply to production
export DATABASE_URL=$PRODUCTION_DATABASE_URL
./scripts/migrate-database.sh
```

### Rollback Migration

If a migration fails:

```bash
# Option 1: Automatic rollback (transaction-based)
# Failed migrations are rolled back automatically

# Option 2: Manual rollback to backup
./scripts/restore-database.sh
# Select the pre-migration backup

# Option 3: Write a down migration
touch database/migrations/TIMESTAMP_rollback_description.sql
```

Down migration example:

```sql
-- Rollback: Remove column from campaigns table

BEGIN;

DROP INDEX IF EXISTS idx_campaigns_new_column;
ALTER TABLE campaigns DROP COLUMN IF EXISTS new_column;

COMMIT;
```

---

## Maintenance

### Overview

Regular maintenance keeps your database healthy and performant.

### Maintenance Scripts

- **[scripts/database-maintenance.sh](scripts/database-maintenance.sh)** - Maintenance tasks

### Maintenance Tasks

The maintenance script performs:
1. **VACUUM** - Reclaim storage from dead tuples
2. **ANALYZE** - Update query planner statistics
3. **REINDEX** - Rebuild indexes (critical tables)
4. **Cleanup** - Delete old audit logs, events
5. **Health Check** - Connection pool, bloat, long queries

### Run Maintenance

```bash
# Make script executable
chmod +x scripts/database-maintenance.sh

# Run maintenance manually
./scripts/database-maintenance.sh
```

### Schedule Maintenance (Cron)

```bash
# Edit crontab
crontab -e

# Weekly maintenance on Sundays at 3 AM
0 3 * * 0 cd /path/to/project && ./scripts/database-maintenance.sh

# Or daily light maintenance
0 3 * * * cd /path/to/project && psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

### Manual Maintenance Commands

```sql
-- Reclaim storage (doesn't lock tables)
VACUUM;

-- Reclaim storage + update stats
VACUUM ANALYZE;

-- Full vacuum (locks tables, use off-peak)
VACUUM FULL;

-- Update statistics only
ANALYZE;

-- Reindex all indexes for a table
REINDEX TABLE campaigns;

-- Reindex entire database (use carefully)
REINDEX DATABASE dbname;
```

### Monitor Table Bloat

```sql
-- Check table sizes
SELECT
  schemaname || '.' || tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup AS dead_tuples,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### Data Retention Policies

Implemented in maintenance script:
- **Audit logs**: 2 years
- **Failed login attempts**: 90 days
- **Email events**: 1 year

Customize in `scripts/database-maintenance.sh`.

---

## Monitoring

### Key Metrics to Monitor

#### 1. Connection Pool
- Active connections
- Idle connections
- Waiting connections
- Pool utilization %

```sql
SELECT * FROM check_connection_pool_health();
```

#### 2. Query Performance
- Slow queries (>1s)
- Long-running queries (>60s)
- Query counts

```sql
SELECT * FROM find_long_running_queries(60);
```

#### 3. Database Size
- Total database size
- Table sizes
- Index sizes

```sql
SELECT * FROM get_table_sizes();
```

#### 4. Index Usage
- Index scans
- Sequential scans
- Unused indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

#### 5. Table Stats
- Row counts
- Dead tuples
- Last vacuum/analyze

```sql
SELECT
  schemaname || '.' || tablename AS table,
  n_live_tup AS rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Monitoring Tools

**Built-in PostgreSQL:**
- `pg_stat_activity` - Current activity
- `pg_stat_user_tables` - Table statistics
- `pg_stat_user_indexes` - Index statistics
- `pg_stat_statements` - Query statistics (extension)

**Supabase Dashboard:**
- Database → Reports
- Database → Logs
- Database → Performance

**External Tools:**
- **pgAdmin** - GUI for PostgreSQL
- **DataGrip** - JetBrains IDE
- **Postico** - macOS client
- **DBeaver** - Free universal tool

### Alerts to Configure

Set up alerts for:
- Connection pool > 80% utilized
- Queries running > 5 minutes
- Database size > threshold
- Failed backups
- Replication lag (if using read replicas)

---

## Best Practices Summary

### ✅ DO

1. **Use indexes** for all WHERE, JOIN, ORDER BY columns
2. **Select specific fields** instead of `SELECT *`
3. **Paginate** all list queries
4. **Use connection pooling** in production
5. **Backup daily** with 30-day retention
6. **Test migrations** on staging first
7. **Run maintenance** weekly (VACUUM, ANALYZE)
8. **Monitor** connection pool and slow queries
9. **Use transactions** for multi-step operations
10. **Version control** all schema changes

### ❌ DON'T

1. Don't use `SELECT *` in production queries
2. Don't fetch entire tables without pagination
3. Don't skip indexes on foreign keys
4. Don't use direct connections (use pooler)
5. Don't deploy migrations without testing
6. Don't skip backups before major changes
7. Don't ignore slow query logs
8. Don't let dead tuples accumulate
9. Don't create indexes without analyzing queries
10. Don't hardcode connection strings

---

## Quick Reference

### Apply All Optimizations

```bash
# 1. Apply performance indexes
psql $DATABASE_URL -f database/migrations/performance-indexes.sql

# 2. Install analytics functions
psql $DATABASE_URL -f database/functions/analytics-functions.sql

# 3. Install connection pool functions
psql $DATABASE_URL -f database/functions/connection-pool-functions.sql

# 4. Set up automated backups
chmod +x scripts/backup-database.sh
crontab -e  # Add: 0 2 * * * /path/to/backup-database.sh

# 5. Set up maintenance
chmod +x scripts/database-maintenance.sh
crontab -e  # Add: 0 3 * * 0 /path/to/database-maintenance.sh

# 6. Configure connection pooling
# Update DATABASE_URL to use port 6543 (pooler)
```

### Common Commands

```bash
# Backup
./scripts/backup-database.sh

# Restore
./scripts/restore-database.sh

# Migrate
./scripts/migrate-database.sh

# Maintenance
./scripts/database-maintenance.sh

# Check pool health
psql $DATABASE_URL -c "SELECT * FROM check_connection_pool_health();"

# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM find_long_running_queries(60);"
```

---

## Support

For issues or questions:
1. Check this guide
2. Review SQL files in `database/`
3. Check application logs
4. Test on staging first

**Remember:** Always backup before making changes!
