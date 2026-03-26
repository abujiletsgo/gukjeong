# 국정투명 배포 가이드

## 프론트엔드 (Vercel)
- Next.js → Vercel 자동 배포
- 한국 CDN 활용

## 백엔드 (Render → Railway)
- FastAPI → Render 무료 티어로 시작
- 트래픽 증가 시 Railway로 마이그레이션

## 데이터베이스 (Neon)
- PostgreSQL 16 + pgvector
- 서버리스 오토스케일링

## 캐시 (Upstash)
- Redis 서버리스
- Celery 브로커 겸용

## 검색 (Meilisearch Cloud)
- 한국어 형태소 분석 지원
