# Project Memory — web
<!-- Mid-term project memory: one entry per session. Auto-maintained. -->
<!-- Layer 2 (episodic): what changed, was fixed, was decided across sessions. -->

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

## 2026-03-28 (15:52 UTC) · @Tom Kwon
**Commit:** fix: News page — add context, summaries, frame analysis to each story (367cf3d) by Tom Kwon
**Changed:**
  apps/web/.claude/MEMORY.md             |  15 ++
  apps/web/app/audit/AuditPageClient.tsx | 408 ++++++++++++++++-----------------
  apps/web/app/news/NewsPageClient.tsx   |  77 ++++++-
  apps/web/tsconfig.tsbuildinfo          |   2 +-
  4 files changed, 290 insertions(+), 212 deletions(-)

## 2026-03-28 (15:56 UTC) · @Tom Kwon
**Commit:** fix: audit PatternCategory type error — replace high_value_sole_source with all (209ce51) by Tom Kwon
**Changed:**
  .claude/MEMORY.md                      | 15 +++++++++++++++
  apps/web/.claude/MEMORY.md             |  9 +++++++++
  apps/web/app/audit/AuditPageClient.tsx | 16 ++++++++--------
  apps/web/tsconfig.tsbuildinfo          |  2 +-
  4 files changed, 33 insertions(+), 9 deletions(-)

## 2026-03-28 (16:04 UTC) · @Tom Kwon
**Commit:** fix: JSX syntax error in news center articles (2c244b9) by Tom Kwon
**Changed:**
  apps/web/app/news/NewsPageClient.tsx | 6 ++----
  apps/web/tsconfig.tsbuildinfo        | 2 +-
  2 files changed, 3 insertions(+), 5 deletions(-)

## 2026-03-29 (12:30 UTC) · @Tom Kwon
**Commit:** fix: Audit page — add 'all' tab, fix category filter, restore high_value_sole_source (e6d27da) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 15 ++++++++++++---
  1 file changed, 12 insertions(+), 3 deletions(-)

## 2026-03-29 (13:45 UTC) · @Tom Kwon
**Commit:** data: Real bid analysis — 500 construction bids, repeat winners, low competition (000ebf7) by Tom Kwon
**Changed:**
  .claude/FACTS.md                       |   1 +
  .claude/MEMORY.md                      |  13 +
  apps/web/.claude/MEMORY.md             |  13 +
  apps/web/public/data/bid-analysis.json | 459 +++++++++++++++++++++++++++++++++
  apps/web/tsconfig.tsbuildinfo          |   2 +-
  scripts/dispatch-api-subscription.md   | 191 ++++++++++++++
  6 files changed, 678 insertions(+), 1 deletion(-)

## 2026-03-29 (14:53 UTC) · @Tom Kwon
**Commit:** fix: Audit page — fallback gracefully when static JSON unavailable (46e29bd) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 45 ++++++++++++++++++----------------
  1 file changed, 24 insertions(+), 21 deletions(-)

## 2026-03-29 (14:56 UTC) · @Tom Kwon
**Commit:** fix: Audit page React error #310 — infinite re-render from useState(!isDemo) (0b4d9f2) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 63 +++++++++++++++++++++++++++++++---
  1 file changed, 58 insertions(+), 5 deletions(-)

## 2026-03-29 (15:00 UTC) · @Tom Kwon
**Commit:** fix: Move all hooks before early returns — React error #310 (aad372a) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 79 ++++++++++++++++------------------
  1 file changed, 36 insertions(+), 43 deletions(-)

## 2026-03-29 (15:40 UTC) · @Tom Kwon
**Commit:** feat: AI 감사 — 8 pattern types, 252 findings from real 나라장터 data (8ba3b6e) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx     |    27 +-
  apps/web/components/audit/PatternBadge.tsx |    18 +-
  apps/web/public/data/audit-results.json    | 11888 +++++++++++++++++++--------
  scripts/generate-audit.py                  |   692 ++
  4 files changed, 8960 insertions(+), 3665 deletions(-)

## 2026-03-29 (16:12 UTC) · @Tom Kwon
**Commit:** feat: Rich audit narratives — demo-level depth for all 252 findings (997d38f) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx  |   65 +
  apps/web/lib/audit/context.ts           |    6 +
  apps/web/public/data/audit-results.json | 5802 +++++++++++++++++++++++++++++--
  scripts/generate-audit.py               |  280 ++
  4 files changed, 5898 insertions(+), 255 deletions(-)

## 2026-03-29 (16:20 UTC) · @Tom Kwon
**Commit:** fix: Rich fields now render — add types to RealFinding, remove 확인 포인트 (8bb055a) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 43 ++++++++++++----------------------
  1 file changed, 15 insertions(+), 28 deletions(-)

