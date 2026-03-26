# CLAUDE.md — 국정투명 (GukjeongTumyeong)

## Project Identity

**Name:** 국정투명 (GukjeongTumyeong)
**Mission:** Korea's first AI-powered civic transparency platform. Citizens see exactly how their government operates — with numbers, not opinions.
**Tagline:** "수치로 보는 대한민국 정부"
**Repo:** gukjeong/

## Core Principles

1. **Data over opinion** — every claim backed by public data with source citation
2. **Political neutrality** — same standards applied to all administrations and parties
3. **Free core, paid power tools** — citizens' right to know is always free
4. **Privacy by design** — no real names stored, anonymous IDs only, K-anonymity on aggregates
5. **Open source** — code is public, anyone can verify

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR for SEO, Korean citizens find via search |
| UI | Tailwind CSS + shadcn/ui | Fast dev + customizable |
| Charts | D3.js + Recharts | Custom Sankey, TreeMap, Timeline, Heatmap |
| Backend | FastAPI (Python 3.11+) | Scraping/AI/ETL all Python ecosystem |
| AI | Claude API (Sonnet 4) | Bill summaries, policy analysis, audit analysis, news framing |
| DB | PostgreSQL 16 + pgvector (Neon) | Relational joins essential, vector search for semantics |
| Search | Meilisearch | Korean morpheme support, fast full-text |
| Cache/Queue | Redis (Upstash) | API caching + Celery broker |
| Scheduler | Celery + Celery Beat | Periodic data collection/analysis |
| Scraping | Scrapy + Playwright | Static/dynamic government pages |
| Korean NLP | KoNLPy + Kiwi | Morpheme analysis, keyword extraction |
| Embeddings | sentence-transformers (ko) | News clustering, similar bill search |
| Frontend Deploy | Vercel | Korean CDN, auto-deploy |
| Backend Deploy | Render (free) → Railway (scale) | Cost-efficient |
| Auth | NextAuth.js + Kakao/Naver OAuth | Korean social login essential |
| Payments | Toss Payments (KR) + Stripe (intl) | Korean payment methods |
| Monitoring | Sentry + Vercel Analytics | Error tracking + usage |

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel     │────▶│   FastAPI     │────▶│  Neon (PG)   │
│  (Next.js)   │     │  (Python)    │     │  + pgvector  │
└─────────────┘     └──────────────┘     └─────────────┘
                          │                      │
                    ┌─────┴─────┐          ┌─────┴─────┐
                    │  Celery   │          │ Meilisearch│
                    │  Workers  │          └───────────┘
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────┴────┐ ┌───┴───┐ ┌────┴────┐
        │ Scrapers │ │Claude │ │  Redis  │
        │ (Gov API)│ │  API  │ │(Upstash)│
        └──────────┘ └───────┘ └─────────┘
