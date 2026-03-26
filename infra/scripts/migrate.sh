#!/bin/bash
# 국정투명 마이그레이션
set -euo pipefail
cd "$(dirname "$0")/../../apps/api"
echo "[마이그레이션] 적용..."
python -m alembic upgrade head
echo "[마이그레이션] 완료!"
