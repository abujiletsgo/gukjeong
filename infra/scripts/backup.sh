#!/bin/bash
# 국정투명 데이터베이스 백업
set -euo pipefail
BACKUP_DIR="$(dirname "$0")/../../data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/gukjeong_${TIMESTAMP}.sql.gz"
mkdir -p "$BACKUP_DIR"
echo "[백업] 시작: $TIMESTAMP"
pg_dump -U gukjeong -h localhost gukjeong | gzip > "$BACKUP_FILE"
echo "[백업] 완료: $BACKUP_FILE"
