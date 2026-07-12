<!-- GIT_HASH: 35b186a8c632775d35350dc7bfe76d29723f924e -->
<!-- GENERATED: 2026-07-12 -->
<!-- PRIME_VERSION: 2.0 -->

# Project Context Cache

## 🎯 Project Overview
- **Name:** 국정투명 (GukjeongTumyeong)
- **Type:** AI-powered civic transparency platform (web app)
- **Mission:** Korea's first platform where citizens see how their government operates — with numbers, not opinions
- **Primary Languages:** TypeScript (frontend), Python (backend/scripts)
- **Tech Stack:** Next.js 14 (App Router) + FastAPI + Neon Postgres (Drizzle ORM on frontend, SQLAlchemy on backend) + Redis (Upstash) + Celery + D3.js/Recharts + Tailwind
- **Monorepo:** Turborepo — `apps/web`, `apps/api`, `packages/shared`
- **Scale:** 913 tracked files, 28 Next.js pages
- **Deploy:** Vercel (frontend) at https://web-eta-sand-65.vercel.app

## 📚 Documentation Available
- `CLAUDE.md` (root) — stack, commands, architecture, data-fetch parallelism protocol
- `.claude/ARCHITECTURE.md` — blast-radius table, Mermaid dependency graph, critical paths, data lineage (⚠️ SPEC-BASED, dated 2026-03-25 "pre-initial-commit" — STALE, regenerate with /arch-map)
- `.claude/FACTS.md`, `.claude/MEMORY.md` — verified facts and gotchas (root + apps/web copies)
- `.claude/CLAUDE_DESIGN_BRIEF.md` — design brief (untracked)
- `apps/web/lib/types.ts` — all TS interfaces; `apps/web/lib/data.ts` — canonical data access layer

## 🔒 Security Audit (Local Skills)
**Status:** CLEAN — no local skills or hooks in `.claude/` (no `.claude/skills/`, no `.claude/hooks/`, no `.claude/commands/`).

## 🔧 Claude Code Integration
- Hooks: none (project-level)
- Custom agents: `audit-analyst`, `data-pipeline` (`.claude/agents/`)
- Custom commands: none project-local
- Skills: none project-local

## 🏗️ Architecture Highlights
- **Data flow:** data.go.kr / 열린국회 APIs → `scripts/fetch-data.py` → `apps/web/data/*.json` (raw cache) → `scripts/generate-audit.py` → `apps/web/public/data/audit-results.json` (processed)
- **Types in 3 places:** SQLAlchemy models → Pydantic schemas → `apps/web/lib/types.ts` — keep in sync after model changes + Alembic migration
- **Audit engine:** `scripts/generate-audit.py` — **25 pattern detectors, 13,880 findings** (grew from 20/673); each finding includes `innocent_explanation` (innocence-first approach)
- **New since last prime:** `/popular` (화제의 감사 — news topics cross-referenced with audit traces), `/bills` wired to 16,914 real bills from 열린국회 API, legislator detail pages with real bill data, news AI analysis + accumulation system
- **In progress (uncommitted):** Drizzle/Neon DB layer — `apps/web/lib/db/queries.ts`, `scripts/seed-db.py`, `scripts/enrich-bills.py`, `bill-enrichment-state.json`
- **Fetcher rule:** every fetcher in `scripts/fetch-data.py` MUST use ThreadPoolExecutor parallelism (see CLAUDE.md Data Fetch Protocol)
- **Architecture map status:** 🗺️ STALE — spec-based, pre-initial-commit; run /arch-map to regenerate

## 💡 Key Insights
- **8 API services wired** — 조달청 + 행안부 subscriptions working via undocumented gateway patterns (inqryDiv, YYYYMMDDHHmm dates, ao/as/at/ prefixes)
- **Audit page:** ISR disabled — 104MB data exceeds Vercel fallback limit; `/api/news/topics` must stay force-static (dynamic breaks on Vercel, no fs access)
- **React hooks rule** — all useMemo/useEffect MUST come before any conditional return in AuditPageClient (React error #310)
- **Vercel deploy** — git push is reliable; CLI fails >100MB; large data files gitignored; `g2b-contract-details.json` stripped from history
- **AI analysis is authored by Claude Code directly** as curated data — no API-key scripts (user rule)
- **Repo is ~2.2GB** — raw data in `apps/web/data/`, only processed results in `public/data/`
- **All user-facing text Korean**, Pretendard font

## 🤝 Team Recommendation
**Complexity Score:** 4.5 (multi-layer 2.0 + multiple-tech 1.5 + large-codebase 1.0)

**Indicators:**
- ✅ Multi-layer architecture (Next.js frontend + FastAPI backend + data pipeline)
- ✅ Multiple technologies (TypeScript, Python, SQL, Celery)
- ✅ Large codebase (913 files)
- ❌ Security concerns (audit clean)
- ❌ Unfamiliar stack

**Recommendation:** Full Development Team available on request (orchestrator + builder + validator + researcher), but user operates in full-autonomy yolo mode — spawn teams only when task scale demands it, not by default.

---

## Change Detection

This cache will be invalidated automatically when:
- Git commit hash changes (pull, commit, checkout)
- .claude/PROJECT_CONTEXT.md is deleted
- /prime is run with --force flag

To force re-analysis: `rm .claude/PROJECT_CONTEXT.md && /prime`
