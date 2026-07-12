# Project Memory — gukjeong
<!-- Mid-term project memory: one entry per session. Auto-maintained. -->
<!-- Layer 2 (episodic): what changed, was fixed, was decided across sessions. -->

## 2026-04-14 (14:40 UTC) · @Tom Kwon
**Commit:** chore: gitignore large data files (>50MB) that stay local-only (564e48d) by Tom Kwon
**Changed:**
  .gitignore | 6 ++++++
  1 file changed, 6 insertions(+)

## 2026-04-21 (18:40 UTC) · @Tom Kwon
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

## 2026-04-21 (19:00 UTC) · @Tom Kwon
**Commit:** fix: stable content-based finding IDs to prevent URL drift on regeneration (b9e16a4) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 10980 +++++++++++++++---------------
  scripts/generate-audit.py               |    44 +-
  2 files changed, 5530 insertions(+), 5494 deletions(-)

## 2026-04-21 (19:14 UTC) · @Tom Kwon
**Commit:** feat: restore legislator photos + add comprehensive 6-category rankings tab (5275d3f) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx | 268 +++++++++++++++++++--
  1 file changed, 252 insertions(+), 16 deletions(-)

## 2026-04-22 (16:24 UTC) · @Tom Kwon
**Commit:** feat: news page — topic cluster view with multi-perspective comparison (8028fe5) by Tom Kwon
**Changed:**
  apps/web/app/news/NewsPageClient.tsx | 601 ++++++++++++-----------------------
  1 file changed, 202 insertions(+), 399 deletions(-)

## 2026-04-22 (16:59 UTC) · @Tom Kwon
**Commit:** fix: dramatically reduce false positives in audit system (9d0e950) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 351316 +++++++++--------------------
  scripts/generate-audit.py               |    538 +-
  2 files changed, 101381 insertions(+), 250473 deletions(-)

## 2026-04-22 (17:47 UTC) · @Tom Kwon
**Commit:** fix: recalibrate audit thresholds — don't over-suppress real issues (0863369) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 38460 +++++++++++++++++++++++-------
  scripts/generate-audit.py               |    14 +-
  2 files changed, 29702 insertions(+), 8772 deletions(-)

## 2026-04-22 (17:51 UTC) · @Tom Kwon
**Commit:** feat: add 정치자금 지출 tab to ranking page (d7d9cb2) by Tom Kwon
**Changed:**
  apps/web/app/legislators/ranking/page.tsx          | 55 +++++++++++-----
  .../components/legislators/RankingLeaderboard.tsx  | 76 ++++++++++++++++------
  2 files changed, 95 insertions(+), 36 deletions(-)

## 2026-04-22 (17:58 UTC) · @Tom Kwon
**Commit:** fix: add 의원 랭킹 to global nav + demo mode link (57b37f4) by Tom Kwon
**Changed:**
  apps/web/app/layout.tsx                            | 1 +
  apps/web/app/legislators/LegislatorsPageClient.tsx | 8 ++++++++
  2 files changed, 9 insertions(+)

## 2026-04-22 (18:03 UTC) · @Tom Kwon
**Commit:** feat: default legislators page to ranking view (0bae1df) by Tom Kwon
**Changed:**
  apps/web/app/legislators/LegislatorsPageClient.tsx | 170 ++++++++++++++++++++-
  1 file changed, 162 insertions(+), 8 deletions(-)

## 2026-04-22 (19:09 UTC) · @Tom Kwon
**Commit:** feat: audit enrichment API, new audit components, desktop mockups (d3d026c) by Tom Kwon
**Changed:**
  .claude/FACTS.md                              |    3 +-
  .claude/MEMORY.md                             |  147 +-
  apps/web/.claude/MEMORY.md                    |   84 +-
  apps/web/.vercelignore                        |    8 +
  apps/web/app/api/audit/enrich/route.ts        |  131 ++
  apps/web/components/audit/AuditHero.tsx       |  121 ++
  apps/web/components/audit/FindingShareBar.tsx |   73 +
  apps/web/components/audit/RegionSearch.tsx    |  103 ++
  apps/web/components/audit/TopOffenderCard.tsx |   77 +
  apps/web/data/news-rss.json                   | 1852 ++++++++++++-------------
  ... and 12 more files

## 2026-04-23 (07:56 UTC) · @Tom Kwon
**Commit:** fix: make AI 감사 priority tab cards clickable (c0f5fc1) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 81 +++++++++++++++++++++++-----------
  1 file changed, 56 insertions(+), 25 deletions(-)

