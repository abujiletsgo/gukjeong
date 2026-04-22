# Plan: Desktop UI/UX for 국정투명

## Task Description
국정투명 currently ships a mobile-first design across 26 pages / 17 routes. The
global chrome in `app/layout.tsx` already has responsive scaffolding (header nav,
footer, bottom-tab bar toggle at `md:` breakpoint), but the page bodies themselves
were designed for narrow viewports and look sparse or broken on desktop.

This plan defines the design system, layout patterns, and a page-by-page migration
roadmap to produce a proper desktop experience — not just a "stretched mobile" —
while preserving the existing Apple Liquid Glass aesthetic and without regressing
the mobile UI.

## Objective
Every page renders a considered, dense, desktop-native layout at ≥1024 px while
continuing to render the current mobile layout at <768 px. The `md` (768–1023 px)
tablet range gets a graceful middle-ground layout. Visual language remains Apple
Liquid Glass (soft shadows, generous whitespace, SF-like typography via Pretendard,
backdrop blur surfaces).

## Problem Statement
- 63 occurrences of `md:/lg:/xl:` across 20 files shows the app knows about
  breakpoints, but they're mostly used for font-size tweaks, not for real layout
  changes.
- `container-page` maxes at `max-w-7xl` (1280 px) — on a 1920 px monitor, content
  is centered in a narrow column with huge empty gutters.
- Data-dense pages (`/audit`, `/budget`, `/legislators`, `/bills`) have single-
  column mobile lists where desktop users expect filter sidebars, multi-column
  grids, and information-dense tables.
- Charts (D3/Recharts in `components/charts/`) are sized for mobile widths and
  don't use the horizontal real estate desktop offers.
- The homepage hero is mobile-scale — loses impact on a widescreen.

## Solution Approach

### Design direction — three options

**Option A — Dashboard-style (Bloomberg / analytics-heavy)**
Multi-panel dashboards with left filter rail, main data area, right contextual
panel. Dense tables, inline sparklines, persistent filter state. Best for power
users and journalists.
- Pros: leverages the data richness (1,711 audit findings, 16k bills, 72k contracts).
- Cons: intimidating for casual citizens; more components to build; doesn't match
  the current editorial/Apple aesthetic.

**Option B — Magazine-style (editorial, Apple.com feel)**
Wide hero sections, 3–4-column card grids, generous whitespace, scroll-driven
storytelling, big typography. Prioritizes discovery over power use.
- Pros: matches existing Liquid Glass aesthetic 1:1; easy to extend mobile
  components (just change grid columns); inviting for first-time visitors.
- Cons: inefficient for power users scanning thousands of findings; a pure card
  grid hides the data density.

**Option C — Hybrid adaptive (RECOMMENDED)**
Different layout archetypes per page type:
- **Landing / content pages** (`/`, `/presidents`, `/about`, `/pricing`, `/compare`)
  → Magazine-style (Option B).
- **Data/explorer pages** (`/audit`, `/budget`, `/legislators`, `/bills`, `/news`)
  → Dashboard-lite: left filter sidebar + main grid/table + optional right rail
  for detail preview. Filter sidebar collapses to top sheet on tablet, hidden on
  mobile (existing bottom-sheet filters).
- **Detail pages** (`/audit/[id]`, `/presidents/[id]`, `/bills/[id]`,
  `/legislators/[id]`) → Wide content column + sticky right-rail metadata card.
- Pros: right tool for each page; maximizes value from the data without
  overwhelming casual users; natural progression from mobile components.
- Cons: more design variety to maintain; requires establishing 3 layout templates.

**Recommendation: Option C.** The platform serves two audiences (citizens and
journalists/researchers), and Option C lets each see what they need without
compromising the other.

### Technical approach

1. **New breakpoints & container widths.** Extend `container-page` with
   `max-w-7xl` (default), plus `container-wide` (`max-w-[1536px]`) for data
   explorers and `container-narrow` (`max-w-3xl`) for detail pages. Add a new
   `lg:` (1024 px) gate for major layout switches.
2. **Layout primitive components.** Add three reusable templates under
   `components/layouts/`:
   - `MagazineLayout.tsx` — hero + multi-column grid
   - `ExplorerLayout.tsx` — left sidebar (filter) + main + optional right rail
   - `DetailLayout.tsx` — main column + sticky right rail
3. **Design tokens.** Extend `styles/globals.css` with desktop spacing scale
   (section padding `py-24` on desktop vs `py-12` on mobile) and typographic
   scale (display/hero sizes only activate at `lg:`).
