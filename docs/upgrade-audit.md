# Component Upgrade Audit — 국정투명

> Reviewed 2026-03-27. Covers frontend pages, chart components, common/feature components, and infrastructure.

---

## 1. Framework & Dependency Upgrades

| Package | Current | Recommended | Impact |
|---------|---------|-------------|--------|
| Next.js | 14.2.0 | **15.x** | React 19 support, Turbopack stable, streaming improvements |
| React | 18.3.0 | **19.x** | Server component improvements, improved DX |
| next-auth | 4.24.0 | **v5** | v4 is deprecated; v5 uses middleware-based auth |
| Tailwind CSS | 3.4.0 | **4.x** | 65-75% smaller CSS bundles, faster builds |
| Node.js engine | 18+ | **20 LTS** | Node 18 approaching EOL |
| @neondatabase/serverless | 1.0.2 | **2.x** | Better connection pooling |
| Meilisearch (Docker) | v1.6 | **v1.9+** | Performance, bug fixes |

---

## 2. Missing Next.js Optimizations

### Font Loading (High Impact on LCP)
- **Current:** External CDN `@import url('...pretendard.css')` — blocks rendering
- **Fix:** Migrate to `next/font/local` for zero layout shift

### Image Optimization
- **Current:** No `next/image` usage — raw `<img>` tags for president portraits, etc.
- **Fix:** Use `next/image` with priority on hero/above-fold images

### Static Generation (ISR/SSG)
- **Current:** All pages render on every request
- **Fix:** Add `revalidate: 60` (or longer) to slow-changing pages like budget, presidents

### OG Image Generation
- **Current:** `/og/route.tsx` is a TODO stub
- **Fix:** Implement with `@vercel/og` or Sharp for dynamic social cards

### Sitemap
- **Current:** Referenced in `robots.ts` but not generated
- **Fix:** Add `next-sitemap` or native `sitemap.ts` route

---

## 3. Missing Middleware & Security

No `middleware.ts` exists. Needed:

- **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Server-side rate limiting** — Currently client-side only; Redis available in docker-compose
- **Auth route protection** — `lib/auth.ts` is a TODO stub
- **Input validation** — Add zod schemas for all API inputs

---

## 4. Chart Components

### Across-the-Board Issues

| Issue | Components Affected | Fix |
|-------|-------------------|-----|
| No animations | All 6 implemented charts | Add `animationDuration` to Recharts; CSS transitions for custom SVG |
| No colorblind-safe palette | All charts use red/green hues | Switch to Viridis/Cividis-inspired palette |
| Missing `useMemo` | SankeyChart, StackedArea, DebtChart, Sparkline | Wrap expensive data transformations |
| No SSR dynamic imports | D3/Recharts charts | Use `dynamic(() => import(...), { ssr: false })` |
| D3 full import | d3 v7.9.0 loaded entirely | Tree-shake to `d3-scale`, `d3-shape`, etc. |

### Per-Component Status

| Component | Library | Responsive | Tooltips | Animations | Empty Data | Status |
|-----------|---------|-----------|----------|-----------|------------|--------|
| SankeyChart | Custom SVG | Yes | **No** | **No** | Yes | Needs tooltips, transitions |
| TreeMap | Recharts | Yes | Yes | **No** | Yes | Good — add animations |
| StackedArea | Recharts | Yes | Yes | **No** | Yes | Good — add animations |
| DebtChart | Recharts | Yes | Yes | **No** | Yes | Hardcoded Y-axis domain [0,60] |
| HeatMap | CSS/Tailwind | Yes | **No** | **No** | Yes | Best mobile support |
| Sparkline | Custom SVG | Yes | **No** | **No** | Yes | Lightweight, add tooltips |
| RadarChart | — | — | — | — | — | **Stub (10 lines)** |
| BubbleChart | — | — | — | — | — | **Stub (10 lines)** |

---

## 5. Accessibility (Systemic)

This is the largest gap across the frontend.

### Critical
- **No ARIA labels** on any chart or data visualization — screen readers see nothing
- **WordsVsActions** (403 LOC) — no `aria-expanded`, no keyboard nav for expand/collapse
- **GlossaryTooltip** — mouse-only (no keyboard support), no `role="tooltip"`
- **Color-only severity indicators** across audit, bills, budget pages need text fallbacks

