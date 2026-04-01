# 🚀 ORCHESTRATION PROMPT — Feed this to Claude Code

## Initial Setup Prompt

Copy-paste the following prompt into Claude Code to bootstrap the project:

---

```
/init

I'm building 국정투명 (GukjeongTumyeong) — Korea's first AI-powered civic transparency platform. 

Read the spec files in .claude/ directory:
- CLAUDE.md — project overview, tech stack, structure, working rules
- facts.md — all verified data, API endpoints, media classifications
- architecture.md — full DB schema, API design, Celery schedule

We're in Phase 0 (Setup). I need you to:

1. Initialize the monorepo structure per CLAUDE.md
2. Set up Docker Compose for local dev (PostgreSQL 16 + pgvector, Redis, Meilisearch)
3. Set up the Next.js 14 app with TypeScript, Tailwind, shadcn/ui, Pretendard font
4. Set up the FastAPI backend with SQLAlchemy 2.0 async, Alembic migrations
5. Create ALL database tables from architecture.md
6. Create seed data files from facts.md (presidents, media outlets, fiscal data)
7. Set up the base scraper framework for government APIs
8. Create .env.example with all required environment variables

Work in parallel where possible. Start with infrastructure (Docker, DB) and frontend skeleton simultaneously.

Important context:
- This is a Korean civic platform — all user-facing text in Korean
- Mobile-first (80% of Korean users are mobile)
- SEO critical (citizens find via Google/Naver search)
- Privacy by design — no real names stored anywhere
- Pretendard font: @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css')
- Color scheme: dark header (#0f172a), warm body (#fafaf8), accent (#ff6b35)
```

---

## Parallel Workstreams for /orchestrate

When using Claude Code's orchestration, here are the parallel workstreams:

```
/orchestrate

Set up 국정투명 project with these parallel workstreams:

WORKSTREAM 1 — Infrastructure (apps/api/)
- Docker Compose: PostgreSQL 16 + pgvector + Redis + Meilisearch
- FastAPI boilerplate with async SQLAlchemy
- Alembic migration with ALL tables from .claude/architecture.md  
- Database seed script (presidents, media outlets, fiscal_yearly)
- Base scraper class with retry/rate-limit logic
- Celery + Redis configuration
- Test: verify DB connection and seed data

WORKSTREAM 2 — Frontend Shell (apps/web/)
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui setup
- Pretendard font integration
- Layout: dark header, warm body, responsive
- Page skeletons for all routes (empty but routable)
- Common components: KPI, ScoreBar, StatusBadge, ShareKakao
- Chart components: Sparkline, TreeMap (basic D3 setup)
- NextAuth.js config (Kakao placeholder)
- Test: all pages render, responsive check

WORKSTREAM 3 — Data Layer
- Government API connector classes (one per source):
  - open_fiscal.py (열린재정)
  - ecos.py (한국은행)
  - data_go_kr.py (공공데이터포털 base)
  - g2b.py (나라장터 contracts)
  - assembly.py (열린국회 bills + legislators)
- Test scripts that verify API connectivity with sample queries
- Rate limit handling per API
- JSON → DB model transformation

WORKSTREAM 4 — Seed Data & Content
- presidents.json with full data for 8 presidents (YS Kim → Lee Jae-myung)
- media_outlets.json with 30 outlets + spectrum scores
- fiscal_historical.json (1998-2025 yearly totals)
- glossary.json (50 essential terms in simple Korean)
- data/seed/ directory with all JSON files
- Seed script that loads all into PostgreSQL

After all workstreams complete:
- Verify Docker Compose brings up all services
- Verify DB has all tables + seed data
- Verify Next.js serves at localhost:3000
- Verify FastAPI serves at localhost:8000
- Verify /api/v1/presidents returns seeded data
```

---

## Phase 1 MVP Prompt (after Phase 0)

