#!/bin/bash
# ARETON.id — Database Backup Script
# Run daily via cron: 0 2 * * * /srv/areton-id/scripts/db-backup.sh >> /var/log/areton-backup.log 2>&1

set -e

# Configuration
DB_NAME="areton_db"
DB_USER="areton"
BACKUP_DIR="/home/escort/backups/db"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# Dump and compress
PGPASSWORD="areton_dev_2026" pg_dump \
  -h localhost \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  -f "${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"

# Also create a plain SQL compressed backup
PGPASSWORD="areton_dev_2026" pg_dump \
  -h localhost \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup created: ${BACKUP_FILE}"

# Get backup size
BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
DUMP_SIZE=$(ls -lh "${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump" | awk '{print $5}')
echo "[$(date)] SQL backup size: ${BACKUP_SIZE}"
echo "[$(date)] Custom dump size: ${DUMP_SIZE}"

# Delete old backups (retention policy)
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "${DB_NAME}_*.dump" -mtime +${RETENTION_DAYS} -delete

REMAINING=$(ls -1 "${BACKUP_DIR}" | wc -l)
echo "[$(date)] Backup complete. ${REMAINING} backup files retained."
echo "---"
