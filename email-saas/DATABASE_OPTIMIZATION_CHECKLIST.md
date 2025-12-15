# Database Optimization Checklist

Quick setup checklist for database optimization in production.

## ✅ Pre-Production Checklist

### 1. Indexes (10 min)

- [ ] Apply performance indexes
  ```bash
  psql $DATABASE_URL -f database/migrations/performance-indexes.sql
  ```
- [ ] Verify indexes created
  ```sql
  SELECT schemaname, tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
  ```
- [ ] Check index sizes
  ```sql
  SELECT
    schemaname || '.' || tablename AS table,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
  FROM pg_stat_user_indexes
  ORDER BY pg_relation_size(indexrelid) DESC
  LIMIT 20;
  ```

### 2. Database Functions (5 min)

- [ ] Install analytics functions
  ```bash
  psql $DATABASE_URL -f database/functions/analytics-functions.sql
  ```
- [ ] Install connection pool functions
  ```bash
  psql $DATABASE_URL -f database/functions/connection-pool-functions.sql
  ```
- [ ] Test functions work
  ```sql
  SELECT * FROM get_connection_pool_stats();
  SELECT * FROM check_connection_pool_health();
  ```

### 3. Connection Pooling (15 min)

- [ ] Get pooled connection string from Supabase
  - Dashboard → Project Settings → Database
  - Copy "Connection Pooling" string (port 6543)

- [ ] Update environment variables
  ```env
  # Use pooler for application
  DATABASE_URL=postgresql://postgres:[pass]@[host]:6543/postgres?pgbouncer=true

  # Pool configuration
  DATABASE_POOL_MAX=20
  DATABASE_POOL_MIN=2
  DATABASE_POOL_IDLE_TIMEOUT=30000
  DATABASE_POOL_CONNECTION_TIMEOUT=10000
  DATABASE_POOL_MAX_LIFETIME=1800000
  DATABASE_STATEMENT_TIMEOUT=60000
  ```

- [ ] Test connection pooling
  ```typescript
  import { monitorConnectionPool } from '@/lib/database/connection-pool'
  const health = await monitorConnectionPool()
  console.log(health)
  ```

- [ ] Restart application with new DATABASE_URL

### 4. Automated Backups (20 min)

- [ ] Configure backup environment variables
  ```env
  BACKUP_DIR=./backups
  BACKUP_RETENTION_DAYS=30
  S3_BACKUP_BUCKET=my-saas-backups
  AWS_REGION=us-east-1
  BACKUP_WEBHOOK_URL=https://hooks.slack.com/...
  ```

- [ ] Make scripts executable
  ```bash
  chmod +x scripts/backup-database.sh
  chmod +x scripts/restore-database.sh
  chmod +x scripts/database-maintenance.sh
  chmod +x scripts/migrate-database.sh
  ```

- [ ] Test manual backup
  ```bash
  ./scripts/backup-database.sh
  ```

- [ ] Verify backup files created
  ```bash
  ls -lh backups/
  ```

- [ ] Schedule daily backups (cron)
  ```bash
  crontab -e
  # Add: 0 2 * * * cd /path/to/project && ./scripts/backup-database.sh
  ```

- [ ] Test restore (on staging!)
  ```bash
  ./scripts/restore-database.sh
  ```

### 5. Migrations (10 min)

- [ ] Test migration script
  ```bash
  ./scripts/migrate-database.sh
  ```

- [ ] Verify migration tracking table
  ```sql
  SELECT * FROM schema_migrations ORDER BY applied_at DESC;
  ```

