# Project Memory — gukjeong
<!-- Mid-term project memory: one entry per session. Auto-maintained. -->
<!-- Layer 2 (episodic): what changed, was fixed, was decided across sessions. -->

## 2026-03-26 (01:47 UTC) · @Tom Kwon
**Commit:** feat: Phase 1 MVP — Presidents timeline, Budget viz, AI Audit dashboard (6dc068c) by Tom Kwon
**Changed:**
  apps/api/app/routers/audit.py                      |  84 +++++--
  apps/api/app/routers/budget.py                     |  68 +++++-
  apps/api/app/routers/presidents.py                 |  81 ++++++-
  apps/web/app/(home)/page.tsx                       | 212 ++++++++++--------
  apps/web/app/audit/AuditPageClient.tsx             | 246 +++++++++++++++++++++
  apps/web/app/audit/[id]/AuditDetailClient.tsx      | 187 ++++++++++++++++
  apps/web/app/audit/[id]/page.tsx                   |  50 +++--
  apps/web/app/audit/page.tsx                        |  43 ++--
  apps/web/app/budget/BudgetPageClient.tsx           | 235 ++++++++++++++++++++
  apps/web/app/budget/page.tsx                       |  67 +++---
  ... and 21 more files

## 2026-03-26 (01:49 UTC) · @Tom Kwon
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

## 2026-03-26 (05:53 UTC) · @Tom Kwon
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

## 2026-03-26 (06:39 UTC) · @Tom Kwon
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

## 2026-03-26 (08:08 UTC) · @Tom Kwon
**Commit:** feat: In-depth citizen explanations for all president data + expandable UI (de450b4) by Tom Kwon
**Changed:**
  .claude/MEMORY.md                                  |  30 +
  apps/web/.claude/MEMORY.md                         |  30 +
  apps/web/.gitignore                                |   1 +
  .../app/presidents/[id]/PresidentDetailClient.tsx  |   6 +
  apps/web/components/presidents/AgendaProgress.tsx  |  84 ++-
  apps/web/components/presidents/PledgeCard.tsx      |  87 ++-
  apps/web/components/timeline/PolicyTimeline.tsx    | 150 ++++-
  apps/web/lib/data.ts                               | 625 ++++++++++++++++-----
  apps/web/lib/types.ts                              |  18 +
  apps/web/tsconfig.tsbuildinfo                      |   2 +-
  ... and 1 more files

## 2026-03-28 (13:44 UTC) · @Tom Kwon
**Commit:** feat: Voting participation data wired into legislator cards (9208242) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx | 211 +++++++++++++++++++--
  apps/web/tsconfig.tsbuildinfo                      |   2 +-
  2 files changed, 199 insertions(+), 14 deletions(-)

## 2026-03-28 (15:21 UTC) · @Tom Kwon
**Commit:** feat: Context-aware AI audit — stop flagging LPG as corruption (1ac2afd) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 394 +++++++++++------
  apps/web/lib/audit/context.ts          | 779 +++++++++++++++++++++++++++++++++
  apps/web/lib/audit/patterns.ts         |  42 +-
  docs/audit-patterns.md                 |  97 +++-
  4 files changed, 1143 insertions(+), 169 deletions(-)

## 2026-03-28 (15:53 UTC) · @Tom Kwon
**Commit:** fix: News page — add context, summaries, frame analysis to each story (367cf3d) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md             |  15 ++
  apps/web/app/audit/AuditPageClient.tsx | 408 ++++++++++++++++-----------------
  apps/web/app/news/NewsPageClient.tsx   |  77 ++++++-
  apps/web/tsconfig.tsbuildinfo          |   2 +-
  4 files changed, 290 insertions(+), 212 deletions(-)

## 2026-03-28 (15:54 UTC) · @Tom Kwon
**Commit:** style: Restore old audit layout — heatmap, dropdowns, pattern grid (2215b2b) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 11 ++++++++---
  1 file changed, 8 insertions(+), 3 deletions(-)

## 2026-03-28 (15:56 UTC) · @Tom Kwon
**Commit:** fix: audit PatternCategory type error — replace high_value_sole_source with all (209ce51) by Tom Kwon
**Changed:**
  .claude/MEMORY.md                      | 15 +++++++++++++++
  apps/web/.claude/MEMORY.md             |  9 +++++++++
  apps/web/app/audit/AuditPageClient.tsx | 16 ++++++++--------
  apps/web/tsconfig.tsbuildinfo          |  2 +-
  4 files changed, 33 insertions(+), 9 deletions(-)
