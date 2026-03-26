#!/bin/bash
# 국정투명 시드 데이터 로드
set -euo pipefail
echo "[시드] 데이터 로드 시작..."
cd "$(dirname "$0")/../../apps/api"
python -m alembic upgrade head
python -m app.db.seed
echo "[시드] 완료!"