### High
- **ScoreBar** — missing `role="progressbar"` and `aria-valuenow`
- **PaywallGate** — blurs content with no accessible warning for screen readers
- **All emoji-only buttons** (ShareKakao, CreditBadge, PatternBadge) — missing `aria-label`
- **Select dropdowns** across Budget, Audit, Bills pages — no associated `<label>`
- **SVG portraits** (PresidentPortrait) — no `role="img"` or `aria-label`

### Medium
- **StatusBadge** — add `role="status"`
- **MediaSpectrum** — tooltip is hover-only, needs keyboard accessibility
- **Tab buttons** on Bills page — missing `role="tab"` and `aria-selected`

---

## 6. Page-Level Issues

### All Pages
- **No loading states** — pages assume data is instantly available; need skeleton loaders
- **No error boundaries** — a single chart crash takes down the entire page
- **No list virtualization** — bills, audit flags, legislators render all items (performance risk with real data)

### Home Page (`(home)/page.tsx`)
- 13 data function calls at top level — could waterfall if async
- No lazy loading on feature grid cards
- Missing alt text on images

### Budget Page (`BudgetPageClient.tsx`)
- Hardcoded year options `[2024, 2025, 2026]` — should be dynamic
- Hardcoded total budget `728` on line 292
- Hardcoded international comparison countries
- No print-friendly view or data export

### Audit Page (`AuditPageClient.tsx`)
- Filter state updates trigger full re-renders
- Department list derived from flags on every render (no memo)
- No timeline view of patterns over time

### Bills Page (`BillsPageClient.tsx`)
- Category icon components defined inline in render (should extract)
- Filtered array recalculated every render with multiple conditions
- No full-text search within bills
- No date range filtering

### Bill Detail (`BillDetailClient.tsx`)
- Vote donut chart is purely visual — no text breakdown for accessibility
- No amendment tracking or committee debate notes

---

## 7. Common Component Issues

| Component | LOC | Issue | Fix |
|-----------|-----|-------|-----|
| ShareKakao | 34 | Uses `alert()` instead of toast; Kakao SDK not integrated | Replace with toast; complete SDK |
| GlossaryTooltip | 35 | Tooltip can overflow viewport on mobile | Add viewport-aware positioning |
| PaywallGate | 36 | No accessible warning when content blurred | Add `aria-disabled` or `role="alert"` |
| CreditBadge | 16 | Emoji without semantic label | Add `aria-label="Credit balance"` |
| Scorecard | 130 | Party colors hardcoded inline, SVG ring not labeled | Extract colors to config; add ARIA |

---

## 8. Infrastructure / Docker Compose

| Issue | Fix |
|-------|-----|
| Missing `depends_on` with `condition: service_healthy` | Add health check conditions |
| No resource limits | Add `deploy.resources.limits` (CPU/memory) |
| Redis persistence not enabled | Add `--appendonly yes` |
| No logging configuration | Add `json-file` driver with max-size |

---

## 9. Data Fetching & Performance

- **No data fetching library** — raw `fetch` with no caching, retry, or deduplication
- **Recommendation:** Add SWR or React Query for client-side; use Next.js `cache()` + `revalidate` for server
- **API client** (`lib/api.ts`) has no error handling — throws on non-200 with no retry logic

---

## 10. Priority Roadmap

### P0 — Critical (do first)
1. Upgrade Next.js 14 → 15 + React 19
2. Replace next-auth v4 → v5 (deprecated)
3. Add `middleware.ts` with security headers + rate limiting
4. Migrate Pretendard to `next/font/local`

### P1 — High (do next)
5. Accessibility pass: ARIA labels, keyboard nav, color-blind palette
6. Add `next/image` for all images
7. Implement OG image generation
8. Add ISR/SSG to data pages
9. Loading skeletons + error boundaries
10. Chart animations

### P2 — Medium
11. Tailwind 3 → 4
12. Add SWR/React Query for data fetching
13. Implement RadarChart + BubbleChart stubs
14. List virtualization for large datasets
15. D3 tree-shaking
16. Extract hardcoded colors/constants to shared config

### P3 — Polish
17. Upgrade Node.js to 20 LTS
18. Docker compose improvements
19. Sitemap generation
20. Print-friendly views
