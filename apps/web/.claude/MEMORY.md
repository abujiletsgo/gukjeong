# Project Memory — web
<!-- Mid-term project memory: one entry per session. Auto-maintained. -->
<!-- Layer 2 (episodic): what changed, was fixed, was decided across sessions. -->

## 2026-03-26 (04:20 UTC) · @Tom Kwon
**Commit:** fix: Full team validation — 61 files fixed across 5 parallel agents (3602160) by Tom Kwon
**Changed:**
  .claude/MEMORY.md                                  |   18 +
  .gitignore                                         |   11 +
  apps/api/app/config.py                             |    7 +-
  apps/api/app/dependencies.py                       |    7 +-
  apps/api/app/models/__init__.py                    |   34 +
  apps/api/app/models/audit_flag.py                  |    6 +-
  apps/api/app/models/legislator.py                  |    2 +-
  apps/api/app/routers/__init__.py                   |    7 +-
  apps/api/app/routers/auth.py                       |   28 +-
  apps/api/app/routers/comments.py                   |   10 +-
  ... and 52 more files

## 2026-03-26 (06:10 UTC) · @Tom Kwon
**Commit:** feat: Deep presidential accountability — pledges, agenda, report cards, infographics (96069bd) by Tom Kwon
**Changed:**
  .claude/MEMORY.md                                  |   15 +
  apps/api/app/models/__init__.py                    |    6 +-
  apps/api/app/models/president.py                   |   83 +-
  apps/api/app/routers/presidents.py                 |  515 +++++++--
  apps/api/app/schemas/president.py                  |  187 +++-
  apps/web/.claude/MEMORY.md                         |   18 +
  .../app/presidents/[id]/PresidentDetailClient.tsx  |  614 ++++++++---
  apps/web/app/presidents/[id]/page.tsx              |   31 +-
  apps/web/components/presidents/AgendaProgress.tsx  |  164 +++
  apps/web/components/presidents/AgendaTreemap.tsx   |  218 ++++
  ... and 25 more files

## 2026-03-26 (06:48 UTC) · @Tom Kwon
**Commit:** feat: Phase 2 — Bills tracker, News frames, President comparisons, portraits (802f1df) by Tom Kwon
**Changed:**
  apps/api/app/routers/bills.py                      | 251 ++++++++--
  apps/api/app/routers/news.py                       | 259 ++++++++++-
  apps/api/app/schemas/bill.py                       |  82 +++-
  apps/api/app/schemas/news.py                       | 125 ++++-
  apps/web/app/(home)/page.tsx                       | 129 +++++-
  apps/web/app/audit/AuditPageClient.tsx             |  38 +-
  apps/web/app/bills/BillsPageClient.tsx             | 416 +++++++++++++++++
  apps/web/app/bills/[id]/BillDetailClient.tsx       | 424 +++++++++++++++++
  apps/web/app/bills/[id]/page.tsx                   |  44 +-
  apps/web/app/bills/page.tsx                        |  13 +-
  ... and 25 more files

## 2026-03-26 (08:31 UTC) · @Tom Kwon
**Commit:** feat: Phase 3 — Legislators scorecard + President comparison capped at 4 (da1de71) by Tom Kwon
**Changed:**
  .claude/MEMORY.md                                  |  15 +
  apps/api/app/routers/legislators.py                | 410 ++++++++--
  apps/api/app/schemas/legislator.py                 | 147 +++-
  apps/web/app/legislators/LegislatorsPageClient.tsx | 267 +++++++
  .../legislators/[id]/LegislatorDetailClient.tsx    | 397 ++++++++++
  apps/web/app/legislators/[id]/page.tsx             |  43 +-
  apps/web/app/legislators/page.tsx                  |  13 +-
  apps/web/app/presidents/PresidentCompareClient.tsx |  17 +-
  apps/web/components/legislators/RankingTable.tsx   | 306 +++++++-
  apps/web/components/legislators/Scorecard.tsx      | 141 +++-
  ... and 5 more files

## 2026-03-26 (08:49 UTC) · @Tom Kwon
**Commit:** feat: Minimal data-first landing page — numbers speak, no editorial (e7ea979) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md    |  15 ++
  apps/web/app/(home)/page.tsx  | 393 ++++++++++++++++++++++--------------------
  apps/web/tsconfig.tsbuildinfo |   2 +-
  3 files changed, 224 insertions(+), 186 deletions(-)

## 2026-03-26 (09:50 UTC) · @Tom Kwon
**Commit:** feat: Deep audit details with links/contracts/timeline + 10 more flags + 8 more news (fc0da73) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                    |   8 +
  apps/web/app/audit/[id]/AuditDetailClient.tsx | 456 ++++++++++----
  apps/web/components/audit/SuspicionCard.tsx   |  19 +-
  apps/web/lib/data.ts                          | 816 +++++++++++++++++++++++++-
  apps/web/lib/types.ts                         |  32 +
  apps/web/tsconfig.tsbuildinfo                 |   2 +-
  6 files changed, 1219 insertions(+), 114 deletions(-)

## 2026-03-26 (10:12 UTC) · @Tom Kwon
**Commit:** feat: Data provenance + demo banner + full about page with sources & methodology (01270b6) by Tom Kwon
**Changed:**
  apps/web/.claude/FACTS.md             |   15 +
  apps/web/.claude/MEMORY.md            |   11 +
  apps/web/.gitignore                   |    3 +
  apps/web/app/about/page.tsx           |  255 +-
  apps/web/app/api/cron/scrape/route.ts |   83 +
  apps/web/app/api/sync/status/route.ts |   92 +
  apps/web/app/layout.tsx               |    9 +
  apps/web/drizzle.config.ts            |   10 +
  apps/web/lib/db/index.ts              |    6 +
  apps/web/lib/db/schema.ts             |  156 +
  ... and 12 more files

## 2026-03-26 (10:19 UTC) · @Tom Kwon
**Commit:** chore: Remove GitHub/open-source references — private project (fcc5548) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md  | 15 +++++++++++++++
  apps/web/app/about/page.tsx | 17 ++++-------------
  apps/web/app/layout.tsx     |  4 ++--
  3 files changed, 21 insertions(+), 15 deletions(-)

## 2026-03-26 (16:02 UTC) · @Tom Kwon
**Commit:** feat: Deep explorable bills — perspectives, controversy analysis, co-sponsors, timelines (dc7ef48) by Tom Kwon
**Changed:**
  apps/web/app/bills/[id]/BillDetailClient.tsx |  874 ++++++++++++++++-----
  apps/web/lib/data.ts                         | 1084 +++++++++++++++++++++++++-
  apps/web/lib/types.ts                        |   51 ++
  apps/web/tsconfig.tsbuildinfo                |    2 +-
  4 files changed, 1820 insertions(+), 191 deletions(-)

## 2026-03-26 (16:37 UTC) · @Tom Kwon
**Commit:** fix: Korean severity labels, no emojis, clean nav, remove 이재명 from legislators (209dee6) by Tom Kwon
**Changed:**
  apps/web/app/audit/[id]/AuditDetailClient.tsx |  4 +--
  apps/web/app/layout.tsx                       | 46 +++++++++++++--------------
  apps/web/components/audit/SuspicionCard.tsx   |  2 +-
  apps/web/lib/data.ts                          | 28 ++++++++--------
  apps/web/tsconfig.tsbuildinfo                 |  2 +-
  5 files changed, 41 insertions(+), 41 deletions(-)
