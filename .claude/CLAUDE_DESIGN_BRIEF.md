# Claude Design Brief — 국정투명 (GukjeongTumyeong)

Paste sections into claude.ai/design as needed. The first block alone is enough to start; everything below is supporting detail to drop in when iterating on a specific page or component.

---

## 1. ONE-PARAGRAPH BRIEF (start here)

Design **국정투명 (GukjeongTumyeong)** — a Korean civic-transparency web platform where citizens see how their government actually operates through public data and AI analysis, not opinions. The site is bilingual-feeling but **entirely Korean UI** in **Pretendard Variable** font. Audience: educated Korean adults 25–55 reading on phones (60%) and desktops (40%). Tone: **editorial newsroom + Apple polish + Bloomberg Terminal density when the user wants it**, never partisan, never preachy. Think **NYT Upshot × Stripe Atlas × FT Visual Storytelling × Apple HIG**. The current site is functional but card-grid generic; the redesign must feel like a **signature publication**, with one **iconic visualization per page**, strong typographic hierarchy in Korean, and ruthless trust signals (data source, last-updated timestamp, "이 숫자는 어디서 왔는가?" provenance). Reject: dashboard chrome, busy gradients, emoji, decorative illustration, generic SaaS gloss.

---

## 2. PRODUCT POSITIONING

- **Name:** 국정투명 (Gukjeong-Tumyeong = "Government Transparency")
- **Tagline:** 숫자로 보는 대한민국 정부 ("The Korean government, by the numbers")
- **Sub-tagline:** 의견이 아닌 데이터. 같은 기준, 모든 정부. ("Data, not opinions. Same standard, every administration.")
- **Mission:** Korea's first place where citizens see government operations with verified numbers — every claim sourced, every comparison apples-to-apples across administrations.
- **The 10 features**, in priority order:
  1. **AI 감사관 (AI Auditor)** — flagship. 673 flagged procurement contracts across 20 anomaly patterns (ghost companies, bid rigging, contract splitting, year-end budget dumps, etc.). Each finding includes an *innocent explanation* counterweight.
  2. **대통령 비교 (Presidents Compare)** — 8 administrations on identical metrics: spending, debt, pledge fulfillment, economic indicators.
  3. **예산 시각화 (Budget)** — 728조 KRW national budget, where it comes from, where it goes (sectors → sub-sectors → programs).
  4. **법안 추적 (Bills)** — 16,914 real bills from 열린국회 API, AI-summarized, vote-tracked.
  5. **국회의원 (Legislators)** — 300 lawmakers tracked: attendance, sponsorship, words-vs-actions consistency, scorecards.
  6. **뉴스 프레임 (News Frames)** — same event reported across the Korean media spectrum (진보 ↔ 보수), AI-extracted framing.
  7. **국제 비교 (Compare)** — Korea vs. OECD on debt, inequality, healthcare, education.
  8. **예산 시뮬레이터 (Simulator)** — drag sliders to reallocate the national budget; see tradeoffs.
  9. **지역 (Local)** — drill into 17 시·도 (regions) with localized fiscal + bills data.
  10. **시민 숙의 (Survey)** — deliberative polls with multi-dimensional results.

- **Trust positioning:** every screen must answer "where does this number come from?" The data sources are **나라장터 (G2B procurement), 한국은행 ECOS (economy), 열린국회정보 (assembly), 공공데이터포털 (data.go.kr), 빅카인즈 (news), 기획재정부 (treasury)**. AI analysis is always **labeled as AI** and provides an "innocent explanation" frame to avoid defamation.

---

## 3. WHAT'S WRONG WITH THE CURRENT DESIGN (fix these)

The site today uses an Apple-HIG-clean palette but suffers from:

