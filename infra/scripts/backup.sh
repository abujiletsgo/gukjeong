#!/bin/bash
# 국정투명 데이터베이스 백업
# Supports both local PostgreSQL and Neon (remote) via DATABASE_URL
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../../data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/gukjeong_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[백업] 시작: $TIMESTAMP"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[백업] Neon 원격 DB 백업 (DATABASE_URL 사용)"
  pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$BACKUP_FILE"
else
  echo "[백업] 로컬 DB 백업"
  pg_dump -U "${POSTGRES_USER:-gukjeong}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" "${POSTGRES_DB:-gukjeong}" | gzip > "$BACKUP_FILE"
fi

echo "[백업] 완료: $BACKUP_FILE"
echo "[백업] 크기: $(du -h "$BACKUP_FILE" | cut -f1)"

# 30일 이상 된 백업 삭제
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
echo "[백업] 30일 이전 백업 정리 완료"
