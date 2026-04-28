# Project Memory — gukjeong
<!-- Mid-term project memory: one entry per session. Auto-maintained. -->
<!-- Layer 2 (episodic): what changed, was fixed, was decided across sessions. -->

## 2026-03-29 (15:10 UTC) · @Tom Kwon
**Commit:** fix: Move all hooks before early returns — React error #310 (aad372a) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 79 ++++++++++++++++------------------
  1 file changed, 36 insertions(+), 43 deletions(-)

## 2026-03-29 (15:59 UTC) · @Tom Kwon
**Commit:** feat: AI 감사 — 8 pattern types, 252 findings from real 나라장터 data (8ba3b6e) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx     |    27 +-
  apps/web/components/audit/PatternBadge.tsx |    18 +-
  apps/web/public/data/audit-results.json    | 11888 +++++++++++++++++++--------
  scripts/generate-audit.py                  |   692 ++
  4 files changed, 8960 insertions(+), 3665 deletions(-)

## 2026-03-31 (07:28 UTC) · @Tom Kwon
**Commit:** feat: RichText — numbered lists, bold, bullets for all narrative fields (3e4e41a) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx        |    9 +-
  apps/web/app/audit/[id]/AuditDetailClient.tsx |   17 +-
  apps/web/components/common/RichText.tsx       |  122 +++
  apps/web/public/data/audit-results.json       | 1132 ++++++++++++-------------
  scripts/generate-audit.py                     |   20 +-
  5 files changed, 718 insertions(+), 582 deletions(-)

## 2026-04-01 (docs refresh) · @Tom Kwon
**Commit:** feat: add knowledge base system, sanctions data, and audit UI improvements (0e2fe7a) by Tom Kwon
**Changed:**
  scripts/generate-audit.py                       | 1742 +-
  scripts/knowledge.py                            |  518 +
  scripts/procurement-context.md                  |   89 +
  scripts/update-knowledge.py                     |  244 +
  data/knowledge/*.json                           |    5 new files
  ... and 34 more files (39 total, +4M/-119K lines — includes large data files)

## 2026-04-01 (02:34 UTC) · @Tom Kwon
**Commit:** docs: refresh project documentation to reflect current state (4f928e4) by Tom Kwon
**Changed:**
  .claude/FACTS.md           |  8 ++++++++
  .claude/MEMORY.md          | 10 ++++++++++
  .claude/PROJECT_CONTEXT.md | 12 ++++++------
  CLAUDE.md                  | 12 +++++++-----
  README.md                  |  2 +-
  5 files changed, 32 insertions(+), 12 deletions(-)

## 2026-04-01 (10:19 UTC) · @Tom Kwon
**Commit:** fix: sync frontend pattern labels with 19 backend patterns, refresh data (bc3c6d8) by Tom Kwon
**Changed:**
  apps/web/app/audit/page.tsx             |    4 +-
  apps/web/data/g2b-contract-changes.json |    8 +
  apps/web/data/g2b-contract-process.json |    2 +-
  apps/web/data/g2b-sanctions.json        |    2 +-
  apps/web/data/news-rss.json             | 1738 +++++++++++++++----------------
  apps/web/lib/constants.ts               |   42 +-
  apps/web/public/data/audit-results.json | 1620 ++++++++++++++--------------
  scripts/generate-audit.py               |   29 +-
  8 files changed, 1721 insertions(+), 1724 deletions(-)

## 2026-04-01 (11:21 UTC) · @Tom Kwon
**Commit:** feat: 4 new audit patterns — yearend_budget_dump, amount_spike, contract_inflation, systemic_risk (ac57ab9) by Tom Kwon
**Changed:**
  apps/web/data/g2b-contract-changes.json | 89495 +++++++++++++++++++++++++++++-
  apps/web/public/data/audit-results.json | 71925 ++++++++++++++----------
  scripts/fetch-data.py                   |    18 +-
  scripts/generate-audit.py               |   106 +-
  4 files changed, 132808 insertions(+), 28736 deletions(-)

## 2026-04-01 (11:35 UTC) · @Tom Kwon
**Commit:** chore: move spec docs to docs/, remove stray scripts/.claude/ (4cbfffd) by Tom Kwon
**Changed:**
  spec-CLAUDE.md => docs/spec-CLAUDE.md               | 0
  spec-ORCHESTRATION.md => docs/spec-ORCHESTRATION.md | 0
  spec-architecture.md => docs/spec-architecture.md   | 0
  spec-facts.md => docs/spec-facts.md                 | 0
  4 files changed, 0 insertions(+), 0 deletions(-)

## 2026-04-09 (14:46 UTC) · @Tom Kwon
**Commit:** feat: integrate g2b-bid-rankings data, expand audit to 1430 findings (7ff820d) by Tom Kwon
**Changed:**
  apps/web/data/g2b-bid-rankings.json     | 1223307 ++++++++++++++++++++++++++++
  apps/web/public/data/audit-results.json |  144205 ++--
  scripts/generate-audit.py               |      43 +-
  3 files changed, 1320576 insertions(+), 46979 deletions(-)

## 2026-04-13 (04:38 UTC) · @Tom Kwon
**Commit:** fix: wire --font-pretendard CSS variable so Pretendard actually loads (f369e38) by Tom Kwon
**Changed:**
  apps/web/styles/globals.css | 1 +
  1 file changed, 1 insertion(+)

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
