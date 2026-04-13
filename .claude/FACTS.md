# Project Facts
<!-- MANAGED: gukjeong | updated: 2026-04-09 | layer: episodic -->
<!-- Injected at session start as authoritative ground truth. -->
<!-- Edit freely — hooks auto-maintain this file. -->

## ✓ CONFIRMED (execution-verified — trust fully)
- Python executor is `uv run` (not python3/pip/poetry) [2026-04-01 @Tom Kwon]

## ⚠ GOTCHAS (known failure modes — read before acting)

## 📁 PATHS & ARCHITECTURE (key files, entry points, config)
- Key file: `.claude/PROJECT_CONTEXT.md` [2026-03-25 @Tom Kwon]
- Key file: `.claude/ARCHITECTURE.md` [2026-03-25 @Tom Kwon]
- Key file: `scripts/fetch-data.py` [2026-03-28 @Tom Kwon]
- Key file: `scripts/dispatch-api-subscription.md` [2026-03-28 @Tom Kwon]
- Key file: `scripts/generate-audit.py` [2026-03-29 @Tom Kwon]
- Key file: `.claude/PROJECT_CONTEXT.md` [2026-03-29 @Tom Kwon]
- Key file: `.claude/PROJECT_CONTEXT.md` [2026-03-30 @Tom Kwon]
- Key file: `scripts/procurement-context.md` [2026-03-31 @Tom Kwon]
- Key file: `data/knowledge/government-orgs.json` [2026-03-31 @Tom Kwon]
- Key file: `data/knowledge/org-relationships.json` [2026-03-31 @Tom Kwon]
- Key file: `data/knowledge/procurement-rules.json` [2026-03-31 @Tom Kwon]
- Key file: `data/knowledge/industry-context.json` [2026-03-31 @Tom Kwon]
- Key file: `data/knowledge/reference-systems.json` [2026-03-31 @Tom Kwon]
- Key file: `scripts/knowledge.py` [2026-03-31 @Tom Kwon]
- Key file: `scripts/update-knowledge.py` [2026-03-31 @Tom Kwon]
- Key file: `apps/web/tailwind.config.ts` [2026-04-09]

## → PATTERNS (confirmed working sequences)

## ✗ STALE (superseded or disproven — do not use)

## Recent Changes (2026-04-01 audit)
- Audit findings: 673 (was 252), patterns: 20 (was 11) — added yearend_budget_dump, related_companies, amount_spike, bid_rigging, contract_inflation, systemic_risk, sanctioned_vendor, price_clustering, network_collusion
- Pattern list (full 20): ghost_company, zero_competition, bid_rate_anomaly, new_company_big_win, vendor_concentration, repeated_sole_source, contract_splitting, low_bid_competition, yearend_budget_dump, related_companies, high_value_sole_source, same_winner_repeat, amount_spike, bid_rigging, contract_inflation, cross_pattern, systemic_risk, sanctioned_vendor, price_clustering, network_collusion
- Frontend constants.ts PATTERN_LABELS and PATTERN_ICONS both cover all 20 patterns (synced with generate-audit.py)
- Tracked files: 605 (was 587)
- Knowledge base system added: `data/knowledge/` (5 JSON files), `scripts/knowledge.py`, `scripts/update-knowledge.py`
- Repo size: ~2.2GB (was 321MB)
- Pages: 26 page.tsx files across 17 route directories
- Routers: 13, Services: 8, Scrapers: 14
