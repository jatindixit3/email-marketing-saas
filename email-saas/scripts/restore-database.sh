#!/bin/bash

# PostgreSQL Database Restore Script
# Restore from backup with safety checks

# ============================================
# Configuration
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

DATABASE_URL="${DATABASE_URL}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# ============================================
# Functions
# ============================================

log() {
  echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

confirm() {
  read -p "$1 (yes/no): " response
  case "$response" in
    [yY][eE][sS]|[yY])
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# ============================================
# Pre-flight Checks
# ============================================

if [ -z "$DATABASE_URL" ]; then
  error "DATABASE_URL is not set"
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  error "Backup directory does not exist: $BACKUP_DIR"
  exit 1
fi

# ============================================
# Select Backup File
# ============================================

log "Available backups:"
echo ""

# List all backup files
backups=($(ls -t "$BACKUP_DIR"/email_saas_backup_*.dump 2>/dev/null))

if [ ${#backups[@]} -eq 0 ]; then
  error "No backup files found in $BACKUP_DIR"
  exit 1
fi

# Display backups with index
for i in "${!backups[@]}"; do
  backup_file="${backups[$i]}"
  backup_size=$(du -h "$backup_file" | cut -f1)
  backup_date=$(echo "$backup_file" | grep -oP '\d{8}_\d{6}')
  formatted_date=$(date -d "${backup_date:0:8} ${backup_date:9:2}:${backup_date:11:2}:${backup_date:13:2}" +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "Unknown")

  echo "  [$i] $formatted_date - $(basename $backup_file) ($backup_size)"
done

echo ""
read -p "Select backup to restore (0-$((${#backups[@]}-1))): " backup_index

if [ -z "$backup_index" ] || [ "$backup_index" -ge "${#backups[@]}" ]; then
  error "Invalid backup selection"
  exit 1
fi

BACKUP_FILE="${backups[$backup_index]}"

log "Selected backup: $(basename $BACKUP_FILE)"

# ============================================
# Verification
# ============================================

log "Verifying backup file integrity..."
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  error "Backup file is corrupted or invalid"
  exit 1
fi

success "Backup file verification passed"

# ============================================
# Safety Confirmation
# ============================================

warning "This will REPLACE all data in the database!"
warning "Database: $DATABASE_URL"
warning "Backup: $(basename $BACKUP_FILE)"
echo ""

if ! confirm "Are you sure you want to continue?"; then
  log "Restore cancelled by user"
  exit 0
fi

echo ""
log "Starting database restore..."

# ============================================
# Create Pre-Restore Backup
# ============================================

log "Creating safety backup of current database..."
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_backup_$(date +%Y%m%d_%H%M%S).dump"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --file="$SAFETY_BACKUP"

if [ $? -eq 0 ]; then
  success "Safety backup created: $(basename $SAFETY_BACKUP)"
else
  error "Failed to create safety backup"
  if ! confirm "Continue without safety backup?"; then
    exit 1
  fi
fi

# ============================================
# Terminate Active Connections
# ============================================

log "Terminating active database connections..."

# Extract database name from URL
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -n "$DB_NAME" ]; then
  psql "$DATABASE_URL" -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
  " 2>/dev/null || warning "Could not terminate connections (may not have permissions)"
fi

# ============================================
# Restore Database
# ============================================

log "Restoring database from backup..."

# Drop and recreate database (if possible)
# Note: For Supabase, you may not have DROP DATABASE permissions
# In that case, restore with --clean option

# Restore with pg_restore
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  "$BACKUP_FILE" 2>&1 | tee "${BACKUP_FILE}.restore.log"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  success "Database restored successfully!"
else
  error "Database restore encountered errors (check ${BACKUP_FILE}.restore.log)"
  warning "Some errors during restore are normal (e.g., 'already exists' errors)"

  if ! confirm "Do you want to continue despite errors?"; then
    error "Restore failed. Rolling back to safety backup..."
    if [ -f "$SAFETY_BACKUP" ]; then
      pg_restore --dbname="$DATABASE_URL" --clean "$SAFETY_BACKUP"
      warning "Rolled back to safety backup"
    fi
    exit 1
  fi
fi

# ============================================
# Post-Restore Verification
# ============================================

log "Verifying restored database..."

# Count tables
table_count=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
" | xargs)

log "Tables found: $table_count"

# Check critical tables exist
critical_tables=("users" "campaigns" "contacts" "email_events")

for table in "${critical_tables[@]}"; do
  exists=$(psql "$DATABASE_URL" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '$table'
    );
  " | xargs)

  if [ "$exists" = "t" ]; then
    success "Table '$table' exists"
  else
    error "Table '$table' is missing!"
  fi
done

# ============================================
# Update Statistics
# ============================================

log "Updating database statistics..."
psql "$DATABASE_URL" -c "ANALYZE;"

# ============================================
# Reindex (Optional)
# ============================================

if confirm "Do you want to reindex the database? (Recommended for best performance)"; then
  log "Reindexing database..."
  psql "$DATABASE_URL" -c "REINDEX DATABASE $DB_NAME;" 2>/dev/null || \
    warning "Could not reindex database (may not have permissions)"
fi

# ============================================
# Cleanup
# ============================================

log "Restore Summary:"
log "  - Backup File: $(basename $BACKUP_FILE)"
log "  - Safety Backup: $(basename $SAFETY_BACKUP)"
log "  - Tables Restored: $table_count"
log "  - Restore Log: ${BACKUP_FILE}.restore.log"

success "Database restore completed!"

# ============================================
# Exit
# ============================================

exit 0
