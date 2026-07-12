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
npm run data:refresh     # 전체 파이프라인: fetch → generate-audit → 파생 산출물 → popular
npm run data:derive      # 파생 산출물만: audit-index/shards + vendors + daily-ox + search-index
uv run scripts/generate-audit.py   # Regenerate audit-results.json from G2B data
uv run scripts/fetch-data.py       # Fetch fresh data from data.go.kr APIs
uv run scripts/accumulate.py       # Accumulate historical G2B data (run daily, --months N)
cd apps/web && npm run test:e2e    # e2e 스모크 매트릭스 (prod 서버가 :3000에 떠 있어야 함)
```

**빌드 가드:** `next dev` 실행 중에는 `npm run build`가 차단된다(같은 .next 공유 → 서버 파괴).
dev를 먼저 끄거나 `SKIP_BUILD_GUARD=1`.

**데이터 재생성 후 필수:** `audit-results.json`(245MB, gitignore됨)을 다시 만들었으면
`npm run data:derive`로 웹이 실제로 소비하는 4개 산출물을 재생성해야 한다.

## Architecture

- `apps/web/` — Next.js frontend (26 pages across 17 routes, 8 chart components, domain components)
- `apps/api/` — FastAPI backend (13 routers, 8 services, 14 scrapers, Celery ETL)
- `apps/web/data/` — Raw JSON from G2B/government APIs (local cache)
- `apps/web/public/data/` — Processed output (audit-results.json)
- `scripts/` — Data pipeline scripts (fetch-data.py, generate-audit.py)
- `data/seed/` — Seed JSON for DB (9 files: presidents, media outlets, fiscal data, etc.)
- `data/knowledge/` — Domain knowledge base (5 files: government orgs, procurement rules, etc.)
- `packages/shared/` — Shared TypeScript types and constants
- `mockups/` — 18 HTML mockup files for UI design exploration

## Key Patterns

- **Data flow:** Government APIs -> scripts/fetch-data.py -> apps/web/data/*.json -> scripts/generate-audit.py -> audit-results.json(로컬 전용, 245MB) -> `npm run data:derive` -> audit-index.json + audit-shards/ + vendors-index/shards + daily-ox.json + search-index
- **감사 웹 아키텍처:** 목록 = audit-index.json(17MB, 사전 보정·정렬), 상세 = DB → fs 샤드(빌드) → 자기 CDN 샤드 fetch(런타임). 246MB 원본은 절대 클라이언트로 보내지 않는다
- **Types in 3 places:** SQLAlchemy models -> Pydantic schemas -> `apps/web/lib/types.ts` (keep in sync)
- **Korean UI:** All user-facing text is Korean. Use Pretendard font. Comments can be Korean or English.
- **Static + API hybrid:** Homepage uses ISR (revalidate=3600). Audit page falls back gracefully when JSON missing.
- **20 audit patterns:** ghost_company, zero_competition, bid_rate_anomaly, new_company_big_win, vendor_concentration, repeated_sole_source, contract_splitting, low_bid_competition, yearend_budget_dump, related_companies, high_value_sole_source, same_winner_repeat, amount_spike, bid_rigging, contract_inflation, cross_pattern, systemic_risk, sanctioned_vendor, price_clustering, network_collusion

## Rules

- After model changes: update Pydantic schema + TypeScript types + generate Alembic migration
- `apps/web/lib/data.ts` is the canonical data access layer for the frontend
- Audit patterns live in `scripts/generate-audit.py` (20 detectors) and `apps/web/lib/audit/`
- API keys: `DATA_GO_KR_API_KEY`, `ECOS_API_KEY`, `ASSEMBLY_API_KEY`, `ANTHROPIC_API_KEY`
- All D3 chart components are in `apps/web/components/charts/` (shared across pages)

## Data Fetch Protocol

Any new fetcher in `scripts/fetch-data.py` MUST use parallelism — never add serial loops:

1. **Multi-page APIs** — use `fetch_koneps_pages(url_template, max_pages=N)`. It fetches page 1 for `totalCount`, then all remaining pages in parallel via `ThreadPoolExecutor(workers=10)`.
2. **Month-range loops** — wrap the month body in `_fetch_month(args)` and dispatch with `ThreadPoolExecutor(max_workers=4)`. Collect via `as_completed`, then sort results before extending `all_items`.
3. **Per-record lookups** (e.g. company bizno) — batch with `ThreadPoolExecutor(max_workers=20)`.
4. Never add a `while page <= N` loop or `for month in ranges` loop without a thread pool wrapper.

## Files to Read First

- `.claude/ARCHITECTURE.md` — full dependency diagram + blast-radius table
- `.claude/FACTS.md` — verified facts and gotchas
- `apps/web/lib/types.ts` — all TypeScript interfaces
- `apps/web/lib/data.ts` — data access layer
- `scripts/generate-audit.py` — audit pattern detection logic
