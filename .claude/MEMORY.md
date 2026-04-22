# Project Memory — gukjeong
<!-- Mid-term project memory: one entry per session. Auto-maintained. -->
<!-- Layer 2 (episodic): what changed, was fixed, was decided across sessions. -->

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

## 2026-03-28 (16:04 UTC) · @Tom Kwon
**Commit:** fix: JSX syntax error in news center articles (2c244b9) by Tom Kwon
**Changed:**
  apps/web/app/news/NewsPageClient.tsx | 6 ++----
  apps/web/tsconfig.tsbuildinfo        | 2 +-
  2 files changed, 3 insertions(+), 5 deletions(-)

## 2026-03-28 (16:05 UTC) · @Tom Kwon
**Commit:** fix: Audit page — add 'all' tab, fix category filter, restore high_value_sole_source (e6d27da) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 15 ++++++++++++---
  1 file changed, 12 insertions(+), 3 deletions(-)

## 2026-03-29 (13:13 UTC) · @Tom Kwon
**Commit:** data: Real bid analysis — 500 construction bids, repeat winners, low competition (000ebf7) by Tom Kwon
**Changed:**
  .claude/FACTS.md                       |   1 +
  .claude/MEMORY.md                      |  13 +
  apps/web/.claude/MEMORY.md             |  13 +
  apps/web/public/data/bid-analysis.json | 459 +++++++++++++++++++++++++++++++++
  apps/web/tsconfig.tsbuildinfo          |   2 +-
  scripts/dispatch-api-subscription.md   | 191 ++++++++++++++
  6 files changed, 678 insertions(+), 1 deletion(-)

## 2026-03-29 (14:04 UTC) · @Tom Kwon
**Commit:** feat: Wire all 8 data.go.kr API services — winning bids, contracts, prices, assets (183c383) by Tom Kwon
**Changed:**
  apps/web/data/g2b-companies.json        | 12508 ++++++
  apps/web/data/g2b-contract-details.json | 65008 +++++++++++++++++++++++++++++
  apps/web/data/g2b-contract-process.json |     7 +
  apps/web/data/g2b-prices.json           | 65084 ++++++++++++++++++++++++++++++
  apps/web/data/g2b-winning-bids.json     | 33008 +++++++++++++++
  apps/web/data/official-assets.json      |  1152 +
  apps/web/data/procurement-stats.json    |    11 +
  apps/web/lib/g2b/client.ts              |    95 +-
  apps/web/lib/local-data.ts              |    56 +
  scripts/fetch-data.py                   |   354 +
  ... and 1 more files

## 2026-03-29 (14:09 UTC) · @Tom Kwon
**Commit:** fix: Audit page — fallback gracefully when static JSON unavailable (46e29bd) by Tom Kwon
**Changed:**
  apps/web/app/audit/AuditPageClient.tsx | 45 ++++++++++++++++++----------------
  1 file changed, 24 insertions(+), 21 deletions(-)

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
