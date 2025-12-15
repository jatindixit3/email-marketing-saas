#!/bin/bash

# Database Migration Script
# Safely apply migrations with rollback support

# ============================================
# Configuration
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

DATABASE_URL="${DATABASE_URL}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-./database/migrations}"
MIGRATION_LOG="${MIGRATION_LOG:-./migration.log}"

# ============================================
# Functions
# ============================================

log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$MIGRATION_LOG"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$MIGRATION_LOG"
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$MIGRATION_LOG"
}

# ============================================
# Pre-flight Checks
# ============================================

log "Starting database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  error "DATABASE_URL is not set"
  exit 1
fi

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  error "Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# ============================================
# Create Migration Tracking Table
# ============================================

log "Setting up migration tracking..."

psql "$DATABASE_URL" << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  checksum VARCHAR(64),
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_name
ON schema_migrations(migration_name);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied
ON schema_migrations(applied_at);
EOF

if [ $? -eq 0 ]; then
  success "Migration tracking table ready"
else
  error "Failed to create migration tracking table"
  exit 1
fi

# ============================================
# Get Pending Migrations
# ============================================

log "Checking for pending migrations..."

# Get list of all migration files
migration_files=($(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))

if [ ${#migration_files[@]} -eq 0 ]; then
  warning "No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

log "Found ${#migration_files[@]} migration files"

# Get list of applied migrations
applied_migrations=$(psql "$DATABASE_URL" -t -c "SELECT migration_name FROM schema_migrations ORDER BY applied_at;" | tr -d ' ')

pending_migrations=()

for migration_file in "${migration_files[@]}"; do
  migration_name=$(basename "$migration_file")

  # Check if migration already applied
  if echo "$applied_migrations" | grep -q "^${migration_name}$"; then
    log "✓ Already applied: $migration_name"
  else
    pending_migrations+=("$migration_file")
    log "✗ Pending: $migration_name"
  fi
done

if [ ${#pending_migrations[@]} -eq 0 ]; then
  success "All migrations are up to date!"
  exit 0
fi

log "Found ${#pending_migrations[@]} pending migrations"

# ============================================
# Apply Migrations
# ============================================

log "Starting migration application..."

# Create backup before migrations
BACKUP_FILE="./backups/pre_migration_$(date +%Y%m%d_%H%M%S).dump"
mkdir -p ./backups

log "Creating safety backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" --format=custom --compress=9 --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
  success "Safety backup created"
else
  error "Failed to create safety backup"
  exit 1
fi

# Apply each pending migration
migration_count=0
failed_migrations=()

for migration_file in "${pending_migrations[@]}"; do
  migration_name=$(basename "$migration_file")
  migration_count=$((migration_count + 1))

  log "[$migration_count/${#pending_migrations[@]}] Applying: $migration_name"

  # Calculate checksum
  checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)

  # Record start time
  start_time=$(date +%s%3N)

  # Apply migration in a transaction
  psql "$DATABASE_URL" << EOF
BEGIN;

-- Apply migration
\i $migration_file

-- Record migration
INSERT INTO schema_migrations (migration_name, checksum, execution_time_ms)
VALUES ('$migration_name', '$checksum', 0);

COMMIT;
EOF

  exit_code=$?

  # Record end time
  end_time=$(date +%s%3N)
  execution_time=$((end_time - start_time))

  if [ $exit_code -eq 0 ]; then
    # Update execution time
    psql "$DATABASE_URL" -c "
      UPDATE schema_migrations
      SET execution_time_ms = $execution_time
      WHERE migration_name = '$migration_name'
    " > /dev/null

    success "Applied: $migration_name (${execution_time}ms)"
  else
    error "Failed: $migration_name"
    failed_migrations+=("$migration_name")

    # Ask if user wants to continue or rollback
    echo ""
    read -p "Migration failed. Continue with remaining migrations? (yes/no/rollback): " response

    case "$response" in
      rollback)
        error "Rolling back to pre-migration backup..."
        pg_restore --dbname="$DATABASE_URL" --clean "$BACKUP_FILE"
        error "Rolled back all migrations"
        exit 1
        ;;
      no)
        error "Stopping migration process"
        exit 1
        ;;
      yes)
        warning "Continuing with remaining migrations..."
        ;;
      *)
        error "Invalid response. Stopping migration process"
        exit 1
        ;;
    esac
  fi
done

# ============================================
# Migration Summary
# ============================================

log "Migration Summary:"
log "  - Total migrations: ${#pending_migrations[@]}"
log "  - Successful: $((${#pending_migrations[@]} - ${#failed_migrations[@]}))"
log "  - Failed: ${#failed_migrations[@]}"

if [ ${#failed_migrations[@]} -gt 0 ]; then
  error "Failed migrations:"
  for failed_migration in "${failed_migrations[@]}"; do
    error "  - $failed_migration"
  done
  exit 1
else
  success "All migrations applied successfully!"
fi

# ============================================
# Post-Migration Tasks
# ============================================

log "Running post-migration tasks..."

# Update database statistics
log "Updating database statistics..."
psql "$DATABASE_URL" -c "ANALYZE;" > /dev/null

# Get current schema version
current_version=$(psql "$DATABASE_URL" -t -c "
  SELECT migration_name
  FROM schema_migrations
  ORDER BY applied_at DESC
  LIMIT 1;
" | tr -d ' ')

log "Current schema version: $current_version"

# List all applied migrations
log "Applied migrations:"
psql "$DATABASE_URL" -c "
  SELECT
    migration_name,
    applied_at,
    execution_time_ms || 'ms' as duration
  FROM schema_migrations
  ORDER BY applied_at DESC
  LIMIT 10;
"

success "Database migration completed successfully!"

# ============================================
# Exit
# ============================================

exit 0
