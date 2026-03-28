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

## 2026-03-26 (17:02 UTC) · @Tom Kwon
**Commit:** fix: Merge duplicate audit link sections into single "직접 확인하기" (de1c20e) by Tom Kwon
**Changed:**
  apps/web/app/audit/[id]/AuditDetailClient.tsx | 30 +--------------------------
  apps/web/tsconfig.tsbuildinfo                 |  2 +-
  2 files changed, 2 insertions(+), 30 deletions(-)

## 2026-03-27 (03:26 UTC) · @Tom Kwon
**Commit:** fix: Pin Next.js 14, React 18, recharts 2.12 — revert mobile session version bumps (4e86df2) by Tom Kwon
**Changed:**
  apps/web/components/charts/BubbleChart.tsx |  119 +-
  apps/web/components/charts/RadarChart.tsx  |  111 +-
  apps/web/package.json                      |   18 +-
  package-lock.json                          | 2863 +++++++++++++++-------------
  4 files changed, 1536 insertions(+), 1575 deletions(-)

## 2026-03-27 (03:45 UTC) · @Tom Kwon
**Commit:** feat: 국제 비교 + 지방자치단체 pages, fact-checked data (c1d9a50) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                 |   9 +
  apps/web/app/compare/ComparePageClient.tsx | 390 +++++++++++++++++++++++
  apps/web/app/compare/page.tsx              |  18 +-
  apps/web/app/local/[region]/page.tsx       | 329 +++++++++++++++++++-
  apps/web/app/local/page.tsx                | 313 +++++++++++++++++++
  apps/web/lib/data.ts                       | 479 ++++++++++++++++++++++++++++-
  apps/web/lib/types.ts                      |  37 +++
  apps/web/tsconfig.tsbuildinfo              |   2 +-
  8 files changed, 1555 insertions(+), 22 deletions(-)

## 2026-03-28 (08:48 UTC) · @Tom Kwon
**Commit:** fix: Consistent neutral color scheme — blue/red only for political parties (5514260) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                         | 13 +++++
  apps/web/app/(home)/page.tsx                       | 18 +++---
  apps/web/app/audit/AuditPageClient.tsx             |  6 +-
  apps/web/app/audit/[id]/AuditDetailClient.tsx      | 68 +++++++++++-----------
  apps/web/app/bills/BillsPageClient.tsx             | 16 ++---
  apps/web/app/bills/[id]/BillDetailClient.tsx       | 44 +++++++-------
  apps/web/app/budget/BudgetPageClient.tsx           |  2 +-
  apps/web/app/budget/[sector]/SectorPageClient.tsx  |  4 +-
  .../legislators/[id]/LegislatorDetailClient.tsx    | 18 +++---
  apps/web/app/local/[region]/page.tsx               | 11 ++--
  ... and 23 more files

## 2026-03-28 (09:13 UTC) · @Tom Kwon
**Commit:** feat: Real data pipeline — 열린국회정보 295 legislators + 나라장터 38K contracts (f79358d) by Tom Kwon
**Changed:**
  apps/web/app/api/legislators/real/bills/route.ts |  70 +++
  apps/web/app/api/legislators/real/route.ts       | 130 ++++
  apps/web/app/legislators/real/page.tsx           | 732 +++++++++++++++++++++++
  apps/web/lib/assembly/client.ts                  | 279 +++++++++
  apps/web/tsconfig.tsbuildinfo                    |   2 +-
  5 files changed, 1212 insertions(+), 1 deletion(-)

## 2026-03-28 (09:26 UTC) · @Tom Kwon
**Commit:** feat: Live data pipelines — real RSS news, ECOS economy, verified audit patterns (139bef4) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                       |  10 +
  apps/web/app/api/economy/route.ts                |  35 +++
  apps/web/app/api/news/live/route.ts              |  37 +++
  apps/web/app/news/live/LiveNewsClient.tsx        | 337 +++++++++++++++++++++++
  apps/web/app/news/live/page.tsx                  |  27 ++
  apps/web/components/economy/EconomyDashboard.tsx | 211 ++++++++++++++
  apps/web/lib/ecos/client.ts                      | 237 ++++++++++++++++
  apps/web/lib/news/rss.ts                         | 234 ++++++++++++++++
  apps/web/tsconfig.tsbuildinfo                    |   2 +-
  9 files changed, 1129 insertions(+), 1 deletion(-)

## 2026-03-28 (09:32 UTC) · @Tom Kwon
**Commit:** feat: Global demo/live toggle — real data is default, demo is opt-in (cc40585) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                    | 14 ++++++++++
  apps/web/app/layout.tsx                       | 26 ++++++++++---------
  apps/web/components/common/DataModeBanner.tsx | 30 ++++++++++++++++++++++
  apps/web/components/common/DataModeToggle.tsx | 21 +++++++++++++++
  apps/web/lib/context/DataModeContext.tsx      | 37 +++++++++++++++++++++++++++
  apps/web/lib/hooks/useRealData.ts             | 31 ++++++++++++++++++++++
  apps/web/tsconfig.tsbuildinfo                 |  2 +-
  7 files changed, 148 insertions(+), 13 deletions(-)