```
/orchestrate

Phase 1 MVP — 국정투명 대통령 비교 + 예산 + AI 감사 기본

Read .claude/ specs for full context.

WORKSTREAM A — President Pages
- /presidents page: interactive timeline (김영삼→현재)
- /presidents/[id] page with 4 tabs:
  1. Overview: KPIs (총지출, 채무, GDP성장률) + policy bubble chart
  2. Budget: TreeMap (sector allocation) + stacked area (trends during term)
  3. Governance: radar chart (소통/협치/재정확장 axes) + minister stats
  4. Pledges: pledge tracking table with fulfillment status
- Data from: /api/v1/presidents/{id} endpoint
- All charts interactive, mobile-optimized
- Korean text throughout, Pretendard font

WORKSTREAM B — Budget Dashboard
- /budget page with:
  1. Hero KPIs: total spending, debt, tax revenue, deficit
  2. Stacked area: 1998-2025 sector spending trends
  3. Sankey: revenue sources → departments → programs
  4. Debt trajectory: bars + GDP ratio line
  5. International comparison: horizontal bars (Korea vs OECD/Japan/US)
  6. "내 세금 1만원" calculator (income input → breakdown)
- Data from 열린재정 API + ECOS API
- Year slider to navigate time

WORKSTREAM C — AI Auditor Basic
- /audit page with department heatmap
- Implement patterns 1, 2, 4 (yearend spike, vendor concentration, contract splitting)
- /audit/[id] detail page showing:
  - Detected patterns with evidence
  - Comparison data (vs other departments)
  - AI analysis summary
  - Disclaimer ("이 분석은 AI 기반 자동 탐지...")
- 나라장터 contract API → daily collection → pattern analysis
- Celery tasks for daily scan + weekly department scores

WORKSTREAM D — Search & Common
- /search page with freemium gate:
  - Anonymous: 5/day, basic filters
  - Registered: 15/day, +department filter
  - Pro: unlimited, all filters, paywall UI for upgrade
- Meilisearch indexing for presidents, bills, contracts, glossary
- Global search bar in header
- GlossaryTooltip component (hover on any technical term)
- Mobile navigation (bottom tab bar)
- SEO: dynamic OG images per page, sitemap.xml, robots.txt
```

---

## Claude Code Settings

### .claude/settings.json
```json
{
  "permissions": {
    "allow": [
      "bash(npm:*)",
      "bash(npx:*)",
      "bash(pip:*)",
      "bash(python:*)",
      "bash(docker:*)",
      "bash(docker-compose:*)",
      "bash(alembic:*)",
      "bash(celery:*)",
      "bash(curl:*)",
      "bash(mkdir:*)",
      "bash(cp:*)",
      "bash(mv:*)",
      "bash(cat:*)",
      "bash(echo:*)",
      "bash(cd:*)",
      "bash(ls:*)",
      "bash(git:*)",
      "bash(touch:*)",
      "bash(pg_dump:*)"
    ]
  }
}
```

---

## Key Prompts for Specific Tasks

### Prompt: Set up Government API connectors
```
Create Python API connector classes for Korean government data sources.

Each connector should:
- Inherit from BaseConnector (apps/api/scrapers/base.py)
- Handle API key auth via serviceKey parameter
- Implement rate limiting (respect daily quotas)
- Return Pydantic models
- Have async methods
- Cache responses in Redis (TTL 1 hour)
- Log all API calls

Connectors needed:
1. DataGoKrConnector — base for all data.go.kr APIs
2. OpenFiscalConnector — 열린재정 (budget/debt/revenue)
3. ECOSConnector — 한국은행 (GDP/CPI/rates)  
4. G2BConnector — 나라장터 (contracts/bids)
5. AssemblyConnector — 열린국회 (bills/legislators/votes)
6. LawConnector — 법제처 (laws/amendments)

See .claude/facts.md for API endpoint details.
```

