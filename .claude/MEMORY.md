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