```

## Monorepo Structure

```
gukjeong/
├── .claude/
│   ├── CLAUDE.md              ← YOU ARE HERE
│   ├── facts.md               ← Project facts & data sources
│   ├── architecture.md        ← Detailed architecture
│   └── settings.json          ← Claude Code config
├── apps/
│   ├── web/                   ← Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (home)/page.tsx
│   │   │   ├── presidents/
│   │   │   │   ├── page.tsx           # Timeline view
│   │   │   │   └── [id]/page.tsx      # President detail
│   │   │   ├── budget/page.tsx        # Budget visualization
│   │   │   ├── bills/
│   │   │   │   ├── page.tsx           # Bill tracker
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── legislators/
│   │   │   │   ├── page.tsx           # Rankings
│   │   │   │   └── [id]/page.tsx      # Legislator scorecard
│   │   │   ├── audit/
│   │   │   │   ├── page.tsx           # AI Auditor dashboard
│   │   │   │   └── [id]/page.tsx      # Suspicion detail
│   │   │   ├── news/page.tsx          # News frame comparison
│   │   │   ├── survey/
│   │   │   │   ├── page.tsx           # Active surveys
│   │   │   │   └── [id]/page.tsx      # Survey + results
│   │   │   ├── local/
│   │   │   │   └── [region]/page.tsx  # Local government
│   │   │   ├── compare/page.tsx       # International comparison
│   │   │   ├── simulator/page.tsx     # Budget simulator
│   │   │   ├── search/page.tsx        # Search (freemium)
│   │   │   ├── auth/
│   │   │   │   └── kakao/callback/    # OAuth callback
│   │   │   ├── pricing/page.tsx       # Tier/pricing
│   │   │   └── about/page.tsx
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── SankeyChart.tsx
│   │   │   │   ├── TreeMap.tsx
│   │   │   │   ├── StackedArea.tsx
│   │   │   │   ├── BubbleChart.tsx
│   │   │   │   ├── Sparkline.tsx
│   │   │   │   ├── HeatMap.tsx
│   │   │   │   ├── RadarChart.tsx
│   │   │   │   └── DebtChart.tsx
│   │   │   ├── timeline/
│   │   │   │   ├── PresidentTimeline.tsx
│   │   │   │   └── PolicyTimeline.tsx
│   │   │   ├── audit/
│   │   │   │   ├── SuspicionCard.tsx
│   │   │   │   ├── DepartmentHeatmap.tsx
│   │   │   │   └── PatternBadge.tsx
│   │   │   ├── news/
│   │   │   │   ├── FrameComparison.tsx
│   │   │   │   ├── MediaSpectrum.tsx
│   │   │   │   └── NewsCluster.tsx
│   │   │   ├── survey/
│   │   │   │   ├── SurveyCard.tsx
│   │   │   │   ├── DeliberativeFlow.tsx
│   │   │   │   └── MultidimensionalResult.tsx
│   │   │   ├── legislators/
│   │   │   │   ├── Scorecard.tsx
│   │   │   │   ├── WordsVsActions.tsx
│   │   │   │   └── RankingTable.tsx
│   │   │   └── common/
│   │   │       ├── KPI.tsx
│   │   │       ├── ScoreBar.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── GlossaryTooltip.tsx
│   │   │       ├── PaywallGate.tsx
│   │   │       ├── CreditBadge.tsx
│   │   │       └── ShareKakao.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client
│   │   │   ├── types.ts              # TypeScript types
│   │   │   ├── auth.ts               # NextAuth config
│   │   │   ├── rate-limit.ts         # Client-side rate check
│   │   │   └── utils.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── public/
│   │   │   └── og/                    # OG images for sharing
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                           ← FastAPI backend
│       ├── app/
│       │   ├── main.py                # FastAPI app
│       │   ├── config.py              # Settings (env vars)
│       │   ├── dependencies.py        # Auth, rate limit deps
│       │   ├── routers/
│       │   │   ├── presidents.py
│       │   │   ├── budget.py
│       │   │   ├── bills.py
│       │   │   ├── legislators.py
│       │   │   ├── audit.py
│       │   │   ├── news.py
│       │   │   ├── survey.py
│       │   │   ├── local.py
│       │   │   ├── search.py
│       │   │   ├── auth.py
│       │   │   └── credits.py
│       │   ├── models/                # SQLAlchemy models
│       │   │   ├── base.py
│       │   │   ├── president.py
│       │   │   ├── fiscal.py
│       │   │   ├── bill.py
│       │   │   ├── legislator.py
│       │   │   ├── contract.py
│       │   │   ├── audit_flag.py
│       │   │   ├── article.py
│       │   │   ├── news_event.py
│       │   │   ├── survey.py
│       │   │   ├── citizen_profile.py
│       │   │   ├── credit.py
│       │   │   ├── user.py
│       │   │   └── glossary.py
│       │   ├── schemas/               # Pydantic schemas
│       │   │   └── (mirrors models/)
│       │   ├── services/
│       │   │   ├── claude_service.py   # Claude API wrapper
│       │   │   ├── search_service.py   # Meilisearch wrapper
│       │   │   ├── audit_engine.py     # AI Auditor (10 patterns)
│       │   │   ├── news_analyzer.py    # News frame analysis
│       │   │   ├── survey_engine.py    # Deliberative survey logic
│       │   │   ├── credit_service.py   # Credit ledger
│       │   │   └── accountability.py   # Words vs Actions engine
│       │   └── db/
│       │       ├── database.py         # Neon connection
│       │       └── seed.py             # Initial data seeding
│       │
│       ├── scrapers/
│       │   ├── base.py                 # Base scraper class
│       │   ├── open_fiscal.py          # 열린재정 API
│       │   ├── assembly.py             # 열린국회 API
│       │   ├── law.py                  # 법제처 API
│       │   ├── ecos.py                 # 한국은행 ECOS API
│       │   ├── kosis.py                # KOSIS API
│       │   ├── g2b.py                  # 나라장터 API
│       │   ├── data_go_kr.py           # 공공데이터포털 (기재부 등)
│       │   ├── presidential.py         # 대통령기록관 (scrape)
│       │   ├── bai.py                  # 감사원 (scrape)
│       │   ├── nec.py                  # 선관위 (scrape)
│       │   ├── news_rss.py             # 뉴스 RSS feeds
│       │   └── bigkinds.py             # 빅카인즈 API
│       │
│       ├── etl/
│       │   ├── tasks.py                # Celery task definitions
│       │   ├── scheduler.py            # Celery Beat schedule
│       │   ├── ai_processor.py         # Claude analysis pipeline
│       │   ├── audit_patterns.py       # 10 audit detection patterns
│       │   ├── news_clustering.py      # TF-IDF + DBSCAN clustering
│       │   ├── consistency_checker.py  # Legislator words vs actions
│       │   └── transformers.py         # Data transformations
│       │
│       ├── alembic/                    # DB migrations
│       │   ├── alembic.ini
│       │   └── versions/
│       │
│       ├── tests/
│       │   ├── test_scrapers/
│       │   ├── test_audit/
│       │   └── test_api/
│       │
│       ├── requirements.txt
│       ├── Dockerfile
│       └── pyproject.toml
│
├── packages/
│   └── shared/
│       ├── types/                      # Shared TypeScript types
│       └── constants/                  # Shared constants
│
├── data/
│   ├── seed/
│   │   ├── presidents.json             # 7 presidents (YS Kim → Yoon)
│   │   ├── media_outlets.json          # 30+ outlets with spectrum scores
│   │   ├── fiscal_historical.json      # 1998-2025 fiscal data
│   │   ├── glossary.json               # 200+ terms in simple Korean
│   │   └── international_comparison.json
│   └── backups/                        # pg_dump backups (gitignored)
│
├── docs/
│   ├── api-sources.md                  # All 70+ public data sources
│   ├── audit-patterns.md               # 10 AI audit patterns detail
│   ├── media-spectrum.md               # 30+ outlet classifications
│   ├── data-ethics-charter.md          # Privacy & ethics policy
│   ├── tier-pricing.md                 # Free/Pro/Institution tiers
│   └── deployment.md
│
├── infra/
│   ├── docker-compose.yml              # Local dev (PG + Redis + Meilisearch)
│   ├── docker-compose.prod.yml
│   └── scripts/
│       ├── backup.sh                   # Daily Neon → local backup
│       ├── seed.sh                     # Run seed data
│       └── migrate.sh
│
├── turbo.json
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Working Rules for Claude Code