4. **Chart responsiveness.** Audit `components/charts/*` for hardcoded widths;
   switch to container-query or `ResponsiveContainer` with desktop min-heights.
5. **Mockup-first workflow.** Before touching production components, produce
   HTML mockups in `mockups/` for each layout archetype (3 files), get
   user approval, then migrate pages.
6. **Page migration in waves.** Migrate the highest-traffic pages first
   (`/`, `/audit`, `/budget`), then detail pages, then secondary pages. Each
   migration is an isolated PR-sized chunk.

## Relevant Files

Use these files to complete the task:

- `apps/web/app/layout.tsx` — already has header/footer/bottom-tab responsive
  logic; will add no changes here (chrome is fine).
- `apps/web/styles/globals.css` — contains `container-page`, `.card`,
  `.card-glass` tokens; extend with desktop-specific utilities and layouts.
- `apps/web/tailwind.config.js` — breakpoint config; may add a custom `xl`
  container width.
- `apps/web/app/(home)/page.tsx` — homepage, needs magazine hero + feature grid.
- `apps/web/app/audit/AuditPageClient.tsx` — **flagship page** (1,711 findings);
  needs filter sidebar + virtualized grid. WATCH the React hooks rule noted in
  CLAUDE.md (useMemo/useEffect before conditional returns, React error #310).
- `apps/web/app/audit/[id]/AuditDetailClient.tsx` — detail layout with right rail.
- `apps/web/app/budget/BudgetPageClient.tsx` — budget viz, needs wider chart area.
- `apps/web/app/legislators/LegislatorsPageClient.tsx` — 295 legislators, grid view.
- `apps/web/app/bills/BillsPageClient.tsx` — 16k bills, table view.
- `apps/web/app/news/NewsPageClient.tsx` — news feed, magazine layout.
- `apps/web/app/presidents/page.tsx` + `PresidentCompareClient.tsx` — comparison view.
- `apps/web/app/compare/page.tsx`, `simulator/page.tsx`, `local/page.tsx`,
  `about/page.tsx`, `pricing/page.tsx` — secondary pages.
- `apps/web/components/charts/*` — 8 D3/Recharts components needing responsive audit.
- `apps/web/components/common/*` — shared UI (DataModeToggle, DataModeBanner, etc.)
- `mockups/` — 18 existing HTML mockups; new desktop mockups go here.

### New Files
- `apps/web/components/layouts/MagazineLayout.tsx` — hero + grid template
- `apps/web/components/layouts/ExplorerLayout.tsx` — sidebar + main + rail template
- `apps/web/components/layouts/DetailLayout.tsx` — content + sticky rail template
- `apps/web/components/common/FilterSidebar.tsx` — reusable filter rail
- `apps/web/components/common/DesktopNavMenu.tsx` — enhanced desktop nav (if
  needed beyond current header)
- `mockups/desktop-home.html` — magazine archetype mockup
- `mockups/desktop-audit.html` — explorer archetype mockup
- `mockups/desktop-audit-detail.html` — detail archetype mockup

## Implementation Phases

### Phase 1: Foundation
Design tokens, layout primitives, and mockups. No production page changes yet.
- Establish desktop breakpoint strategy and `container-wide` / `container-narrow`
  utilities in `globals.css`.
- Build 3 HTML mockups (home magazine, audit explorer, audit detail) for user
  approval. User must sign off before Phase 2.
- Build the 3 layout template components as React primitives (empty shells
  matching the mockups).

### Phase 2: Core Implementation
Migrate the three flagship pages (home, audit list, audit detail) to the new
layout primitives. Ship and validate visually before touching secondary pages.
- `/` (home) → `MagazineLayout`
- `/audit` → `ExplorerLayout` with filter sidebar
- `/audit/[id]` → `DetailLayout`
- Audit the charts used on these 3 pages; fix the widest-regression components
  first.

### Phase 3: Integration & Polish
Roll out remaining pages and handle edge cases.
- `/budget`, `/bills`, `/legislators`, `/news` → `ExplorerLayout`
- `/presidents`, `/presidents/[id]`, `/bills/[id]`, `/legislators/[id]` → magazine + detail
- Secondary pages (`/about`, `/pricing`, `/compare`, `/simulator`, `/local`,
  `/search`, `/survey`, `/simulator`) → case-by-case
- Visual QA across 1280/1440/1920 px widths and tablet 768/1024 px
- Update `.claude/ARCHITECTURE.md` and `CLAUDE.md` to reflect the new layout
  system.

## Team Orchestration

- You operate as the team lead and orchestrate the team to execute the plan.
- You're responsible for deploying the right team members with the right context
  to execute the plan.
- IMPORTANT: You NEVER operate directly on the codebase. You use `Task` and
  `Task*` tools to deploy team members.
- Your role is to validate all work is going well and make sure the team is on
  track to complete the plan.
- Communication is paramount. Use Task* Tools to communicate with team members
  and ensure they're on track.

### Team Members

- **Designer**
  - Name: designer-mockups
  - Role: Produce HTML mockups of the 3 layout archetypes (home magazine, audit
    explorer, audit detail) so the user can approve the visual direction before
    production code changes.
  - Agent Type: general-purpose (with Write access; may invoke `design-html` or
    `design-shotgun` skills if variety is wanted)
  - Resume: true

- **Builder — Foundation**
  - Name: builder-foundation
  - Role: Add design tokens to `globals.css` and create the 3 React layout
    primitive components (`MagazineLayout`, `ExplorerLayout`, `DetailLayout`)
    plus `FilterSidebar`. No production page edits.
  - Agent Type: builder (model: sonnet — multi-file)
  - Resume: true

- **Builder — Flagship pages**
  - Name: builder-flagship
  - Role: Migrate `/`, `/audit`, `/audit/[id]` to the new layout primitives.
    CRITICAL: preserve the React hooks rule (all useMemo/useEffect BEFORE any
    conditional return in AuditPageClient — per CLAUDE.md).
  - Agent Type: builder (model: sonnet)
  - Resume: true

- **Builder — Charts audit**
  - Name: builder-charts
  - Role: Audit `components/charts/*` for hardcoded widths; replace with
    responsive container patterns. Can run in parallel with builder-flagship.
  - Agent Type: builder (model: sonnet)
  - Resume: true

- **Builder — Secondary pages**
  - Name: builder-secondary
  - Role: Migrate the remaining data explorer pages (`/budget`, `/bills`,
    `/legislators`, `/news`) and detail pages once the flagship pages are
    approved.
  - Agent Type: builder (model: sonnet)
  - Resume: true

- **Visual QA**
  - Name: visual-qa
  - Role: Boot the dev server, navigate each migrated page at 1280/1440/1920 px
    and at tablet 768/1024 px, screenshot, and report regressions. Uses the
    `browse` or `gstack` skill.
  - Agent Type: general-purpose
  - Resume: true

- **Validator**
  - Name: validator
  - Role: Run typecheck + `npm run build` to confirm no regressions; verify
    mobile layouts are unchanged at <768 px.
  - Agent Type: validator (model: haiku)
  - Resume: false (fresh context for each validation)

## Step by Step Tasks

### 1. Design tokens and breakpoint strategy
- **Task ID**: foundation-tokens
- **Depends On**: none
- **Assigned To**: builder-foundation
- **Agent Type**: builder
- **Parallel**: false
- Extend `apps/web/styles/globals.css` with `container-wide` (max-w-[1536px]),
  `container-narrow` (max-w-3xl), and `lg:` desktop spacing tokens.
- Add a `--breakpoint-desktop` CSS variable at 1024 px for future use.
- Do NOT touch any page files in this task.

### 2. Mockup: Home (magazine archetype)
- **Task ID**: mockup-home
- **Depends On**: none
- **Assigned To**: designer-mockups
- **Agent Type**: general-purpose
- **Parallel**: true (runs alongside mockup-audit and mockup-audit-detail)
- Produce `mockups/desktop-home.html` — standalone HTML file with Pretendard
  font, Liquid Glass styling, showing a full-width hero, feature grid
  (3 or 4 cols), highlight cards, and footer. Target 1440 px viewport.

### 3. Mockup: Audit explorer archetype
- **Task ID**: mockup-audit
- **Depends On**: none
- **Assigned To**: designer-mockups
- **Agent Type**: general-purpose
- **Parallel**: true
- Produce `mockups/desktop-audit.html` — left filter sidebar (280 px), main
  content area with finding cards in 2–3 column grid, summary bar at top.
  Includes at least 12 mock finding cards to show information density.

### 4. Mockup: Audit detail archetype
- **Task ID**: mockup-audit-detail
- **Depends On**: none
- **Assigned To**: designer-mockups
- **Agent Type**: general-purpose
- **Parallel**: true
- Produce `mockups/desktop-audit-detail.html` — wide content column (~720 px)
  with finding narrative, embedded charts, and sticky right rail (~320 px)
  showing metadata, related findings, vendor info.

### 5. User approval gate on mockups
- **Task ID**: approval-mockups
- **Depends On**: mockup-home, mockup-audit, mockup-audit-detail
- **Assigned To**: team lead (YOU)
- **Agent Type**: n/a
- **Parallel**: false
- Present all 3 mockups to the user. Do not proceed to Phase 2 without
  explicit approval. Iterate on mockups if requested.

### 6. Layout primitive components
- **Task ID**: layout-primitives
- **Depends On**: foundation-tokens, approval-mockups
- **Assigned To**: builder-foundation
- **Agent Type**: builder
- **Parallel**: false
- Create `MagazineLayout.tsx`, `ExplorerLayout.tsx`, `DetailLayout.tsx`, and
  `FilterSidebar.tsx` under `apps/web/components/layouts/` and
  `apps/web/components/common/`. Each accepts `children` and relevant slots
  (e.g., `<ExplorerLayout sidebar={<FilterSidebar />}>…`).
- Match the approved mockup HTML/CSS structure.

### 7. Charts responsive audit
- **Task ID**: charts-audit
- **Depends On**: foundation-tokens
- **Assigned To**: builder-charts
- **Agent Type**: builder
- **Parallel**: true (runs alongside task 6)
- Audit each file in `apps/web/components/charts/`. Replace hardcoded widths
  with Recharts `ResponsiveContainer` or similar. Ensure charts render properly
  at both 320 px mobile width and 1200 px desktop width.
- Report list of changed files.

### 8. Migrate homepage to MagazineLayout
- **Task ID**: migrate-home
- **Depends On**: layout-primitives
- **Assigned To**: builder-flagship
- **Agent Type**: builder
- **Parallel**: false
- Rewrite `apps/web/app/(home)/page.tsx` to use `<MagazineLayout>`. Preserve
  all existing content, data fetching, and mobile behavior. Add desktop-specific
  hero sizing and feature grid.

### 9. Migrate /audit to ExplorerLayout
- **Task ID**: migrate-audit
- **Depends On**: layout-primitives, charts-audit
- **Assigned To**: builder-flagship
- **Agent Type**: builder
- **Parallel**: false
- Rewrite `apps/web/app/audit/AuditPageClient.tsx` to use `<ExplorerLayout>`.
  CRITICAL: ALL `useMemo`/`useEffect` hooks MUST be declared before any
  conditional return statement (CLAUDE.md — React error #310 gotcha).
  Filter sidebar content = existing filter controls; main = existing finding
  grid reflowed to 2-column (tablet) / 3-column (desktop).

### 10. Migrate /audit/[id] to DetailLayout
- **Task ID**: migrate-audit-detail
- **Depends On**: layout-primitives
- **Assigned To**: builder-flagship
- **Agent Type**: builder
- **Parallel**: false
- Rewrite `apps/web/app/audit/[id]/AuditDetailClient.tsx` to use `<DetailLayout>`.
  Main column = narrative + charts; right rail = metadata, vendor info,
  related findings.

### 11. Visual QA — flagship pages
- **Task ID**: qa-flagship
- **Depends On**: migrate-home, migrate-audit, migrate-audit-detail
- **Assigned To**: visual-qa
- **Agent Type**: general-purpose
- **Parallel**: false
- Boot `npm run dev:web`, navigate `/`, `/audit`, `/audit/[some-id]` at
  viewport widths 1920, 1440, 1280, 1024, 768, 414, 390, 375 px. Screenshot
  each combination. Report any regressions (especially mobile).

### 12. User approval gate on flagship pages
- **Task ID**: approval-flagship
- **Depends On**: qa-flagship
- **Assigned To**: team lead (YOU)
- **Agent Type**: n/a
- **Parallel**: false
- Share screenshots with user. Iterate if requested. Do not roll out
  secondary pages until flagship is approved.

### 13. Migrate secondary data pages
- **Task ID**: migrate-secondary-data
- **Depends On**: approval-flagship
- **Assigned To**: builder-secondary
- **Agent Type**: builder
- **Parallel**: false
- Migrate `/budget/BudgetPageClient.tsx`, `/bills/BillsPageClient.tsx`,
  `/legislators/LegislatorsPageClient.tsx`, `/news/NewsPageClient.tsx` to
  `<ExplorerLayout>`. One file at a time; keep each commit atomic.

### 14. Migrate detail pages
- **Task ID**: migrate-details
- **Depends On**: approval-flagship
- **Assigned To**: builder-secondary
- **Agent Type**: builder
- **Parallel**: true (alongside task 13)
- Migrate `/presidents/[id]/PresidentDetailClient.tsx`, `/bills/[id]/
  BillDetailClient.tsx`, `/legislators/[id]/LegislatorDetailClient.tsx` to
  `<DetailLayout>`.

### 15. Migrate presidents + magazine pages
- **Task ID**: migrate-magazine
- **Depends On**: approval-flagship
- **Assigned To**: builder-secondary
- **Agent Type**: builder
- **Parallel**: true
- Migrate `/presidents/page.tsx`, `/about/page.tsx`, `/pricing/page.tsx`,
  `/compare/page.tsx` to `<MagazineLayout>`.

### 16. Migrate remaining pages
- **Task ID**: migrate-remaining
- **Depends On**: approval-flagship
- **Assigned To**: builder-secondary
- **Agent Type**: builder
- **Parallel**: true
- Migrate `/simulator`, `/local`, `/local/[region]`, `/search`, `/survey`,
  `/survey/[id]` case-by-case. Some may just need `max-w-` widening without a
  full layout switch.

### 17. Final Visual QA
- **Task ID**: qa-all
- **Depends On**: migrate-secondary-data, migrate-details, migrate-magazine, migrate-remaining
- **Assigned To**: visual-qa
- **Agent Type**: general-purpose
- **Parallel**: false
- Walk every route at desktop (1920, 1440, 1280), tablet (1024, 768), and
  mobile (414, 390, 375). Report regressions.

### 18. Documentation update
- **Task ID**: docs-update
- **Depends On**: qa-all
- **Assigned To**: builder-foundation
- **Agent Type**: builder (model: haiku — mechanical)
- **Parallel**: false
- Update `CLAUDE.md` Key Patterns section with the 3 layout archetypes and
  where to use each. Update `.claude/ARCHITECTURE.md` with the new
  `components/layouts/` directory.

### 19. Final validation
- **Task ID**: validate-all
- **Depends On**: docs-update
- **Assigned To**: validator
- **Agent Type**: validator
- **Parallel**: false
- Run all validation commands (below). Verify acceptance criteria met.

## Acceptance Criteria
- Every route renders a deliberate, non-"stretched mobile" layout at ≥1024 px
  viewport.
- Mobile layout (<768 px) is unchanged — no regressions visible in screenshots.
- `npm run build` succeeds with zero new TypeScript errors.
- No new React hydration warnings in dev server console.
- AuditPageClient still obeys the hooks-before-conditional-return rule
  (React error #310 does not appear).
- 3 HTML mockup files exist in `mockups/` and were explicitly approved by the user.
- 3 new layout components exist under `apps/web/components/layouts/` and are
  re-used (not copy-pasted) across the migrated pages.
- Charts render responsively at both 320 px and 1200 px widths without overflow.
- CLAUDE.md mentions the new layout system.

## Validation Commands
Execute these commands to validate the task is complete:

- `cd apps/web && npm run build` — Next.js production build must succeed
- `cd apps/web && npx tsc --noEmit` — TypeScript must typecheck clean
- `cd apps/web && npm run dev:web &` then navigate to http://localhost:3000 —
  visit /, /audit, /audit/[id], /budget, /bills, /legislators, /news,
  /presidents, /about, /pricing at widths 1920, 1440, 1024, 768, 414 —
  screenshot each and verify layouts
- `git diff --stat apps/web/styles/globals.css` — ensure tokens added
- `ls apps/web/components/layouts/` — must contain MagazineLayout.tsx,
  ExplorerLayout.tsx, DetailLayout.tsx
- `ls mockups/desktop-*.html` — must contain 3 approved mockups

## Notes
- **Do not break mobile.** Every change must be verified at mobile widths too.
  The existing mobile experience is shipping and must be preserved verbatim.
- **AuditPageClient hooks rule.** All `useMemo`/`useEffect` must be declared
  before any conditional return. This is called out in CLAUDE.md and caused
  a production incident (React error #310). Any builder touching AuditPageClient
  must be briefed on this.
- **No new dependencies expected.** The existing stack (Tailwind, Recharts,
  D3, React 18, Next.js 14) can cover this entire plan.
- **Deploy cadence.** After Phase 2 (flagship pages), push to git — Vercel
  auto-deploys from GitHub (per `feedback_vercel_deploy.md`). Do NOT use
  `npx vercel --prod` CLI — it hits the 100 MB upload limit because of the
  `apps/web/data/` JSON files.
- **Mockup style must match existing Liquid Glass.** Reference
  `apps/web/app/layout.tsx` for header/footer glass effect and
  `apps/web/styles/globals.css` for `.card` and `.card-glass` tokens.
- **User approval gates are mandatory** at tasks 5 and 12. The team lead must
  NOT auto-advance past these without explicit user sign-off.