- [ ] Document migration process for team
  - See [DATABASE_OPTIMIZATION_GUIDE.md](DATABASE_OPTIMIZATION_GUIDE.md#migrations)

### 6. Maintenance Schedule (5 min)

- [ ] Schedule weekly maintenance (cron)
  ```bash
  crontab -e
  # Add: 0 3 * * 0 cd /path/to/project && ./scripts/database-maintenance.sh
  ```

- [ ] Test maintenance script
  ```bash
  ./scripts/database-maintenance.sh
  ```

- [ ] Set up monitoring alerts (optional)
  - Connection pool > 80%
  - Queries > 5 minutes
  - Database size threshold

### 7. Query Optimization (15 min)

- [ ] Update queries to use optimized functions
  ```typescript
  // OLD: SELECT * with N+1 queries
  const campaigns = await supabase.from('campaigns').select('*')

  // NEW: Paginated with specific fields
  import { getCampaigns } from '@/lib/database/optimized-queries'
  const result = await getCampaigns(userId, { page: 1, limit: 25 })
  ```

- [ ] Replace all `SELECT *` with specific fields

- [ ] Add pagination to all list queries

- [ ] Use eager loading to prevent N+1
  ```typescript
  // Use getCampaignWithRelations instead of multiple queries
  const campaign = await getCampaignWithRelations(campaignId, userId)
  ```

- [ ] Implement batch operations
  ```typescript
  import { bulkAddContactsToList } from '@/lib/database/optimized-queries'
  await bulkAddContactsToList(contactIds, listId)
  ```

### 8. Testing (30 min)

- [ ] Test on staging database first
- [ ] Run application tests
- [ ] Load test with connection pooling
- [ ] Monitor query performance
- [ ] Check backup restoration
- [ ] Verify migration rollback works

### 9. Documentation (10 min)

- [ ] Document setup for team
- [ ] Add runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Document migration process
- [ ] Add monitoring dashboard links

### 10. Production Deployment (15 min)

- [ ] Create pre-deployment backup
  ```bash
  ./scripts/backup-database.sh
  ```

- [ ] Apply indexes to production
  ```bash
  psql $PRODUCTION_DATABASE_URL -f database/migrations/performance-indexes.sql
  ```

- [ ] Install functions
  ```bash
  psql $PRODUCTION_DATABASE_URL -f database/functions/analytics-functions.sql
  psql $PRODUCTION_DATABASE_URL -f database/functions/connection-pool-functions.sql
  ```

- [ ] Update production environment variables

- [ ] Deploy application with optimized queries

- [ ] Monitor for issues (first 24 hours)
  - Connection pool health
  - Query performance
  - Error rates
  - Response times

---

## 🔍 Verification Steps

### Check Indexes

```sql
-- Count indexes
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';

-- Should be 50+ indexes

-- Check critical indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_campaigns_user_status_scheduled',
  'idx_contacts_email_lower',
  'idx_email_events_campaign_type_time'
);
```

### Check Functions

```sql
-- List all functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Should include:
-- - get_connection_pool_stats
-- - get_event_counts_by_type
-- - update_campaign_stats_optimized
-- - check_connection_pool_health
```

### Check Connection Pool

```sql
SELECT * FROM check_connection_pool_health();

-- All metrics should show GOOD status
```

### Check Backups

```bash
# List recent backups
ls -lh backups/ | tail -5

# Verify backup size (should be >10MB for populated database)
du -sh backups/

# Check backup log
tail -50 backups/email_saas_backup_*.log
```

### Check Query Performance

```sql
-- Enable pg_stat_statements (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slowest queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- All queries should be <1000ms mean time
```

---

## 📊 Performance Benchmarks

### Before Optimization

- Campaign list query: ~500ms
- Contact search: ~800ms
- Email events query: ~1200ms
- Dashboard load: ~2000ms

### After Optimization (Expected)

- Campaign list query: ~50ms (10x faster)
- Contact search: ~80ms (10x faster)
- Email events query: ~120ms (10x faster)
- Dashboard load: ~200ms (10x faster)

---

## 🚨 Troubleshooting

### Issue: Indexes not being used

**Solution:**
```sql
-- Update statistics
ANALYZE;

-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM campaigns WHERE user_id = 'xxx' AND status = 'sent';

-- Should show "Index Scan" not "Seq Scan"
```

### Issue: Connection pool exhausted

**Solution:**
```sql
-- Check current connections
SELECT * FROM get_connection_pool_stats();

-- Kill long-running queries
SELECT * FROM kill_long_running_queries(60000);

-- Increase pool size in environment
DATABASE_POOL_MAX=40
```

### Issue: Backup failed

**Solution:**
```bash
# Check disk space
df -h

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check permissions
ls -la backups/

# Run with verbose output
./scripts/backup-database.sh
```

### Issue: Migration failed

**Solution:**
```bash
# Check migration log
cat migration.log

# Rollback to pre-migration backup
./scripts/restore-database.sh

# Fix migration SQL and retry
./scripts/migrate-database.sh
```

---

## 📅 Ongoing Maintenance

### Daily
- [ ] Check backup completed successfully
- [ ] Monitor connection pool health
- [ ] Check for long-running queries

### Weekly
- [ ] Run maintenance script
- [ ] Review slow query logs
- [ ] Check disk space
- [ ] Verify backups are valid

### Monthly
- [ ] Update statistics: `ANALYZE`
- [ ] Reindex critical tables
- [ ] Review and optimize slow queries
- [ ] Check for unused indexes
- [ ] Review database size growth

### Quarterly
- [ ] Full VACUUM (off-peak hours)
- [ ] Database health audit
- [ ] Review and update indexes
- [ ] Capacity planning
- [ ] Test disaster recovery

---

## ✅ Completion Checklist

Once all steps are complete:

- [ ] All indexes created and verified
- [ ] All database functions installed
- [ ] Connection pooling configured and tested
- [ ] Automated backups scheduled and tested
- [ ] Migrations working with rollback support
- [ ] Maintenance scheduled
- [ ] Queries optimized (no SELECT *, pagination, eager loading)
- [ ] Testing completed on staging
- [ ] Documentation updated
- [ ] Production deployment successful
- [ ] Monitoring in place
- [ ] Team trained on procedures

**Estimated Time:** 2-3 hours total

**Impact:**
- 10x faster queries
- Reduced database load
- Automated backups and recovery
- Better connection management
- Easier maintenance and migrations

---

## 📖 Resources

- [DATABASE_OPTIMIZATION_GUIDE.md](DATABASE_OPTIMIZATION_GUIDE.md) - Complete guide
- [database/migrations/performance-indexes.sql](database/migrations/performance-indexes.sql) - Index definitions
- [lib/database/optimized-queries.ts](lib/database/optimized-queries.ts) - Query examples
- [scripts/backup-database.sh](scripts/backup-database.sh) - Backup script
- [scripts/database-maintenance.sh](scripts/database-maintenance.sh) - Maintenance script

**Next Steps:** Review the complete [DATABASE_OPTIMIZATION_GUIDE.md](DATABASE_OPTIMIZATION_GUIDE.md) for detailed explanations and advanced topics.