## 2026-03-28 (09:59 UTC) · @Tom Kwon
**Commit:** feat: 76 real audit findings from 3200 contracts + more photos (9102b22) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json  | 4304 ++++++++++++++++++++++++++----
  apps/web/public/legislators/0698755I.jpg |  Bin 0 -> 21547618 bytes
  apps/web/public/legislators/0R68099X.jpg |  Bin 0 -> 57410 bytes
  apps/web/public/legislators/2385336L.jpg |  Bin 0 -> 376070 bytes
  apps/web/public/legislators/25G2571T.jpg |  Bin 0 -> 559103 bytes
  apps/web/public/legislators/2NV6751W.jpg |  Bin 0 -> 653927 bytes
  apps/web/public/legislators/2S73768V.jpg |  Bin 0 -> 342953 bytes
  apps/web/public/legislators/3LP22204.jpg |  Bin 0 -> 894314 bytes
  apps/web/public/legislators/3ZR4438W.jpg |  Bin 0 -> 5560717 bytes
  apps/web/public/legislators/4T026790.jpg |  Bin 0 -> 1103197 bytes
  ... and 53 more files

## 2026-03-28 (10:15 UTC) · @Tom Kwon
**Commit:** feat: Real data is now DEFAULT — audit, legislators, news all show live data (b062b71) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                         |  15 +
  apps/web/app/(home)/HomeRealDataOverlay.tsx        |  65 ++
  apps/web/app/(home)/page.tsx                       |   7 +
  apps/web/app/audit/AuditPageClient.tsx             | 659 ++++++++++++++++----
  apps/web/app/legislators/LegislatorsPageClient.tsx | 661 ++++++++++++++++++---
  apps/web/app/news/NewsPageClient.tsx               | 176 +++++-
  apps/web/components/audit/PatternBadge.tsx         |   1 +
  apps/web/public/legislators/1S05899F.jpg           | Bin 0 -> 273486 bytes
  apps/web/public/legislators/3C23171A.jpg           | Bin 0 -> 106405 bytes
  apps/web/public/legislators/3NI5978A.jpg           | Bin 0 -> 680297 bytes
  ... and 31 more files

## 2026-03-28 (12:51 UTC) · @Tom Kwon
**Commit:** fix: Remove live data banner, fix gender stat, filter news keywords, rich audit UI (9fa8d5b) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md                         |   15 +
  apps/web/app/audit/AuditPageClient.tsx             | 1240 +++++++++++---------
  apps/web/app/legislators/LegislatorsPageClient.tsx |    6 +-
  apps/web/components/common/DataModeBanner.tsx      |   13 +-
  apps/web/lib/news/rss.ts                           |   21 +-
  apps/web/tsconfig.tsbuildinfo                      |    2 +-
  6 files changed, 735 insertions(+), 562 deletions(-)

## 2026-03-28 (13:02 UTC) · @Tom Kwon
**Commit:** feat: Rich legislator page with real bill data — photos, activity tracking, expandable details (5559938) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx | 378 +++++++++++++++++----
  apps/web/tsconfig.tsbuildinfo                      |   2 +-
  2 files changed, 307 insertions(+), 73 deletions(-)

## 2026-03-28 (13:53 UTC) · @Tom Kwon
**Commit:** feat: Voting participation data wired into legislator cards (9208242) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx | 211 +++++++++++++++++++--
  apps/web/tsconfig.tsbuildinfo                      |   2 +-
  2 files changed, 199 insertions(+), 14 deletions(-)

## 2026-03-28 (15:29 UTC) · @Tom Kwon
**Commit:** feat: Context-aware AI audit — stop flagging LPG as corruption (1ac2afd) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 394 +++++++++++------
  apps/web/lib/audit/context.ts          | 779 +++++++++++++++++++++++++++++++++
  apps/web/lib/audit/patterns.ts         |  42 +-
  docs/audit-patterns.md                 |  97 +++-
  4 files changed, 1143 insertions(+), 169 deletions(-)

## 2026-03-28 (15:51 UTC) · @Tom Kwon
**Commit:** feat: Full rebuild — all 5 pages with rich UI + real data (d1ad624) by Tom Kwon
**Changed:**
  .claude/FACTS.md                                   |      3 +-
  .claude/MEMORY.md                                  |     16 +
  apps/web/.claude/MEMORY.md                         |     16 +
  apps/web/app/api/audit/analyze/route.ts            |     23 +-
  apps/web/app/api/audit/contracts/route.ts          |     23 +-
  apps/web/app/api/cron/scrape/route.ts              |     81 +-
  apps/web/app/api/economy/route.ts                  |     85 +-
  apps/web/app/api/legislators/real/bills/route.ts   |     26 +-
  apps/web/app/api/legislators/real/route.ts         |     51 +-
  apps/web/app/api/news/live/route.ts                |     23 +-
  ... and 35 more files