### General
- Always use TypeScript for frontend, Python 3.11+ for backend
- Korean comments/strings in code are fine and expected
- All user-facing text must be in Korean
- Mobile-first design (80% of Korean internet is mobile)
- Every data point must cite its source
- Pretendard font for all Korean text

### Frontend
- Use App Router (not Pages Router)
- shadcn/ui for base components, customize heavily
- D3.js for complex visualizations (Sankey, TreeMap, custom)
- Recharts for standard charts (line, bar, area)
- All pages must have proper OG tags for Kakao sharing
- No localStorage in artifacts (use React state)
- Dark header (#0f172a), warm light body (#fafaf8)

### Backend
- FastAPI with async everywhere
- SQLAlchemy 2.0 async ORM
- Pydantic v2 for all schemas
- Alembic for migrations
- Type hints on everything
- Rate limiting via Redis
- All external API calls go through service layer (never direct in routers)

### AI Usage
- Claude Sonnet 4 for all AI processing
- Always return structured JSON from Claude
- Cache AI results in DB (never re-analyze same content)
- AI analysis always marked as "AI 분석" in UI
- Batch API for bulk processing (50% cost savings)

### Data
- All monetary values in 조원 (trillion KRW) for display, 백만원 for DB storage
- Dates in YYYY-MM-DD (ISO 8601)
- Korean fiscal year = calendar year (Jan 1 - Dec 31)
- President terms: use actual dates, not just years
- Media spectrum: 1.0 (강한진보) to 5.0 (강한보수)
- Suspicion scores: 0-100

### Privacy
- NEVER store real names
- Kakao/Naver OAuth → one-way hash → UUID only
- K-anonymity: min 30 people per aggregate group
- Survey responses: individual data never exposed externally
- Only aggregated analytics shared with institution tier

### Legal
- Government public data: free to use (공공데이터법)
- News: title + link + AI summary only (no full text)
- Audit findings: always say "의심 패턴" never "비리 확정"
- All presidents/parties evaluated by identical standards
- Media classification: "학술 연구 기반 참고 분류" disclaimer

## Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/gukjeong
NEON_DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/gukjeong

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Government APIs (all from data.go.kr unless noted)
DATA_GO_KR_API_KEY=xxx
ECOS_API_KEY=xxx              # 한국은행 (ecos.bok.or.kr)
ASSEMBLY_API_KEY=xxx          # 열린국회 (open.assembly.go.kr)
LAW_API_KEY=xxx               # 법제처 (open.law.go.kr)

# Auth
KAKAO_CLIENT_ID=xxx           # developers.kakao.com
KAKAO_CLIENT_SECRET=xxx
NAVER_CLIENT_ID=xxx           # developers.naver.com
NAVER_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://gukjeong.kr

# Payments
TOSS_CLIENT_KEY=xxx           # tosspayments
TOSS_SECRET_KEY=xxx

# Infrastructure
REDIS_URL=redis://xxx         # Upstash
MEILISEARCH_URL=http://xxx
MEILISEARCH_API_KEY=xxx
SENTRY_DSN=xxx

# Feature flags
ENABLE_PAID_TIERS=false       # Enable when ready
ENABLE_SURVEYS=false          # Enable Phase 4
ENABLE_AUDIT=true
```

## Phase Plan

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|-----------------|
| 0 | 2 weeks | Setup | Monorepo, Docker, DB schema, API tests |
| 1 | 6 weeks | MVP | Presidents + Budget + AI Audit basic |
| 2 | 4 weeks | Expand | Bills + News layer |
| 3 | 4 weeks | People | Legislators + Local government |
| 4 | 4 weeks | Engage | Surveys + Citizen participation |
| 5 | 4 weeks | Deep | Policy causation + International |
| 6 | Ongoing | Scale | Community + Sustainability |

## Current Phase: 0 — SETUP

Priority tasks right now:
1. Initialize monorepo (turborepo)
2. Set up Docker Compose for local dev
3. Create DB schema (all tables from architecture.md)
4. Set up Next.js with Tailwind + shadcn/ui + Pretendard font
5. Set up FastAPI with SQLAlchemy + Alembic
6. Test government API connections (열린재정, ECOS, 나라장터)
7. Seed initial data (presidents, media outlets, historical fiscal)
