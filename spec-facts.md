# facts.md — Verified Data & Constants

## Korean Government Data APIs

### data.go.kr (공공데이터포털) — Single API key covers all below
- Budget by Sector: `기획재정부_분야별 예산현황`
- Budget by Department: `기획재정부_부처별 예산현황`
- Budget Detail: `기획재정부_세출 세부사업 예산편성`
- National Accounts: `기획재정부_나라살림 예산개요`
- Contract Info: `조달청_나라장터 계약정보서비스` — covers 물품/외자/공사/용역
- Bid Info: `조달청_나라장터 입찰공고정보서비스`
- Contract Process: `조달청_나라장터 계약과정통합공개서비스`
- Bills: `국회사무처_의안정보 통합 API`
- Legislators: `국회사무처_국회의원 정보 통합 API`
- Historical Legislators: `국회사무처_역대 국회의원 현황`
- News Metadata: `한국언론진흥재단_뉴스빅데이터_메타데이터`
- Public Institutions: ALIO 공공기관 경영정보
- Base URL pattern: `https://apis.data.go.kr/{service_path}`
- Auth: `serviceKey` query parameter
- Format: JSON or XML (prefer JSON with `resultType=json`)
- Rate: Dev 1,000/day, Production 100,000/day

### 한국은행 ECOS (ecos.bok.or.kr/api)
- GDP, CPI, interest rates, money supply, exchange rates, household debt
- Base URL: `https://ecos.bok.or.kr/api/{service}/{apiKey}/{format}/{lang}/{start}/{end}/{statCode}/{period}/{itemCode}`
- Rate: 100,000/day

### 열린국회정보 (open.assembly.go.kr)
- Bills, votes, legislators, sessions, minutes
- Separate API key from data.go.kr

### 국가법령정보 (open.law.go.kr)
- Laws full text, amendment history, regulations
- Separate API key

### 빅카인즈 (bigkinds.or.kr)
- 104 outlets, 108M+ articles since 1990
- Requires research/public interest application
- API provides: keyword search, trend analysis, entity extraction

## Fiscal Data (Verified Numbers)

### Total Government Spending (조원, 본예산 기준)
```
1998: 104 | 2000: 111 | 2005: 175 | 2010: 268
2015: 343 | 2020: 512 | 2021: 548 | 2022: 607
2023: 639 | 2024: 657 | 2025: 677 | 2026: 728(안)
```

### National Debt D1 (조원)
```
1998: 80  | 2000: 111 | 2005: 248 | 2010: 393
2015: 591 | 2020: 846 | 2021: 971 | 2022: 1068
2023: 1093 | 2024: 1175 | 2025: 1222(추정)
```

### Debt-to-GDP Ratio
```
2000: 19.2% | 2010: 37.6% | 2020: 52.5%
2024: 46.8% (D1 기준, BIS 기준 47.2%)
OECD avg: 112.3% | Japan: 260% | US: 121%
```

### 2026 Budget by Sector (예산안)
- 보건·복지·고용: 269.1조 (37.0%)
- 일반·지방행정: 121.1조
- 교육: 99.8조
- 국방: 66.3조
- R&D growth: +19.3% YoY

### Tax Revenue
- 2024 actual: 336.5조 (vs 367.3조 budget = △30.8조 shortfall)
- 2023: 344.1조
- Sources: 소득세, 법인세, 부가가치세, etc.

## Presidents (김영삼 ~ 현재)

```json
[
  {"id": "ysk", "name": "김영삼", "start": "1993-02-25", "end": "1998-02-24", "party": "민주자유당→신한국당", "era": "문민정부", "gdp_growth_avg": 5.7},
  {"id": "kdj", "name": "김대중", "start": "1998-02-25", "end": "2003-02-24", "party": "새정치국민회의→새천년민주당", "era": "국민의 정부", "gdp_growth_avg": 5.2},
  {"id": "nmh", "name": "노무현", "start": "2003-02-25", "end": "2008-02-24", "party": "새천년민주당→열린우리당", "era": "참여정부", "gdp_growth_avg": 4.3},
  {"id": "lmb", "name": "이명박", "start": "2008-02-25", "end": "2013-02-24", "party": "한나라당→새누리당", "era": "이명박 정부", "gdp_growth_avg": 3.2},
  {"id": "pgh", "name": "박근혜", "start": "2013-02-25", "end": "2017-03-10", "party": "새누리당", "era": "박근혜 정부", "gdp_growth_avg": 2.9, "note": "탄핵 파면"},
  {"id": "mji", "name": "문재인", "start": "2017-05-10", "end": "2022-05-09", "party": "더불어민주당", "era": "문재인 정부", "gdp_growth_avg": 2.3},
  {"id": "ysy", "name": "윤석열", "start": "2022-05-10", "end": "2025-04-04", "party": "국민의힘", "era": "윤석열 정부", "gdp_growth_avg": 1.8, "note": "비상계엄→탄핵 파면"},
  {"id": "ljm", "name": "이재명", "start": "2025-06-04", "end": null, "party": "더불어민주당", "era": "이재명 정부"}
]
```