## 2026-04-23 (08:25 UTC) · @Tom Kwon
**Commit:** feat: add 여수 expo corruption findings + media sources section (de1a748) by Tom Kwon
**Changed:**
  apps/web/app/audit/[id]/AuditDetailClient.tsx |     28 +
  apps/web/public/data/audit-results.json       | 180950 +----------------------
  2 files changed, 29 insertions(+), 180949 deletions(-)

## 2026-04-23 (08:26 UTC) · @Tom Kwon
**Commit:** feat: pattern 22 rebid_same_winner + yeosu media findings (44ed2aa) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx        |      5 +
  apps/web/app/audit/[id]/AuditDetailClient.tsx |      2 +
  apps/web/components/audit/PatternBadge.tsx    |      8 +
  apps/web/public/data/audit-results.json       | 261077 ++++++++++++++++++++++-
  scripts/generate-audit.py                     |    426 +-
  5 files changed, 261508 insertions(+), 10 deletions(-)

## 2026-04-24 (09:34 UTC) · @Tom Kwon
**Commit:** feat: add 잼버리·대장동 media-reported findings (6116a6d) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 2889 +++++++++++++++----------------
  scripts/generate-audit.py               |  124 ++
  2 files changed, 1539 insertions(+), 1474 deletions(-)

## 2026-04-27 (05:48 UTC) · @Tom Kwon
**Commit:** feat: redesign live news mode to match demo — topic cards with 진보/중도/보수 frames (b35cdd5) by Tom Kwon
**Changed:**
  apps/web/app/api/news/topics/route.ts       |   9 +
  apps/web/app/news/NewsPageClient.tsx        | 620 ++------------------
  apps/web/components/news/LiveTopicCard.tsx  | 217 +++++++
  apps/web/components/news/SpectrumColumn.tsx | 115 ++++
  apps/web/lib/local-data.ts                  |  12 +
  apps/web/lib/types.ts                       |  43 ++
  apps/web/public/data/news-topics.json       | 868 ++++++++++++++++++++++++++++
  scripts/generate-news-topics.py             | 340 +++++++++++
  8 files changed, 1666 insertions(+), 558 deletions(-)

## 2026-04-27 (06:24 UTC) · @Tom Kwon
**Commit:** feat: add news_coverage UI + 조달청 false-positive fix + safe numeric helpers (16af522) by Tom Kwon
**Changed:**
  apps/web/app/audit/[id]/AuditDetailClient.tsx |  46 +++-
  apps/web/lib/types.ts                         |   9 +
  scripts/enrich-audit.py                       | 250 +++++++++++++++++-
  scripts/generate-audit.py                     | 365 +++++++++++++++++++++-----
  4 files changed, 583 insertions(+), 87 deletions(-)

## 2026-04-27 (08:05 UTC) · @Tom Kwon
**Commit:** data: update audit-results.json with 176 AI-enriched findings (072832f) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 261018 +----------------------------
  1 file changed, 1 insertion(+), 261017 deletions(-)

## 2026-04-27 (09:00 UTC) · @Tom Kwon
**Commit:** fix: make 최우선 조사기관 cards clickable + fix pattern tab empty results (aec9c56) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx        | 23 +++++++++++------------
  apps/web/components/audit/TopOffenderCard.tsx |  2 +-
  2 files changed, 12 insertions(+), 13 deletions(-)

## 2026-04-27 (09:13 UTC) · @Tom Kwon
**Commit:** fix: rename turbo.json pipeline → tasks for Turbo 2.0 compatibility (da4b787) by Tom Kwon
**Changed:**
  turbo.json | 2 +-
  1 file changed, 1 insertion(+), 1 deletion(-)

## 2026-04-29 (12:37 UTC) · @Tom Kwon
**Commit:** fix: Pattern 6 reason-code filtering now works (96.7% vs 0.02% coverage) (03b747a) by Tom Kwon
**Changed:**
  apps/web/public/data/audit-results.json | 2368222 +++++++++++++---------------
  scripts/fetch-data.py                   |     148 +
  scripts/generate-audit.py               |     138 +-
  3 files changed, 1094761 insertions(+), 1273747 deletions(-)