## 2026-03-29 (16:42 UTC) · @Tom Kwon
**Commit:** feat: Unified audit UI — live data uses same detail page as demo (1ca9bf3) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx  |   12 +-
  apps/web/app/audit/page.tsx             |   30 +-
  apps/web/lib/data.ts                    |   20 +
  apps/web/public/data/audit-results.json | 6214 +++++++++++++++++++++++++++++--
  scripts/generate-audit.py               |   54 +
  5 files changed, 6003 insertions(+), 327 deletions(-)

## 2026-03-29 (16:49 UTC) · @Tom Kwon
**Commit:** fix: No English in UI, tighter bid rate criteria, Korean labels everywhere (b094a52) by Tom Kwon
**Changed:**
  apps/web/app/audit/[id]/AuditDetailClient.tsx |    33 +-
  apps/web/components/audit/SuspicionCard.tsx   |    17 +-
  apps/web/public/data/audit-results.json       | 20909 ++++++++++--------------
  scripts/generate-audit.py                     |    24 +-
  4 files changed, 9104 insertions(+), 11879 deletions(-)

## 2026-03-29 (16:58 UTC) · @Tom Kwon
**Commit:** fix: Vendor names — corpList index 3 not 2 (was showing '단독' instead of company name) (9a53988) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 792 ++++++++++++++++----------------
  scripts/generate-audit.py               |  16 +-
  2 files changed, 408 insertions(+), 400 deletions(-)

## 2026-03-31 (07:49 UTC) · @Tom Kwon
**Commit:** feat: RichText — numbered lists, bold, bullets for all narrative fields (3e4e41a) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx        |    9 +-
  apps/web/app/audit/[id]/AuditDetailClient.tsx |   17 +-
  apps/web/components/common/RichText.tsx       |  122 +++
  apps/web/public/data/audit-results.json       | 1132 ++++++++++++-------------
  scripts/generate-audit.py                     |   20 +-
  5 files changed, 718 insertions(+), 582 deletions(-)

## 2026-04-10 (18:47 UTC) · @Tom Kwon
**Commit:** fix: wire --font-pretendard CSS variable so Pretendard actually loads (f369e38) by Tom Kwon
**Changed:**
  apps/web/styles/globals.css | 1 +
  1 file changed, 1 insertion(+)

## 2026-04-20 (01:29 UTC) · @Tom Kwon
**Commit:** chore: gitignore large data files (>50MB) that stay local-only (564e48d) by Tom Kwon
**Changed:**
  .gitignore | 6 ++++++
  1 file changed, 6 insertions(+)

## 2026-04-21 (18:51 UTC) · @Tom Kwon
**Commit:** feat: add missing pattern labels + layout system components (e27c418) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx         | 492 ++++++++++++++-----------
  apps/web/app/audit/[id]/AuditDetailClient.tsx  | 116 +++++-
  apps/web/components/audit/PatternBadge.tsx     |   3 +
  apps/web/components/common/FilterSidebar.tsx   |  38 ++
  apps/web/components/layouts/DetailLayout.tsx   |  21 ++
  apps/web/components/layouts/ExplorerLayout.tsx |  43 +++
  apps/web/components/layouts/MagazineLayout.tsx |  23 ++
  apps/web/styles/globals.css                    |  28 ++
  8 files changed, 552 insertions(+), 212 deletions(-)

## 2026-04-22 (18:28 UTC) · @Tom Kwon
**Commit:** feat: default legislators page to ranking view (0bae1df) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx | 170 ++++++++++++++++++++-
  1 file changed, 162 insertions(+), 8 deletions(-)

## 2026-04-22 (19:05 UTC) · @Tom Kwon
**Commit:** feat: serve legislator portraits as 120x160 local thumbnails (bd89efe) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx     |   2 +-
  apps/web/components/legislators/RankingLeaderboard.tsx |   2 +-
  apps/web/public/legislators-thumb/04T3751T.jpg         | Bin 0 -> 3842 bytes
  apps/web/public/legislators-thumb/0698755I.jpg         | Bin 0 -> 4267 bytes
  apps/web/public/legislators-thumb/0R68099X.jpg         | Bin 0 -> 3394 bytes
  apps/web/public/legislators-thumb/1A82234K.jpg         | Bin 0 -> 3656 bytes
  apps/web/public/legislators-thumb/1JI2689F.jpg         | Bin 0 -> 3352 bytes
  apps/web/public/legislators-thumb/1S05899F.jpg         | Bin 0 -> 3160 bytes
  apps/web/public/legislators-thumb/1SR94244.jpg         | Bin 0 -> 3780 bytes
  apps/web/public/legislators-thumb/1WE5693J.jpg         | Bin 0 -> 3015 bytes
  ... and 265 more files