### Prompt: Build AI Audit Engine
```
Build the AI Auditor engine that detects suspicious government spending patterns.

Read .claude/facts.md section "AI Audit Patterns" for all 10 patterns.

Implement in apps/api/services/audit_engine.py and apps/api/etl/audit_patterns.py.

Start with patterns 1, 2, 4:
1. Year-end spending spike: Q4 > 40% of annual spending per department
2. Vendor concentration: same vendor >30% of dept contracts or 3yr consecutive
4. Contract splitting: 3+ contracts at ₩16M-₩20M (80-100% of 수의계약 limit) to same vendor within 30 days

Each pattern returns:
{
  "pattern_type": "yearend_spike",
  "severity": "HIGH",
  "suspicion_score": 15,  # weight from facts.md
  "target_type": "department",
  "target_id": "국토교통부",
  "detail": {...},
  "evidence": {...}
}

Create Celery task that runs patterns daily on new contracts.
Create weekly task that calculates department-level suspicion scores.
```

### Prompt: Build News Frame Comparison
```
Build the news media frame comparison system.

Read .claude/facts.md for media outlet spectrum scores (1.0-5.0).

Components:
1. RSS collector (apps/api/scrapers/news_rss.py)
   - Collect from 20 outlets every 30 min
   - Store title, url, source, published_at

2. News clustering (apps/api/etl/news_clustering.py)
   - Group articles about same event using TF-IDF + cosine similarity
   - Threshold: 0.6 similarity → same event cluster

3. Frame analyzer (apps/api/services/news_analyzer.py)
   - For each event cluster with 5+ articles:
   - Separate progressive (score < 2.5) vs conservative (score > 3.5) articles
   - Send to Claude API with frame comparison prompt
   - Store: key_facts, progressive_frame, conservative_frame, citizen_takeaway

4. Frontend component: FrameComparison.tsx
   - Split view: blue left (진보) | red right (보수)
   - Common facts in center
   - Media spectrum bar showing coverage volume by outlet

Claude prompt template in .claude/facts.md context.
```

### Prompt: Build Citizen Survey System
```
Build the deliberative survey system with credit rewards.

Key concept: "Data before opinion" — show relevant data BEFORE asking opinion, then ask again AFTER.

Components:
1. Survey engine (apps/api/services/survey_engine.py)
   - Create surveys with pre_info and post_info phases
   - Track which users completed which phase
   - Calculate aggregates with K-anonymity (min 30 per group)
   - Weight results by demographics vs national distribution

2. Credit system (apps/api/services/credit_service.py)
   - Award credits per action (see facts.md credit table)
   - Track balance, allow redemption for Pro tier

3. Frontend: /survey/[id] page
   - Phase 1: Initial questions
   - Data panel: charts/facts about the issue
   - Phase 2: Same questions after data exposure
   - Results: multidimensional view (by job, age, region, etc.)
   - Always show: "대표성 점수: XX/100" + disclaimer

4. Profile: progressive disclosure
   - Level 1 after signup: age/gender/region → +50 credits
   - Level 2 optional: job/income → +100 credits
   - Level 3 optional: interests/political self → +200 credits
   - NEVER store real name

Privacy: see .claude/architecture.md for DB separation.
```

---

## Useful Claude Code Commands

```bash
# Start development
docker-compose up -d                    # Start PG + Redis + Meilisearch
cd apps/web && npm run dev              # Next.js at :3000
cd apps/api && uvicorn app.main:app --reload  # FastAPI at :8000

# Database
cd apps/api && alembic upgrade head     # Run migrations
cd apps/api && python -m app.db.seed    # Seed data

# Testing
cd apps/api && pytest                   # Backend tests
cd apps/web && npm test                 # Frontend tests

# Celery
cd apps/api && celery -A etl.tasks worker --loglevel=info
cd apps/api && celery -A etl.tasks beat --loglevel=info

# Backup
pg_dump $NEON_DATABASE_URL | gzip > data/backups/$(date +%Y%m%d).sql.gz
```