## Media Outlet Spectrum

Score: 1.0 (강한진보) ↔ 3.0 (중도) ↔ 5.0 (강한보수)

### Newspapers
| ID | Name | Score | Category | RSS |
|----|------|-------|----------|-----|
| chosun | 조선일보 | 4.5 | conservative | https://www.chosun.com/arc/outboundfeeds/rss/ |
| joongang | 중앙일보 | 3.8 | conservative | https://rss.joins.com/joins_news_list.xml |
| donga | 동아일보 | 4.0 | conservative | https://rss.donga.com/total.xml |
| hankyoreh | 한겨레 | 1.2 | progressive | https://www.hani.co.kr/rss/ |
| khan | 경향신문 | 1.5 | progressive | https://www.khan.co.kr/rss/rssdata/total_news.xml |
| hankookilbo | 한국일보 | 2.8 | center | |
| seoul | 서울신문 | 3.0 | center | |
| munhwa | 문화일보 | 4.3 | conservative | |
| hankyung | 한국경제 | 4.2 | conservative | https://rss.hankyung.com/feed/ |
| mk | 매일경제 | 3.5 | center-right | |

### Broadcast
| ID | Name | Score | Category |
|----|------|-------|----------|
| kbs | KBS | 3.0 | center (govt-influenced) |
| mbc | MBC | 1.8 | progressive |
| sbs | SBS | 2.8 | center |
| jtbc | JTBC | 2.2 | center-left |
| tvchosun | TV조선 | 4.8 | strong conservative |
| channela | 채널A | 4.0 | conservative |
| mbn | MBN | 3.3 | center-right |
| ytn | YTN | 2.8 | center |
| yonhap | 연합뉴스 | 3.0 | center (state wire) |

### Online
| ID | Name | Score | Category |
|----|------|-------|----------|
| ohmynews | 오마이뉴스 | 1.3 | progressive |
| pressian | 프레시안 | 1.0 | strong progressive |
| newstapa | 뉴스타파 | 1.2 | progressive (investigative) |
| mediatoday | 미디어오늘 | 1.3 | progressive |
| newdaily | 뉴데일리 | 4.8 | strong conservative |

## AI Audit Patterns

| # | Pattern | Detection Logic | Weight |
|---|---------|----------------|--------|
| 1 | Year-end spending spike | Q4 > 40% of annual | +15 |
| 2 | Vendor concentration | Same vendor >30% or 3yr consecutive | +15 |
| 3 | Inflated pricing | >30% above cross-agency median | +20 |
| 4 | Contract splitting | 3+ contracts at 80-100% of 수의계약 limit (20M KRW) | +20 |
| 5 | Zombie projects | 3+ years under 50% execution rate | +10 |
| 6 | Revolving door | Retired officials → vendor officers | +30 |
| 7 | Paper company | <1yr old + <5 employees + large contract | +25 |
| 8 | Unnecessary renovation | Same location re-construction within 3 years | +10 |
| 9 | Poor ROI | High budget + vague performance metrics | +20 |
| 10 | Bid rigging | Same bidder combo 5+ times | +30 |

Suspicion scale: 0-20 🟢 | 21-40 🟡 | 41-60 🟠 | 61-80 🔴 | 81-100 ⚫

## Tier/Pricing

| Tier | Price | Search/day | Filters | Downloads | API |
|------|-------|-----------|---------|-----------|-----|
| Anonymous | Free | 5 | year, sector | ❌ | ❌ |
| Free registered | Free | 15 | + department | ❌ | ❌ |
| Citizen Pro | ₩3,900/mo | ∞ | All | 10/mo CSV | ❌ |
| Institution | ₩190,000/mo | ∞ | All | ∞ | 100K/mo |
| API Only | ₩90,000/mo | — | — | — | 50K/mo |
| Institution + Panel | ₩390,000/mo | ∞ | All | ∞ + survey aggregates | 100K/mo |

## Credit System

| Action | Credits |
|--------|---------|
| Profile Level 1 (age/gender/region) | +50 |
| Profile Level 2 (job/income/education) | +100 |
| Profile Level 3 (interests/politics) | +200 |
| Basic survey (3-5 questions) | +30 |
| Deliberative survey (read + re-answer) | +80 |
| Citizen report (if accepted) | +200 |
| Friend referral (completed signup) | +100 |
| Daily check-in | +5 |
| 7-day streak bonus | +50 |

Redemptions: 500 credits = 1 month Pro free

## Legal Constraints

- News: title + link + AI summary only (저작권법)
- Audit: "의심 패턴" only, never "비리 확정" (명예훼손 방지)
- Privacy: No real names, K-anonymity min 30 for survey aggregates
- Public data: Free to use per 공공데이터법 (2013)
- Presidential records: 공공저작물 자유이용 가능
