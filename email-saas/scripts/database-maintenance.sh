#!/bin/bash

# Database Maintenance Script
# Regular maintenance tasks: VACUUM, ANALYZE, REINDEX

# ============================================
# Configuration
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

DATABASE_URL="${DATABASE_URL}"
MAINTENANCE_LOG="${MAINTENANCE_LOG:-./maintenance.log}"

# ============================================
# Functions
# ============================================

log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

# ============================================
# Pre-flight Checks
# ============================================

log "Starting database maintenance..."

if [ -z "$DATABASE_URL" ]; then
  error "DATABASE_URL is not set"
  exit 1
fi

# ============================================
# 1. VACUUM - Reclaim Storage
# ============================================

log "Running VACUUM to reclaim storage..."

# VACUUM removes dead tuples and updates statistics
psql "$DATABASE_URL" -c "VACUUM VERBOSE;" 2>&1 | tee -a "$MAINTENANCE_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  success "VACUUM completed"
else
  error "VACUUM failed"
fi

# VACUUM ANALYZE (combines both operations)
log "Running VACUUM ANALYZE..."
psql "$DATABASE_URL" -c "VACUUM ANALYZE;" 2>&1 | tee -a "$MAINTENANCE_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  success "VACUUM ANALYZE completed"
else
  error "VACUUM ANALYZE failed"
fi

# ============================================
# 2. ANALYZE - Update Statistics
# ============================================

log "Running ANALYZE to update query planner statistics..."

psql "$DATABASE_URL" -c "ANALYZE VERBOSE;" 2>&1 | tee -a "$MAINTENANCE_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  success "ANALYZE completed"
else
  error "ANALYZE failed"
fi

# ============================================
# 3. REINDEX - Rebuild Indexes
# ============================================

log "Checking if REINDEX is needed..."

# Get database name
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -n "$DB_NAME" ]; then
  log "Reindexing database: $DB_NAME"

  # REINDEX can be slow, so only run if needed
  # Check index bloat first
  bloat_query="
    SELECT
      schemaname,
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND schemaname = 'public'
    LIMIT 5;
  "

  unused_indexes=$(psql "$DATABASE_URL" -t -c "$bloat_query" | grep -v "^$")

  if [ -n "$unused_indexes" ]; then
    warning "Found potentially unused indexes:"
    echo "$unused_indexes"
  fi

  # Reindex critical tables
  log "Reindexing critical tables..."

  for table in users contacts campaigns email_events lists; do
    log "Reindexing table: $table"
    psql "$DATABASE_URL" -c "REINDEX TABLE $table;" 2>&1 | tee -a "$MAINTENANCE_LOG"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
      success "Reindexed: $table"
    else
      warning "Failed to reindex: $table"
    fi
  done
else
  warning "Could not determine database name, skipping REINDEX"
fi

# ============================================
# 4. Clean Up Old Data
# ============================================

log "Cleaning up old data..."

# Delete old audit logs (older than 2 years)
psql "$DATABASE_URL" << 'EOF'
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '2 years';
EOF

log "Deleted old audit logs"

# Delete old failed login attempts (older than 90 days)
psql "$DATABASE_URL" << 'EOF'
DELETE FROM failed_login_attempts
WHERE attempted_at < NOW() - INTERVAL '90 days';
EOF

log "Deleted old failed login attempts"

# Delete old email events (older than 1 year)
psql "$DATABASE_URL" << 'EOF'
DELETE FROM email_events
WHERE created_at < NOW() - INTERVAL '1 year';
EOF

log "Deleted old email events"

success "Old data cleaned up"

# ============================================
# 5. Update Table Statistics
# ============================================

log "Updating table statistics..."

psql "$DATABASE_URL" << 'EOF'
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
EOF

# ============================================
# 6. Check Database Health
# ============================================

log "Checking database health..."

# Check connection pool
psql "$DATABASE_URL" -c "SELECT * FROM check_connection_pool_health();" 2>/dev/null || \
  warning "Connection pool health check not available (function may not exist)"

# Check for bloat
log "Checking for table bloat..."
psql "$DATABASE_URL" << 'EOF'
SELECT
  schemaname || '.' || tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup AS dead_tuples,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 10;
EOF

# Check for long-running queries
log "Checking for long-running queries..."
psql "$DATABASE_URL" -c "SELECT * FROM find_long_running_queries(60);" 2>/dev/null || \
  log "No long-running query function available"

# ============================================
# 7. Maintenance Summary
# ============================================

log "Maintenance Summary:"

# Get database size
db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" | xargs)
log "  - Database Size: $db_size"

# Get table count
table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
log "  - Tables: $table_count"

# Get index count
index_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)
log "  - Indexes: $index_count"

# Get connection count
conn_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database();" | xargs)
log "  - Active Connections: $conn_count"

success "Database maintenance completed successfully!"

# ============================================
# Exit
# ============================================

exit 0
