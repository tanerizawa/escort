#!/bin/bash
# ARETON.id — Database Restore Script
# Usage: ./db-restore.sh <backup_file>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lht /home/escort/backups/db/ 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="areton_db"
DB_USER="areton"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: File not found: ${BACKUP_FILE}"
  exit 1
fi

echo "⚠️  WARNING: This will REPLACE ALL DATA in ${DB_NAME}!"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "[$(date)] Stopping services..."
pm2 stop areton-api 2>/dev/null || true

echo "[$(date)] Starting restore..."

if [[ "${BACKUP_FILE}" == *.dump ]]; then
  # Custom format restore
  PGPASSWORD="areton_dev_2026" pg_restore \
    -h localhost \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "${BACKUP_FILE}"
elif [[ "${BACKUP_FILE}" == *.sql.gz ]]; then
  # Compressed SQL restore
  gunzip -c "${BACKUP_FILE}" | PGPASSWORD="areton_dev_2026" psql \
    -h localhost \
    -U "${DB_USER}" \
    -d "${DB_NAME}"
else
  echo "Error: Unsupported file format. Use .dump or .sql.gz"
  exit 1
fi

echo "[$(date)] Restore complete."

echo "[$(date)] Restarting services..."
pm2 start areton-api

echo "[$(date)] Done! Verify: pm2 status"
