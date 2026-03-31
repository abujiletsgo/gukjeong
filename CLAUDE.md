# 국정투명 (GukjeongTumyeong)

Korean government transparency platform. Public data + AI analysis.

## Stack

- **Monorepo:** Turborepo workspaces (`apps/web`, `apps/api`, `packages/shared`)
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind, D3/Recharts, Drizzle ORM, Neon Postgres
- **Backend:** FastAPI, SQLAlchemy, Celery (ETL), Alembic migrations
- **Data:** 나라장터 G2B APIs (data.go.kr), ECOS, 열린국회, 빅카인즈 RSS
- **AI:** Claude API (audit analysis, news framing, survey engine)

## Commands

```
npm run dev:web          # Next.js on :3000
npm run dev:api          # FastAPI on :8000 (uvicorn --reload)
npm run db:migrate       # Alembic upgrade head
npm run db:seed          # Seed presidents, media, fiscal data
uv run scripts/generate-audit.py   # Regenerate audit-results.json from G2B data
uv run scripts/fetch-data.py       # Fetch fresh data from data.go.kr APIs
```

## Architecture

- `apps/web/` — Next.js frontend (14 pages, 8 chart components, domain components)
- `apps/api/` — FastAPI backend (11 routers, 7 services, 12 scrapers, Celery ETL)
- `apps/web/data/` — Raw JSON from G2B/government APIs (local cache)
- `apps/web/public/data/` — Processed output (audit-results.json)
- `scripts/` — Data pipeline scripts (fetch-data.py, generate-audit.py)
- `data/seed/` — Seed JSON for DB (presidents, media outlets, fiscal data)
- `packages/shared/` — Shared TypeScript types and constants

## Key Patterns

- **Data flow:** Government APIs -> scripts/fetch-data.py -> apps/web/data/*.json -> scripts/generate-audit.py -> apps/web/public/data/audit-results.json
- **Types in 3 places:** SQLAlchemy models -> Pydantic schemas -> `apps/web/lib/types.ts` (keep in sync)
- **Korean UI:** All user-facing text is Korean. Use Pretendard font. Comments can be Korean or English.
- **Static + API hybrid:** Homepage uses ISR (revalidate=3600). Audit page falls back gracefully when JSON missing.
- **8 audit patterns:** ghost_company, zero_competition, bid_rate_anomaly, new_company_big_win, vendor_concentration, repeated_sole_source, contract_splitting, low_bid_competition

## Rules

- After model changes: update Pydantic schema + TypeScript types + generate Alembic migration
- `apps/web/lib/data.ts` is the canonical data access layer for the frontend
- Audit patterns live in `scripts/generate-audit.py` (8 detectors) and `apps/web/lib/audit/`
- API keys: `DATA_GO_KR_API_KEY`, `ECOS_API_KEY`, `ASSEMBLY_API_KEY`, `ANTHROPIC_API_KEY`
- All D3 chart components are in `apps/web/components/charts/` (shared across pages)

## Files to Read First

- `.claude/ARCHITECTURE.md` — full dependency diagram + blast-radius table
- `.claude/FACTS.md` — verified facts and gotchas
- `apps/web/lib/types.ts` — all TypeScript interfaces
- `apps/web/lib/data.ts` — data access layer
- `scripts/generate-audit.py` — audit pattern detection logic
