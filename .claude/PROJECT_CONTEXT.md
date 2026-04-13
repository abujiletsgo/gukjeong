<!-- GIT_HASH: bc3c6d8 -->
<!-- GENERATED: 2026-04-01 -->
<!-- PRIME_VERSION: 2.0 -->

# Project Context Cache

## 🎯 Project Overview
- **Name:** 국정투명 (GukjeongTumyeong)
- **Type:** AI-powered civic transparency platform (web app)
- **Mission:** Korea's first platform where citizens see how their government operates — with numbers, not opinions
- **Primary Languages:** TypeScript (frontend), Python (backend/scripts)
- **Tech Stack:** Next.js 14 (App Router) + FastAPI + PostgreSQL 16/pgvector (Neon) + Redis (Upstash) + Celery + Claude API + D3.js/Recharts
- **Phase:** Active development — all 5 main pages built with real data from 8 Korean government APIs
- **Deploy:** Vercel (frontend) at https://web-eta-sand-65.vercel.app

## 📚 Documentation Available
- `spec-CLAUDE.md` — Full project spec
- `spec-architecture.md` — DB schema, API endpoints, Celery schedules
- `spec-facts.md` — Verified data: Korean government APIs, fiscal data, media classifications
- `.claude/ARCHITECTURE.md` — Dependency map, blast-radius table (FRESH)
- `.claude/FACTS.md` — Project episodic memory

## 🔒 Security Audit (Local Skills)
**Status:** CLEAN — No local skills, hooks, or commands configured.

## 🔧 Claude Code Integration
- Hooks: None
- Custom agents: `audit-analyst.md`, `data-pipeline.md`
- Custom commands: None
- Skills: None (using system skills only)
- Settings: Full permissions (`"allow": ["*"]`)

## 🏗️ Architecture Highlights
- **Monorepo:** `apps/web/` (Next.js) + `apps/api/` (FastAPI) + `scripts/` (data pipeline)
- **Data pipeline:** `scripts/fetch-data.py` → 8 data.go.kr APIs → `apps/web/data/*.json` (33MB)
- **Audit pipeline:** `scripts/generate-audit.py` → cross-references all data → `public/data/audit-results.json` (673 findings, 20 patterns)
- **Key pages:** Budget viz, AI Auditor (20 patterns), News Frame Analysis, Legislator Scorecards, Presidents comparison
- **Data sources (all working):** 개방표준, 사용자정보, 낙찰정보, 계약정보, 계약과정통합, 가격정보, 공공조달통계, 공직자재산공개
- **Architecture map:** 🗺️ FRESH

### Blast-radius (top 5)
| Changed | Must Also Update |
|---------|-----------------|
| `apps/api/models/*.py` | Pydantic schemas, Alembic migration, `apps/web/lib/types.ts` |
| `apps/api/routers/*.py` | `apps/web/lib/api.ts`, relevant page.tsx files |
| `apps/web/lib/types.ts` | All page.tsx and component.tsx consumers |
| `scripts/generate-audit.py` | `public/data/audit-results.json`, audit UI components |
| `apps/web/components/charts/*.tsx` | budget, presidents, audit, compare pages |

### Critical paths
- **Dev:** `npm run dev:web` (Next.js :3000)
- **Data refresh:** `uv run scripts/fetch-data.py` → `uv run scripts/generate-audit.py`
- **Deploy:** `cd apps/web && npx vercel --prod`

## 💡 Key Insights
- **8 API services wired** — all 조달청 + 행안부 subscriptions working after discovering undocumented gateway patterns (inqryDiv, YYYYMMDDHHmm dates, ao/as/at/ prefixes)
- **AI 감사 system** — 673 real findings across 20 pattern types: ghost_company, zero_competition, bid_rate_anomaly, new_company_big_win, vendor_concentration, repeated_sole_source, contract_splitting, low_bid_competition, yearend_budget_dump, related_companies, high_value_sole_source, same_winner_repeat, amount_spike, bid_rigging, contract_inflation, cross_pattern, systemic_risk, sanctioned_vendor, price_clustering, network_collusion
- **Each finding includes innocent_explanation** — contextual analysis considering legitimate reasons (textbook distributors, defense procurement, commodity rules)
- **React hooks rule** — all useMemo/useEffect MUST be before any conditional return in AuditPageClient (React error #310)
- **Vercel deploy** — `cd apps/web && npx vercel --prod` (git auto-deploy sometimes fails, CLI always works)
- **Repo is ~2.2GB** — data files + legislator photos; keep raw data in `apps/web/data/`, only processed results in `public/data/`

## 🤝 Team Recommendation
**Complexity Score:** 5.5

**Indicators Detected:**
- ✅ Multi-layer architecture (Next.js + FastAPI + Celery + scrapers)
- ✅ Multiple technologies (TypeScript + Python + SQL + D3.js + Korean NLP)
- ✅ Large codebase (605 tracked files)
- ❌ Security concerns (none)
- ✅ Unfamiliar stack (Korean NLP, Korean gov APIs, Korean payment systems)

**Recommendation:** Full Development Team when needed

---

## Change Detection

This cache will be invalidated automatically when:
- Git commit hash changes (pull, commit, checkout)
- .claude/PROJECT_CONTEXT.md is deleted
- /prime is run with --force flag

To force re-analysis: `rm .claude/PROJECT_CONTEXT.md && /prime`
