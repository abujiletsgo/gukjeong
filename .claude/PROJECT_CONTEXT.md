<!-- GIT_HASH: no-git-pre-commit -->
<!-- GENERATED: 2026-03-25 -->
<!-- PRIME_VERSION: 2.0 -->

# Project Context Cache

## 🎯 Project Overview
- **Name:** 국정투명 (GukjeongTumyeong)
- **Type:** AI-powered civic transparency platform (web app)
- **Mission:** Korea's first platform where citizens see how their government operates — with numbers, not opinions
- **Primary Languages:** TypeScript (frontend), Python (backend)
- **Tech Stack:** Next.js 14 (App Router) + FastAPI + PostgreSQL 16/pgvector (Neon) + Redis (Upstash) + Meilisearch + Celery + Scrapy/Playwright + Claude API (Sonnet 4) + KoNLPy/Kiwi + D3.js/Recharts
- **Phase:** Pre-code (Phase 0 — Setup). Spec files exist, no source code yet.

## 📚 Documentation Available
- `spec-CLAUDE.md` — Full project spec: identity, tech stack, architecture, monorepo structure, features, working rules
- `spec-architecture.md` — Complete DB schema (PostgreSQL 16 + pgvector), API endpoints, Celery schedules
- `spec-facts.md` — Verified data: Korean government APIs, fiscal data, president list, media outlet classifications
- `spec-ORCHESTRATION.md` — Bootstrapping prompts, parallel workstreams for setup
- No README.md yet (to be created)

## 🔒 Security Audit (Local Skills)
**Status:** CLEAN — No local skills detected. No hooks, agents, or commands configured.

## 🔧 Claude Code Integration
- Hooks: None
- Custom agents: None
- Custom commands: None
- Skills: None (using system skills only)
- Settings: Full permissions (`"allow": ["*"]`)

## 🏗️ Architecture Highlights
- **Monorepo:** `apps/web/` (Next.js) + `apps/api/` (FastAPI) + `packages/shared/`
- **DB:** 20+ tables covering users, budget, bills, legislators, audit, news, surveys, local gov
- **Key features:** Budget visualization (Sankey/TreeMap), AI Auditor (anomaly detection), News Frame Analysis, Legislator Scorecards, Deliberative Surveys, Budget Simulator
- **Data sources:** data.go.kr, 한국은행 ECOS, 열린국회정보, 국가법령정보, 빅카인즈
- **Deploy:** Vercel (frontend) + Render→Railway (backend) + Neon (DB)
- **Auth:** NextAuth.js + Kakao/Naver OAuth
- **Payments:** Toss Payments (KR) + Stripe (intl)
- **Architecture map:** Not yet created

## 💡 Key Insights
- **Pre-code stage** — all spec files exist but no source code has been written yet
- **Korean-first** — all UI in Korean, Pretendard font, Kakao/Naver social login, Korean NLP
- **Mobile-first** — 80% of Korean users are mobile
- **Privacy by design** — no real names, anonymous IDs, K-anonymity on aggregates
- **Freemium model** — free core civic data, paid power tools (unlimited search, API access, ad-free)
- **Political neutrality** — same standards for all administrations/parties
- **Heavy data pipeline** — 12+ government APIs to scrape, Claude AI for analysis

## 🤝 Team Recommendation
**Complexity Score:** 5.5 (multi-layer=2.0 + multiple-tech=1.5 + large-codebase=1.0 + unfamiliar-stack=1.0)

**Indicators Detected:**
- ✅ Multi-layer architecture (Next.js frontend + FastAPI backend + Celery workers + scrapers)
- ✅ Multiple technologies (TypeScript + Python + SQL + D3.js + Korean NLP)
- ✅ Large codebase (projected 100+ files from spec)
- ❌ Security concerns (none yet — pre-code)
- ✅ Unfamiliar stack (Korean NLP tools, Korean gov APIs, Korean payment systems)

**Recommendation:** Full Development Team

**Rationale:** Multi-layer monorepo with frontend (Next.js/TypeScript), backend (FastAPI/Python), data pipeline (Celery/Scrapy), and AI integration (Claude API). Korean-specific tooling adds complexity.

**Suggested Composition:**
- orchestrator (opus) — coordinate parallel workstreams
- builder x2 (sonnet) — frontend + backend in parallel
- researcher (sonnet) — Korean gov API documentation, NLP tooling
- validator (haiku) — test and verify each component

---

## Change Detection

This cache will be invalidated automatically when:
- Git commit hash changes (pull, commit, checkout)
- .claude/PROJECT_CONTEXT.md is deleted
- /prime is run with --force flag

To force re-analysis: `rm .claude/PROJECT_CONTEXT.md && /prime`