## 2026-04-29 (13:04 UTC) · @Tom Kwon
**Commit:** feat: news page live mode — Claude AI enrichment + layout matches mockup (f7a97c7) by Tom Kwon
**Changed:**
  apps/web/app/api/news/topics/route.ts | 136 +++++++++++++++++++++++++++++++++-
  apps/web/app/news/NewsPageClient.tsx  |  48 ++++++------
  apps/web/styles/globals.css           |   1 +
  scripts/generate-news-topics.py       |  18 +++--
  4 files changed, 166 insertions(+), 37 deletions(-)

## 2026-04-29 (13:38 UTC) · @Tom Kwon
**Commit:** feat: news AI analysis + accumulation system (5b13588) by Tom Kwon
**Changed:**
  apps/web/data/news-archive.json       |  935 ++++++++++++++++++++++++++
  apps/web/public/data/news-topics.json | 1192 +++++++++++++++++----------------
  scripts/generate-news-topics.py       |  139 +++-
  3 files changed, 1668 insertions(+), 598 deletions(-)

## 2026-05-01 (13:41 UTC) · @Tom Kwon
**Commit:** fix: revert /api/news/topics to force-static — dynamic breaks on Vercel (no fs access) (d9ec507) by Tom Kwon
**Changed:**
  apps/web/app/api/news/topics/route.ts | 136 +---------------------------------
  1 file changed, 3 insertions(+), 133 deletions(-)

## 2026-05-01 (14:10 UTC) · @Tom Kwon
**Commit:** feat: extend ghost/new-company/vendor-concentration patterns to contract-details (e91a55c) by Tom Kwon
**Changed:**
  scripts/fetch-data.py     |  98 ++++++++++++++++++++++++++++++
  scripts/generate-audit.py | 148 +++++++++++++++++++++++++++++++++++++++++++---
  2 files changed, 239 insertions(+), 7 deletions(-)

## 2026-05-01 (14:17 UTC) · @Tom Kwon
**Commit:** feat: wire real bill data to legislator detail page with popup modal (e012390) by Tom Kwon
**Changed:**
  .../legislators/[id]/LegislatorDetailClient.tsx    | 179 ++++++++++++++++++---
  apps/web/app/legislators/[id]/page.tsx             |   3 +-
  apps/web/app/legislators/ranking/page.tsx          |   6 +-
  apps/web/lib/types.ts                              |  20 +++
  apps/web/public/data/legislator-scores.json        |   2 +-
  scripts/generate-legislator-scores.py              |  36 +++++
  6 files changed, 221 insertions(+), 25 deletions(-)

## 2026-05-01 (15:02 UTC) · @Tom Kwon
**Commit:** fix: merge recent_bills into seed-data legislators on detail page (07cbf45) by Tom Kwon
**Changed:**
  apps/web/app/legislators/[id]/page.tsx | 31 +++++++++++++++++++++++--------
  1 file changed, 23 insertions(+), 8 deletions(-)

## 2026-05-01 (15:59 UTC) · @Tom Kwon
**Commit:** feat: wire real 16,914 bills to /bills page from 열린국회 API data (910b0a2) by Tom Kwon
**Changed:**
  apps/web/app/bills/BillsPageClient.tsx   | 25 +++++----
  apps/web/app/bills/page.tsx              | 94 +++++++++++++++++++++++++++++---
  apps/web/public/data/bills-enriched.json |  1 +
  3 files changed, 101 insertions(+), 19 deletions(-)

## 2026-05-11 (13:40 UTC) · @Tom Kwon
**Commit:** fix: add raw legislators.json fallback so detail page never shows not-found (510897d) by Tom Kwon
**Changed:**
  apps/web/app/legislators/[id]/page.tsx | 37 ++++++++++++++++++++++++----------
  1 file changed, 26 insertions(+), 11 deletions(-)

## 2026-07-12 (12:20 UTC) · @Tom Kwon
**Commit:** feat: 화제의 감사 (Popular) — popular news cross-referenced with real audit traces (35b186a) by Tom Kwon
**Changed:**
  apps/web/app/layout.tsx                    |    1 +
  apps/web/app/popular/PopularPageClient.tsx |  307 +++++++++++++++++++++++++++++
  apps/web/app/popular/page.tsx              |   22 +++
  apps/web/data/news-rss.json                | 1350 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------------------------------------
  apps/web/lib/local-data.ts                 |   15 +-
  apps/web/lib/types.ts                      |   73 +++++++
  apps/web/public/data/popular-report.json   |    1 +
  scripts/generate-popular-report.py         |  464 ++++++++++++++++++++++++++++++++++++++++++++
  8 files changed, 1557 insertions(+), 676 deletions(-)