1. **Card-grid sameness.** Every feature on the home is a rounded white card with a colored pill, icon, paragraph, mini-stat. Six in a row. No hierarchy — everything reads as equal-weight.
2. **Numbers don't breathe.** Hero stats (728조, 1175조, 8명, 300명) are jammed into a 6-column strip 30px tall. The most important numbers on the site should be **the size of a magazine cover headline.**
3. **No signature visualization.** The AI Auditor's 673 findings are presented as a list of cards; there's no single chart that becomes the iconic image of the platform. Every great data publication has a hero viz (FT's coronavirus tracker, NYT's election needle, Bloomberg Billionaires Index). 국정투명 needs one.
4. **Korean typography is default.** Pretendard is loaded but used at Tailwind defaults — same line-height as English. Korean characters need **150–170% line-height** and tighter letter-spacing for body, looser for headlines.
5. **No editorial moments.** Every page is a dashboard, not an article. The reader never gets a **lede → nut graf → evidence → "what this means"** arc. Civic data needs storytelling.
6. **Color is functional, not distinctive.** Pure Apple system colors (#007AFF, #34C759, #FF3B30) make it indistinguishable from a hundred SaaS dashboards. Needs a **proprietary accent** that feels Korean and journalistic.
7. **Mobile is a copy of desktop.** Same cards stacked. Bottom tab bar is fine but the *content* never reflows for mobile-first reading.
8. **Trust signals are buried.** "데이터 출처" lives in the footer. It should be **inline, next to every number**, with a hover/tap revealing "한국은행 ECOS, 2025년 4분기, 최종 업데이트 2026-04-15".
9. **Density toggle is missing.** Power users want a Bloomberg view; casual readers want NYT view. Same data, two density modes.
10. **No motion language.** Scroll, hover, page transitions all use defaults. Premium publications use scroll-driven reveals, number tickers, chart drawing animations as **information** (not decoration).

---

## 4. DESIGN DIRECTION (the "better" version)

**Macro aesthetic:** Editorial publication meets civic OS.
- **Reference moodboard:** NYT Upshot · The Pudding · FT Visual Stories · The Economist data charts · Pitch.com hero pages · Linear changelog · Stripe Press · Are.na · Apple Newsroom · Bloomberg Terminal (for dense views) · Pentagram identity systems.
- **NOT:** generic SaaS, gradient-heavy fintech, dashboard chrome (Power BI / Tableau public), Korean government portal aesthetic (color-clashing, 90s-banner-laden).

**Tone:** *Calm authority.* Like an institutional report you actually want to read. White space is a feature. The page should feel like it was edited, not assembled.

**One iconic visualization** — propose this in your designs:
- A **Korea map** rendered as 17 시·도 shapes, each filled with its AI 감사 suspicion score, animated to pulse when a high-severity flag lands. Becomes the platform's "spinning globe" — the recognizable image people screenshot.

**Distinctive accent system** (Apple defaults are placeholders):
- Primary: a deep **Korean navy** `#0A2540` or `#0F2A47` (think Korean traditional 청색)
- Accent: a vivid **persimmon orange** `#E85D2C` (한국 단풍 / persimmon) — used sparingly for the **AI 감사 severity** signal and key CTAs
- Secondary accent: a quiet **sage** `#7A8A6F` for "verified / fact" badges
- Surfaces: warm off-white `#FAFAF7` (paper feel), not cold Apple gray
- Ink: `#0B0F19` near-black for body text (warmer than #000)
- Severity scale (audit): #FEF3E8 → #F4B886 → #E85D2C → #B33A18 → #6F1F0B
- Spectrum scale (news): #1E40AF (진보) → #6B7280 (중도) → #B91C1C (보수), keep diverging diverging

**Typography:**
- Pretendard Variable, weights 300/400/500/700/900
- Display (h1): 64–96px, weight 900, letter-spacing −2%, line-height 1.05
- Headline (h2): 36–48px, weight 700, letter-spacing −1%, line-height 1.15
- Subhead (h3): 22–26px, weight 600, line-height 1.3
- Body: 16–18px, weight 400, line-height 1.7 (Korean needs this)
- Caption / meta: 12–13px, weight 500, letter-spacing +2%, uppercase Latin / `tracking-wide`
- Numerics: **tabular-nums everywhere**, monospaced feel — IBM Plex Mono or JetBrains Mono for code-like data tables; for huge hero numbers use Pretendard but force `font-feature-settings: "tnum"`.

**Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 120 / 200. Use 120 and 200 generously on landing.

**Radius:** 8 / 12 / 16 (cards), 999 (pills). No 24+ — feels childish.

**Shadows:** almost none. Use **hairlines** (`0.5px solid rgba(11,15,25,0.08)`) instead. Where needed, single soft shadow `0 8px 24px rgba(11,15,25,0.06)`.

**Motion:**
- Scroll-triggered number count-ups for hero stats
- Charts draw on enter (left-to-right path animation, 600ms ease-out)
- Page transitions: 200ms fade + 8px y-translate (no slides, no parallax)
- Hover: lift cards 2px max, no scaling > 1.02
- Reduced-motion: respected, all the above disabled

**Density toggle (global control):**
- `편안하게` (comfortable / NYT mode) — default
- `밀집` (dense / Bloomberg mode) — tables get tighter rows, charts get tick marks, sparklines appear inline

**Dark mode required.** Treat as first-class, not afterthought. Newsroom-dark, not Discord-dark: backgrounds `#0B0F19`, surfaces `#141926`, text `#EDECE3` (warm).

---

## 5. INFORMATION ARCHITECTURE

**Top-level routes (8 nav slots):**
```
/                       — Home (editorial landing)
/presidents             — Compare 8 administrations
/budget                 — 728조 national budget viz
/bills                  — 16,914 bills, AI-summarized
/legislators            — 300 lawmakers tracked
/legislators/ranking    — Leaderboard
/audit                  — AI Auditor (flagship)
/news                   — Frame comparison
```
**Secondary:**
```
/compare                — Korea vs OECD
/simulator              — Drag-sliders budget remix
/local                  — 17 regions
/local/[region]
/survey                 — Deliberative polls
/search                 — Universal
/about, /pricing
```
**Detail routes:**
```
/presidents/[id]        — Single administration deep-dive
/bills/[id]             — Single bill with AI summary, votes, impact
/legislators/[id]       — Lawmaker profile with scorecard
/audit/[id]             — Single flagged contract with AI analysis
/budget/[sector]        — Sector drill (e.g. /budget/health)
/budget/[sector]/[sub]  — Sub-sector drill
/news/live              — Live news ticker
/survey/[id]            — Single deliberative poll
```

**Global chrome (always present):**
- Sticky header (56–64px) with logo, 7 nav items, search affordance, density toggle, dark mode toggle, account
- Mobile: same logo + hamburger → full-screen sheet nav
- Persistent bottom tab bar (mobile only, 5 slots: 홈 / 대통령 / 예산 / 감사 / 뉴스)
- Footer with data sources, methodology link, disclaimer

---

## 6. PAGE-BY-PAGE DESIGN BRIEFS

### 6.1 `/` — Home (editorial landing)

**Goal:** convince a first-time visitor in 6 seconds that this is *the* place to understand Korean government, then surface the 4 things worth doing today.

**Sections, top to bottom:**

1. **HERO** — full-viewport. Left 60%: oversized display headline `숫자로 보는<br/>대한민국 정부` (96px), tagline below, two CTAs. Right 40%: live-feeling visualization — animated stacked area of 정부지출 1997–2026, with a subtle pulsing dot on the latest data point. Top-right of hero: "최근 업데이트 2026-05-08 · 데이터 출처 6곳" small caption.

2. **NUMBERS LEDE** — full-bleed band, off-white. Four monumentally large stats in 4 columns, each 200px tall:
   - `728조` 2026 정부 지출
   - `1,175조` 국가채무 (with delta arrow vs prior year)
   - `673건` AI 감지 의심 패턴 (clickable, persimmon color)
   - `16,914건` 추적 중인 법안
   Each stat has a hairline sparkline underneath and a tiny `출처: 기획재정부 / 나라장터 / 열린국회` caption.

3. **TODAY'S ANOMALIES (AI 감사 lede)** — three editorial-style cards, but tall and image-heavy. Each is a real flagged contract with:
   - Persimmon severity dot
   - 패턴 type as kicker `유령업체`
   - Headline (the contract title, max 2 lines)
   - 1-paragraph AI 요약
   - 3 inline stats (계약금액, 부처, 의심점수)
   - "결백 가능성" muted counter-explanation
   - 자세히 보기 → /audit/[id]
   Below: `673건 전체 보기 →`

4. **ADMINISTRATIONS STRIP** — 8 portraits in a horizontal scrolling rail (desktop: visible as static row). Each portrait has name, dates, party color hairline. Click → /presidents/[id]. Heading: `같은 기준으로 비교한 역대 8명의 대통령`.

5. **BUDGET LIVE SANKEY** (the signature viz) — half-page interactive Sankey: 수입 → 분야 → 프로그램. Default state shows 2026 totals. Hover a band to highlight the flow. Below: small toggle `2024 / 2025 / 2026`.

6. **NEWS SPECTRUM** — one selected news event, framed by 6 outlets across the spectrum, shown as a horizontal "scrolling stage" with each outlet's frame as a card positioned on the spectrum axis.

7. **METHOD & TRUST** — short typographic section. `우리가 어떻게 작업하는가` — three bullets, each linking to /about. Reinforces the editorial trust.

8. **FOOTER** — 4-column. Data sources logos at top. Disclaimer in 11px gray.

**What NOT to put on home:** generic feature cards, testimonials, "trusted by" logo strips (not appropriate), CTAs to sign up.

### 6.2 `/audit` — AI 감사관 (flagship)

**Goal:** make the user feel they're looking at *the* civic-tech AI audit, with the visceral weight of 673 real findings, without it feeling accusatory.

**Layout: explorer (sidebar + main).**

- **Sidebar (280px, sticky):** filter panel
  - 검색 (search free-text)
  - 패턴 종류 (20 chips: 유령업체, 경쟁부재, 입찰담합, 계약쪼개기, 연말예산소진, 단가과대, 1인견적반복, 신생업체대형낙찰, 벤더집중, 관련사거래, 고액수의계약, 동일낙찰자반복, 금액급증, 가격클러스터링, 네트워크담합, 제재업체, 시스템적위험, 교차패턴, 저가경쟁, 계약과대)
  - 심각도 (HIGH / MEDIUM / LOW with counts)
  - 부처 (multi-select)
  - 계약금액 range
  - 기간 range
  - Sort: 의심점수 ↓ / 금액 ↓ / 최근

- **Main area:**
  1. **Page hero:** big number `673` with subtitle `AI가 자동 탐지한 의심 계약 패턴`. Right side: 4 KPI mini-stats (총 패턴, 높은 심각도, 모니터링 부처, 평균 점수).
  2. **Korea map of suspicion** (signature viz): 17 시·도 SVG, fill = max suspicion score, click → filter region. Tooltip on hover.
  3. **Department heatmap** (or treemap): 50 부처 as rectangles sized by contract volume, colored by suspicion. Replaces current squat grid.
  4. **Pattern frequency bar chart**: horizontal bars, 20 patterns, with the persimmon palette. Click bar → filter.
  5. **Findings feed:** card list, infinite scroll. Each card =
     - Persimmon severity dot (animated subtle pulse on HIGH)
     - Pattern kicker + 부처
     - Contract title (link to /audit/[id])
     - 계약금액 large tabular-nums, 낙찰업체 underneath
     - AI 요약 (2 lines, truncated)
     - "결백 가능성:" muted line — the innocent-explanation counter
     - Share button + permalink
  6. **Methodology footer** — link to 방법론 page explaining each of 20 patterns and false-positive rate.

**Dark mode here is crucial** — this page should feel like a Bloomberg terminal at night.

### 6.3 `/audit/[id]` — Single Finding Detail

Two-column detail layout (1fr + 320px right rail).

- **Lede:** breadcrumb `AI 감사 / 유령업체`. H1: contract title. Subtitle: 부처 · 연도 · 계약금액.
- **AI 분석 block:** large quoted box, persimmon left-border. The full Claude-generated analysis, ~200 words. Footer: "이 분석은 AI가 생성했습니다 · 모델: Claude Sonnet 4.6 · 생성일: ..."
- **결백 가능성 block:** equal-weight box, sage border. The counter-explanation.
- **Pattern evidence:** structured sub-sections per detected pattern with raw data tables (Bloomberg-dense mode here is great).
- **Right rail (sticky):**
  - 의심 점수 큰 숫자 + ring chart
  - 7 facts: 계약일, 계약금액, 낙찰업체, 사업자번호, 발주처, 입찰방식, 경쟁업체수
  - 공유 (Kakao / Twitter / 링크 복사)
  - 비슷한 사례 (related findings list)
- **Bottom:** raw nara-jangteo source link with `원본 데이터 보기 (data.go.kr)` CTA.

### 6.4 `/presidents` — Compare 8 Administrations

**Layout:** magazine.

1. **Hero:** 8 presidential portraits in a horizontal "filmstrip" with party color hairline below each. Inline timeline scrubber at bottom: 1948 ←→ 2026.
2. **Compare-bar:** persistent at top — select up to 3 presidents to compare. Selected ones get pinned chips.
3. **Comparison panels** (one per metric, full-width with full-bleed chart):
   - 정부지출 (stacked area, 1948–2026, lines for each admin)
   - 국가채무 (line chart, % of GDP)
   - 경제성장률 (bar chart)
   - 공약 이행률 (radar)
   - 부동산 (median line + inflation overlay)
   - 인플레이션 (line)
   - 실업률 (line)
   Each chart: editorial caption beneath, sourced.
4. **레포트 카드:** for each compared admin, a radar chart "성적표" with 6 dimensions.
5. **Words vs Actions:** for each admin, headline pledges vs. measured outcomes (NYT-style scorecard table).

### 6.5 `/presidents/[id]` — Single Administration

Detail layout. Left content, right rail (sticky bio panel).

- **Hero:** portrait, name, party color band, term dates, mandate stat.
- **타임라인:** vertical scroll-anchored timeline of major events, policy actions, scandals — each as an entry with date, headline, source link.
- **공약 흐름 (Pledge Flow):** Sankey from 공약 → 추진 → 이행/미이행 — each band labeled.
- **Before/After cards:** key metrics, side-by-side state when entered office vs left.
- **Budget waterfall:** how spending changed year over year.
- **Right rail:** quick facts (출생, 정당, 학력, 직전 경력), share, 비교에 추가.

### 6.6 `/budget` — 728조 Budget Viz

This page is the **signature data-viz page**.

1. **Hero:** "728조 원이 어디로 가는가?" headline. Tabs for year: 2024 / 2025 / 2026.
2. **The Sankey** (full-width, 600px tall): 수입 → 11 분야 → top programs. Hover band = highlight. Click 분야 = drill to `/budget/[sector]`.
3. **TreeMap** (alternate view, toggle): 11 분야 sized by spend, colored by YoY change.
4. **Stacked area** (1997–2026 trend): toggle between absolute 조 and % of GDP.
5. **Inequality block:** spending per capita by 시·도 (small-multiples map row).
6. **Year-over-year movers:** top 10 programs that grew the most + top 10 that shrunk.
7. **CTA strip:** `예산을 직접 재배분해 보기 → /simulator`.

### 6.7 `/budget/[sector]` and `/budget/[sector]/[sub]` — Sector Drill

Repeat the same Sankey/TreeMap pattern at sector level. Breadcrumb shows path. Right rail: methodology + data source.

### 6.8 `/bills` — Bills List

**Layout:** explorer (sidebar + main).

- **Sidebar:** 상태 (가결/계류/폐기), 회기, 위원회, 발의자, 카테고리, 키워드 search.
- **Main:**
  - Hero stats: 전체 16,914 · 가결 N · 계류 N · 폐기 N (horizontal bar visualizing proportions)
  - List of bill cards: status pill (sage/orange/red), bill title, 발의일, 발의자, 위원회, AI 한줄 요약, 영향 추정 (가구당 ₩XXX or 영향 인구 N명)
- Dense mode flips to a table with sortable columns.

### 6.9 `/bills/[id]` — Single Bill

- Headline (the bill's official title)
- Status banner (가결/계류 colored)
- AI 요약 box (200 words, Claude generated)
- 시민 영향 (AI-extracted who's affected, in plain Korean)
- 투표 결과 (party-grouped bars)
- 일정 타임라인 (proposal → committee → vote)
- Right rail: 발의자 cards (linked to /legislators/[id]), 위원회, 관련 법안, 공유

### 6.10 `/legislators` — Browse 300 Lawmakers

**Layout:** explorer.

- Sidebar filters: 정당, 지역, 위원회, 선수 (term count), 성별, 연령대.
- Main:
  - Hero stats: 전체 300명, 평균 출석률, 평균 발의건수.
  - Grid of lawmaker cards: photo (40×40), name, 정당 hairline, 지역구, 4 mini-bars (출석, 발의, 발언, 일치도).
  - Toggle: 격자 / 표 (table dense mode).

### 6.11 `/legislators/[id]` — Single Lawmaker

- Hero: large photo, name, 정당 color, 지역구, 선수, brief bio
- **Scorecard radar:** 5 axes (출석률, 발의활동, 본회의발언, 위원회참여, 말과행동일치도) — large radar visualization
- **출석 캘린더:** GitHub-style heatmap of session attendance
- **발의 법안 list:** linked to /bills/[id]
- **Words vs Actions:** key public statements with timestamps vs. how they voted on related bills — scored
- **투표 일치도:** party-line voting %
- Right rail: 정당, 지역구, 위원회, 임기, 학력, 전직, share

### 6.12 `/legislators/ranking` — Leaderboard

- Hero: tab strip — 종합 / 출석 / 발의 / 발언 / 일치도
- Top 3 podium (gold/silver/bronze visual)
- Table of 300 ranked, columns: 순위, 사진+이름, 정당, 점수, mini-bars per dimension
- Filters: 정당, 위원회

### 6.13 `/news` — Frame Comparison

**Layout:** magazine.

1. **Hero:** today's biggest news event. Headline. Date. Article count across outlets.
2. **Media Spectrum strip:** horizontal axis 진보 ↔ 보수. Outlets plotted as dots. Click an outlet → see its frame.
3. **Frame comparison grid:** 6 columns (one per major outlet). Each column shows that outlet's headline + 2-line AI-extracted frame for the event. Outlets across spectrum so reader sees the same story refracted.
4. **Below:** cluster list — 12 other major events from last 7 days. Each = clickable, opens same comparison view.

### 6.14 `/news/live` — Live News Ticker

- Sticky top: filter chips (분야, 매체).
- Two-column feed: outlet name + headline + timestamp on left, AI sentiment / frame tag on right.
- Real-time feel: subtle pulse on newest items.

### 6.15 `/compare` — Korea vs OECD

- Hero: "OECD 38개국 중 한국의 자리" with one signature scatterplot (e.g., GDP/capita × 행복지수, Korea highlighted).
- Tabs for dimension: 경제 / 불평등 / 의료 / 교육 / 환경 / 노동
- Per-tab: 1 hero chart + 3 supporting + plain-language interpretation in Korean.

### 6.16 `/simulator` — Budget Re-Allocation

- Left 60%: 11 분야 sliders. Each slider 0–N조. Constraint: total locked at 728조 (re-distribute, can't add).
- Right 40%: live Sankey updating as you drag. Below Sankey: "당신의 선택이 의미하는 것" — AI commentary updating in real-time on tradeoffs (e.g., "교육 +10조 / 국방 −10조 → 군현역 N명 감소, 학생 1인당 +₩X").
- Bottom: 공유 your budget (URL state).

### 6.17 `/local/[region]` — Regional View

- Hero: region name + map highlight + key stats (인구, GRDP, 예산).
- Repeating mini-versions of the main features scoped to region.

### 6.18 `/survey/[id]` — Deliberative Poll

- Question card (large headline).
- 5-stage flow: 본인 입장 → 정보 학습 (3 sources from spectrum) → 토론 시뮬레이션 → 재투표 → 결과
- Result: multi-dimensional radar showing how opinion shifted across N dimensions.

---

## 7. COMPONENT LIBRARY (the design system)

Design these reusable components and ensure each appears in at least one page mockup:

**Navigation & layout**
- `Header` (sticky, hairline border, density/dark toggles)
- `MobileSheetNav` (full-screen on hamburger)
- `BottomTabBar` (mobile only, 5 slots)
- `Breadcrumb`
- `Footer` (4-col)
- `Sidebar` (sticky, collapsible on mobile)
- `RightRail` (sticky desktop, accordion mobile)

**Data primitives**
- `StatBig` (200px hero number, with optional sparkline + caption + source)
- `StatMedium` (compact KPI for cards)
- `Sparkline` (inline, 280×36)
- `ProgressBar` (segmented for status: 가결/계류/폐기)
- `Pill` (kicker tag, persimmon / sage / navy / muted)
- `SourceTag` ("출처: 기획재정부" with hover popover showing date + URL)
- `LastUpdated` ("2026-05-08 업데이트" with relative time)
- `TabularNumber` (CSS-only wrapper enforcing tnum + min-width)
- `DeltaArrow` (+12% / −3% with color)

**Cards**
- `FindingCard` (audit) — severity dot, kicker, headline, AI summary, innocent explanation, share
- `BillCard` — status pill, title, sponsor, summary, impact
- `LegislatorCard` — photo, name, party, mini-bars
- `PresidentCard` (compact, portrait + name + party + dates)
- `NewsFrameCard` — outlet logo, headline, AI frame, spectrum position
- `MetricCompareCard` (NYT-scorecard style two-state)

**Charts** (build once, reuse — use Recharts/D3 idioms):
- `Sankey`
- `TreeMap`
- `StackedArea`
- `LineWithBand` (line + confidence interval)
- `RadarChart`
- `BubbleScatter`
- `HeatMap` (department × pattern)
- `KoreaMap17` (the signature)
- `GitHubHeatmap` (attendance calendar)
- `BarHorizontal`

**Filters**
- `FilterChip` (persimmon when active)
- `SearchInput` (with universal "/" shortcut)
- `RangeSlider`
- `SortToggle`
- `DensityToggle` (편안/밀집)
- `DateRangePicker`

**Status & feedback**
- `SeverityDot` (xs/sm/md, color + optional pulse)
- `SeverityBadge` (HIGH/MED/LOW with count)
- `StatusBadge` (가결/계류/폐기/취하)
- `EmptyState` (illustration-free, copy-led)
- `Skeleton` (matched to final layout exactly)
- `ErrorBlock` (calm, with retry)

**Trust**
- `AISummaryBlock` (left border persimmon, AI label + model + date)
- `InnocentExplanationBlock` (left border sage, "결백 가능성")
- `MethodologyLink` (always present near AI output)
- `DataProvenancePopover` (hover on any number)

**Interaction**
- `ShareSheet` (Kakao / Twitter / link / 이미지 저장)
- `PaywallGate` (used for /pro features — minimal, copy-driven)
- `CTAStripe` (rare, full-bleed, sage or navy)

**Mobile-first variants**
- Every card has a phone variant (single column, larger tap targets, swipe affordances on stacks)

---

## 8. INTERACTION PRINCIPLES

1. **Every number is a source.** Hover/tap any number reveals: source + date + URL. Touch-friendly popover, not tooltip.
2. **Every AI output is labeled.** AI summaries always have a kicker `AI 분석` and a footer with model name + generation date.
3. **No mystery actions.** No swipe-to-reveal hidden buttons. Affordances are visible.
4. **Stateful URLs.** Filters, sort, density, dark mode all live in URL params so any view is shareable.
5. **Scroll = read, click = drill.** No autoplay video. No autoplaying chart cycling.
6. **Keyboard:** `/` opens search, `g h / g b / g a` jumps to home/budget/audit (gh-style), `?` shows shortcuts.
7. **Accessibility:** WCAG AA contrast minimum (4.5:1 body, 3:1 large). All charts have a table fallback. Color is never the only signal — severity always has both color and a textual label.

---

## 9. CONTENT TONE (the copy)

- Headlines are **declarative**, never clickbait. `이 부처에서 23건의 의심 패턴이 탐지되었습니다.` not `놀라운 발견!`
- Numbers come first. Adjectives come last, if at all.
- Avoid political language. `정부 지출 증가` is fine. `정부의 무책임한 지출` is not.
- When AI is uncertain, say so. `AI 신뢰도: 중`, `허위양성 가능성 있음`.
- Korean tone: respectful but not stiff (`-습니다` for body, `-다` for tight chart labels, no `~요`).

---

## 10. WHAT TO DELIVER (the mockup list)

When you generate designs, please cover at minimum:

**Phase 1 — identity & home (priority):**
1. Design system overview page (typography scale, color palette, components)
2. `/` Home — desktop + mobile
3. `/audit` — desktop + mobile (the flagship)
4. `/audit/[id]` — single finding detail
5. Dark mode variant of `/audit`

**Phase 2 — key pages:**
6. `/presidents` compare view
7. `/presidents/[id]` single administration
8. `/budget` with Sankey hero
9. `/bills` list + `/bills/[id]` detail
10. `/legislators/[id]` profile with scorecard radar

**Phase 3 — secondary:**
11. `/news` frame comparison
12. `/legislators/ranking` leaderboard
13. `/compare` vs OECD
14. `/simulator` budget remix
15. Mobile bottom tab + sheet nav states

**Always include:** the signature Korea-map viz, at least one Sankey, at least one radar, the persimmon/navy/sage palette, and Pretendard typography.

---

## 11. WHAT TO AVOID

- Stock illustrations of people, hands, lightbulbs, charts-as-decoration
- Emoji in UI
- Gradient buttons (only the hero can have a subtle gradient background)
- Carousel hero
- Modal popovers for primary content
- Generic Material Design / Bootstrap-feel components
- Pure black `#000` — use `#0B0F19`
- Apple system blue `#007AFF` as primary (it's the current site, we're replacing it)
- Rounded corners > 16px on cards
- Drop shadows on everything
- Animated illustrations
- "Trusted by" logo strips (we're not B2B)
- Sign-up walls on the home page

---

## 12. SUCCESS CRITERIA

The redesign succeeds if:
1. A first-time visitor on mobile understands "what is this site" in **5 seconds** without scrolling.
2. The AI 감사 page feels like the iconic feature — screenshot-worthy, share-worthy.
3. Korean text is comfortable to read for 10+ minutes (line-height, font-size, contrast).
4. Every number on screen can be traced to its source in one tap.
5. The design works as well in dark mode as light.
6. A power user can switch to dense mode and feel like they're using a research tool.
7. The site is **immediately recognizable** as 국정투명 — proprietary palette, signature Korea-map viz, distinctive typography rhythm.
8. No screen looks like a generic SaaS dashboard.
