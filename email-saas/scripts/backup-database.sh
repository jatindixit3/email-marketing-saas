#!/bin/bash

# PostgreSQL Database Backup Script
# Automated daily backups with retention policy

# ============================================
# Configuration
# ============================================

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="email_saas_backup_${TIMESTAMP}"

# Database connection (from Supabase or custom PostgreSQL)
DATABASE_URL="${DATABASE_URL}"

# S3 Configuration (optional - for offsite backups)
S3_BUCKET="${S3_BACKUP_BUCKET}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Notification (optional)
WEBHOOK_URL="${BACKUP_WEBHOOK_URL}"

# ============================================
# Functions
# ============================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

send_notification() {
  local status=$1
  local message=$2

  if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -Iseconds)\"}"
  fi
}

# ============================================
# Pre-flight Checks
# ============================================

log "Starting database backup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  log "ERROR: DATABASE_URL is not set"
  send_notification "error" "DATABASE_URL not configured"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# ============================================
# Database Backup
# ============================================

log "Creating database backup: $BACKUP_NAME"

# Full database backup with pg_dump
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_DIR}/${BACKUP_NAME}.dump" \
  2>&1 | tee "${BACKUP_DIR}/${BACKUP_NAME}.log"

# Check if backup succeeded
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  log "Database backup completed successfully"

  # Get backup file size
  BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)
  log "Backup size: $BACKUP_SIZE"

  # Create a plain SQL backup as well (for easier inspection)
  log "Creating plain SQL backup..."
  pg_dump "$DATABASE_URL" \
    --format=plain \
    --no-owner \
    --no-acl \
    --file="${BACKUP_DIR}/${BACKUP_NAME}.sql" \
    2>&1 | tee -a "${BACKUP_DIR}/${BACKUP_NAME}.log"

  # Compress SQL backup
  gzip -f "${BACKUP_DIR}/${BACKUP_NAME}.sql"
  SQL_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" | cut -f1)
  log "SQL backup size: $SQL_SIZE"

  send_notification "success" "Backup completed: $BACKUP_SIZE (dump), $SQL_SIZE (sql)"
else
  log "ERROR: Database backup failed"
  send_notification "error" "Database backup failed"
  exit 1
fi

# ============================================
# Schema-Only Backup
# ============================================

log "Creating schema-only backup..."
pg_dump "$DATABASE_URL" \
  --schema-only \
  --format=plain \
  --no-owner \
  --no-acl \
  --file="${BACKUP_DIR}/${BACKUP_NAME}_schema.sql" \
  2>&1 | tee -a "${BACKUP_DIR}/${BACKUP_NAME}.log"

# ============================================
# Backup Verification
# ============================================

log "Verifying backup integrity..."
pg_restore --list "${BACKUP_DIR}/${BACKUP_NAME}.dump" > "${BACKUP_DIR}/${BACKUP_NAME}_contents.txt"

if [ $? -eq 0 ]; then
  log "Backup verification passed"
else
  log "WARNING: Backup verification failed"
  send_notification "warning" "Backup verification failed"
fi

# ============================================
# Upload to S3 (Optional)
# ============================================

if [ -n "$S3_BUCKET" ]; then
  log "Uploading backup to S3: s3://${S3_BUCKET}/backups/"

  # Upload dump file
  aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.dump" \
    "s3://${S3_BUCKET}/backups/${BACKUP_NAME}.dump" \
    --region "$AWS_REGION" \
    --storage-class STANDARD_IA

  # Upload SQL file
  aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" \
    "s3://${S3_BUCKET}/backups/${BACKUP_NAME}.sql.gz" \
    --region "$AWS_REGION" \
    --storage-class STANDARD_IA

  # Upload schema
  aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}_schema.sql" \
    "s3://${S3_BUCKET}/backups/${BACKUP_NAME}_schema.sql" \
    --region "$AWS_REGION" \
    --storage-class STANDARD_IA

  if [ $? -eq 0 ]; then
    log "Backup uploaded to S3 successfully"
    send_notification "success" "Backup uploaded to S3"
  else
    log "ERROR: Failed to upload backup to S3"
    send_notification "error" "S3 upload failed"
  fi
fi

# ============================================
# Cleanup Old Backups
# ============================================

log "Cleaning up old backups (retention: ${BACKUP_RETENTION_DAYS} days)..."

# Remove local backups older than retention period
find "$BACKUP_DIR" -name "email_saas_backup_*.dump" -mtime +${BACKUP_RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "email_saas_backup_*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "email_saas_backup_*.log" -mtime +${BACKUP_RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "email_saas_backup_*_schema.sql" -mtime +${BACKUP_RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "email_saas_backup_*_contents.txt" -mtime +${BACKUP_RETENTION_DAYS} -delete

log "Old backups cleaned up"

# Cleanup old S3 backups (if enabled)
if [ -n "$S3_BUCKET" ]; then
  log "Cleaning up old S3 backups..."

  # List and delete old backups from S3
  aws s3 ls "s3://${S3_BUCKET}/backups/" \
    | awk '{print $4}' \
    | grep "email_saas_backup_" \
    | while read backup_file; do
      # Get file age
      file_date=$(echo "$backup_file" | grep -oP '\d{8}' | head -1)
      file_timestamp=$(date -d "${file_date:0:4}-${file_date:4:2}-${file_date:6:2}" +%s)
      current_timestamp=$(date +%s)
      age_days=$(( (current_timestamp - file_timestamp) / 86400 ))

      # Delete if older than retention period
      if [ $age_days -gt $BACKUP_RETENTION_DAYS ]; then
        log "Deleting old S3 backup: $backup_file (age: $age_days days)"
        aws s3 rm "s3://${S3_BUCKET}/backups/$backup_file" --region "$AWS_REGION"
      fi
    done
fi

# ============================================
# Backup Summary
# ============================================

log "Backup Summary:"
log "  - Backup Name: $BACKUP_NAME"
log "  - Dump Size: $BACKUP_SIZE"
log "  - SQL Size: $SQL_SIZE"
log "  - Location: $BACKUP_DIR"
if [ -n "$S3_BUCKET" ]; then
  log "  - S3 Location: s3://${S3_BUCKET}/backups/"
fi
log "  - Retention: ${BACKUP_RETENTION_DAYS} days"

# List current backups
log "Current backups:"
ls -lh "$BACKUP_DIR" | grep "email_saas_backup_"

log "Database backup completed successfully!"

# ============================================
# Exit
# ============================================

exit 0
