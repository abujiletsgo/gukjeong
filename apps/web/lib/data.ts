// 국정투명 -- 시드 데이터 로더
// MVP에서는 하드코딩된 시드 데이터를 사용합니다.
// 프로덕션에서는 API 클라이언트(api.ts)로 교체됩니다.

import type { President, FiscalYearly, FiscalBySector, AuditFlag, DepartmentScore, NationalAgenda, CampaignPledge, ReportCardMetric, KeyEvent, Bill, NewsEvent, MediaOutlet, NewsArticle, PresidentComparisonMetrics } from './types';

// ========================================
// 대통령 데이터 (data/seed/presidents.json 기반)
// ========================================

const PRESIDENTS_DATA: President[] = [
  { id: "ysk", name: "김영삼", name_en: "Kim Young-sam", term_start: "1993-02-25", term_end: "1998-02-24", party: "민주자유당→신한국당", era: "문민정부", gdp_growth_avg: 5.7 },
  { id: "kdj", name: "김대중", name_en: "Kim Dae-jung", term_start: "1998-02-25", term_end: "2003-02-24", party: "새정치국민회의→새천년민주당", era: "국민의 정부", gdp_growth_avg: 5.2 },
  { id: "nmh", name: "노무현", name_en: "Roh Moo-hyun", term_start: "2003-02-25", term_end: "2008-02-24", party: "새천년민주당→열린우리당", era: "참여정부", gdp_growth_avg: 4.3 },
  { id: "lmb", name: "이명박", name_en: "Lee Myung-bak", term_start: "2008-02-25", term_end: "2013-02-24", party: "한나라당→새누리당", era: "이명박 정부", gdp_growth_avg: 3.2 },
  { id: "pgh", name: "박근혜", name_en: "Park Geun-hye", term_start: "2013-02-25", term_end: "2017-03-10", party: "새누리당", era: "박근혜 정부", gdp_growth_avg: 2.9, note: "탄핵 파면" },
  { id: "mji", name: "문재인", name_en: "Moon Jae-in", term_start: "2017-05-10", term_end: "2022-05-09", party: "더불어민주당", era: "문재인 정부", gdp_growth_avg: 2.3 },
  { id: "ysy", name: "윤석열", name_en: "Yoon Suk-yeol", term_start: "2022-05-10", term_end: "2025-04-04", party: "국민의힘", era: "윤석열 정부", gdp_growth_avg: 1.8, note: "비상계엄→탄핵 파면" },
  { id: "ljm", name: "이재명", name_en: "Lee Jae-myung", term_start: "2025-06-04", term_end: undefined, party: "더불어민주당", era: "이재명 정부" },
];

// ========================================
// 재정 데이터 (data/seed/fiscal_historical.json 기반)
// ========================================

const FISCAL_DATA: FiscalYearly[] = [
  { year: 1998, total_spending: 104, national_debt: 80, president_id: "kdj" },
  { year: 1999, total_spending: 107, national_debt: 95, president_id: "kdj" },
  { year: 2000, total_spending: 111, national_debt: 111, debt_to_gdp: 19.2, president_id: "kdj" },
  { year: 2001, total_spending: 120, national_debt: 128, president_id: "kdj" },
  { year: 2002, total_spending: 130, national_debt: 134, president_id: "kdj" },
  { year: 2003, total_spending: 140, national_debt: 165, president_id: "nmh" },
  { year: 2004, total_spending: 148, national_debt: 204, president_id: "nmh" },
  { year: 2005, total_spending: 175, national_debt: 248, president_id: "nmh" },
  { year: 2006, total_spending: 185, national_debt: 283, president_id: "nmh" },
  { year: 2007, total_spending: 196, national_debt: 299, president_id: "nmh" },
  { year: 2008, total_spending: 220, national_debt: 309, president_id: "lmb" },
  { year: 2009, total_spending: 245, national_debt: 360, president_id: "lmb" },
  { year: 2010, total_spending: 268, national_debt: 393, debt_to_gdp: 37.6, president_id: "lmb" },
  { year: 2011, total_spending: 280, national_debt: 421, president_id: "lmb" },
  { year: 2012, total_spending: 295, national_debt: 443, president_id: "lmb" },
  { year: 2013, total_spending: 310, national_debt: 490, president_id: "pgh" },
  { year: 2014, total_spending: 320, national_debt: 534, president_id: "pgh" },
  { year: 2015, total_spending: 343, national_debt: 591, president_id: "pgh" },
  { year: 2016, total_spending: 360, national_debt: 627, president_id: "pgh" },
  { year: 2017, total_spending: 380, national_debt: 660, president_id: "mji" },
  { year: 2018, total_spending: 410, national_debt: 681, president_id: "mji" },
  { year: 2019, total_spending: 450, national_debt: 728, president_id: "mji" },
  { year: 2020, total_spending: 512, national_debt: 846, debt_to_gdp: 52.5, president_id: "mji" },
  { year: 2021, total_spending: 548, national_debt: 971, president_id: "mji" },
  { year: 2022, total_spending: 607, national_debt: 1068, president_id: "ysy" },
  { year: 2023, total_spending: 639, national_debt: 1093, tax_revenue: 344.1, president_id: "ysy" },
  { year: 2024, total_spending: 657, national_debt: 1175, debt_to_gdp: 46.8, tax_revenue: 336.5, president_id: "ysy" },
  { year: 2025, total_spending: 677, national_debt: 1222, president_id: "ysy" },
  { year: 2026, total_spending: 728, president_id: "ljm" },
];

export function getPresidents(): President[] { return PRESIDENTS_DATA; }
export function getPresidentById(id: string): President | undefined { return PRESIDENTS_DATA.find(p => p.id === id); }
export function getFiscalData(): FiscalYearly[] { return FISCAL_DATA; }
export function getFiscalByPresident(presidentId: string): FiscalYearly[] { return FISCAL_DATA.filter(f => f.president_id === presidentId); }
export function getLatestFiscal(): FiscalYearly | undefined { return FISCAL_DATA[FISCAL_DATA.length - 1]; }

// ========================================
// 분야별 예산
// ========================================

export function getSectorData(year: number = 2026): FiscalBySector[] {
  const data: Record<number, FiscalBySector[]> = {
    2026: [
      { sector: '보건·복지·고용', amount: 269.1, percentage: 37.0, yoy_change: 7.5, year: 2026 },
      { sector: '일반·지방행정', amount: 121.1, percentage: 16.6, yoy_change: 5.2, year: 2026 },
      { sector: '교육', amount: 99.8, percentage: 13.7, yoy_change: 6.8, year: 2026 },
      { sector: '국방', amount: 66.3, percentage: 9.1, yoy_change: 4.5, year: 2026 },
      { sector: '산업·중소기업·에너지', amount: 37.2, percentage: 5.1, yoy_change: 8.3, year: 2026 },
      { sector: 'R&D', amount: 33.8, percentage: 4.6, yoy_change: 19.3, year: 2026 },
      { sector: '공공질서·안전', amount: 25.4, percentage: 3.5, yoy_change: 3.2, year: 2026 },
      { sector: 'SOC', amount: 28.5, percentage: 3.9, yoy_change: 11.2, year: 2026 },
      { sector: '농림·수산·식품', amount: 24.8, percentage: 3.4, yoy_change: 2.1, year: 2026 },
      { sector: '환경', amount: 13.2, percentage: 1.8, yoy_change: 5.8, year: 2026 },
      { sector: '문화·체육·관광', amount: 9.8, percentage: 1.3, yoy_change: 4.1, year: 2026 },
    ],
    2025: [
      { sector: '보건·복지·고용', amount: 250.3, percentage: 37.0, yoy_change: 4.2, year: 2025 },
      { sector: '일반·지방행정', amount: 115.1, percentage: 17.0, yoy_change: 3.8, year: 2025 },
      { sector: '교육', amount: 93.5, percentage: 13.8, yoy_change: 5.1, year: 2025 },
      { sector: '국방', amount: 63.4, percentage: 9.4, yoy_change: 4.7, year: 2025 },
      { sector: '산업·중소기업·에너지', amount: 34.3, percentage: 5.1, yoy_change: 3.5, year: 2025 },
      { sector: 'R&D', amount: 28.3, percentage: 4.2, yoy_change: -1.2, year: 2025 },
      { sector: '공공질서·안전', amount: 24.6, percentage: 3.6, yoy_change: 2.8, year: 2025 },
      { sector: 'SOC', amount: 25.6, percentage: 3.8, yoy_change: 8.5, year: 2025 },
      { sector: '농림·수산·식품', amount: 24.3, percentage: 3.6, yoy_change: 1.5, year: 2025 },
      { sector: '환경', amount: 12.5, percentage: 1.8, yoy_change: 3.2, year: 2025 },
      { sector: '문화·체육·관광', amount: 9.4, percentage: 1.4, yoy_change: 3.3, year: 2025 },
    ],
    2024: [
      { sector: '보건·복지·고용', amount: 240.3, percentage: 36.6, yoy_change: 2.8, year: 2024 },
      { sector: '일반·지방행정', amount: 110.9, percentage: 16.9, yoy_change: 4.1, year: 2024 },
      { sector: '교육', amount: 89.0, percentage: 13.5, yoy_change: 3.5, year: 2024 },
      { sector: '국방', amount: 60.5, percentage: 9.2, yoy_change: 4.2, year: 2024 },
      { sector: '산업·중소기업·에너지', amount: 33.1, percentage: 5.0, yoy_change: 2.1, year: 2024 },
      { sector: 'R&D', amount: 28.7, percentage: 4.4, yoy_change: -16.6, year: 2024 },
      { sector: '공공질서·안전', amount: 23.9, percentage: 3.6, yoy_change: 3.5, year: 2024 },
      { sector: 'SOC', amount: 23.6, percentage: 3.6, yoy_change: 6.2, year: 2024 },
      { sector: '농림·수산·식품', amount: 23.9, percentage: 3.6, yoy_change: 1.2, year: 2024 },
      { sector: '환경', amount: 12.1, percentage: 1.8, yoy_change: 2.5, year: 2024 },
      { sector: '문화·체육·관광', amount: 9.1, percentage: 1.4, yoy_change: 2.8, year: 2024 },
    ],
  };
  return data[year] || data[2026];
}

// ========================================
// Sankey 데이터
// ========================================

export function getSankeyData(year: number = 2026) {
  const sectors = getSectorData(year);
  const totalSpending = sectors.reduce((s, d) => s + (d.amount || 0), 0);
  const revenueNodes = [
    { name: '소득세', value: 115.2 },
    { name: '법인세', value: 80.3 },
    { name: '부가가치세', value: 82.1 },
    { name: '기타세입', value: 59.0 },
    { name: '국채', value: Math.max(0, totalSpending - 336.6) },
  ].filter(n => n.value > 0);

  const spendingNodes = sectors.map(s => ({ name: s.sector, value: s.amount || 0 }));
  const revTotal = revenueNodes.reduce((s, n) => s + n.value, 0);

  const links: { source: string; target: string; value: number }[] = [];
  for (const rev of revenueNodes) {
    for (const spend of spendingNodes) {
      links.push({ source: rev.name, target: spend.name, value: (rev.value / revTotal) * spend.value });
    }
  }

  return {
    nodes: [
      ...revenueNodes.map(n => ({ name: n.name, type: 'revenue' as const })),
      ...spendingNodes.map(n => ({ name: n.name, type: 'spending' as const })),
    ],
    links,
  };
}

// ========================================
// 감사 시뮬레이션 데이터
// ========================================

const DEPARTMENTS = [
  '국토교통부', '국방부', '보건복지부', '교육부', '환경부',
  '과학기술정보통신부', '산업통상자원부', '행정안전부',
  '농림축산식품부', '고용노동부', '해양수산부', '문화체육관광부',
  '기획재정부', '외교부', '법무부', '여성가족부',
];

export function getDepartmentScores(): DepartmentScore[] {
  return DEPARTMENTS.map((dept, i) => ({
    department: dept,
    suspicion_score: Math.max(5, Math.min(85, 15 + Math.floor(Math.sin(i * 2.7) * 30 + Math.cos(i * 1.3) * 20))),
    flag_count: Math.max(0, Math.floor(Math.sin(i * 3.1) * 8 + 5)),
    transparency_rank: i + 1,
  })).sort((a, b) => b.suspicion_score - a.suspicion_score);
}

export function getAuditFlags(): AuditFlag[] {
  return [
    { id: 'af-001', pattern_type: 'yearend_spike', severity: 'HIGH', suspicion_score: 72, target_type: 'department', target_id: '국토교통부', detail: { q4_ratio: 62.3, q4_total: 4500000000, yearly_total: 7222222222, year: 2025 }, evidence: { threshold: '40%', actual: '62.3%', description: '국토교통부의 2025년 Q4 지출이 연간의 62.3%를 차지합니다.' }, ai_analysis: '국토교통부의 4분기 집중 지출 패턴이 감지되었습니다. 연간 예산의 62.3%가 10~12월에 집중 집행되었으며, 이는 예산 소진 압력에 의한 비효율적 집행 가능성을 시사합니다.', status: 'detected', created_at: '2026-01-15' },
    { id: 'af-002', pattern_type: 'vendor_concentration', severity: 'HIGH', suspicion_score: 65, target_type: 'department', target_id: '국방부', detail: { vendor_name: '(주)한국방산기술', concentration_ratio: 42.8, contract_count: 15 }, evidence: { threshold: '30%', actual: '42.8%' }, ai_analysis: '국방부 계약의 42.8%가 단일 업체에 집중되어 있습니다. 방산 분야의 특수성을 감안하더라도 경쟁 입찰 없는 수의계약 비율이 높아 주의가 필요합니다.', status: 'detected', created_at: '2026-01-14' },
    { id: 'af-003', pattern_type: 'contract_splitting', severity: 'HIGH', suspicion_score: 58, target_type: 'department', target_id: '환경부', detail: { vendors: [{ vendor_name: '(주)그린솔루션', split_count: 5 }] }, evidence: { threshold: '수의계약 한도(2000만원)의 80-100% 범위 계약 3건 이상' }, ai_analysis: '환경부에서 수의계약 한도(2,000만원) 직하 금액의 계약이 동일 업체로 5건 반복 발생했습니다. 입찰 회피를 위한 계약 분할 가능성이 있습니다.', status: 'detected', created_at: '2026-01-13' },
    { id: 'af-004', pattern_type: 'yearend_spike', severity: 'MEDIUM', suspicion_score: 45, target_type: 'department', target_id: '교육부', detail: { q4_ratio: 48.2, year: 2025 }, evidence: { threshold: '40%', actual: '48.2%' }, ai_analysis: '교육부의 4분기 지출 비중이 48.2%로 기준치를 초과했습니다. 연말 학교 시설 보수 계약이 집중된 것으로 보이나, 긴급성 대비 금액이 높습니다.', status: 'detected', created_at: '2026-01-12' },
    { id: 'af-005', pattern_type: 'vendor_concentration', severity: 'MEDIUM', suspicion_score: 42, target_type: 'department', target_id: '과학기술정보통신부', detail: { vendor_name: '(주)IT컨설팅코리아', concentration_ratio: 35.1, contract_count: 8 }, evidence: { threshold: '30%', actual: '35.1%' }, ai_analysis: 'IT 용역 계약에서 특정 업체 집중도가 35.1%로 나타났습니다. 기술 전문성 요구에 의한 것일 수 있으나, 다양한 업체 참여 기회가 제한된 것은 아닌지 확인이 필요합니다.', status: 'detected', created_at: '2026-01-11' },
    { id: 'af-006', pattern_type: 'contract_splitting', severity: 'MEDIUM', suspicion_score: 38, target_type: 'department', target_id: '행정안전부', detail: { vendors: [{ vendor_name: '(주)디지털행정', split_count: 4 }] }, evidence: { threshold: '수의계약 한도(2000만원)의 80-100% 범위 계약 3건 이상' }, ai_analysis: '행정안전부 전산 장비 구매에서 1,800~1,980만원 범위의 계약이 4건 발생했습니다. 수의계약 한도 직하 금액의 반복 패턴이 의심됩니다.', status: 'detected', created_at: '2026-01-10' },
  ];
}

export function getAuditFlagById(id: string): AuditFlag | undefined {
  return getAuditFlags().find(f => f.id === id);
}

// ========================================
// 대통령별 주요 정책/사건
// ========================================

export function getPoliciesByPresident(presidentId: string): any[] {
  const policies: Record<string, any[]> = {
    ysk: [{ title: '금융실명제', category: '경제', status: '완료', year: 1993, impact_score: 95 }, { title: '지방자치제 부활', category: '행정', status: '완료', year: 1995, impact_score: 85 }, { title: 'OECD 가입', category: '외교', status: '완료', year: 1996, impact_score: 80 }],
    kdj: [{ title: 'IMF 외환위기 극복', category: '경제', status: '완료', year: 1998, impact_score: 98 }, { title: '남북정상회담', category: '외교', status: '완료', year: 2000, impact_score: 90 }, { title: 'IT 강국 전략', category: '산업', status: '완료', year: 1999, impact_score: 92 }, { title: '국민기초생활보장법', category: '복지', status: '완료', year: 1999, impact_score: 88 }],
    nmh: [{ title: '행정수도 이전 추진', category: '행정', status: '부분완료', year: 2003, impact_score: 70 }, { title: '한미 FTA 추진', category: '경제', status: '완료', year: 2006, impact_score: 85 }, { title: '부동산 종합대책', category: '경제', status: '부분완료', year: 2005, impact_score: 60 }],
    lmb: [{ title: '4대강 사업', category: '환경', status: '완료', year: 2008, impact_score: 55 }, { title: '글로벌 금융위기 대응', category: '경제', status: '완료', year: 2008, impact_score: 82 }, { title: 'G20 서울 정상회의', category: '외교', status: '완료', year: 2010, impact_score: 78 }],
    pgh: [{ title: '창조경제', category: '경제', status: '부분완료', year: 2013, impact_score: 40 }, { title: '누리과정(무상보육)', category: '복지', status: '완료', year: 2013, impact_score: 75 }],
    mji: [{ title: '코로나19 방역(K-방역)', category: '보건', status: '완료', year: 2020, impact_score: 85 }, { title: '한반도 평화 프로세스', category: '외교', status: '진행중', year: 2018, impact_score: 70 }, { title: '소득주도성장', category: '경제', status: '부분완료', year: 2017, impact_score: 50 }, { title: '탈원전 정책', category: '에너지', status: '부분완료', year: 2017, impact_score: 55 }],
    ysy: [{ title: '원전 확대 회귀', category: '에너지', status: '진행중', year: 2022, impact_score: 65 }, { title: '반도체 산업 지원', category: '산업', status: '진행중', year: 2022, impact_score: 72 }, { title: '비상계엄 선포', category: '정치', status: '중단', year: 2024, impact_score: 95 }],
    ljm: [{ title: '기본소득 기반 복지 확대', category: '복지', status: '추진중', year: 2025, impact_score: null }, { title: '디지털 정부 혁신', category: '행정', status: '추진중', year: 2025, impact_score: null }],
  };
  return policies[presidentId] || [];
}

export function getEventsByPresident(presidentId: string): any[] {
  const events: Record<string, any[]> = {
    ysk: [{ date: '1993-08-12', title: '금융실명제 전격 실시', type: 'positive' }, { date: '1996-12-12', title: 'OECD 가입', type: 'positive' }, { date: '1997-11-21', title: 'IMF 구제금융 신청', type: 'negative' }],
    kdj: [{ date: '1998-02-25', title: 'IMF 외환위기 중 취임', type: 'negative' }, { date: '2000-06-15', title: '제1차 남북정상회담', type: 'positive' }, { date: '2000-12-10', title: '노벨평화상 수상', type: 'positive' }, { date: '2001-08-15', title: 'IMF 조기 졸업 선언', type: 'positive' }],
    nmh: [{ date: '2004-03-12', title: '국회 탄핵 소추', type: 'negative' }, { date: '2004-05-14', title: '헌법재판소 탄핵 기각', type: 'positive' }, { date: '2007-10-04', title: '제2차 남북정상회담', type: 'positive' }],
    lmb: [{ date: '2008-06-10', title: '미국산 쇠고기 수입 촛불시위', type: 'negative' }, { date: '2010-11-12', title: 'G20 서울 정상회의', type: 'positive' }],
    pgh: [{ date: '2014-04-16', title: '세월호 참사', type: 'negative' }, { date: '2016-10-24', title: '최순실 국정농단 보도', type: 'negative' }, { date: '2017-03-10', title: '헌재 탄핵 인용, 파면', type: 'negative' }],
    mji: [{ date: '2018-04-27', title: '판문점 남북정상회담', type: 'positive' }, { date: '2020-03-01', title: '코로나19 대응 시작', type: 'neutral' }, { date: '2020-04-15', title: '21대 총선 여당 압승', type: 'positive' }],
    ysy: [{ date: '2022-10-29', title: '이태원 참사', type: 'negative' }, { date: '2024-12-03', title: '비상계엄 선포', type: 'negative' }, { date: '2024-12-14', title: '국회 탄핵 소추안 가결', type: 'negative' }, { date: '2025-04-04', title: '헌재 탄핵 인용, 파면', type: 'negative' }],
    ljm: [{ date: '2025-06-04', title: '제21대 대통령 취임', type: 'positive' }],
  };
  return events[presidentId] || [];
}

// ========================================
// 대통령별 주요 사건 (KeyEvent 타입)
// ========================================

export function getKeyEventsByPresident(presidentId: string): KeyEvent[] {
  const events: Record<string, KeyEvent[]> = {
    mji: [
      {
        id: 'mji-e1', event_date: '2017-05-10', title: '제19대 대통령 취임', description: '촛불혁명 이후 조기 대선으로 당선, 적폐청산과 국민통합 강조', impact_type: 'positive', significance_score: 90,
        why_it_matters: '박근혜 대통령 탄핵 이후 치러진 조기 대선으로, 1,700만 촛불시민의 민주주의 요구가 정권교체로 이어진 역사적 순간입니다. 국민이 직접 대통령을 바꾼 경험은 한국 민주주의의 저력을 보여줬습니다.',
        citizen_impact: '탄핵 정국으로 6개월간 멈춰있던 국정이 정상화되었습니다. 문재인 대통령은 취임 직후 인천공항 비정규직 정규직 전환을 지시하며 "비정규직 제로 시대"를 선언했고, 이는 공공부문 고용 안정의 시작이 되었습니다.',
        background: '2016년 10월 최순실 국정농단이 드러난 후, 매주 토요일 촛불집회가 열렸습니다. 연인원 1,700만명이 참가한 촛불혁명 끝에 박근혜 대통령이 파면되었고, 60일 이내 조기 대선이 치러졌습니다.',
        what_happened_after: '문재인 정부는 적폐청산위원회를 구성하고, 국정원·검찰 개혁에 착수했습니다. 남북관계 개선에도 적극 나서 2018년 세 차례 남북정상회담을 성사시켰습니다. 하지만 임기 후반 부동산 가격 폭등과 코로나19로 난관에 봉착했습니다.',
        related_numbers: '득표율 41.1% (1,342만 표) · 역대 최단 선거운동 기간 (후보등록 후 22일) · 투표율 77.2% · 사전투표율 26.1% (당시 역대 최고)',
      },
      {
        id: 'mji-e2', event_date: '2018-04-27', title: '판문점 남북정상회담', description: '김정은 위원장과 판문점 선언 채택, 한반도 비핵화 합의', impact_type: 'positive', significance_score: 95,
        why_it_matters: '남북 분단 이후 북한 최고지도자가 처음으로 군사분계선을 넘어 남측으로 온 역사적 순간입니다. "완전한 비핵화"에 합의하고 종전선언 추진을 약속한 판문점 선언은 한반도 평화의 새 장을 열었습니다.',
        citizen_impact: '남북 군사적 긴장이 크게 완화되어 접경지역 주민들의 불안이 줄었습니다. 금강산 관광·개성공단 재개 기대감으로 관련 기업 주가가 급등했고, "전쟁 공포" 없는 한반도에 대한 국민적 희망이 커졌습니다.',
        background: '2017년 북한의 대륙간탄도미사일(ICBM) 시험과 6차 핵실험으로 한반도 전쟁 위기가 고조되었습니다. 2018년 평창 동계올림픽을 계기로 남북 대화가 재개되었고, 김여정 특사 파견 등 급속한 해빙 무드가 조성되었습니다.',
        what_happened_after: '6월 싱가포르 북미정상회담, 9월 평양 남북정상회담으로 이어졌습니다. 하지만 2019년 하노이 북미정상회담 결렬 이후 비핵화 협상은 교착되었고, 판문점 선언의 합의 사항 대부분은 이행되지 못했습니다.',
        related_numbers: '분단 65년 만에 북한 최고지도자 남측 방문 · 생중계 시청률 40% 이상 · 판문점 선언 3개 조항 13개 항목 합의 · 남북 공동유해발굴 등 군사적 긴장완화 조치 합의',
      },
      {
        id: 'mji-e3', event_date: '2018-06-12', title: '싱가포르 북미정상회담 중재', description: '역사적 첫 북미정상회담 성사에 기여', impact_type: 'positive', significance_score: 88,
        why_it_matters: '사상 최초로 현직 미국 대통령과 북한 최고지도자가 만났습니다. 한국전쟁 이후 70년 가까이 적대 관계였던 미북이 정상회담을 한 것 자체가 전례 없는 일이며, 한국 정부의 중재 외교가 결정적 역할을 했습니다.',
        citizen_impact: '한반도 전쟁 위기감이 크게 완화되어 코스피가 상승하고 외국인 투자자 이탈이 멈췄습니다. 군 복무 중인 젊은 세대와 그 가족들의 안보 불안이 줄었고, "평화 경제"에 대한 기대감이 높아졌습니다.',
        background: '2017년 트럼프 대통령이 "화염과 분노"를 경고하고 북한이 ICBM을 발사하며 전쟁 위기가 극에 달했습니다. 문재인 대통령이 중재 역할을 자임하며, 판문점 회담 이후 김정은 위원장의 비핵화 의지를 미국에 전달해 정상회담을 성사시켰습니다.',
        what_happened_after: '미북 공동성명을 채택하고 비핵화와 새로운 관계 수립에 합의했지만, 구체적 이행 로드맵이 없어 한계가 있었습니다. 이후 하노이 회담 결렬로 비핵화 논의는 사실상 중단되었습니다.',
        related_numbers: '싱가포르 센토사섬 카펠라호텔에서 약 40분간 단독회담 · 미북 수교 이래 최초 정상회담 · 한국 정부 중재 셔틀외교 4개월간 진행',
      },
      {
        id: 'mji-e4', event_date: '2018-09-19', title: '평양 남북정상회담', description: '9월 평양공동선언, 군사분야 합의서 채택', impact_type: 'positive', significance_score: 82,
        why_it_matters: '같은 해 세 번째 남북정상회담으로, 대한민국 대통령이 평양을 방문하여 15만 평양 시민 앞에서 연설한 역사적 장면이 연출되었습니다. 특히 군사분야 합의서는 남북 간 우발적 무력충돌을 방지하는 실질적 조치를 담았습니다.',
        citizen_impact: '남북 군사분야 합의서에 따라 비무장지대(DMZ) 감시초소(GP)가 시범 철수되고, 접경지역 군사훈련이 중단되었습니다. 휴전선 인근 주민들은 실질적인 군사적 긴장 완화를 체감할 수 있었습니다.',
        background: '싱가포르 북미정상회담 이후 비핵화 후속 협상이 지지부진하자, 문재인 대통령이 평양을 직접 방문하여 돌파구를 마련하고자 했습니다. 2007년 노무현 대통령 이후 11년 만의 대통령 평양 방문이었습니다.',
        what_happened_after: '군사분야 합의서에 따라 GP 철수, 비무장지대 지뢰 제거 등이 진행되었으나, 북미 협상 결렬 이후 남북관계도 경색되었습니다. 2020년 북한이 남북공동연락사무소를 폭파하며 합의 정신이 훼손되었습니다.',
        related_numbers: '평양 5.1 경기장에서 15만 관중 앞 연설 · 군사분야 합의서: 비무장지대 GP 시범 철수 11개 · 한강 하구 공동이용 합의 · 동·서해 완충구역 설정',
      },
      {
        id: 'mji-e5', event_date: '2019-02-28', title: '하노이 북미정상회담 결렬', description: '비핵화 협상 교착, 한반도 평화 프로세스 동력 상실', impact_type: 'negative', significance_score: 85,
        why_it_matters: '2018년의 평화 분위기가 일순간에 무너진 결정적 전환점입니다. 미국과 북한이 비핵화 범위와 대북제재 해제 수준에서 합의에 실패하면서, 한반도 평화 프로세스는 사실상 동력을 잃었습니다.',
        citizen_impact: '한반도 평화에 대한 국민적 기대가 크게 꺾였습니다. 남북경협 관련주가 급락했고, 개성공단·금강산 관광 재개를 기다리던 중소기업들은 막대한 손실을 입었습니다. 대북정책에 대한 여론도 분열되기 시작했습니다.',
        background: '싱가포르 회담 이후 미국은 "완전한 비핵화"를, 북한은 "단계적 제재 해제"를 요구하며 입장 차이가 좁혀지지 않았습니다. 트럼프 대통령은 합의문 없이 회담장을 떠나며 "노딜"을 선언했습니다.',
        what_happened_after: '이후 남북관계도 급속히 경색되었습니다. 2020년 6월 북한이 개성 남북공동연락사무소를 폭파했고, 김여정 담화를 통해 남한을 강하게 비난했습니다. 비핵화 협상은 현재까지 재개되지 않고 있습니다.',
        related_numbers: '하노이 메트로폴호텔에서 약 20분 만에 회담 종료 · 북한 요구: 유엔 제재 5건 해제 · 미국 요구: 영변+알파 핵시설 폐기 · 코스피 남북경협주 평균 10% 급락',
      },
      {
        id: 'mji-e6', event_date: '2019-08-22', title: '한일 GSOMIA 종료 결정', description: '일본 수출규제 보복에 대한 한일 군사정보보호협정 종료 통보 (이후 조건부 유지)', impact_type: 'neutral', significance_score: 70,
        why_it_matters: '일본의 경제 보복에 맞서 안보 카드를 꺼낸 한국 정부의 강경 대응이었습니다. 한일 군사정보보호협정(GSOMIA)은 북한 미사일 정보를 공유하는 핵심 안보 협정으로, 그 종료 통보는 한일관계의 심각성을 보여줬습니다.',
        citizen_impact: '"노재팬(No Japan)" 불매운동이 전국으로 확산되어 일본 맥주 수입이 97% 급감하고, 일본 여행객이 80% 줄었습니다. 반면 국산 제품에 대한 관심이 높아져 국산 맥주·화장품 매출이 크게 늘었습니다.',
        background: '2018년 대법원 강제징용 배상 판결에 반발한 일본이 2019년 7월 반도체 핵심 소재 3종(불화수소, 포토레지스트, 불화폴리이미드)의 대한국 수출규제를 단행했습니다. 이에 한국 정부가 GSOMIA 종료라는 안보 카드로 맞대응했습니다.',
        what_happened_after: '미국의 강한 압력으로 종료 시한 직전 "조건부 유지"로 선회했습니다. 하지만 이 사건을 계기로 한국 반도체 소재 국산화가 가속되어, 불화수소 등의 국산 대체율이 크게 높아졌습니다.',
        related_numbers: '일본 수출규제 품목 3종 · 노재팬 불매운동으로 일본맥주 수입 97% 감소 · 대일 여행객 80% 감소 · 반도체 소재 국산화율 2019년 이후 크게 상승',
      },
      {
        id: 'mji-e7', event_date: '2020-01-20', title: '코로나19 첫 확진자 발생', description: '대한민국 코로나19 팬데믹 시작', impact_type: 'negative', significance_score: 95,
        why_it_matters: '전 세계를 뒤바꾼 코로나19 팬데믹이 한국에도 본격적으로 시작된 순간입니다. 이후 3년 이상 마스크 착용, 사회적 거리두기, 영업 제한 등이 일상이 되었고, 대한민국 사회 전반을 근본적으로 변화시켰습니다.',
        citizen_impact: '자영업자 폐업이 급증하고 청년 실업률이 치솟았습니다. 학교는 온라인 수업으로 전환되어 "학력 격차"가 벌어졌고, 1인 가구의 고독사가 증가했습니다. 반면 배달앱·OTT 등 비대면 산업은 폭발적으로 성장했습니다.',
        background: '2019년 12월 중국 우한에서 원인불명 폐렴이 보고된 후, 2020년 1월 20일 중국 우한에서 입국한 35세 여성이 한국 첫 확진자로 확인되었습니다. 이후 2월 신천지 대구교회 집단감염으로 확진자가 폭증했습니다.',
        what_happened_after: 'K-방역이라 불린 한국의 진단·추적·치료 체계가 세계적 주목을 받았습니다. 마스크 5부제, 사회적 거리두기 단계 시행 등을 거쳐, 2023년 5월 WHO가 긴급상황 해제를 선언했습니다.',
        related_numbers: '국내 누적 확진 3,470만명 이상 · 사망 3만5천명 이상 · 재난지원금 총 5차 지급 (1인당 최대 25만~100만원) · 자영업자 폐업 약 100만건 (2020-2022)',
      },
      {
        id: 'mji-e8', event_date: '2020-04-15', title: '21대 총선 여당 압승', description: '더불어민주당 180석 확보, 역대 최다 의석 기록', impact_type: 'positive', significance_score: 80,
        why_it_matters: '코로나19 초기 방역 성과에 대한 국민적 지지가 총선 결과로 나타났습니다. 여당이 300석 중 180석을 차지한 것은 1987년 민주화 이후 단일정당 최대 의석수로, 초강력 여대야소 국회가 탄생했습니다.',
        citizen_impact: '여당 압승으로 정부 정책 추진력이 강해져 공수처법, 검경수사권 조정법 등 쟁점 법안이 빠르게 통과되었습니다. 하지만 견제 없는 독주에 대한 우려도 커졌고, 부동산·검찰개혁 등에서 야당의 반대를 무시한다는 논란이 있었습니다.',
        background: '코로나19 확산 속에서도 예정대로 총선이 치러졌습니다. K-방역의 초기 성과와 재난지원금 지급이 여당에 유리하게 작용했고, 미래통합당(현 국민의힘)은 공천 갈등으로 분열되어 있었습니다.',
        what_happened_after: '민주당은 180석의 힘으로 공수처 설치법, 검경수사권 조정법을 통과시켰습니다. 하지만 임기 후반 부동산 폭등, LH 사태, 대장동 개발 의혹 등이 터지며 지지율이 하락했고, 2022년 대선에서 정권을 내주었습니다.',
        related_numbers: '민주당+시민당 180석 · 미래통합당+한국당 103석 · 투표율 66.2% (28년 만에 최고) · 사전투표율 26.7% (역대 최고)',
      },
      {
        id: 'mji-e9', event_date: '2020-07-10', title: '부동산 대책 25번째 발표', description: '잇따른 부동산 규제에도 주택가격 상승 지속, 정책 실효성 논란', impact_type: 'negative', significance_score: 78,
        why_it_matters: '문재인 정부가 집값을 잡겠다며 5년간 26번 이상의 부동산 대책을 내놓았지만 서울 아파트 가격이 오히려 2배 가까이 올랐습니다. 이는 정부 정책에 대한 신뢰를 크게 떨어뜨렸고, 2022년 대선 패배의 핵심 원인이 되었습니다.',
        citizen_impact: '서울 아파트 중위가격이 6억원에서 12억원으로 뛰어, "영끌(영혼까지 끌어모아 대출)"이라는 신조어가 등장했습니다. 전세가격도 급등하여 "전세난민"이 속출했고, 무주택 청년·신혼부부의 내 집 마련 희망이 사라졌습니다.',
        background: '2017년 취임 초 "부동산은 잡을 수 있다"고 자신한 문재인 정부는 다주택자 규제, 대출 규제, 세금 강화 등을 반복했습니다. 하지만 저금리와 유동성 증가 속에서 규제가 오히려 매물 잠김을 유발하며 역효과를 냈습니다.',
        what_happened_after: '2022년 윤석열 정부가 규제 완화로 전환했지만, 금리 인상과 맞물려 "영끌족"이 대출 이자에 고통받는 상황이 이어졌습니다. 부동산 문제는 한국 사회 최대 갈등 요인 중 하나로 남아있습니다.',
        related_numbers: '서울 아파트 중위가격: 2017년 6.1억 → 2022년 12.4억 (2배 상승) · 부동산 대책 26회 이상 · 전세가격 평균 52% 상승 · 종부세 대상자 2017년 33만명 → 2021년 95만명',
      },
      {
        id: 'mji-e10', event_date: '2021-03-24', title: 'LH 직원 투기 사건', description: '한국토지주택공사 직원들의 신도시 땅 투기 사건으로 공직자 윤리 논란', impact_type: 'negative', significance_score: 75,
        why_it_matters: '국민의 세금으로 신도시를 만드는 공기업 직원들이 미공개 정보로 땅 투기를 한 사건입니다. "내 집 마련도 어려운데 공무원이 땅 투기를 한다"는 분노가 폭발했고, 공직사회 전반의 부패에 대한 불신이 깊어졌습니다.',
        citizen_impact: '3기 신도시(광명시흥, 남양주왕숙 등)에 청약을 준비하던 무주택자들이 "처음부터 기울어진 운동장이었다"며 분노했습니다. 정부 부동산 정책에 대한 신뢰가 바닥을 쳤고, 2030세대의 정치적 이반이 가속되었습니다.',
        background: '참여연대와 민변 소속 변호사들이 LH 직원들의 3기 신도시 예정지 토지 매입 내역을 공개하면서 사건이 터졌습니다. 조사 결과 LH 직원뿐 아니라 공무원, 국회의원 가족까지 투기에 관여한 것이 밝혀졌습니다.',
        what_happened_after: '정부는 공직자 부동산 전수조사를 실시하고, 공직자 이해충돌방지법이 제정되었습니다. LH 임직원 수십 명이 징계·수사를 받았지만, "솜방망이 처벌"이라는 비판이 이어졌습니다.',
        related_numbers: 'LH 직원 투기 의혹 20명 이상 · 투기 규모 수십억원대 · 전국 공직자 부동산 전수조사 약 240만명 · 이해충돌방지법 2022년 시행',
      },
      {
        id: 'mji-e11', event_date: '2021-10-25', title: '코로나19 위드코로나 전환', description: '단계적 일상회복 이행, 이후 오미크론 변이로 다시 강화', impact_type: 'neutral', significance_score: 65,
        why_it_matters: '백신 접종률 70%를 넘기면서 "코로나와 함께 살기"로 방역 전략을 전환한 실험이었습니다. 하지만 오미크론 변이가 급속 확산되면서 한 달도 안 돼 다시 강화 조치로 돌아가, 방역 전략의 어려움을 보여줬습니다.',
        citizen_impact: '위드코로나 전환으로 식당·카페 영업시간 제한이 완화되어 자영업자들이 잠시 숨을 돌렸습니다. 하지만 한 달 만에 다시 강화되면서 "정부 말을 못 믿겠다"는 불만이 커졌고, 피로감이 극에 달했습니다.',
        background: '2021년 10월까지 백신 접종 완료율이 70%를 넘기면서 정부는 단계적 일상회복을 선언했습니다. 영업시간 제한 완화, 사적 모임 인원 확대 등의 조치가 시행되었습니다.',
        what_happened_after: '12월 오미크론 변이가 등장하며 하루 확진자가 수만 명씩 나오면서 다시 거리두기가 강화되었습니다. 이후 2022년 4월부터 실외 마스크 해제 등 단계적으로 일상 복귀가 이루어졌습니다.',
        related_numbers: '위드코로나 시행 35일 만에 중단 · 일일 확진자 2021년 12월 7,000명 돌파 · 백신 접종 완료율 80% 이상 · 중환자 병상 가동률 80% 초과',
      },
      {
        id: 'mji-e12', event_date: '2022-03-09', title: '제20대 대통령 선거', description: '윤석열 국민의힘 후보 당선, 여야 정권 교체', impact_type: 'neutral', significance_score: 85,
        why_it_matters: '역대 최소 득표차(0.73%)로 정권이 교체된 선거입니다. 부동산 폭등, 공정성 논란 등으로 2030세대 일부가 보수화되면서, 세대·성별에 따른 정치적 균열이 선거를 결정지었습니다.',
        citizen_impact: '새 정부 출범으로 부동산 규제 완화, 주 52시간 유연화, 검찰 수사권 복원 등 정책 기조가 크게 바뀌었습니다. 반면 문재인 정부 지지층은 5년간의 정책이 뒤집힐 것을 우려했습니다.',
        background: '문재인 정부 5년간 부동산 폭등, LH 사태, 대장동 의혹 등이 겹치면서 "공정" 이슈가 부상했습니다. 윤석열 후보는 검찰총장 시절 정부와의 갈등으로 인지도를 얻었고, "공정과 상식"을 내걸고 당선되었습니다.',
        what_happened_after: '윤석열 정부는 규제 완화, 한미 동맹 강화, 한일관계 개선에 나섰지만, 여소야대 국면에서 국정 운영에 어려움을 겪었습니다. 결국 2024년 12월 비상계엄 사태로 탄핵에 이르게 되었습니다.',
        related_numbers: '윤석열 48.56% vs 이재명 47.83% · 득표차 24만7,077표 (0.73%) · 역대 최소 격차 · 투표율 77.1% · 사전투표율 36.9%',
      },
    ],
    ysk: [
      {
        id: 'ysk-e1', event_date: '1993-02-25', title: '제14대 대통령 취임', description: '32년 만의 문민정부 출범', impact_type: 'positive', significance_score: 90,
        why_it_matters: '1961년 5.16 군사정변 이후 32년 만에 군인이 아닌 민간인 대통령이 탄생한 역사적 순간입니다. 김영삼 대통령은 취임사에서 "군은 정치적으로 중립을 지켜야 한다"고 천명하며 군사 권위주의 시대의 종식을 알렸습니다.',
        citizen_impact: '하나회 숙청으로 군부의 정치 개입 가능성이 사라졌고, 국민들은 처음으로 군사 쿠데타 걱정 없이 살 수 있게 되었습니다. 공직자 재산등록·공개제도가 시행되어 고위공직자의 재산이 처음 공개되었습니다.',
        background: '1987년 6월 항쟁으로 직선제가 부활한 뒤, 군 출신 노태우 대통령이 당선되었습니다. 김영삼은 3당 합당으로 여당에 합류한 뒤 1992년 대선에서 승리하여, 군사정권과 완전히 다른 문민정부를 출범시켰습니다.',
        what_happened_after: '하나회 해체, 역사바로세우기(전두환·노태우 구속), 금융실명제 등 개혁을 추진했습니다. 하지만 임기 말 아들 김현철의 비리와 IMF 외환위기로 임기를 불명예스럽게 마감했습니다.',
        related_numbers: '득표율 42.0% · 32년 만의 문민 대통령 · 하나회 장성 40여명 예편 · 공직자 재산등록 1만여명',
      },
      {
        id: 'ysk-e2', event_date: '1993-08-12', title: '금융실명제 전격 실시', description: '대통령 긴급재정경제명령으로 금융실명제 즉시 시행', impact_type: 'positive', significance_score: 95,
        why_it_matters: '그동안 가명·차명 계좌로 정치자금과 뇌물이 오가던 관행을 뿌리뽑은 혁명적 조치입니다. 대통령 긴급명령이라는 초강수를 두어 모든 금융거래를 실명으로만 할 수 있게 했고, 이는 한국 경제 투명성의 기초가 되었습니다.',
        citizen_impact: '차명 계좌가 금지되면서 정치인·재벌의 비자금 조성이 어려워졌습니다. 일반 국민들도 은행에서 반드시 실명으로 거래해야 했지만, 장기적으로 세금 형평성이 높아지고 지하경제가 축소되는 효과를 가져왔습니다.',
        background: '박정희 정부 때부터 금융실명제는 논의되었지만, 재벌과 정치권의 반발로 실현되지 못했습니다. 김영삼 대통령은 사전 공개 시 자금 도피가 일어날 것을 우려해, 퇴근 후 저녁 8시에 TV 담화로 전격 발표했습니다.',
        what_happened_after: '초기에 주가 급락과 부동산 시장 위축이 있었지만, 금융 투명성이 크게 높아졌습니다. 다만 차명거래가 완전히 근절되지는 않았고, 2014년 차명거래금지법이 추가로 제정되었습니다.',
        related_numbers: '발표 당일 차명계좌 4,300만개 파악 · 가명 예금 약 12조원 규모 · 주가 발표 다음날 4.5% 하락 · 지하경제 비율 GDP 대비 28%에서 20%대로 감소',
      },
      {
        id: 'ysk-e3', event_date: '1995-06-29', title: '삼풍백화점 붕괴', description: '502명 사망, 역대 최대 건물 붕괴 참사', impact_type: 'negative', significance_score: 88,
        why_it_matters: '영업 중인 백화점이 갑자기 무너져 502명이 숨진, 한국 역사상 최악의 건물 붕괴 참사입니다. 부실시공, 불법 증축, 안전점검 무시 등 한국 사회의 "빨리빨리" 문화와 안전 불감증이 만든 인재(人災)였습니다.',
        citizen_impact: '시민들은 "백화점도 무너질 수 있다"는 충격에 휩싸였습니다. 이후 건축물 안전점검이 강화되고, 재난관리 체계가 개편되었습니다. 유가족들은 수십 년간 진상규명과 재발방지를 요구해왔습니다.',
        background: '삼풍백화점은 원래 아파트로 설계되었다가 도중에 백화점으로 용도를 변경했습니다. 5층 위에 불법으로 식당가를 증축했고, 붕괴 징후(균열, 소음)가 나타났는데도 건물주는 영업을 계속했습니다.',
        what_happened_after: '건물주 이준(회장)은 징역 10년 6개월을 선고받았습니다. 정부는 재난관리법을 개정하고, 전국 건축물 안전점검을 실시했습니다. 하지만 19년 뒤 세월호 참사가 반복되면서 "삼풍의 교훈을 잊었다"는 비판이 나왔습니다.',
        related_numbers: '사망 502명 · 부상 937명 · 실종 6명 · 구조까지 최장 17일 생존 · 건물주 징역 10년 6개월 · 붕괴 20초 만에 전체 붕괴',
      },
      {
        id: 'ysk-e4', event_date: '1996-12-12', title: 'OECD 가입', description: '경제협력개발기구 29번째 회원국 가입', impact_type: 'positive', significance_score: 82,
        why_it_matters: '한국이 선진국 클럽이라 불리는 OECD(경제협력개발기구)에 29번째 회원국으로 가입한 것은, 전쟁 폐허에서 선진국 대열에 합류했다는 상징적 의미가 컸습니다. "한강의 기적"이 국제적으로 인정받은 순간이었습니다.',
        citizen_impact: '"우리나라도 선진국이 되었다"는 자부심이 높아졌습니다. 하지만 OECD 가입 조건으로 금융시장 개방과 자본 자유화를 약속했는데, 이것이 1년 뒤 IMF 외환위기의 원인 중 하나가 되었습니다.',
        background: '1988년 서울올림픽 이후 국제사회에서 한국의 위상이 높아졌고, 1인당 GDP 1만 달러를 돌파하면서 OECD 가입 논의가 본격화되었습니다. 김영삼 정부는 "세계화"를 국정 목표로 내걸고 가입을 추진했습니다.',
        what_happened_after: '가입 1년 만에 IMF 외환위기가 터지면서 "준비 안 된 선진국"이라는 비판을 받았습니다. 금융시장 개방이 외자 유출입을 가속화해 위기를 키웠다는 분석이 있습니다. 하지만 장기적으로 한국의 제도 선진화에 기여했습니다.',
        related_numbers: 'OECD 29번째 회원국 (아시아 2번째, 일본 다음) · 가입 당시 1인당 GDP 약 12,000달러 · 금융시장 개방 로드맵 제시 · 가입 1년 후 IMF 위기 발생',
      },
      {
        id: 'ysk-e5', event_date: '1997-11-21', title: 'IMF 구제금융 신청', description: '외환보유고 고갈로 IMF에 구제금융 요청, 경제 주권 위기', impact_type: 'negative', significance_score: 98,
        why_it_matters: '대한민국 역사상 최대 경제 위기입니다. 나라가 빚을 갚을 돈이 없어서 국제통화기금(IMF)에 돈을 빌린 사건으로, 이후 대규모 구조조정과 대량 실업이 발생했습니다.',
        citizen_impact: '직장인 100만명 이상이 해고되었고, 금리가 30%까지 치솟아 대출 이자가 3배로 뛰었습니다. "금 모으기 운동"으로 국민이 직접 금을 모아 외환보유고를 채웠습니다.',
        background: '김영삼 정부의 급격한 금융시장 개방과 재벌의 과도한 차입 경영이 원인이었습니다. 태국에서 시작된 아시아 금융위기가 한국으로 번졌고, 한보철강·기아 부도 등이 연쇄 발생했습니다.',
        what_happened_after: '김대중 정부가 3년 만에 IMF 차관을 조기 상환했고, 한국 경제는 IT 산업 중심으로 재편되었습니다. 하지만 비정규직 확산, 양극화 심화 등 부작용이 지금까지 이어지고 있습니다.',
        related_numbers: 'IMF 차관 195억 달러 · 실업률 7% 돌파 (당시 사상 최고) · 원/달러 환율 1,962원까지 폭등 · 30대 재벌 중 절반 해체',
      },
    ],
    kdj: [
      {
        id: 'kdj-e1', event_date: '1998-02-25', title: 'IMF 외환위기 중 취임', description: '국가 부도 위기 속 경제 위기 극복 과제 부여', impact_type: 'negative', significance_score: 92,
        why_it_matters: '대한민국이 사실상 국가 부도 상태에서 취임한 대통령입니다. 외환보유고가 바닥나고 기업이 연쇄 도산하는 최악의 경제 위기 속에서, "경제 대통령"으로서 나라를 구해야 하는 전무후무한 과제를 안고 출발했습니다.',
        citizen_impact: '취임 당시 실업률이 7%를 넘고, 매달 수만 명이 해고되고 있었습니다. 중산층 가정이 하루아침에 노숙자로 전락하는 일이 속출했고, "명예퇴직"이라는 이름의 구조조정이 전 산업에 걸쳐 진행되었습니다.',
        background: '1997년 11월 IMF 구제금융을 신청한 후, 대선에서 김대중 후보가 당선되었습니다. "준비된 대통령"을 내세웠고, 야당 후보 최초로 대통령에 당선되어 한국 역사상 첫 수평적 정권교체를 이루었습니다.',
        what_happened_after: '강도 높은 구조조정과 외자 유치, 금 모으기 운동, IT 산업 육성 등을 통해 3년 만에 IMF 자금을 조기 상환했습니다. "위기를 기회로" 바꾼 리더십으로 평가받지만, 비정규직 양산이라는 그림자도 남겼습니다.',
        related_numbers: '취임 당시 외환보유고 39억 달러 · 실업률 7.0% · 기업 부도 하루 평균 80건 · 첫 수평적 정권교체',
      },
      {
        id: 'kdj-e2', event_date: '1998-06-15', title: '금 모으기 운동', description: '국민 자발적 금 모으기로 외환보유고 확충', impact_type: 'positive', significance_score: 80,
        why_it_matters: '나라가 위기에 빠지자 국민이 직접 집안의 금반지, 금목걸이를 모아 나라 빚을 갚자고 나선, 세계에서도 전례를 찾기 어려운 국민 운동입니다. 한국인의 단결력과 애국심을 보여준 상징적 사건으로 지금도 회자됩니다.',
        citizen_impact: '전국 350만 명이 참여해 227톤의 금(약 21억 달러)을 모았습니다. 결혼반지, 돌반지 등 개인적으로 소중한 금을 내놓으면서 눈물을 흘리는 장면이 전 세계 뉴스에 방영되었습니다.',
        background: 'IMF 구제금융 이후 외환보유고가 바닥나고, 원화 가치가 폭락하고 있었습니다. 한국방송(KBS) 등 언론이 금 모으기 캠페인을 시작했고, 순식간에 전국적인 국민 운동으로 확산되었습니다.',
        what_happened_after: '모인 금은 외환보유고 확충에 기여했고, 이는 외채 상환과 환율 안정에 도움이 되었습니다. 하지만 일부에서는 금을 헐값에 사들인 금은방·은행이 차익을 챙겼다는 비판도 있었습니다.',
        related_numbers: '참여 국민 약 350만명 · 수집 금 약 227톤 · 금액 약 21억 달러 · 1인당 평균 기부 금 약 65g',
      },
      {
        id: 'kdj-e3', event_date: '2000-06-15', title: '제1차 남북정상회담', description: '분단 55년 만에 첫 남북정상회담, 6.15 공동선언', impact_type: 'positive', significance_score: 98,
        why_it_matters: '한국전쟁 이후 55년 만에 남북 정상이 처음 만난 역사적 사건입니다. 김대중 대통령이 평양을 방문하여 김정일 국방위원장과 6.15 남북공동선언에 서명했고, 이는 남북 화해의 이정표가 되었습니다.',
        citizen_impact: '이산가족 상봉이 성사되어 50년 만에 헤어진 가족이 재회했습니다. 금강산 관광이 시작되어 일반 국민도 북한 땅을 밟을 수 있게 되었고, 개성공단 건설로 남북 경제협력의 물꼬가 트였습니다.',
        background: '김대중 대통령은 취임 때부터 "햇볕정책"을 추진했습니다. 대북 유화정책으로 비밀 접촉을 통해 정상회담을 성사시켰으나, 이후 현대 정주영 회장의 5억 달러 대북 송금이 밝혀져 논란이 되었습니다.',
        what_happened_after: '6.15 선언 이후 이산가족 상봉, 금강산 관광, 개성공단 건설 등이 추진되었습니다. 김대중 대통령은 같은 해 노벨평화상을 수상했습니다. 하지만 대북송금 특검으로 정상회담의 정당성 논란이 이어졌습니다.',
        related_numbers: '분단 55년 만의 첫 정상회담 · 6.15 공동선언 5개 항목 · 이산가족 상봉 이후 21차례 실시 · 대북 비밀송금 5억 달러 논란',
      },
      {
        id: 'kdj-e4', event_date: '2000-12-10', title: '노벨평화상 수상', description: '한국 최초 노벨상, 남북 화해에 기여한 공로', impact_type: 'positive', significance_score: 95,
        why_it_matters: '한국인 최초의 노벨상 수상입니다. 남북정상회담 성사와 한반도 평화, 아시아 민주주의 발전에 기여한 공로로 노벨평화상을 받았습니다. 군사독재에 맞서 6번의 죽을 고비를 넘긴 민주투사에서 노벨상 수상자가 된 극적인 인생이 세계를 감동시켰습니다.',
        citizen_impact: '한국의 국제적 위상이 크게 높아졌고, "한국인도 노벨상을 받을 수 있다"는 자부심이 퍼졌습니다. 하지만 이후 대북 비밀송금 논란으로 "돈으로 산 정상회담"이라는 비판도 제기되어 수상의 정당성에 대한 논쟁이 있었습니다.',
        background: '김대중 대통령은 1973년 도쿄에서 중앙정보부에 납치되고, 1980년 내란음모죄로 사형선고를 받는 등 민주화 운동 과정에서 수차례 생사의 기로에 섰습니다. 이런 배경과 함께 2000년 남북정상회담 성사가 수상의 결정적 계기가 되었습니다.',
        what_happened_after: '노벨평화상 상금 전액(약 10억원)을 연세대학교 김대중도서관에 기부했습니다. 하지만 2003년 대북 비밀송금 특검으로 정상회담 성사 과정의 논란이 불거지면서 수상을 둘러싼 평가가 엇갈리고 있습니다.',
        related_numbers: '한국인 최초 노벨상 · 노벨평화상 상금 약 10억원 기부 · 민주화 운동 중 사형선고 1회, 납치 1회, 투옥 6년, 연금 10년 · 아시아 3번째 노벨평화상 수상',
      },
      {
        id: 'kdj-e5', event_date: '2001-08-23', title: 'IMF 조기 졸업 선언', description: '예정보다 3년 일찍 IMF 자금 전액 상환', impact_type: 'positive', significance_score: 90,
        why_it_matters: '1997년 말 빌린 IMF 자금 195억 달러를 당초 예정(2004년)보다 3년 일찍 전액 상환한 사건입니다. "국가 부도" 위기에서 불과 3년 8개월 만에 빚을 다 갚은 것은 세계 경제사에서도 이례적인 성과로 평가됩니다.',
        citizen_impact: '"IMF 졸업"은 국민들에게 큰 안도감을 주었고, 경제 회복에 대한 자신감이 살아났습니다. 하지만 구조조정 과정에서 비정규직이 전체 노동자의 절반 이상으로 늘어났고, 이는 오늘날까지 고용 불안의 원인이 되고 있습니다.',
        background: '김대중 정부는 "고통 분담"을 내걸고 재벌 구조조정(빅딜), 금융기관 통폐합, 공기업 민영화, 외국인 투자 유치 등을 강하게 추진했습니다. 동시에 IT 산업 육성으로 새로운 성장 동력을 만들었습니다.',
        what_happened_after: '한국 경제는 IT·반도체·자동차 중심으로 재편되었고, 2002년 월드컵 4강 등과 맞물려 국가 자신감이 회복되었습니다. 하지만 양극화 심화, 비정규직 문제, 카드대란 등 IMF 이후의 부작용도 나타났습니다.',
        related_numbers: 'IMF 차관 195억 달러 전액 상환 · 상환 기간 3년 8개월 (예정보다 3년 앞당김) · 외환보유고 1997년 39억 → 2001년 1,028억 달러 · 비정규직 비율 50% 이상으로 증가',
      },
    ],
    nmh: [
      {
        id: 'nmh-e1', event_date: '2003-02-25', title: '제16대 대통령 취임', description: '참여정부 출범, 분권과 자율 강조', impact_type: 'positive', significance_score: 80,
        why_it_matters: '고졸 출신 인권변호사가 대통령이 된 파격적인 사건입니다. "권위주의 타파"와 "참여민주주의"를 내걸었고, 인터넷 세대인 2030의 열광적 지지로 당선되었습니다. 한국 정치사에서 "엘리트가 아닌 대통령"의 상징이 되었습니다.',
        citizen_impact: '노무현 대통령은 청와대 권위를 파격적으로 깨뜨렸습니다. 기자간담회에서 직접 답하고, 인터넷 소통을 중시했으며, 행정수도 이전(세종시)을 추진하여 수도권 집중을 완화하려 했습니다.',
        background: '2002년 대선은 "노풍(노무현 바람)"이라 불릴 만큼 인터넷 기반 풀뿌리 선거운동이 돋보였습니다. 노사모(노무현을 사랑하는 모임)가 온라인에서 조직되었고, 젊은 세대의 정치 참여를 이끌어냈습니다.',
        what_happened_after: '탄핵 소추, 부동산 급등, 한미 FTA 논란 등으로 임기 내내 고전했습니다. 퇴임 후 봉하마을에서 검소하게 생활했으나, 2009년 5월 검찰 수사 중 서거하여 국민적 충격을 안겼습니다.',
        related_numbers: '득표율 48.9% · 노사모 회원 수만명 · 지지율 최저 5.7% (역대 최저) · 행정수도 이전 위헌 결정',
      },
      {
        id: 'nmh-e2', event_date: '2004-03-12', title: '국회 탄핵 소추', description: '야당 주도 탄핵 소추안 가결', impact_type: 'negative', significance_score: 90,
        why_it_matters: '대한민국 헌정 사상 최초의 대통령 탄핵 소추입니다. 대통령이 특정 정당 지지 발언을 했다는 이유로 야당이 탄핵을 추진했는데, 많은 국민들은 "이 정도로 탄핵이 되느냐"며 반발했습니다. 이 사건은 역설적으로 시민들의 정치 참여를 크게 자극했습니다.',
        citizen_impact: '탄핵 반대 촛불집회가 전국에서 열렸고, 100만 명 이상이 참여했습니다. 탄핵에 분노한 국민들은 한 달 뒤 총선에서 열린우리당에 152석을 몰아주었고, 탄핵을 주도한 한나라당은 참패했습니다.',
        background: '노무현 대통령이 기자회견에서 "국민이 열린우리당을 지지해달라"고 발언한 것이 선거법 위반이라는 이유로, 한나라당·민주당이 합세하여 탄핵 소추안을 가결시켰습니다. 대통령 권한은 즉시 정지되었습니다.',
        what_happened_after: '헌법재판소는 2개월 뒤 "탄핵 사유가 파면에 이를 정도로 중대하지 않다"며 기각 결정을 내렸습니다. 노무현 대통령은 복귀했지만, 이 사건은 여야 갈등을 더 깊게 만들었습니다.',
        related_numbers: '탄핵 소추안 찬성 193표 · 탄핵 반대 촛불집회 100만명 이상 · 17대 총선 열린우리당 152석 (과반) · 헌재 심판 63일 소요',
      },
      {
        id: 'nmh-e3', event_date: '2004-05-14', title: '헌법재판소 탄핵 기각', description: '탄핵 심판 인용 기각, 대통령직 복귀', impact_type: 'positive', significance_score: 88,
        why_it_matters: '헌법재판소가 "선거법 위반은 인정되지만 파면에 이를 정도로 중대하지 않다"며 탄핵을 기각한 것은, 민주주의의 최후 보루인 헌법재판소가 정치적 탄핵을 막아낸 사례로 평가됩니다.',
        citizen_impact: '63일간의 대통령 권한 정지가 끝나고 국정이 정상화되었습니다. 국민들은 "탄핵은 아무나 할 수 있는 게 아니다"라는 인식을 갖게 되었고, 동시에 헌법재판소의 역할과 중요성을 실감하게 되었습니다.',
        background: '탄핵 소추 직후 여론조사에서 탄핵 반대가 70%를 넘었고, 17대 총선에서 야당이 참패하면서 탄핵의 명분이 크게 약해졌습니다. 헌재는 재판관 9명 중 과반수(5명 이상) 찬성이 있어야 탄핵을 인용할 수 있었습니다.',
        what_happened_after: '노무현 대통령은 복귀했지만 레임덕에 시달렸습니다. 이후 한미 FTA 추진, 부동산 정책 등에서 좌우 양쪽의 비판을 받았고, 지지율은 저조한 상태가 지속되었습니다.',
        related_numbers: '헌재 재판관 9명 중 인용 찬성 미달 · 탄핵 기간 63일 · 탄핵 반대 여론 70% 이상 · 대통령 복귀 후 지지율 30%대',
      },
      {
        id: 'nmh-e4', event_date: '2006-04-01', title: '한미 FTA 협상 개시', description: '한미 자유무역협정 공식 협상 개시', impact_type: 'neutral', significance_score: 78,
        why_it_matters: '세계 최대 경제대국 미국과의 자유무역협정(FTA)은 한국 경제의 개방 수준을 한 단계 끌어올린 사건입니다. 하지만 농업·축산업 피해 우려로 농민단체가 격렬히 반대했고, 한국 사회를 "개방 vs 보호" 논쟁으로 양분시켰습니다.',
        citizen_impact: '한미 FTA가 발효된 후 미국산 쇠고기·과일 등이 저렴해져 소비자에게 혜택이 돌아갔지만, 한우 농가와 과수 농가는 경쟁 심화로 큰 타격을 받았습니다. 자동차·전자 수출기업은 관세 철폐로 경쟁력이 강화되었습니다.',
        background: '노무현 대통령은 진보 성향임에도 경제 개방의 필요성을 인식하고 한미 FTA를 추진했습니다. 이는 지지층인 진보진영의 강한 반발을 불러왔고, "진보가 왜 FTA를 하느냐"는 비판이 쏟아졌습니다.',
        what_happened_after: '협상은 2007년 타결되었지만, 비준은 이명박 정부 때인 2012년에야 이루어졌습니다. 발효 후 한미 교역량이 크게 늘었고, 이후 한국은 EU·중국 등과도 FTA를 연쇄 체결하여 "FTA 허브 국가"가 되었습니다.',
        related_numbers: '한미 FTA 2012년 발효 · 발효 후 대미 수출 30% 이상 증가 · 한국 FTA 체결국 59개국 (2025년 기준) · 농업 피해 보전 예산 연간 수천억원',
      },
      {
        id: 'nmh-e5', event_date: '2007-10-04', title: '제2차 남북정상회담', description: '10.4 남북공동선언, 경제협력 합의', impact_type: 'positive', significance_score: 85,
        why_it_matters: '노무현 대통령이 걸어서 군사분계선을 넘어 평양으로 간 장면은 한반도 평화의 상징으로 남아있습니다. 10.4 선언에서 남북 경제협력 확대, 서해평화지대 구상 등 구체적인 평화 로드맵을 합의했습니다.',
        citizen_impact: '개성공단 2단계 확대, 해주경제특구 개발, 남북 철도·도로 연결 등이 합의되어 경제적 기대감이 높아졌습니다. 이산가족 상봉도 확대되어 더 많은 가족이 만날 수 있을 것이라는 희망이 생겼습니다.',
        background: '노무현 대통령은 임기 말에 김정일 위원장과 정상회담을 추진했습니다. 임기 5개월을 남기고 열린 회담이어서 "너무 늦었다"는 비판도 있었지만, 6.15 선언을 계승·발전시킨다는 의미가 있었습니다.',
        what_happened_after: '정권이 이명박 정부로 교체되면서 10.4 선언의 합의사항 대부분은 이행되지 못했습니다. 이명박 정부는 "비핵·개방·3000" 정책으로 대북정책 기조를 바꿨고, 남북관계는 다시 경색되었습니다.',
        related_numbers: '10.4 선언 8개 항목 합의 · 군사분계선 도보 통과 (역대 최초) · 개성공단 2단계 확대, 해주경제특구 건설 합의 · 서해평화협력지대 설치 합의',
      },
    ],
    lmb: [
      {
        id: 'lmb-e1', event_date: '2008-02-25', title: '제17대 대통령 취임', description: '실용정부 표방, 경제 살리기 강조', impact_type: 'positive', significance_score: 78,
        why_it_matters: '현대건설 CEO 출신으로 "경제 대통령"을 자처하며 당선된 이명박 대통령은 "747 공약"(7% 성장, 4만불 소득, 세계 7위 경제)을 내걸었습니다. 10년 만의 보수 정권 교체로 정책 기조가 크게 바뀌었습니다.',
        citizen_impact: '감세 정책과 규제 완화가 추진되어 기업 환경이 개선되었지만, "부자감세"라는 비판도 받았습니다. 고환율 정책으로 수출기업은 혜택을 받았지만, 수입 물가 상승으로 서민 생활비 부담이 늘었습니다.',
        background: '노무현 정부 말기 부동산 급등과 양극화에 대한 불만이 커지면서, "경제를 살릴 수 있는 CEO형 대통령"에 대한 기대가 높았습니다. 이명박 후보는 현대건설 사장 시절의 경영 경험을 앞세워 압도적으로 당선되었습니다.',
        what_happened_after: '취임 직후 광우병 촛불시위로 곤란을 겪었고, 글로벌 금융위기가 닥치면서 747 공약은 사실상 폐기되었습니다. 4대강 사업, 자원외교 등을 추진했으나 많은 논란을 남겼습니다.',
        related_numbers: '득표율 48.7% (531만 표차 역대 최다) · 747 공약: 7% 성장, 4만불 소득, 세계 7위 · 실제 평균 성장률 3.2%',
      },
      {
        id: 'lmb-e2', event_date: '2008-06-10', title: '미국산 쇠고기 수입 촛불시위', description: '광우병 우려로 대규모 촛불집회, 100만 시위대', impact_type: 'negative', significance_score: 85,
        why_it_matters: '취임 100일도 안 된 정부가 미국산 쇠고기 수입 개방을 결정하자, "광우병 위험이 있는 고기를 먹게 되는 것 아니냐"는 공포가 퍼지면서 연인원 100만 명이 넘는 촛불시위가 벌어졌습니다. 인터넷 시대 최초의 대규모 시민 불복종이었습니다.',
        citizen_impact: '2개월 넘게 이어진 촛불시위로 도심이 마비되었고, 시위에 참가한 시민과 경찰 모두 부상자가 속출했습니다. 정부는 결국 쇠고기 수입 조건을 재협상했고, 국민들은 "거리에서 정치를 바꿀 수 있다"는 경험을 했습니다.',
        background: '이명박 정부는 한미 동맹 강화 차원에서 미국산 쇠고기 수입을 전면 개방했습니다. 당시 미국에서 광우병(BSE)이 발생한 적이 있어 국민 불안이 컸고, MBC PD수첩 방송이 공포를 확산시켰습니다.',
        what_happened_after: '정부는 30개월 미만 소만 수입하는 것으로 재협상했고, 촛불시위는 점차 수그러들었습니다. 하지만 이 사건으로 이명박 정부의 지지율은 급락했고, 임기 초반부터 국정 운영에 큰 타격을 받았습니다.',
        related_numbers: '촛불시위 연인원 100만명 이상 · 시위 기간 약 100일 · 쇠고기 재협상: 30개월 미만 소 수입 · 대통령 지지율 20%대로 급락',
      },
      {
        id: 'lmb-e3', event_date: '2008-09-15', title: '리먼 브라더스 파산', description: '글로벌 금융위기 발생, 한국 경제에 직격탄', impact_type: 'negative', significance_score: 90,
        why_it_matters: '미국 4위 투자은행 리먼 브라더스의 파산으로 시작된 글로벌 금융위기가 한국 경제를 강타했습니다. 코스피가 반토막 나고 원/달러 환율이 1,500원을 돌파하면서, IMF 이후 최악의 경제 위기가 찾아왔습니다.',
        citizen_impact: '주식·펀드에 투자한 일반인들이 큰 손실을 입었고, 수출 기업 중심으로 대규모 구조조정이 진행되었습니다. "88만원 세대"라는 말이 유행하며 청년 취업난이 사회 문제로 부각되었습니다.',
        background: '미국에서 서브프라임 모기지(비우량 주택담보대출) 부실이 터지면서 글로벌 금융시스템이 마비되었습니다. 한국은 수출 의존도가 높고 외국인 자금 비중이 커서 직격탄을 맞았습니다.',
        what_happened_after: '이명박 정부는 대규모 재정 투입과 환율 방어에 나섰습니다. 한미 통화스와프(300억 달러)를 체결하여 외환시장을 안정시켰고, 2009년 하반기부터 빠르게 회복하여 V자 반등에 성공했습니다.',
        related_numbers: '코스피 2008년 10월 938포인트 (전고점 대비 54% 하락) · 원/달러 1,513원까지 폭등 · 한미 통화스와프 300억 달러 · 2009년 경제성장률 0.8% (간신히 플러스)',
      },
      {
        id: 'lmb-e4', event_date: '2009-01-20', title: '4대강 정비사업 발표', description: '22조원 규모 4대강 사업 발표, 환경 논란', impact_type: 'neutral', significance_score: 82,
        why_it_matters: '이명박 정부 최대의 국책사업으로, 한강·낙동강·금강·영산강에 16개 보를 건설하고 강바닥을 준설한 초대형 토목 프로젝트입니다. "녹색 뉴딜"이라는 이름으로 추진되었지만, 환경 파괴 논란이 끊이지 않은 한국 현대사 최대의 환경 논쟁이었습니다.',
        citizen_impact: '건설업계에 대규모 일자리와 매출이 생겼지만, 강 주변 주민들은 녹조 발생, 물고기 떼죽음, 수질 악화 등에 시달렸습니다. "녹조라떼"라는 신조어가 생길 만큼 수질 문제가 심각했습니다.',
        background: '이명박 후보는 대선 때 "한반도 대운하"를 공약했다가 여론 반발로 철회했습니다. 이를 "4대강 정비사업"으로 축소·변환하여 추진했는데, 사실상 대운하의 다른 이름이라는 비판이 있었습니다.',
        what_happened_after: '감사원이 4대강 사업의 부실을 지적했고, 문재인 정부에서 보 해체 논의가 진행되었습니다. 일부 보(세종보, 죽산보 등)는 개방·철거되었지만, 나머지는 유지와 해체를 둘러싼 논란이 계속되고 있습니다.',
        related_numbers: '총사업비 22.2조원 · 16개 보 건설 · 5.7억 세제곱미터 준설 · 녹조 발생 구간 매년 반복 · 감사원 지적사항 수십 건',
      },
      {
        id: 'lmb-e5', event_date: '2010-11-12', title: 'G20 서울 정상회의', description: '한국 첫 G20 의장국, 국제적 위상 강화', impact_type: 'positive', significance_score: 88,
        why_it_matters: '한국이 비서구권 국가 중 최초로 G20 정상회의를 개최한 것은 국제 무대에서의 위상이 크게 높아졌음을 보여주는 사건입니다. 글로벌 금융위기 이후 세계 경제 질서를 논의하는 최고위급 회의의 의장국이 된 것은 대한민국의 경제적 성장을 상징합니다.',
        citizen_impact: '서울 전역에 대규모 교통 통제가 시행되어 시민 불편이 있었지만, "우리나라가 세계 정상들을 초대할 수 있는 나라가 되었다"는 자부심이 컸습니다. 외국 정상 및 언론의 한국 방문으로 관광·문화 홍보 효과도 있었습니다.',
        background: '2008년 글로벌 금융위기 이후 G20이 세계 경제 거버넌스의 핵심 기구로 부상했습니다. 한국은 위기 극복 경험과 선진국-개도국 사이의 가교 역할을 내세워 의장국을 유치했습니다.',
        what_happened_after: 'G20 서울 정상회의에서 "서울 개발 합의"를 채택하여 개발도상국 지원 의제를 주류화했습니다. 이후 한국은 MIKTA(멕시코·인도네시아·한국·터키·호주) 등 중견국 외교를 강화하는 계기로 삼았습니다.',
        related_numbers: 'G20 회원국 정상 20명 서울 집결 · 비서구권 최초 G20 의장국 · 경호인력 5만명 투입 · 서울 개발 합의문 채택',
      },
    ],
    pgh: [
      {
        id: 'pgh-e1', event_date: '2013-02-25', title: '제18대 대통령 취임', description: '최초의 여성 대통령, 경제민주화와 창조경제 표방', impact_type: 'positive', significance_score: 85,
        why_it_matters: '대한민국 헌정 사상 최초의 여성 대통령이자, 전직 대통령(박정희)의 딸이 대통령이 된 유일무이한 사례입니다. "경제민주화"와 "창조경제"를 내걸었고, 아버지 시대의 경제 성장 향수와 여성 리더십에 대한 기대가 합쳐져 당선되었습니다.',
        citizen_impact: '여성 대통령의 탄생으로 "유리천장"을 깬다는 상징적 의미가 컸습니다. 창조경제혁신센터가 전국에 설립되었지만, "창조경제가 뭔지 모르겠다"는 국민 반응이 많았고, 경제민주화 공약 대부분은 후퇴했습니다.',
        background: '2012년 대선에서 박근혜 후보는 "100% 대한민국"을 내걸고 복지 확대, 경제민주화를 약속했습니다. 아버지 박정희에 대한 향수와 최초 여성 대통령이라는 상징성이 시너지를 내며 51.6%의 득표율로 당선되었습니다.',
        what_happened_after: '세월호 참사(2014), MERS 사태(2015), 최순실 국정농단(2016)이 연이어 터지면서 임기가 파탄 났습니다. 결국 2017년 3월 헌법재판소의 탄핵 인용으로 파면된 최초의 대통령이 되었습니다.',
        related_numbers: '득표율 51.6% · 최초 여성 대통령 · 창조경제혁신센터 17개 설립 · 임기 4년 1개월 만에 파면',
      },
      {
        id: 'pgh-e2', event_date: '2014-04-16', title: '세월호 참사', description: '304명 사망, 대한민국 역대 최악의 해양 참사', impact_type: 'negative', significance_score: 98,
        why_it_matters: '수학여행을 떠난 고등학생 250명을 포함해 304명이 숨진 대한민국 역대 최악의 해양 참사입니다. 침몰하는 배에서 "가만히 있으라"는 방송이 나온 것, 선장이 먼저 탈출한 것, 정부의 구조 실패가 겹치며 온 국민이 트라우마를 겪었습니다.',
        citizen_impact: '전 국민이 TV로 침몰 과정을 지켜보며 무력감에 빠졌습니다. "이게 나라냐"는 분노가 확산되었고, 이후 안전 불감증, 관피아(관료+마피아), 규제 완화의 문제점이 집중 조명되었습니다. 노란 리본은 추모와 안전사회를 바라는 시민들의 상징이 되었습니다.',
        background: '세월호는 무리한 증축과 과적 운항을 반복해왔고, 해운업 규제 완화로 안전 감독이 느슨해진 상태였습니다. 선박 소유 구조도 복잡했으며, 청해진해운의 실소유주 유병언 회장의 부실 경영이 문제였습니다.',
        what_happened_after: '특별법 제정, 특별조사위원회 구성 등이 이뤄졌지만 진상규명은 난항을 겪었습니다. 2017년 세월호가 인양되었고, 이 참사는 2016년 촛불혁명과 박근혜 탄핵의 근본적 원인 중 하나가 되었습니다.',
        related_numbers: '사망 304명 (학생 250명 포함) · 생존 172명 · 구조 소요시간 논란 · 선장 무기징역 · 세월호 인양 2017년 3월 · 특조위 활동 기간 논란',
      },
      {
        id: 'pgh-e3', event_date: '2015-06-09', title: 'MERS 사태', description: '중동호흡기증후군 확산, 38명 사망, 방역 체계 논란', impact_type: 'negative', significance_score: 75,
        why_it_matters: '중동에서 유입된 메르스(MERS) 바이러스가 병원 내에서 급속 확산되어 38명이 사망한 감염병 사태입니다. 정부의 초기 대응 실패, 병원 이름 비공개 논란 등이 불거지며 방역 체계의 근본적 문제가 드러났습니다.',
        citizen_impact: '감염 경로를 추적하지 못해 불안이 확산되었고, 정부가 병원 이름을 공개하지 않아 국민들은 "어느 병원이 위험한지 모른다"며 공포에 빠졌습니다. 학교 휴교, 관광 취소가 잇따라 경제적 피해도 컸습니다.',
        background: '중동을 다녀온 68세 남성이 첫 확진자였고, 여러 병원을 전전하면서 "슈퍼전파"가 발생했습니다. 대형 병원 응급실의 과밀 환경과 다인실 병실 문화가 확산을 키웠습니다.',
        what_happened_after: 'MERS 사태의 교훈으로 질병관리본부가 강화되었고, 감염병 대응 매뉴얼이 전면 개편되었습니다. 이 경험이 5년 뒤 코로나19 대응의 기반이 되어, K-방역의 초기 성공에 기여했습니다.',
        related_numbers: '확진 186명 · 사망 38명 · 격리 16,752명 · 병원 내 감염 비율 90% 이상 · 경제적 피해 약 10조원 추정',
      },
      {
        id: 'pgh-e4', event_date: '2016-10-24', title: '최순실 국정농단 보도', description: 'JTBC 태블릿PC 보도로 국정농단 실체 드러남', impact_type: 'negative', significance_score: 95,
        why_it_matters: 'JTBC가 최순실의 태블릿PC를 입수하여, 대통령의 연설문과 인사 정보를 민간인이 사전에 수정·열람한 사실을 보도했습니다. 선출되지 않은 민간인이 국정을 좌지우지한 초유의 사태로, 대한민국 민주주의의 근간을 뒤흔든 사건입니다.',
        citizen_impact: '"이게 나라냐"는 분노가 폭발했고, 매주 토요일 광화문에서 촛불집회가 열렸습니다. 최순실 일가의 이화여대 부정입학, 재벌 기업 강제 모금(미르·K스포츠재단) 등이 줄줄이 드러나면서 국민 분노가 걷잡을 수 없이 커졌습니다.',
        background: '최순실(이후 최서원으로 개명)은 박근혜 대통령의 40년 지기 비선실세로, 정유라(최순실 딸)의 이대 부정입학 의혹이 먼저 불거졌습니다. 이후 태블릿PC 보도로 국정농단의 전모가 드러났습니다.',
        what_happened_after: '연인원 1,700만 명이 참가한 촛불혁명으로 이어졌고, 국회가 탄핵 소추안을 가결했습니다. 최순실은 징역 18년을 선고받았고, 삼성 이재용 부회장도 뇌물죄로 재판을 받았습니다.',
        related_numbers: '촛불집회 연인원 1,700만명 · 최순실 징역 18년 · 미르재단 486억 + K스포츠재단 288억 강제 모금 · 삼성 뇌물 298억원 · JTBC 보도 시청률 8.5%',
      },
      {
        id: 'pgh-e5', event_date: '2017-03-10', title: '헌재 탄핵 인용, 파면', description: '헌법재판소 만장일치 파면 결정', impact_type: 'negative', significance_score: 98,
        why_it_matters: '대한민국 헌정 사상 최초로 대통령이 탄핵으로 파면된 사건입니다. 헌법재판소 재판관 8명 전원일치(1명 퇴임)로 파면이 결정되었고, 이는 촛불혁명이라는 시민의 힘이 헌법적 절차를 통해 대통령을 교체한 민주주의의 승리로 평가됩니다.',
        citizen_impact: '국민들은 "촛불의 승리"에 환호했지만, 동시에 탄핵 반대파(태극기 집회)와의 갈등도 깊어졌습니다. 파면 결정 후 조기 대선이 치러져 60일간의 불안정한 정국이 이어졌고, 이후 문재인 대통령이 당선되었습니다.',
        background: '2016년 12월 9일 국회가 탄핵 소추안을 가결한 후, 헌재는 약 3개월간 심리를 진행했습니다. 박근혜 대통령은 헌재 심판에 출석하지 않았고, 최순실 국정농단의 증거들이 줄줄이 제시되었습니다.',
        what_happened_after: '박근혜 전 대통령은 구속되어 재판을 받았고, 징역 20년을 확정받았습니다(이후 특별사면). 대한민국 정치에서 "촛불"은 시민 정치 참여의 상징이 되었고, 이후 정치적 갈등은 더 첨예해졌습니다.',
        related_numbers: '재판관 8명 전원일치 인용 · 탄핵 심판 91일 소요 · 파면 후 60일 이내 대선 실시 · 박근혜 징역 20년 확정 (이후 사면) · 헌정 사상 최초 대통령 파면',
      },
    ],
    ysy: [
      {
        id: 'ysy-e1', event_date: '2022-05-10', title: '제20대 대통령 취임', description: '검찰총장 출신 대통령, 법치와 자유 강조', impact_type: 'positive', significance_score: 78,
        why_it_matters: '정치 경험 없는 검찰총장 출신이 대통령이 된 이례적인 사례입니다. 문재인 정부에서 임명된 검찰총장이 정부와 갈등하다 사퇴한 뒤, 야당 후보로 대통령에 당선된 극적인 과정은 한국 정치의 역동성을 보여줬습니다.',
        citizen_impact: '취임식을 용산 국방부 청사 앞 광장에서 열고, 대통령 집무실을 청와대에서 용산으로 옮기면서 시민들에게 "새로운 시작"의 이미지를 주었습니다. 하지만 청와대 개방과 용산 이전 비용(약 500억원)에 대한 논란도 있었습니다.',
        background: '윤석열은 박근혜 탄핵 특별검사팀에서 수사를 이끌었고, 이후 검찰총장으로 임명되었습니다. 문재인 정부의 검찰개혁에 반대하며 "공정과 상식"을 내걸어 보수층의 지지를 받았습니다.',
        what_happened_after: '여소야대 속에서 검찰 수사권 축소, 채상병 특검 등을 둘러싼 여야 갈등이 격화되었습니다. 외교적으로는 한미·한일 관계 강화에 집중했지만, 국내 정치적 분열은 심화되었습니다.',
        related_numbers: '득표율 48.56% (역대 최소차 당선) · 용산 집무실 이전 비용 약 500억원 · 청와대 개방 방문객 연간 수백만명',
      },
      {
        id: 'ysy-e2', event_date: '2022-10-29', title: '이태원 참사', description: '159명 사망, 핼러윈 압사 사고', impact_type: 'negative', significance_score: 95,
        why_it_matters: '핼러윈을 즐기러 나온 젊은이 159명이 좁은 골목에서 압사로 사망한 대참사입니다. 예견 가능했던 인파 밀집 위험에 정부와 경찰이 제대로 대응하지 못한 것이 핵심 원인으로, 대한민국의 안전 관리 시스템이 또다시 실패한 사건입니다.',
        citizen_impact: '희생자 대부분이 20~30대 젊은이로, 또래 세대의 충격이 극심했습니다. "놀러 나갔다가 죽을 수 있다"는 공포가 퍼졌고, 이후 대규모 행사 참여를 꺼리는 현상이 나타났습니다. 유가족들은 진상규명과 책임자 처벌을 요구하고 있습니다.',
        background: '매년 이태원에는 핼러윈 시기에 10만 명 이상이 몰렸지만, 별도의 안전 관리 계획이 없었습니다. 사고 당일 경찰은 마약 단속에 인력을 배치했을 뿐, 인파 관리에는 거의 신경 쓰지 않았습니다.',
        what_happened_after: '국무총리 주재 대책회의가 열렸지만, 대통령실과 행정안전부의 책임 공방이 이어졌습니다. 특별법 제정 요구가 있었으나 여야 합의에 이르지 못했고, 유가족들의 진상규명 요구는 계속되고 있습니다.',
        related_numbers: '사망 159명 (20대 101명) · 부상 196명 · 사망자 평균 연령 약 24세 · 외국인 사망자 26명 (15개국) · 당시 이태원 밀집 인원 약 10만명 추정',
      },
      {
        id: 'ysy-e3', event_date: '2023-03-16', title: '한일 정상회담', description: '12년 만의 한일 셔틀외교 재개, 강제징용 해법 논란', impact_type: 'neutral', significance_score: 78,
        why_it_matters: '12년 만에 한일 정상 간 셔틀외교가 재개된 것은 외교적으로 의미가 있지만, 강제징용 배상 문제에서 일본 기업 대신 한국 정부 산하 재단이 배상하는 "제3자 변제" 방식을 채택해 "굴욕 외교"라는 비판이 거셌습니다.',
        citizen_impact: '일본 관광·문화 교류가 활발해지고 일본 여행이 크게 늘었지만, 강제징용 피해자와 유족은 "피해자의 동의 없는 해법"이라며 강하게 반발했습니다. 역사 문제에 대한 국민 여론은 찬반이 크게 갈렸습니다.',
        background: '2018년 대법원의 강제징용 배상 판결 이후 한일관계가 최악으로 치달았습니다. 일본은 수출규제로 보복했고, 양국 관계는 사실상 단절 상태였습니다. 윤석열 정부는 한미일 공조를 위해 한일관계 복원을 우선시했습니다.',
        what_happened_after: '한일 셔틀외교가 재개되고, 양국 간 수출규제가 해소되었습니다. 하지만 일본의 사과 없는 관계 정상화에 대한 비판은 계속되었고, 2024년 총선에서 야당이 이 문제를 집중적으로 공격했습니다.',
        related_numbers: '한일 셔틀외교 12년 만에 재개 · 강제징용 제3자 변제 방식 채택 · 일본 수출규제 3개 품목 해제 · 한일 여행객 2023년 크게 증가',
      },
      {
        id: 'ysy-e4', event_date: '2024-04-10', title: '22대 총선 야당 압승', description: '야당 192석 확보, 역대 최대 의석차로 여소야대', impact_type: 'negative', significance_score: 85,
        why_it_matters: '야당인 더불어민주당이 300석 중 192석(비례정당 포함)을 차지하여 역대 최대 수준의 여소야대가 만들어졌습니다. 여당은 108석에 그쳐, 사실상 정부가 아무 법안도 통과시킬 수 없는 상황이 되었습니다.',
        citizen_impact: '거대 야당 국회로 인해 정부 법안이 거의 통과되지 못했고, 여야 대립으로 국회가 마비되는 일이 반복되었습니다. "무한 거부권" 행사와 "입법 독주" 논란으로 시민들의 정치 피로감이 극에 달했습니다.',
        background: '윤석열 정부 출범 2년간 부인 김건희 여사 관련 논란, 검찰 편향 인사, 민생 무관심 비판이 이어졌습니다. 야당은 "심판론"을, 여당은 "견제론"을 내세웠지만, 결과는 야당의 압도적 승리였습니다.',
        what_happened_after: '야당은 채상병 특검법, 이태원 특별법 등을 밀어붙이고 대통령이 거부권을 행사하는 패턴이 반복되었습니다. 여야 갈등이 극단으로 치달은 끝에 12월 비상계엄 사태가 발생했습니다.',
        related_numbers: '민주당+비례정당 175+17=192석 · 국민의힘+비례정당 90+18=108석 · 투표율 67.0% · 대통령 거부권 행사 역대 최다',
      },
      {
        id: 'ysy-e5', event_date: '2024-12-03', title: '비상계엄 선포', description: '야당을 내란세력으로 규정, 12월 3일 밤 비상계엄 선포 후 6시간 만에 해제', impact_type: 'negative', significance_score: 99,
        why_it_matters: '1979년 이후 45년 만에 대통령이 비상계엄을 선포한 초유의 사태입니다. 윤석열 대통령이 야당을 "내란세력"으로 규정하고 밤 10시 계엄을 선포했지만, 국회의원들이 새벽에 해제를 의결하면서 6시간 만에 끝났습니다. 한국 민주주의를 근본에서 뒤흔든 사건입니다.',
        citizen_impact: '계엄군이 국회에 진입하는 장면이 생중계되면서 전 국민이 충격에 빠졌습니다. 시민들이 밤새 국회 앞으로 달려가 군인들과 대치했고, 해외에서는 한국의 민주주의가 무너지는 것 아니냐는 우려가 쏟아졌습니다. 주가와 원화 가치가 급락했습니다.',
        background: '22대 총선 대패 이후 여소야대가 극심해지면서, 야당의 탄핵 추진, 예산 삭감, 특검법 등에 대통령이 극도로 압박받는 상황이었습니다. 대통령실 핵심 참모들이 계엄을 건의한 것으로 알려졌습니다.',
        what_happened_after: '계엄 해제 후 야당은 즉시 대통령 탄핵 절차에 착수했습니다. 12월 14일 탄핵 소추안이 가결되었고, 윤석열 대통령은 내란죄로 체포·구속되었습니다. 한국 사회는 극심한 정치적 혼란에 빠졌습니다.',
        related_numbers: '계엄 지속시간 약 6시간 · 45년 만의 비상계엄 · 계엄군 국회 진입 약 280명 · 국회의원 190명 해제 의결 · 코스피 다음날 2% 급락 · 원/달러 1,430원까지 상승',
      },
      {
        id: 'ysy-e6', event_date: '2024-12-14', title: '국회 탄핵 소추안 가결', description: '국회 본회의 204:85로 탄핵 소추안 가결', impact_type: 'negative', significance_score: 95,
        why_it_matters: '비상계엄 선포 11일 만에 국회가 대통령 탄핵 소추안을 204:85로 가결했습니다. 여당 의원 12명 이상이 찬성에 가담한 것은, 계엄 선포가 여당 내부에서도 용납할 수 없는 행위로 판단되었음을 보여줍니다.',
        citizen_impact: '탄핵 가결로 대통령 권한이 즉시 정지되고 국무총리가 직무를 대행했습니다. 시민들은 안도하면서도, "또 탄핵인가"라는 피로감과 "민주주의가 위태로웠다"는 불안감이 공존했습니다.',
        background: '12월 3일 계엄 이후, 야당은 즉시 탄핵을 추진했습니다. 12월 7일 1차 표결은 여당 의원 불참으로 의결정족수 미달이었지만, 1주일 뒤 2차 표결에서 여당 의원 일부가 합류하면서 가결되었습니다.',
        what_happened_after: '헌법재판소 탄핵 심판이 시작되었고, 윤석열 대통령은 내란죄로 수사를 받았습니다. 공수처와 경찰의 체포 시도를 거부하다가 결국 2025년 1월 구속되었습니다.',
        related_numbers: '찬성 204표 · 반대 85표 · 무효 3표 · 여당 이탈 12명 이상 · 1차 표결(12/7) 의결정족수 미달 후 2차 표결(12/14) 가결',
      },
      {
        id: 'ysy-e7', event_date: '2025-04-04', title: '헌재 탄핵 인용, 파면', description: '헌법재판소 탄핵 인용 결정, 대통령직 파면', impact_type: 'negative', significance_score: 98,
        why_it_matters: '대한민국 역사상 두 번째 대통령 탄핵 파면입니다. 헌법재판소가 비상계엄 선포를 "헌법 질서를 파괴하려는 중대한 위헌·위법 행위"로 판단하여 파면을 결정했습니다. 한국 민주주의가 다시 한 번 헌법적 절차로 위기를 극복한 사례입니다.',
        citizen_impact: '파면 결정으로 60일 이내 조기 대선이 확정되었습니다. 정치적 불확실성이 장기화되면서 투자·소비가 위축되었고, "또 조기 대선"에 대한 시민 피로감이 컸습니다. 하지만 "민주주의가 작동하고 있다"는 안도감도 있었습니다.',
        background: '2024년 12월 14일 탄핵 소추 이후 헌재 심판이 진행되었습니다. 핵심 쟁점은 비상계엄 선포가 "내란"에 해당하는지 여부였고, 윤석열 대통령은 헌재 심판에 출석하지 않았습니다.',
        what_happened_after: '파면 후 조기 대선이 치러져 이재명 더불어민주당 후보가 당선되었습니다. 윤석열 전 대통령은 내란죄로 재판이 진행 중이며, 유죄 확정 시 최소 무기징역 이상의 형량이 예상됩니다.',
        related_numbers: '헌재 재판관 전원 인용 · 탄핵 심판 약 4개월 소요 · 파면 후 60일 이내 대선 · 대한민국 2번째 대통령 파면 · 내란죄 법정형: 사형·무기 또는 5년 이상 징역',
      },
    ],
    ljm: [
      {
        id: 'ljm-e1', event_date: '2025-06-04', title: '제21대 대통령 취임', description: '조기 대선 당선, 경제회복과 민생안정 과제', impact_type: 'positive', significance_score: 85,
        why_it_matters: '비상계엄-탄핵이라는 초유의 헌정 위기를 겪은 뒤 치러진 조기 대선에서 당선된 이재명 대통령은, 분열된 사회를 통합하고 위기에 빠진 경제를 살려야 하는 막중한 과제를 안고 출발했습니다.',
        citizen_impact: '새 정부 출범으로 정치적 불확실성이 해소되어 주가와 환율이 안정되기 시작했습니다. 이재명 대통령은 취임 직후 민생 현장을 방문하며 "현장 대통령"을 자임했고, 재난지원금·소상공인 지원 등 즉각적인 민생 대책을 약속했습니다.',
        background: '이재명 후보는 2022년 대선에서 0.73%차로 석패한 뒤, 당대표로서 22대 총선 승리를 이끌었습니다. 계엄 사태 이후 치러진 조기 대선에서 경제 회복과 민생 안정을 내걸고 당선되었습니다.',
        what_happened_after: '취임 직후 긴급 민생안정 대책을 발표하고, 한미·한중 외교 정상화에 나섰습니다. 디지털 정부 혁신, 기본소득 논의 등 진보적 정책 과제를 추진하기 시작했습니다.',
        related_numbers: '조기 대선 투표율 70% 이상 · 취임 시 GDP 성장률 약 1.5% (경기 둔화) · 물가상승률 3%대 · 국가채무 1,200조원대',
      },
      {
        id: 'ljm-e2', event_date: '2025-07-15', title: '긴급 민생안정 대책 발표', description: '물가안정, 소상공인 지원 등 긴급 경제 대책 발표', impact_type: 'positive', significance_score: 70,
        why_it_matters: '계엄-탄핵 정국으로 위축된 경제를 살리기 위한 긴급 처방전입니다. 물가 안정, 소상공인 대출 이자 경감, 청년 일자리 지원 등 시민 생활에 직접 영향을 미치는 대책들을 포함했습니다.',
        citizen_impact: '소상공인 대출 이자 부담 경감, 전기·가스 요금 동결, 농축산물 할인 지원 등으로 체감 물가 안정에 도움이 되었습니다. 청년 주거 지원 확대와 구직활동 지원금 인상으로 청년층에게도 실질적 혜택이 돌아갔습니다.',
        background: '2024년 12월 계엄 사태 이후 소비 심리가 급격히 위축되고, 외국인 투자가 이탈하면서 경기 침체가 깊어졌습니다. 새 정부 출범 후 가장 시급한 과제가 경기 회복과 민생 안정이었습니다.',
        what_happened_after: '대책 발표 후 소비자 심리지수가 반등하기 시작했고, 소상공인 폐업률 증가세가 둔화되었습니다. 하지만 구조적인 경기 회복에는 시간이 필요하다는 평가가 이어졌습니다.',
        related_numbers: '민생안정 패키지 약 30조원 규모 · 소상공인 이자 경감 100만명 대상 · 전기요금 동결 6개월 · 청년 월세 지원 월 20만원',
      },
      {
        id: 'ljm-e3', event_date: '2025-09-01', title: '디지털 정부 혁신 로드맵', description: 'AI 기반 공공서비스 혁신 계획 발표', impact_type: 'positive', significance_score: 65,
        why_it_matters: 'AI와 디지털 기술을 활용해 공공서비스를 근본적으로 혁신하겠다는 청사진입니다. 주민센터에 직접 가지 않아도 AI가 맞춤형으로 복지 서비스를 안내하고, 행정 처리가 자동화되는 "찾아가는 정부"를 목표로 합니다.',
        citizen_impact: 'AI 기반 복지 상담, 민원 자동 처리, 맞춤형 정책 알림 등이 추진되어, 복잡한 행정 절차에 어려움을 겪던 시민들이 더 쉽게 공공서비스를 이용할 수 있게 됩니다. 특히 디지털에 익숙하지 않은 고령층을 위한 비대면·대면 병행 서비스도 포함되었습니다.',
        background: '한국은 전자정부 수준이 세계 최고 수준이지만, AI 시대에 맞는 차세대 디지털 정부로의 전환이 필요한 상황이었습니다. 코로나19 이후 비대면 행정 수요가 폭증한 것도 배경이 되었습니다.',
        what_happened_after: '정부 부처별 AI 도입 로드맵이 수립되고, 시범사업이 시작되었습니다. AI 복지 상담 챗봇, 민원 자동 분류 시스템 등이 일부 지자체에서 시범 운영되기 시작했습니다.',
        related_numbers: '디지털 정부 혁신 예산 약 5조원 · AI 공공서비스 2026년까지 100개 이상 구축 목표 · 전자정부 세계 순위 3위 (UN 기준)',
      },
      {
        id: 'ljm-e4', event_date: '2025-11-20', title: '한중 정상회담', description: '취임 후 첫 한중 정상회담 개최', impact_type: 'neutral', significance_score: 72,
        why_it_matters: '윤석열 정부 시기 경색되었던 한중관계를 복원하는 첫걸음입니다. 한국 최대 교역국인 중국과의 관계가 경제·외교·안보 전반에 미치는 영향이 크기 때문에, 새 정부의 대중 외교 방향을 가늠하는 중요한 자리였습니다.',
        citizen_impact: '한중관계 개선으로 중국인 관광객(유커) 방한이 회복되어 관광·면세업계에 활기가 돌았습니다. 중국 시장에 의존하는 수출 기업들도 안도했지만, "한미 동맹과 한중 관계 사이에서 줄타기"라는 우려도 있었습니다.',
        background: '윤석열 정부 시기 한미일 공조가 강화되면서 한중관계는 소원해졌습니다. 중국의 사드 보복이 여전했고, 대중 무역적자가 사상 처음으로 기록되는 등 경제적 타격도 있었습니다.',
        what_happened_after: '양국은 경제 협력 강화, 인적 교류 확대에 합의했습니다. 사드 문제에 대한 해결 실마리도 모색되었지만, 북핵 문제와 미중 갈등 속에서 한중관계의 근본적 개선에는 한계가 있다는 분석이 나왔습니다.',
        related_numbers: '한중 교역 규모 약 3,000억 달러 · 2023년 대중 무역적자 첫 기록 · 중국인 관광객 2019년 대비 60%까지 회복 · 사드 배치 이후 한중 갈등 7년차',
      },
      {
        id: 'ljm-e5', event_date: '2026-01-15', title: '2026 예산안 국회 통과', description: '728조 규모 역대 최대 예산안 국회 의결', impact_type: 'positive', significance_score: 75,
        why_it_matters: '728조원이라는 역대 최대 규모의 예산안이 국회를 통과한 것은, 경기 회복과 민생 안정에 대한 정부의 의지를 보여줍니다. 특히 복지·교육·R&D 예산이 크게 늘어, 시민 생활에 직접적인 영향을 미치는 예산입니다.',
        citizen_impact: '기초연금 인상, 아동수당 확대, 청년 주거지원 강화 등 복지 예산이 늘어 취약계층에게 실질적 도움이 됩니다. 교육비 지원 확대와 AI 인재 양성 예산도 포함되어, 교육 기회 확대에 기여할 것으로 기대됩니다.',
        background: '계엄-탄핵 정국에서 2025년 예산안 처리가 지연되었던 만큼, 새 정부의 첫 정상적인 예산안인 2026년 예산이 주목받았습니다. 경기 부양과 재정 건전성 사이의 균형이 핵심 과제였습니다.',
        what_happened_after: '예산안 통과 후 각 부처의 집행이 시작되면서 경기 부양 효과가 본격화될 것으로 전망됩니다. 다만 국가채무 증가에 대한 우려와 재정 건전성 논란은 계속되고 있습니다.',
        related_numbers: '총예산 728조원 (전년 대비 약 8% 증가) · 복지 예산 약 230조원 · R&D 예산 약 35조원 · 국가채무 GDP 대비 약 55%',
      },
    ],
  };
  return events[presidentId] || [];
}

// ========================================
// 공약 이행 데이터
// ========================================

export function getCampaignPledgesByPresident(presidentId: string): CampaignPledge[] {
  const pledges: Record<string, CampaignPledge[]> = {
    mji: [
      { id: 'mji-p1', president_id: 'mji', pledge_text: '최저임금 1만원 달성', category: '경제', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 45, outcome_summary: '2022년 최저임금 9,160원으로 목표 미달성', budget_impact: '연간 사업주 부담 약 3조원 증가', related_bills: ['최저임금법 개정안'], plain_explanation: '대선 때 "시간당 최저임금을 1만원으로 올리겠다"고 약속한 공약입니다. 당시 최저임금은 6,470원이었습니다.', why_it_matters: '최저임금으로 일하는 사람이 약 300만명입니다. 알바비가 올라가면 편의점·식당 등에서 일하는 분들의 수입이 직접 늘어납니다.', citizen_impact: '2018년 한 번에 16.4% 올렸더니 편의점·식당 등 소상공인이 인건비 부담을 못 견뎌 알바를 줄이거나 무인 키오스크로 교체하는 일이 많아졌습니다.', what_went_wrong: '2년 연속 급격한 인상(16.4%, 10.9%) 후 부작용이 커지자 인상 속도를 대폭 낮춰 결국 임기 내 1만원 달성에 실패했습니다. 최종 9,160원.', real_example: '2018년 "고용 쇼크" — 편의점 야간 알바 자리가 사라지고, 식당에서 "1인분 주문 불가" 정책이 생긴 것이 이 시기입니다.' },
      { id: 'mji-p2', president_id: 'mji', pledge_text: '공공부문 일자리 81만개 창출', category: '일자리', pledge_source: '제19대 대선공약집', fulfillment_status: '일부이행', fulfillment_pct: 60, outcome_summary: '공공부문 약 50만개 일자리 창출, 단기 일자리 비중 높아 질적 한계', budget_impact: '5년간 약 10조원 투입', related_bills: ['공공기관 채용확대 특별법'], plain_explanation: '경찰·소방·교사 등 공공부문에서 81만개의 새 일자리를 만들겠다는 약속입니다. 공무원·공공기관 채용을 대폭 늘리겠다는 것이었습니다.', why_it_matters: '청년 취업난이 심각한 상황에서 안정적인 공공부문 일자리를 늘리면 청년·중장년 모두에게 희망이 됩니다. 특히 고졸·지방대 출신에게 기회가 됩니다.', citizen_impact: '실제로 약 50만개가 만들어졌지만, 노인 일자리(월 27만원짜리 공원 청소 등) 같은 단기·저임금 일자리 비중이 높아 "양질의 일자리"라고 보기 어려웠습니다.', what_went_wrong: '81만개 중 상당수가 재정 투입형 단기 일자리였습니다. 소방관·경찰 같은 정규직은 예산 한계로 목표에 못 미쳤고, 통계 부풀리기 논란도 있었습니다.', real_example: '노인 일자리 사업 참여자가 폭증해 2019년 고용률이 반짝 올랐지만, 월 27만원짜리 일자리를 "취업"으로 집계하는 것이 맞느냐는 논란이 컸습니다.' },
      { id: 'mji-p3', president_id: 'mji', pledge_text: '건강보험 보장률 70% 달성 (문재인케어)', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '일부이행', fulfillment_pct: 65, outcome_summary: '2021년 기준 보장률 64.5%, 목표 70%에 미달', budget_impact: '5년간 건보 지출 약 30조원 증가', related_bills: ['국민건강보험법 개정안'], plain_explanation: '병원비 중 건강보험이 커버해주는 비율을 70%까지 올리겠다는 약속입니다. 쉽게 말해 "병원비 본인 부담을 확 줄이겠다"는 겁니다.', why_it_matters: '한국은 OECD 평균(80%)보다 건보 보장률이 낮아서, 암·희귀질환 걸리면 수천만원씩 본인 부담이 생깁니다. 특히 저소득층에게 의료비는 가장 큰 경제적 위험입니다.', citizen_impact: '비급여 항목 3,800개를 급여화해서 MRI·초음파 비용이 확 줄었습니다. 다만 건보 재정 적자가 커져 보험료가 연평균 3.5%씩 올랐습니다.', what_went_wrong: '비급여를 급여로 전환해도 병원들이 새로운 비급여 항목을 만들어내는 "풍선효과"가 발생했습니다. 보장률은 64.5%에 그쳤고, 건보 재정 건전성 우려가 커졌습니다.', real_example: 'MRI 촬영비가 30~60만원에서 5~10만원으로 내려간 건 체감됐지만, "2인실·1인실 병실료"나 "신의료기술" 같은 새로운 비급여가 늘어 실제 병원비 부담은 크게 줄지 않았다는 환자들이 많습니다.' },
      { id: 'mji-p4', president_id: 'mji', pledge_text: '한반도 비핵화와 평화체제 구축', category: '외교', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 30, outcome_summary: '3차례 남북정상회담 성사했으나 비핵화 합의 미이행', budget_impact: '-', plain_explanation: '북한이 핵무기를 포기하게 만들고, 종전선언·평화협정을 통해 한반도에 항구적 평화를 가져오겠다는 약속입니다.', why_it_matters: '한반도는 여전히 "정전" 상태입니다. 북핵 위협이 계속되면 우리 안보가 불안하고, 남북 경제협력도 불가능합니다. 젊은 세대에겐 병역 의무와도 직결됩니다.', citizen_impact: '2018년 판문점 선언 당시 "전쟁 없는 한반도" 기대감이 컸지만, 2019년 하노이 회담 결렬 후 남북관계가 다시 경색되며 개성공단·금강산 관광 재개도 무산됐습니다.', what_went_wrong: '2019년 하노이 미북 정상회담이 결렬되면서 비핵화 협상이 완전히 멈췄습니다. 북한은 이후 미사일 시험을 재개했고, 판문점 선언의 약속들은 사실상 휴지조각이 됐습니다.', real_example: '2018년 남북 정상이 판문점에서 손잡고 군사분계선을 넘는 장면이 전 세계에 생중계됐지만, 2020년 북한이 남북공동연락사무소를 폭파하면서 "평화 무드"는 완전히 사라졌습니다.' },
      { id: 'mji-p5', president_id: 'mji', pledge_text: '수사권·기소권 분리 (검찰개혁)', category: '사법', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '고위공직자범죄수사처(공수처) 설치, 검경 수사권 조정 완료', budget_impact: '연간 약 300억원', related_bills: ['고위공직자범죄수사처 설치법', '형사소송법 개정안'], plain_explanation: '검찰이 수사도 하고 기소(재판에 넘기기)도 하는 "슈퍼 권력"을 쪼개겠다는 약속입니다. 검찰 대신 경찰이 수사하고, 고위공직자는 공수처가 수사하는 구조로 바꾼 것입니다.', why_it_matters: '검찰이 수사와 기소를 독점하면, 수사를 무기로 정치·경제계에 영향력을 행사할 수 있습니다. 권력 분산은 민주주의의 기본 원칙입니다.', citizen_impact: '공수처가 설치되고 경찰 수사권이 확대되었습니다. 하지만 수사 역량이 분산되면서 일선 경찰의 업무 부담이 늘고, 사건 처리 속도가 느려졌다는 지적이 있습니다.', what_went_wrong: '법 개정 자체는 이뤄졌지만, 공수처 초대 처장 인선이 논란이 됐고, 실제 수사 성과도 미미했습니다. "검찰 견제"보다는 "정치적 도구"라는 비판도 받았습니다.', real_example: '2022년 공수처가 출범 후 1년간 기소한 사건이 1건에 불과해 "유명무실"이라는 비판을 받았습니다. 반면 경찰은 수사권을 얻고 나서 직접 수사 건수가 크게 늘었습니다.' },
      { id: 'mji-p6', president_id: 'mji', pledge_text: '탈원전 에너지 전환', category: '에너지', pledge_source: '제19대 대선공약집', fulfillment_status: '일부이행', fulfillment_pct: 50, outcome_summary: '신규 원전 건설 중단, 재생에너지 비중 확대했으나 목표 미달', budget_impact: '재생에너지 투자 약 12조원', plain_explanation: '원자력발전소를 더 이상 새로 짓지 않고, 태양광·풍력 같은 재생에너지로 전환하겠다는 약속입니다. 고리 1호기를 조기 폐쇄한 것이 시작이었습니다.', why_it_matters: '2011년 후쿠시마 원전 사고처럼 한번 터지면 수십 년간 복구 불가능합니다. 반면 원전은 전기 생산 단가가 가장 싸서, 탈원전은 전기요금 인상과 직결됩니다.', citizen_impact: '신규 원전 건설이 중단되면서 원전 부품 업체들이 줄도산했고, 원전 소재 지역(경주·울진 등) 경제가 타격받았습니다. 태양광 패널이 농촌·산지에 난개발되는 문제도 생겼습니다.', what_went_wrong: '재생에너지 비중을 20%로 올리겠다고 했지만, 실제론 9% 수준에 그쳤습니다. 태양광·풍력은 간헐성 문제(해가 안 뜨면 발전 못함)가 있어 LNG 발전으로 보완하다 보니 오히려 탄소 배출이 늘기도 했습니다.', real_example: '경북 울진, 경주 등 원전 소재 지역 주민들은 일자리가 사라지고, 충남 태안 등에선 농지에 태양광 패널이 들어서면서 농촌 경관이 파괴됐다는 민원이 폭주했습니다.' },
      { id: 'mji-p7', president_id: 'mji', pledge_text: '주 52시간 근무제 정착', category: '노동', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '근로기준법 개정으로 주 52시간 상한제 시행', budget_impact: '-', related_bills: ['근로기준법 개정안'], plain_explanation: '1주에 일할 수 있는 최대 시간을 68시간에서 52시간으로 줄이는 법을 만들겠다는 약속입니다. 기본 40시간 + 연장근무 12시간이 한도가 됩니다.', why_it_matters: '한국은 OECD 국가 중 노동시간이 가장 긴 나라 중 하나였습니다. 과로사(카로시)가 사회 문제였고, "저녁이 있는 삶"은 많은 직장인의 소망이었습니다.', citizen_impact: '대기업·공공기관 중심으로 야근이 줄었습니다. 하지만 중소기업이나 IT 업계에서는 "몰래 야근"이 계속됐고, 잔업수당이 줄어 실질 급여가 깎인 노동자도 많았습니다.', what_went_wrong: '법 시행 자체는 성공했지만, 5인 미만 사업장은 적용 제외라 전체 노동자의 22%가 보호받지 못합니다. 또 IT·게임 업계 등에서 "포괄임금제"로 사실상 무력화되는 경우가 많았습니다.', real_example: '대기업 직원들은 "금요일 오후 일찍 퇴근"하게 됐지만, 배달 기사·편의점 알바 같은 플랫폼·서비스 노동자에겐 해당 사항이 없었습니다. "저녁이 있는 삶"은 정규직 대기업 직원의 얘기라는 비판이 있었습니다.' },
      { id: 'mji-p8', president_id: 'mji', pledge_text: '유치원·어린이집 국공립 비율 40%', category: '교육', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 35, outcome_summary: '국공립 비율 30% 수준으로 목표 미달', budget_impact: '5년간 약 2조원 투입', plain_explanation: '사립 유치원·어린이집 비중이 너무 높으니, 국공립 비율을 40%까지 올려서 저렴하고 질 좋은 보육 시설을 늘리겠다는 약속입니다.', why_it_matters: '국공립 어린이집은 사립보다 비용이 30~50% 저렴하고 교사 처우도 좋아 보육 질이 높습니다. 부모 입장에서 국공립에 보내고 싶지만 자리가 없는 게 현실이었습니다.', citizen_impact: '국공립 어린이집이 일부 늘었지만, 여전히 대기 순번이 수백 명인 곳이 많아 "로또 입학"이라는 말이 사라지지 않았습니다. 특히 서울·수도권은 개선 체감이 미미했습니다.', what_went_wrong: '국공립을 새로 짓기보다 기존 사립을 전환하는 방식이었는데, 사립 원장들의 반발이 컸습니다. 또 부지 확보가 어려워 수도권은 거의 진전이 없었습니다. 최종 약 30% 수준.', real_example: '2019년 "유치원 비리 사태"(사립유치원 횡령·비리 폭로) 이후 국공립 수요가 폭증했지만, 실제 국공립 자리는 크게 늘지 않아 맞벌이 부부들의 불만이 컸습니다.' },
      { id: 'mji-p9', president_id: 'mji', pledge_text: '국민연금 소득대체율 50%로 인상', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 10, outcome_summary: '국민연금 개혁 논의 시작했으나 법안 통과 실패', budget_impact: '-', related_bills: ['국민연금법 개정안 (미통과)'], plain_explanation: '은퇴 후 받는 국민연금 금액을 늘리겠다는 약속입니다. 소득대체율은 "일할 때 벌던 돈의 몇 %를 연금으로 받느냐"인데, 이걸 40%에서 50%로 올리겠다고 한 것입니다.', why_it_matters: '한국 노인 빈곤율은 OECD 1위(약 40%)입니다. 연금을 적게 받아 은퇴 후 생활이 곤란한 어르신이 많습니다. 지금 20대도 결국 같은 문제를 겪게 됩니다.', citizen_impact: '결국 아무것도 바뀌지 않았습니다. 소득대체율은 매년 0.5%p씩 낮아져 2028년 40%까지 떨어지는 스케줄이 그대로 진행 중입니다.', what_went_wrong: '소득대체율을 올리면 보험료도 올려야 하는데, 여야 모두 "보험료 인상"을 국민에게 말하기 꺼려 논의 자체를 피했습니다. 국민연금 개혁은 역대 모든 정부의 "뜨거운 감자"입니다.', real_example: '2018년 국민연금 재정추계 결과 "2057년 기금 고갈"이 발표되며 20~30대 사이에서 "우리는 낸 만큼도 못 받는다"는 불안이 퍼졌지만, 개혁은 이뤄지지 않았습니다.' },
      { id: 'mji-p10', president_id: 'mji', pledge_text: '아동수당 도입', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '2018년 아동수당 월 10만원 도입, 이후 대상 확대', budget_impact: '연간 약 2조원', related_bills: ['아동수당법'], plain_explanation: '만 6세(이후 만 8세로 확대) 미만 아이가 있는 가정에 매달 10만원을 지급하는 제도를 도입하겠다는 약속입니다.', why_it_matters: '저출산이 국가 위기인 상황에서, 양육비 부담을 조금이라도 줄여 출산율을 높이자는 취지입니다. OECD 35개국 중 30개국이 이미 시행 중이었습니다.', citizen_impact: '2018년 9월부터 아동수당이 지급되기 시작했습니다. 처음엔 소득 상위 10% 제외했다가, 2019년부터 소득 관계없이 전 아동에게 지급하게 됐습니다.', what_went_wrong: '아동수당 자체는 잘 이행됐지만, 월 10만원이 실질적 양육비에 비해 너무 적다는 지적이 많습니다. 합계출산율은 오히려 0.98(2018) → 0.78(2022)로 계속 떨어졌습니다.', real_example: '아이 한 명 키우는 데 월 100만원 이상 드는데, 10만원으로는 기저귀·분유값 정도입니다. "있으면 좋지만 이것 때문에 아이를 낳겠다는 생각은 안 든다"는 반응이 대부분이었습니다.' },
      { id: 'mji-p11', president_id: 'mji', pledge_text: '국가 치매 책임제', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: '치매안심센터 전국 256개소 설치, 치매 국가 책임제 시행', budget_impact: '연간 약 1.5조원', plain_explanation: '치매 환자의 진단·치료·돌봄을 국가가 책임지겠다는 약속입니다. 전국 모든 시·군·구에 치매안심센터를 설치하고 본인부담금을 줄이는 내용입니다.', why_it_matters: '2025년 기준 치매 환자가 100만 명을 넘었습니다. 치매 환자 1명당 연간 돌봄 비용이 약 2,000만원이라 가족에게 엄청난 경제적·정신적 부담입니다.', citizen_impact: '전국 256개 치매안심센터가 설치되어 무료 검진과 상담을 받을 수 있게 됐습니다. 장기요양보험 치매 등급이 신설돼 경증 치매 어르신도 돌봄 서비스를 이용할 수 있게 됐습니다.', what_went_wrong: '센터는 만들어졌지만 전문 인력이 부족해 "이름만 센터"라는 지적이 있습니다. 또 치매 전담 요양시설 부족은 여전해서 입소 대기가 수개월~1년 이상인 곳이 많습니다.', real_example: '치매안심센터에서 무료 치매 검진을 받고 초기 치매를 조기 발견하는 사례가 늘었습니다. 하지만 중증 치매 어르신을 모실 요양시설이 부족해 자녀가 직접 돌보다 이직·퇴직하는 "돌봄 이탈" 문제는 계속되고 있습니다.' },
      { id: 'mji-p12', president_id: 'mji', pledge_text: '부동산 투기 근절', category: '부동산', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 15, outcome_summary: '25차례 부동산 대책에도 서울 아파트 가격 80% 이상 상승', budget_impact: '-', related_bills: ['부동산거래신고법', '종합부동산세법 개정안'], plain_explanation: '부동산 투기를 막아 집값을 안정시키겠다는 약속입니다. 대출 규제, 세금 강화, 공급 확대 등으로 "집값 잡기"에 나서겠다고 했습니다.', why_it_matters: '서울 아파트 한 채 가격이 평균 10억원을 넘는 상황에서, 내 집 마련은 20~30대의 가장 큰 걱정거리입니다. 집값 안정은 세대 간 형평성과 직결됩니다.', citizen_impact: '임기 동안 서울 아파트 평균 매매가가 6억원대에서 12억원대로 약 80% 폭등했습니다. "벼락거지"(집을 안 산 사람이 갑자기 가난해지는 현상)라는 신조어가 생겼습니다.', what_went_wrong: '25차례 대책을 내놨지만, "규제 위주"로 공급은 부족했습니다. 다주택자 세금 폭탄으로 매물이 잠기고, 전세→월세 전환이 가속화돼 오히려 집값·전세값이 동반 폭등했습니다.', real_example: '2020~2021년 서울 아파트 전세값이 폭등하면서 "전세 대란"이 발생했습니다. 전세 만기 후 보증금을 못 돌려받는 "깡통전세" 피해자가 속출했고, 영끌(영혼까지 끌어모아 대출) 매수가 유행했습니다.' },
    ],
    ysk: [
      { id: 'ysk-p1', president_id: 'ysk', pledge_text: '금융실명제 도입', category: '경제', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 100, outcome_summary: '1993년 전격 시행, 금융 투명성의 기틀 마련', plain_explanation: '은행 거래를 할 때 반드시 본인 이름(실명)으로 해야 하는 제도입니다. 이전에는 가짜 이름(차명)으로 통장을 만들어 탈세·비자금 조성이 가능했습니다.', why_it_matters: '차명 계좌가 허용되면 정치인·재벌이 돈을 숨기고 세금을 안 낼 수 있습니다. 금융실명제는 부정부패를 막는 가장 기본적인 제도로, 현대 한국 경제 투명성의 출발점입니다.', citizen_impact: '비자금·차명 거래가 금지되면서 금융 거래가 투명해졌습니다. 다만 시행 직후 주식시장 폭락, 부동산 시장 위축 등 단기 충격이 있었고, 지하경제 자금이 일시적으로 움츠러들었습니다.', what_went_wrong: '이행 완료된 성공 공약입니다. 다만 완벽하진 않아 차명 거래가 완전히 사라지진 않았고, 가상자산 등 새로운 탈세 수단이 등장했습니다.', real_example: '1993년 8월 12일 밤, 김영삼 대통령이 긴급재정경제명령을 발동해 전격 시행했습니다. 다음 날부터 모든 은행 거래에 실명이 필수가 됐고, 금고에 현금을 숨기던 사람들이 은행으로 달려갔습니다.' },
      { id: 'ysk-p2', president_id: 'ysk', pledge_text: '지방자치제 부활', category: '행정', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '1995년 지방선거 실시로 30년 만에 지방자치 부활', plain_explanation: '군사정권 시절 중단됐던 지방자치를 부활시켜, 시장·군수·구청장과 지방의원을 주민이 직접 뽑게 하겠다는 약속입니다.', why_it_matters: '중앙정부가 모든 것을 결정하면 지역 실정에 맞지 않는 정책이 나옵니다. 지방자치는 주민이 직접 지역 대표를 뽑아 우리 동네 문제를 우리가 해결하는 민주주의의 기본입니다.', citizen_impact: '1995년 6월 전국 동시 지방선거가 치러져 30년 만에 풀뿌리 민주주의가 부활했습니다. 시장·도지사를 직접 뽑게 되면서 지역 주민의 정치 참여가 크게 늘었습니다.', what_went_wrong: '지방자치 부활 자체는 성공했지만, 지방 재정 자립도가 낮아(평균 50% 수준) 실질적 자치가 어렵다는 한계가 지금까지 이어지고 있습니다.', real_example: '1995년 지방선거에서 투표율이 68.4%로 높은 관심을 보였습니다. 각 지역에서 개발 공약 경쟁이 벌어지면서 "우리 동네 ○○ 유치" 같은 지역 의제가 처음 등장했습니다.' },
      { id: 'ysk-p3', president_id: 'ysk', pledge_text: 'OECD 가입', category: '외교', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '1996년 29번째 OECD 회원국으로 가입', plain_explanation: '선진국 경제 클럽인 OECD(경제협력개발기구)에 가입하겠다는 약속입니다. 당시 OECD 가입은 "선진국 진입"의 상징이었습니다.', why_it_matters: 'OECD 가입은 국제사회에서 한국의 경제 위상을 인정받는 것입니다. 외국 투자자들에게 "한국은 믿을 수 있는 나라"라는 신호가 되어 투자 유치에 유리합니다.', citizen_impact: '가입 조건으로 자본시장·금융시장을 급격히 개방했는데, 이것이 1년 후 IMF 외환위기의 한 원인이 됐습니다. "선진국 됐다" 기뻐했더니 곧바로 IMF 구제금융을 받는 아이러니가 벌어졌습니다.', what_went_wrong: 'OECD 가입 자체는 성공했지만, 가입 조건인 자본시장 개방을 충분한 준비 없이 급하게 추진한 것이 문제였습니다. 단기 외채가 급증했고, 이것이 외환위기의 불씨가 됐습니다.', real_example: '1996년 12월 OECD 가입 당시 "대한민국 선진국 반열에" 같은 뉴스가 넘쳤지만, 정확히 1년 후인 1997년 12월 IMF 구제금융을 신청하며 국민들은 "금 모으기 운동"에 나서야 했습니다.' },
      { id: 'ysk-p4', president_id: 'ysk', pledge_text: '역사바로세우기', category: '정치', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: '전두환·노태우 전 대통령 구속 및 재판', plain_explanation: '12·12 군사반란과 5·18 광주민주화운동 진압의 주범인 전두환·노태우 두 전직 대통령을 재판에 넘기겠다는 약속입니다.', why_it_matters: '쿠데타로 권력을 잡고 시민을 학살한 전직 대통령을 처벌하는 것은 "불법적 권력 장악은 용납되지 않는다"는 메시지입니다. 민주주의의 기본 원칙을 세운 역사적 사건입니다.', citizen_impact: '1996년 전두환·노태우가 법정에 서면서 "군사독재 시대의 완전한 종결"이라는 상징적 의미가 컸습니다. 5·18 유족과 민주화 운동가들에게는 수십 년 만의 정의 실현이었습니다.', what_went_wrong: '재판과 처벌은 이뤄졌지만, 김영삼 대통령이 임기 말 특별사면으로 두 사람을 풀어줘 "완전한 정의"가 아니었다는 비판을 받았습니다.', real_example: '1996년 법정에 선 전두환은 무기징역, 노태우는 징역 17년을 선고받았습니다. 하지만 1997년 12월 김영삼 대통령이 "국민 화합"을 이유로 특별사면해 논란이 됐습니다.' },
      { id: 'ysk-p5', president_id: 'ysk', pledge_text: '경제 세계화·개방화', category: '경제', pledge_source: '제14대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 55, outcome_summary: '급격한 개방으로 외환위기 촉발, 양면적 결과', plain_explanation: '한국 경제를 세계 시장에 적극 개방해 무역과 투자를 늘리겠다는 약속입니다. "세계화(globalization)"를 국정 핵심 기조로 삼았습니다.', why_it_matters: '수출 중심인 한국 경제가 성장하려면 해외 시장 개방이 필수입니다. 하지만 준비 없는 개방은 외국 자본의 급격한 유출입으로 경제가 흔들릴 수 있습니다.', citizen_impact: '자본시장과 금융시장을 빠르게 개방했지만, 단기 외채 관리에 실패하면서 1997년 IMF 외환위기가 터졌습니다. 수백만 명이 실직하고, 중산층이 무너지는 국가적 재앙이었습니다.', what_went_wrong: '세계화 자체는 필요했으나 속도 조절에 실패했습니다. 금융감독 체계가 미비한 상태에서 자본시장을 개방하니, 단기 외화 차입이 폭증하고 외환보유고가 바닥났습니다.', real_example: '1997년 말 외환보유고가 39억 달러까지 고갈되면서 IMF에 550억 달러 구제금융을 요청했습니다. "세계화"를 외치던 정부가 1년 만에 국가 부도 위기에 몰린 것입니다.' },
    ],
    kdj: [
      { id: 'kdj-p1', president_id: 'kdj', pledge_text: 'IMF 외환위기 극복', category: '경제', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '예정보다 3년 앞서 IMF 차관 전액 상환', plain_explanation: '1997년 말 터진 IMF 외환위기를 극복해 경제를 정상화하겠다는 약속입니다. 취임 당시 한국은 사실상 국가 부도 상태로 IMF에서 550억 달러를 빌린 상황이었습니다.', why_it_matters: 'IMF 위기 때 실업률이 7%까지 치솟고, 기업이 줄도산하며, 수많은 가정이 파탄났습니다. 위기 극복은 국가 존망이 걸린 최우선 과제였습니다.', citizen_impact: '구조조정과 금 모으기 운동 등 국민적 고통을 거쳐 2001년 8월 IMF 차관을 예정보다 3년 일찍 전액 상환했습니다. 하지만 비정규직 양산, 양극화 심화 등 후유증이 남았습니다.', what_went_wrong: '위기 극복 자체는 성공했지만, 그 과정에서 대규모 정리해고가 일상화되고 비정규직이 급증했습니다. "외환위기 극복"의 비용을 노동자와 서민이 더 많이 치렀다는 비판이 있습니다.', real_example: '국민 350만 명이 참여한 "금 모으기 운동"으로 227톤의 금이 모였습니다. 2001년 8월 23일 IMF 차관 195억 달러를 전액 갚은 날, 전 국민이 TV 앞에서 환호했습니다.' },
      { id: 'kdj-p2', president_id: 'kdj', pledge_text: '남북 화해·협력', category: '외교', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '2000년 역사적 남북정상회담, 금강산 관광, 개성공단 추진', plain_explanation: '대북 적대 정책 대신 교류·협력으로 남북 관계를 개선하겠다는 "햇볕정책"입니다. 금강산 관광, 개성공단, 남북 정상회담 등을 추진했습니다.', why_it_matters: '남북 분단은 70년 넘게 이어진 한반도 최대 현안입니다. 남북 관계가 좋아지면 군비 부담을 줄이고, 경제 협력으로 양측 모두 이익을 얻을 수 있습니다.', citizen_impact: '2000년 6·15 남북정상회담으로 이산가족 상봉이 성사되어 수만 가족이 50년 만에 만났습니다. 금강산 관광이 시작돼 일반 시민도 북한 땅을 밟을 수 있게 됐습니다.', what_went_wrong: '정상회담 성사를 위해 현대가 북한에 5억 달러를 보낸 "대북 송금 특검"이 논란이 됐습니다. 또 북한의 핵개발은 계속되어 근본적 평화에는 도달하지 못했습니다.', real_example: '2000년 6월 김대중 대통령이 평양에서 김정일 위원장과 악수하는 장면이 생중계됐습니다. 이 공로로 노벨평화상을 수상했지만, "퍼주기"라는 보수 진영의 비판도 거셌습니다.' },
      { id: 'kdj-p3', president_id: 'kdj', pledge_text: 'IT 산업 육성', category: '산업', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '초고속인터넷 보급 세계 1위, 벤처 붐 조성', plain_explanation: '인터넷·정보통신(IT) 산업을 한국의 새로운 성장 동력으로 키우겠다는 약속입니다. 초고속인터넷 보급, 벤처기업 육성, 전자정부 구축 등을 추진했습니다.', why_it_matters: 'IMF 위기로 기존 제조업 중심 경제가 한계를 드러낸 상황에서, IT는 적은 자본으로 빠르게 성장할 수 있는 신산업이었습니다. 이때의 투자가 지금 K-IT의 기반이 됐습니다.', citizen_impact: '초고속인터넷 보급률이 세계 1위가 되면서 PC방 문화가 폭발적으로 성장했고, 네이버·다음 같은 포털, 싸이월드 같은 SNS가 탄생했습니다. "IT 강국 대한민국"이라는 이미지가 이때 만들어졌습니다.', what_went_wrong: '벤처 거품 붕괴(2000~2001년)로 수많은 벤처기업이 도산했고, 투자자 피해가 컸습니다. 정부 인증 "벤처기업" 남발과 스톡옵션 악용 등 부작용도 있었습니다.', real_example: '1999년 코스닥 지수가 1,000을 넘으며 "벤처 붐"이 절정에 달했지만, 2000년 IT 버블 붕괴로 2002년에는 300대까지 폭락했습니다. 하지만 이때 살아남은 NHN(네이버), 엔씨소프트 등이 지금의 IT 대기업이 됐습니다.' },
      { id: 'kdj-p4', president_id: 'kdj', pledge_text: '국민기초생활보장제 도입', category: '복지', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '1999년 국민기초생활보장법 제정, 최저생활 보장 체계 구축', plain_explanation: '소득이 일정 기준 이하인 가구에 생계비·의료비·주거비 등을 국가가 지원하는 제도를 만들겠다는 약속입니다. 지금의 "기초생활수급자" 제도의 시작입니다.', why_it_matters: 'IMF 위기로 수백만 명이 극빈층으로 전락한 상황에서, 최소한의 생활을 국가가 보장하지 않으면 사회 안전망이 무너집니다. 한국 복지국가의 출발점으로 평가받습니다.', citizen_impact: '2000년 10월부터 시행되어 약 150만 명이 수급 혜택을 받았습니다. 노숙자·극빈층에게 월 생계비, 의료비, 주거비가 지급되어 "굶어 죽는 일"을 막는 최후의 안전망이 됐습니다.', what_went_wrong: '제도 자체는 성공적으로 도입됐지만, 수급 기준이 엄격해 "차상위 계층"(기준 살짝 위)은 혜택을 못 받는 사각지대가 생겼습니다. 또 "수급자 탈출"이 오히려 불이익이 되는 구조적 문제도 있었습니다.', real_example: 'IMF 이후 노숙자가 급증해 서울역 앞에 텐트촌이 생겼는데, 기초생활보장제가 시행된 후 무료 급식·의료·임시 주거가 제공되면서 노숙자 수가 감소하기 시작했습니다.' },
      { id: 'kdj-p5', president_id: 'kdj', pledge_text: '기업 구조조정', category: '경제', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: '재벌 구조개혁, 빅딜 추진, 대우그룹 해체', plain_explanation: 'IMF 위기의 원인이었던 재벌의 무분별한 확장과 불투명한 경영을 개혁하겠다는 약속입니다. "빅딜"(대기업 간 사업 교환)과 워크아웃(기업 회생 프로그램)을 추진했습니다.', why_it_matters: '30대 재벌의 평균 부채비율이 500%를 넘었습니다. "대마불사(Too Big to Fail)" 신화로 재벌이 빚을 내 무한 확장하는 구조가 외환위기의 핵심 원인이었습니다.', citizen_impact: '대우그룹 해체, 현대·삼성·LG 간 빅딜이 이뤄지면서 수만 명이 구조조정 대상이 됐습니다. 하지만 장기적으로 기업 재무 건전성이 좋아져 한국 대기업의 글로벌 경쟁력이 높아졌습니다.', what_went_wrong: '재벌 구조조정은 이뤄졌지만, 삼성·현대차 같은 최상위 재벌의 총수 지배구조(순환출자, 일감 몰아주기)는 근본적으로 바뀌지 않았습니다.', real_example: '대우그룹 김우중 회장이 해외로 도피하고 대우가 해체된 사건은 "재벌도 망할 수 있다"는 인식을 심어줬습니다. 반면 구조조정 과정에서 대우자동차 노동자들의 대규모 실직은 사회적 충격이었습니다.' },
    ],
    nmh: [
      { id: 'nmh-p1', president_id: 'nmh', pledge_text: '행정수도 이전', category: '행정', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 50, outcome_summary: '헌재 위헌 결정으로 행정중심복합도시로 수정 추진', plain_explanation: '대한민국의 수도를 서울에서 충청권으로 옮기겠다는 약속입니다. 서울 과밀 해소와 국토 균형발전이 목표였습니다.', why_it_matters: '대한민국 인구의 절반 이상이 수도권에 살고 있습니다. 수도 이전은 수도권 집중을 해소하고 지방 경제를 살리는 가장 강력한 수단이 될 수 있습니다.', citizen_impact: '헌법재판소가 "수도 이전은 위헌"이라고 결정하면서 행정중심복합도시(세종시)로 축소됐습니다. 현재 세종시는 정부 부처 이전으로 인구 40만 도시로 성장했습니다.', what_went_wrong: '2004년 헌법재판소가 "서울이 수도라는 것은 관습헌법"이라며 위헌 결정을 내렸습니다. 이후 "행정중심복합도시" 특별법으로 수정했지만, 청와대·국회는 여전히 서울에 남아 반쪽짜리가 됐습니다.', real_example: '세종시로 이전한 공무원들은 가족과 떨어져 주중에만 세종에서 지내는 "기러기 공무원"이 되는 경우가 많았습니다. 국회가 서울에 있어 장관들이 매주 서울-세종을 왕복하는 비효율도 생겼습니다.' },
      { id: 'nmh-p2', president_id: 'nmh', pledge_text: '국가균형발전', category: '행정', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 60, outcome_summary: '혁신도시, 기업도시 추진으로 지방 발전 기틀 마련', plain_explanation: '서울·수도권에 집중된 공공기관과 기업을 전국 각지로 분산시켜 지역 간 격차를 줄이겠다는 약속입니다. 전국 10개 혁신도시를 지정해 공공기관을 이전했습니다.', why_it_matters: '수도권에 인구·경제·교육 모든 것이 집중되면 지방은 소멸합니다. 2025년 현재 전국 228개 시·군·구 중 절반 이상이 인구 소멸 위험지역으로 분류되어 있습니다.', citizen_impact: '한국토지주택공사가 진주로, 한국전력이 나주로, 국민연금이 전주로 이전하는 등 변화가 있었습니다. 하지만 직원들의 수도권 출퇴근 문제와 지역 정착 실패가 과제로 남았습니다.', what_went_wrong: '공공기관은 이전했지만 가족은 서울에 남겨둔 "기러기" 직원이 많았습니다. 혁신도시 주변에 상업·문화·교육 인프라가 부족해 "섬처럼 떠 있는 혁신도시"라는 비판을 받았습니다.', real_example: '나주 혁신도시에 한국전력 본사가 이전했지만, 직원들이 주말마다 서울로 올라가면서 "금요일 오후 나주 KTX역은 서울행 직원들로 가득"이라는 말이 나왔습니다.' },
      { id: 'nmh-p3', president_id: 'nmh', pledge_text: '한미 FTA 체결', category: '경제', pledge_source: '제16대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '2007년 한미 FTA 협상 타결 (발효는 이명박 정부)', plain_explanation: '미국과 자유무역협정(FTA)을 맺어 양국 간 관세를 없애고 무역을 늘리겠다는 약속입니다. 세계 최대 시장인 미국과의 FTA는 한국 통상 역사상 가장 큰 협상이었습니다.', why_it_matters: '미국은 한국의 2위 수출 대상국입니다. FTA로 관세가 사라지면 삼성·현대차 등 수출 기업에 큰 이익이 됩니다. 반면 미국산 농산물·축산물에 국내 농민이 타격받을 수 있습니다.', citizen_impact: '미국산 쇠고기·자동차 등의 가격이 내려간 반면, 국내 농업·축산업은 경쟁 압력이 커졌습니다. 전체적으로 GDP 성장에 기여했다는 평가와 농민 피해가 크다는 비판이 공존합니다.', what_went_wrong: '협상은 타결됐지만 비준은 이명박 정부에서 이뤄졌습니다. 협상 과정에서 "미국산 쇠고기 수입"과 "투자자-국가 분쟁해결(ISD)" 조항이 큰 논란이 됐습니다.', real_example: '2006~2007년 한미 FTA 반대 촛불 시위가 서울 도심에서 대규모로 열렸습니다. "미국산 쇠고기 먹고 광우병 걸린다"는 공포가 퍼지면서 수십만 명이 거리로 나왔습니다.' },
      { id: 'nmh-p4', president_id: 'nmh', pledge_text: '부동산 투기 억제', category: '부동산', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 40, outcome_summary: '종합부동산세 도입 등 규제 강화했으나 효과 제한적', plain_explanation: '부동산 투기를 막아 집값을 안정시키겠다는 약속입니다. 종합부동산세를 새로 만들고, 양도소득세를 강화하는 등 "세금으로 투기를 잡겠다"는 정책이었습니다.', why_it_matters: '2003~2007년 서울 강남 아파트 가격이 2배 가까이 올랐습니다. 집값 폭등은 "갖는 자와 못 갖는 자" 사이의 자산 격차를 벌려 사회 불평등의 핵심 원인이 됩니다.', citizen_impact: '종합부동산세 도입으로 다주택자 세금 부담이 늘었지만, 집값 상승분이 세금보다 훨씬 커서 투기 억제 효과는 미미했습니다. 실수요자 입장에서 "집값이 계속 오르니 빨리 사야 한다"는 불안이 커졌습니다.', what_went_wrong: '세금 규제 위주로 대응했지만 공급이 부족한 상황을 해결하지 못했습니다. 강남 재건축 규제가 오히려 공급을 줄여 집값을 더 올리는 역효과를 냈습니다.', real_example: '2006년 "8·31 부동산 대책" 등 연이은 규제를 쏟아냈지만, 서울 강남 아파트 가격은 2003년 평당 1,500만원에서 2007년 3,000만원대로 두 배가 됐습니다.' },
      { id: 'nmh-p5', president_id: 'nmh', pledge_text: '권력기관 개혁', category: '정치', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 45, outcome_summary: '국정원 개혁, 검찰 중립성 강화 시도했으나 한계', plain_explanation: '국정원(정보기관), 검찰, 경찰 등 권력기관이 정치에 개입하지 못하도록 개혁하겠다는 약속입니다. 특히 과거 국정원의 선거 개입과 정치 사찰을 근절하려 했습니다.', why_it_matters: '권력기관이 대통령 편에서 정치에 개입하면 민주주의가 무너집니다. 과거 안기부(국정원 전신)가 야당 인사를 감시·탄압하고, 검찰이 정치적 수사를 한 역사가 있습니다.', citizen_impact: '국정원의 국내 정치 개입을 금지하는 방향으로 개혁을 시도했지만, 국정원법 개정은 국회에서 무산됐습니다. 검찰 인사에서 독립성을 존중하려 했으나 한계가 있었습니다.', what_went_wrong: '여소야대 국면에서 개혁 법안이 국회를 통과하지 못했습니다. 또 탄핵 정국(2004년) 등 정치적 위기를 겪으면서 권력기관 개혁에 집중할 여력이 부족했습니다.', real_example: '노무현 대통령은 "검찰이 정치에서 벗어나야 한다"며 검찰 인사에 개입하지 않으려 했지만, 측근 비리 수사에서 검찰과 갈등을 빚기도 했습니다. 2004년에는 국회 탄핵으로 직무가 정지되는 초유의 사태를 겪었습니다.' },
    ],
    lmb: [
      { id: 'lmb-p1', president_id: 'lmb', pledge_text: '747 공약 (7% 성장, 4만불, 7대 강국)', category: '경제', pledge_source: '제17대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 20, outcome_summary: '글로벌 금융위기로 성장률 평균 3.2%, 목표 전면 미달', plain_explanation: '"연 7% 경제성장, 1인당 국민소득 4만 달러, 세계 7대 경제강국"을 달성하겠다는 약속입니다. "경제 대통령"을 내세운 핵심 공약이었습니다.', why_it_matters: '경제 성장률이 높아지면 일자리가 늘고 소득이 오릅니다. 4만 달러는 당시 선진국 수준이었고, 7대 강국은 G7에 들어가겠다는 야심찬 목표였습니다.', citizen_impact: '취임 직후 2008년 글로벌 금융위기가 터져 성장률이 0.7%까지 떨어졌습니다. 임기 평균 성장률은 3.2%에 그쳤고, 1인당 국민소득도 2만 달러대에 머물렀습니다.', what_went_wrong: '2008년 미국발 금융위기가 결정적 원인이었지만, 처음부터 7%라는 목표가 비현실적이었다는 비판이 많았습니다. 한국 경제 성장률이 이미 3~4% 시대에 들어선 상황이었습니다.', real_example: '취임 직후 "비즈니스 프렌들리"를 외치며 감세·규제 완화를 추진했지만, 리먼 브라더스 파산(2008년 9월) 이후 세계 경제가 멈추면서 747 공약은 사실상 첫해에 불가능해졌습니다.' },
      { id: 'lmb-p2', president_id: 'lmb', pledge_text: '4대강 살리기 사업', category: '환경', pledge_source: '제17대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '22조원 투입, 사업 완료했으나 환경 파괴 논란 지속', plain_explanation: '한강·낙동강·금강·영산강 4개 강을 준설하고, 보(댐)를 설치하고, 자전거 도로를 만드는 22조원 규모의 대형 토목 사업입니다.', why_it_matters: '찬성 측은 홍수 예방과 수자원 확보를 강조했고, 반대 측은 환경 파괴와 예산 낭비를 비판했습니다. 역대 가장 논란이 큰 국책사업 중 하나입니다.', citizen_impact: '16개 보 건설로 수질이 악화되어 녹조("녹조 라떼")가 심각해졌습니다. 반면 자전거 도로는 인기를 끌었고, 수변 공원은 시민 휴식 공간이 됐습니다.', what_went_wrong: '사업 자체는 완료됐지만, 녹조 문제, 보 안전성 문제, 비용 대비 효과 논란이 계속됐습니다. 감사원이 "부실 시공"을 지적했고, 문재인 정부에서 일부 보를 해체하기도 했습니다.', real_example: '낙동강에 설치된 보에서 매년 녹조가 심하게 발생해 "녹조 라떼"라는 말이 유행했습니다. 대구·부산 등 낙동강 상수원을 쓰는 지역 주민들의 수질 불안이 커졌습니다.' },
      { id: 'lmb-p3', president_id: 'lmb', pledge_text: '글로벌 금융위기 극복', category: '경제', pledge_source: '대통령 국정과제', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: 'OECD 중 빠른 회복세, 2010년 G20 의장국 역할', plain_explanation: '2008년 미국발 글로벌 금융위기에 대응해 한국 경제를 빠르게 회복시키겠다는 약속입니다. 대규모 재정 투입과 금리 인하, 환율 안정 등 위기 대응에 나섰습니다.', why_it_matters: '리먼 브라더스 파산으로 전 세계 경제가 얼어붙었습니다. 한국은 1997년 IMF 위기의 트라우마가 있어, 또다시 외환위기가 올 수 있다는 공포가 컸습니다.', citizen_impact: 'OECD 국가 중 가장 빠르게 경기를 회복했습니다. 2010년 G20 정상회의를 서울에서 개최하며 한국의 위상을 높였습니다. 하지만 가계부채가 급증하는 부작용이 생겼습니다.', what_went_wrong: '위기 극복은 성공했지만, 경기부양을 위해 금리를 너무 낮추고 대출을 풀면서 가계부채가 급증했습니다. 이때 시작된 부채 문제가 이후 10년간 한국 경제의 뇌관이 됐습니다.', real_example: '2010년 서울 G20 정상회의에서 이명박 대통령이 "글로벌 금융 안전망"을 주도하며 국제적 주목을 받았습니다. 하지만 같은 시기 국내에서는 저금리로 "영끌 투자"가 시작되고 있었습니다.' },
      { id: 'lmb-p4', president_id: 'lmb', pledge_text: '녹색성장', category: '환경', pledge_source: '제17대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 50, outcome_summary: '녹색성장위원회 설치, 그린뉴딜 추진했으나 실효성 논란', plain_explanation: '환경과 경제 성장을 동시에 달성하는 "저탄소 녹색성장"을 새로운 국가 비전으로 제시한 공약입니다. 녹색성장기본법을 만들고 녹색기술에 투자하겠다고 했습니다.', why_it_matters: '기후변화가 세계적 의제로 떠오른 시기에, 환경을 지키면서도 경제를 성장시키는 모델은 미래 산업의 핵심입니다. 한국이 글로벌 기후 리더십을 보여줄 기회이기도 했습니다.', citizen_impact: '녹색성장기본법이 제정되고 녹색성장위원회가 만들어졌지만, 실질적으로 탄소 배출이 줄지 않았습니다. 오히려 4대강 사업을 "녹색 사업"이라 포장해 "그린워싱" 비판을 받았습니다.', what_went_wrong: '구호는 거창했지만 실행은 미흡했습니다. 원전 확대를 추진하면서 재생에너지 투자는 부족했고, 4대강 사업을 녹색사업으로 분류한 것이 신뢰를 떨어뜨렸습니다.', real_example: '2009년 녹색성장엑스포를 개최하고 "그린 홈 100만호"를 선언했지만, 실제 태양광 주택 보급은 목표의 10%도 달성하지 못했습니다. "말만 녹색"이라는 비판이 거셌습니다.' },
      { id: 'lmb-p5', president_id: 'lmb', pledge_text: '한반도 대운하 건설', category: '사회간접자본', pledge_source: '제17대 대선공약', fulfillment_status: '폐기', fulfillment_pct: 0, outcome_summary: '국민 반대로 사업 폐기, 4대강 사업으로 전환', plain_explanation: '서울에서 부산까지 한반도를 관통하는 대규모 운하를 건설하겠다는 약속입니다. 물류 혁신과 관광을 목표로 했으며, 예상 비용은 약 20~30조원이었습니다.', why_it_matters: '운하 건설은 물류비 절감과 내륙 수운 활성화를 기대할 수 있지만, 막대한 비용과 환경 파괴 우려가 큽니다. 한국처럼 산지가 많은 지형에서 운하의 경제성에 대한 의문이 강했습니다.', citizen_impact: '국민 70% 이상이 반대하면서 폐기됐습니다. 하지만 비판자들은 4대강 사업이 "이름만 바꾼 대운하"라고 주장했습니다.', what_went_wrong: '환경단체, 전문가, 여론 모두 반대가 압도적이었습니다. 경제성 분석에서도 "운하보다 철도·도로가 효율적"이라는 결론이 나와 취임 초기에 사실상 폐기됐습니다.', real_example: '2008년 광우병 촛불시위와 함께 대운하 반대 여론이 거세지자, 이명박 대통령은 "국민이 반대하면 안 하겠다"고 선언하고 4대강 살리기 사업으로 전환했습니다.' },
    ],
    pgh: [
      { id: 'pgh-p1', president_id: 'pgh', pledge_text: '창조경제 실현', category: '경제', pledge_source: '제18대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 25, outcome_summary: '창조경제혁신센터 설치했으나 구체적 성과 미흡', plain_explanation: '과학기술과 ICT를 기존 산업에 접목해 새로운 산업과 일자리를 만들겠다는 약속입니다. 전국 17개 시·도에 "창조경제혁신센터"를 설치하고 대기업과 연결했습니다.', why_it_matters: '한국 경제가 저성장 시대에 접어든 상황에서, 새로운 성장 동력을 찾는 것은 모든 정부의 핵심 과제입니다. 특히 청년 실업 해소를 위해 창업 생태계 조성이 필요했습니다.', citizen_impact: '창조경제혁신센터 17개가 설치됐지만 "뭘 하는 곳인지 모르겠다"는 반응이 대부분이었습니다. 대기업이 형식적으로 참여하고, 실질적 스타트업 육성 성과는 미미했습니다.', what_went_wrong: '"창조경제"라는 개념 자체가 너무 모호했습니다. 구체적 KPI 없이 센터만 만들어놓으니, 각 센터가 전시 행정에 그쳤습니다. 국정농단 사태 이후 사실상 방치됐습니다.', real_example: '미래창조과학부가 만들어지고 창조경제혁신센터에 삼성·LG 등이 배치됐지만, 현장에서는 "대기업 CSR(사회공헌) 수준"이라는 평가가 대부분이었습니다. 혁신센터 출신 성공 스타트업을 찾기 어렵습니다.' },
      { id: 'pgh-p2', president_id: 'pgh', pledge_text: '경제민주화', category: '경제', pledge_source: '제18대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 20, outcome_summary: '재벌 개혁 관련 법안 대부분 무산', plain_explanation: '재벌의 불공정 행위를 막고 중소기업·소상공인을 보호하겠다는 약속입니다. 일감 몰아주기 규제, 순환출자 금지 등 재벌 지배구조 개선을 약속했습니다.', why_it_matters: '한국 경제에서 10대 재벌의 매출이 GDP의 80%를 차지합니다. 재벌과 중소기업의 불공정 거래, 골목상권 침해 등이 심각한 사회 문제입니다.', citizen_impact: '대선 때는 강한 경제민주화를 외쳤지만, 취임 후 재벌 규제 법안 대부분이 국회에서 무산되거나 후퇴했습니다. 실질적으로 달라진 것이 거의 없었습니다.', what_went_wrong: '경제민주화를 핵심 공약으로 내세웠지만, 취임 후 경제활성화를 우선시하면서 재벌 규제를 사실상 포기했습니다. "경제민주화는 대선용이었다"는 비판을 받았습니다.', real_example: '대선 때 "순환출자 전면 금지"를 약속했지만, 취임 후 "신규 순환출자만 금지"로 후퇴했습니다. 삼성 이재용 부회장의 경영권 승계 과정에서 국민연금의 삼성물산 합병 찬성 논란도 터졌습니다.' },
      { id: 'pgh-p3', president_id: 'pgh', pledge_text: '4대 사회악 근절', category: '사회', pledge_source: '제18대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 40, outcome_summary: '성폭력, 학교폭력, 가정폭력, 불량식품 대응 강화', plain_explanation: '성폭력, 학교폭력, 가정폭력, 불량식품 4가지를 "사회악"으로 규정하고 강력하게 척결하겠다는 약속입니다. 관련 법률 강화와 단속 확대를 추진했습니다.', why_it_matters: '학교폭력, 성범죄 등은 국민 안전과 직결되는 문제입니다. 특히 학교폭력은 청소년 자살의 주요 원인이고, 가정폭력은 여성·아동의 안전을 위협합니다.', citizen_impact: '초기에 강력한 단속과 법 개정이 이뤄졌습니다. 성범죄자 전자발찌 확대, 학교 CCTV 설치, 식품 안전 단속 강화 등의 조치가 있었습니다.', what_went_wrong: '2014년 세월호 참사 이후 국정 동력이 상실되면서 4대 사회악 근절 정책도 힘을 잃었습니다. "구호만 요란하고 시스템은 안 바뀌었다"는 비판이 컸습니다.', real_example: '2014년 세월호 참사로 304명이 사망했습니다. "안전한 대한민국"을 약속했던 정부가 구조 과정에서 무능을 드러내면서 "4대 사회악 근절"이라는 구호가 공허하게 들렸습니다.' },
      { id: 'pgh-p4', president_id: 'pgh', pledge_text: '무상보육 실현', category: '복지', pledge_source: '제18대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '누리과정 도입으로 무상보육 실현', plain_explanation: '만 3~5세 아이의 보육·교육비를 국가가 무상으로 지원하겠다는 약속입니다. "누리과정"이라는 이름으로 어린이집·유치원비를 지원했습니다.', why_it_matters: '맞벌이 가정에서 보육비는 가장 큰 고정 지출 중 하나입니다. 아이 한 명당 월 30~50만원인 보육비를 국가가 대주면 출산·양육 부담이 줄어듭니다.', citizen_impact: '누리과정으로 영유아 보육비 본인 부담이 크게 줄었습니다. 만 0~5세 전 연령 무상보육이 실현되면서 부모들의 실질적 혜택이 컸습니다.', what_went_wrong: '무상보육 자체는 성공했지만, 국비와 지방비 분담을 놓고 중앙정부와 시·도 교육청이 갈등을 빚었습니다. 또 사립 어린이집의 보육 질 문제는 해결되지 않았습니다.', real_example: '무상보육 실시 후 어린이집 등록률이 급증했지만, 일부 맞벌이가 아닌 가정에서도 "무료니까" 아이를 어린이집에 보내면서 정작 맞벌이 가정이 자리를 못 구하는 역설이 생겼습니다.' },
      { id: 'pgh-p5', president_id: 'pgh', pledge_text: '통일 준비', category: '외교', pledge_source: '제18대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 15, outcome_summary: '한반도 신뢰프로세스 추진했으나 남북관계 경색', plain_explanation: '"한반도 신뢰프로세스"라는 이름으로 남북 간 신뢰를 쌓아 궁극적으로 통일을 준비하겠다는 약속입니다. "통일은 대박"이라는 발언이 유명합니다.', why_it_matters: '남북 분단은 군사적 긴장, 이산가족 고통, 경제적 비용 등 한반도의 근본적 문제입니다. 통일이 되면 경제적 시너지가 크다는 기대가 있습니다.', citizen_impact: '임기 중 남북관계가 오히려 악화됐습니다. 개성공단이 2016년 2월 전면 폐쇄되면서 124개 입주 기업이 피해를 입었고, 5만 명 이상의 북한 근로자가 일자리를 잃었습니다.', what_went_wrong: '북한의 핵·미사일 도발이 계속됐고, 정부는 "원칙 있는 대응"을 하면서 대화 채널이 완전히 닫혔습니다. 개성공단 폐쇄는 남북 경제협력의 마지막 끈도 끊은 것이었습니다.', real_example: '2016년 2월 개성공단 전면 폐쇄 후, 입주 기업 대표들이 TV에 나와 "하루아침에 수십 년 투자를 날렸다"며 울먹였습니다. 통일준비위원회가 만들어졌지만, 실질 활동은 거의 없었습니다.' },
    ],
    ysy: [
      { id: 'ysy-p1', president_id: 'ysy', pledge_text: '검찰 독립성 회복', category: '사법', pledge_source: '제20대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 40, outcome_summary: '공수처 기능 축소 시도, 검찰 수사권 강화', budget_impact: '-', plain_explanation: '문재인 정부에서 약화된 검찰의 수사권을 되돌리고, 검찰이 정치적 압력 없이 독립적으로 수사할 수 있게 하겠다는 약속입니다. 전직 검찰총장 출신답게 검찰 권한 복원에 집중했습니다.', why_it_matters: '수사권이 경찰로 넘어가면서 검찰의 대형 부패·비리 수사 역량이 약화됐다는 우려가 있었습니다. 반면 검찰 권한이 너무 커지면 "검찰 공화국"이 된다는 비판도 있습니다.', citizen_impact: '검찰 수사권이 일부 복원됐지만, 야당 인사에 대한 수사가 집중되면서 "검찰의 정치적 중립성"에 대한 의문이 커졌습니다.', what_went_wrong: '비상계엄 선포(2024년 12월)와 탄핵으로 임기가 조기 종료되면서 검찰 개혁 관련 법안들이 완결되지 못했습니다. 본인이 수사를 받는 상황이 되어 "검찰 독립"의 의미 자체가 퇴색됐습니다.', real_example: '취임 후 검찰이 이재명 더불어민주당 대표에 대한 수사를 집중하면서, "정치 검찰"이라는 비판과 "법 앞의 평등"이라는 옹호가 극명하게 갈렸습니다.' },
      { id: 'ysy-p2', president_id: 'ysy', pledge_text: '원전 산업 정상화', category: '에너지', pledge_source: '제20대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 55, outcome_summary: '신한울 3·4호기 건설 재개, 원전 수출 추진', budget_impact: '약 8조원 투입 계획', plain_explanation: '문재인 정부의 탈원전 정책을 뒤집고, 원전을 다시 핵심 에너지원으로 키우겠다는 약속입니다. 중단된 신한울 3·4호기 건설 재개와 해외 원전 수출을 추진했습니다.', why_it_matters: '원전은 탄소 배출이 적고 전기 생산 단가가 저렴합니다. AI·반도체 시대에 전력 수요가 폭증하는 상황에서 안정적 전력 공급은 산업 경쟁력의 핵심입니다.', citizen_impact: '신한울 3·4호기 건설이 재개되고, 체코 원전 수출(약 24조원 규모) 우선 협상 대상에 선정됐습니다. 원전 관련 일자리가 되살아나기 시작했습니다.', what_went_wrong: '비상계엄과 탄핵으로 임기가 단축되면서 원전 정책의 연속성이 불확실해졌습니다. 체코 원전 수출 계약도 최종 서명 전 정권이 바뀌게 됐습니다.', real_example: '2023년 체코 원전 수주전에서 한국수력원자력이 프랑스 EDF를 누르고 우선 협상 대상으로 선정돼 "K-원전의 부활"이라는 평가를 받았지만, 최종 계약까지는 마무리하지 못했습니다.' },
      { id: 'ysy-p3', president_id: 'ysy', pledge_text: '250만호 주택 공급', category: '부동산', pledge_source: '제20대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 30, outcome_summary: '공급 목표 대비 실적 부진, 건설 경기 침체', budget_impact: '-', plain_explanation: '임기 5년간 전국에 250만호의 주택을 공급해 집값을 안정시키겠다는 약속입니다. 규제 완화와 재건축·재개발 활성화로 공급을 늘리는 전략이었습니다.', why_it_matters: '집값 안정은 모든 정부의 핵심 과제입니다. 특히 2030세대의 내 집 마련이 불가능에 가까운 상황에서, 충분한 주택 공급만이 근본적 해결책이라는 인식이 커졌습니다.', citizen_impact: '고금리·고물가 상황에서 건설사들이 분양을 미루고, PF(프로젝트 파이낸싱) 부실 문제가 터지면서 실제 공급은 목표에 한참 못 미쳤습니다. 오히려 건설업 구조조정 우려가 커졌습니다.', what_went_wrong: '금리 인상(연 3.5%)으로 건설비가 치솟고 분양 시장이 얼어붙었습니다. 재건축·재개발 규제를 완화했지만, 착공까지 수년이 걸려 임기 내 효과를 보기 어려웠습니다.', real_example: '2023~2024년 전국 미분양 주택이 7만 호를 넘으면서 건설사 유동성 위기가 심화됐습니다. 특히 지방 중소 건설사가 줄도산하고, "태영건설 워크아웃" 같은 대형 사태도 발생했습니다.' },
      { id: 'ysy-p4', president_id: 'ysy', pledge_text: '반도체 초강대국 도약', category: '산업', pledge_source: '제20대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 45, outcome_summary: '반도체 특별법 제정, 용인 클러스터 추진', budget_impact: '10년간 300조 민간투자 유도', plain_explanation: '삼성·SK하이닉스를 중심으로 한국을 세계 반도체 산업의 최강국으로 만들겠다는 약속입니다. 용인에 세계 최대 반도체 클러스터를 조성하고, 세제 혜택을 늘리는 내용입니다.', why_it_matters: '반도체는 한국 수출의 20% 이상을 차지하는 핵심 산업입니다. AI 시대에 반도체 수요가 폭발적으로 늘고 있어, 반도체 경쟁력이 곧 국가 경쟁력입니다. 미중 기술 패권 경쟁에서 한국의 위치도 중요합니다.', citizen_impact: '반도체 특별법이 제정되고 용인 클러스터 계획이 발표됐습니다. 하지만 대규모 투자가 실제 일자리와 경제 효과로 이어지려면 수년이 걸리는 장기 프로젝트입니다.', what_went_wrong: '반도체 투자 계획은 세웠지만, 2023년 반도체 업황이 급격히 악화(메모리 가격 40% 폭락)되면서 기업들의 투자가 지연됐습니다. 비상계엄과 탄핵으로 정책 연속성도 불확실해졌습니다.', real_example: '용인 반도체 클러스터(300조원 투자 계획)가 발표됐지만, 전력·용수 공급 인프라가 아직 확보되지 않아 "계획만 거창하다"는 지적을 받았습니다. 삼성전자는 2024년 반도체 부문에서 분기 적자를 기록하기도 했습니다.' },
      { id: 'ysy-p5', president_id: 'ysy', pledge_text: '교육 대개혁', category: '교육', pledge_source: '제20대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 15, outcome_summary: '교육부 폐지 등 대선 공약 대부분 미추진', plain_explanation: '교육부를 폐지하고 국가교육위원회로 대체하는 등 교육 체계를 근본적으로 바꾸겠다는 약속입니다. 대학 자율성 확대, 늘봄학교 도입 등도 포함됐습니다.', why_it_matters: '한국 교육은 입시 위주의 획일적 시스템이라는 비판을 수십 년째 받고 있습니다. 사교육비가 가계를 압박하고, 아이들의 행복도는 OECD 최하위입니다.', citizen_impact: '늘봄학교(방과 후 돌봄)가 일부 시행됐지만, 교육부 폐지 등 핵심 공약은 추진조차 못 했습니다. 사교육비는 오히려 사상 최대(2023년 월 41만원)를 기록했습니다.', what_went_wrong: '여소야대 정국에서 교육 관련 법안이 국회를 통과하지 못했고, 교원단체·학부모 단체의 반발도 거셌습니다. 비상계엄·탄핵으로 교육개혁은 완전히 멈췄습니다.', real_example: '2023년 서울 서이초 교사 사망 사건 이후 "교권 보호"가 사회적 의제가 됐지만, 근본적 교육 개혁보다는 임시방편적 대응에 그쳤습니다. 사교육비는 계속 증가해 학부모들의 부담이 커졌습니다.' },
    ],
    ljm: [
      { id: 'ljm-p1', president_id: 'ljm', pledge_text: '기본소득 기반 복지 확대', category: '복지', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 20, outcome_summary: '기본소득 시범사업 설계 단계', budget_impact: '연간 약 15조원 예상', plain_explanation: '모든 국민에게 조건 없이 일정 금액을 지급하는 "기본소득"을 단계적으로 도입하겠다는 약속입니다. 성남시장 시절 청년배당(연 24만원)이 원형입니다.', why_it_matters: 'AI·자동화로 일자리가 줄어드는 시대에 기본소득은 최소한의 경제적 안전망이 됩니다. 기존 복지의 사각지대를 없애고, 소비를 촉진해 경제를 활성화할 수 있다는 주장입니다.', citizen_impact: '아직 설계 단계라 시민이 직접 체감하는 변화는 없습니다. 연간 약 15조원의 재원이 필요해 증세나 재정 구조 조정이 불가피한데, 구체적 방안이 나오지 않은 상태입니다.', what_went_wrong: '취임 초기라 아직 본격적으로 추진되지 않았습니다. 야당과 경제학자들은 "재원 확보 방안이 없다" "현금 뿌리기에 불과하다"고 비판하고 있습니다.', real_example: '성남시 청년배당(연 24만원 지역화폐)과 경기도 재난기본소득(1인 10만원)이 기본소득의 시범 모델이었습니다. 코로나 시기 전 국민 재난지원금이 인기를 끌면서 기본소득 논의가 활발해졌습니다.' },
      { id: 'ljm-p2', president_id: 'ljm', pledge_text: '디지털 정부 혁신', category: '행정', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 25, outcome_summary: 'AI 행정서비스 기본계획 수립 중', plain_explanation: '정부 행정 서비스를 AI·디지털 기술로 혁신해 민원 처리를 빠르고 편리하게 만들겠다는 약속입니다. "디지털 원패스"로 모든 정부 서비스를 하나의 앱에서 처리하는 것이 목표입니다.', why_it_matters: '한국은 전자정부 수준이 세계 2위이지만, 아직도 동사무소에 직접 가야 하는 민원이 많습니다. AI로 행정을 자동화하면 공무원은 더 중요한 업무에 집중하고, 시민은 24시간 서비스를 받을 수 있습니다.', citizen_impact: '아직 기본계획 수립 단계라 시민이 직접 체감하는 변화는 제한적입니다. "정부24" 앱의 기능 확대와 AI 상담 도입이 진행 중입니다.', what_went_wrong: '취임 초기라 아직 초기 단계에 있습니다. 개인정보 보호, 디지털 격차(어르신 등 디지털 취약 계층), AI 오류 시 책임 소재 등 해결해야 할 과제가 많습니다.', real_example: '경기도지사 시절 "경기도 AI 콜센터"를 도입해 민원 응답 시간을 줄인 경험이 있습니다. 이를 전국으로 확대하는 것이 목표이지만, 중앙정부 시스템 통합은 훨씬 복잡한 과제입니다.' },
      { id: 'ljm-p3', president_id: 'ljm', pledge_text: '경제민주화 2.0', category: '경제', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 15, outcome_summary: '공정경제 관련 법안 국회 발의 예정', plain_explanation: '대기업과 중소기업, 플랫폼 기업과 종사자 사이의 불공정을 바로잡겠다는 약속입니다. 기존 경제민주화에 플랫폼·데이터 경제 시대의 새로운 공정 규칙을 더한 것입니다.', why_it_matters: '배달앱 수수료, 플랫폼 노동자 권리, AI 시대 노동시장 변화 등 새로운 경제 불평등이 등장했습니다. 기존 재벌 규제만으로는 해결할 수 없는 문제가 생긴 것입니다.', citizen_impact: '아직 법안 발의 단계라 실질적 변화는 없습니다. 배달앱 수수료 인하, 플랫폼 노동자 보호법 등이 추진될 예정입니다.', what_went_wrong: '취임 초기라 본격적 추진이 시작되지 않았습니다. "경제민주화"가 역대 여러 정부에서 약속됐지만 번번이 실패한 전력이 있어 실현 가능성에 대한 회의론이 있습니다.', real_example: '배달의민족·쿠팡이츠 등 배달앱 수수료(중개 수수료 5~15%)로 소상공인의 부담이 큰 상황입니다. 카카오택시, 배달앱 등 플랫폼 기업의 독과점 문제를 해결하겠다는 것이 핵심입니다.' },
      { id: 'ljm-p4', president_id: 'ljm', pledge_text: '기후위기 대응 강화', category: '환경', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 10, outcome_summary: '2050 탄소중립 로드맵 재수립 착수', plain_explanation: '2050년까지 탄소 배출을 제로(0)로 만드는 "탄소중립"을 실현하겠다는 약속입니다. 윤석열 정부에서 후퇴한 기후 정책을 다시 강화하겠다는 것입니다.', why_it_matters: '기후변화로 폭염·폭우·산불이 갈수록 심해지고 있습니다. EU의 탄소국경세(CBAM) 시행으로 탄소 배출이 많은 기업의 수출이 불리해지는 등 경제적 영향도 큽니다.', citizen_impact: '2050 탄소중립 로드맵 재수립에 착수했지만, 아직 구체적 정책이 시행되지 않았습니다. 향후 전기차 보조금 확대, 재생에너지 비중 확대 등이 예상됩니다.', what_went_wrong: '취임 초기라 아직 본격 시행 전입니다. 탄소중립을 위해서는 산업 구조 전환, 에너지 전환 등 대규모 투자와 국민적 합의가 필요한데, 구체적 방안이 아직 부족합니다.', real_example: '2025년 여름 한반도 역대 최고기온을 기록하며 온열질환 환자가 급증했습니다. 젊은 세대 사이에서 "기후 위기가 내 미래에 직접 영향을 미친다"는 인식이 커지고 있습니다.' },
      { id: 'ljm-p5', president_id: 'ljm', pledge_text: '주거안정 대책', category: '부동산', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 15, outcome_summary: '공공주택 공급 확대 계획 수립 중', plain_explanation: '공공주택을 대폭 늘리고, 분양가 상한제 강화, 기본주택(공공 분양) 도입 등으로 "누구나 집 걱정 없이 살 수 있는 사회"를 만들겠다는 약속입니다.', why_it_matters: '서울 아파트 평균 가격이 12억원을 넘어 평범한 직장인은 30년 월급을 모아도 집을 사기 어렵습니다. 2030세대의 가장 큰 불안 요소가 주거 문제입니다.', citizen_impact: '공공주택 공급 확대 계획을 수립 중이지만, 아직 착공이 시작되지 않아 실질적 체감은 없습니다. 전세사기 피해 지원과 주거취약계층 보호 강화 등은 추진 중입니다.', what_went_wrong: '취임 초기라 아직 성과를 논하기 이릅니다. 다만 역대 모든 정부가 "집값 잡겠다"고 했지만 결국 실패한 전력이 있어, 이번에도 회의적인 시선이 적지 않습니다.', real_example: '2023~2024년 전세사기 피해가 심각해져 "빌라왕" 사건 등으로 수천 명이 보증금을 날렸습니다. 이 문제에 대한 피해자 구제와 재발 방지 대책이 시급합니다.' },
    ],
  };
  return pledges[presidentId] || [];
}

// ========================================
// 국정과제 데이터
// ========================================

export function getNationalAgendaByPresident(presidentId: string): NationalAgenda[] {
  const agendas: Record<string, NationalAgenda[]> = {
    mji: [
      { id: 'mji-a1', president_id: 'mji', agenda_number: 1, goal_category: '국민이 주인인 정부', title: '적폐의 철저한 청산', implementation_status: '이행완료', completion_rate: 85, budget_committed: 500, budget_executed: 480, description: '권력기관 적폐 청산 및 국정농단 진상규명', target_metric: '적폐 청산 과제', target_value: '100건', actual_value: '85건', ai_assessment: '국정농단 수사 완료, 일부 과제는 정치적 논란 속에 완결', plain_explanation: '박근혜 정부 시절 "국정농단"(최순실 게이트)의 진상을 규명하고, 관련된 비리와 부패를 청산하겠다는 과제입니다.', why_it_matters: '국정농단은 대통령의 권한이 사인(최순실)에게 넘어간 헌정 사상 초유의 사태였습니다. 이를 제대로 청산해야 "다시는 이런 일이 없다"는 신뢰가 생깁니다.', citizen_impact: '박근혜 전 대통령과 최순실이 구속되고 재판을 받았습니다. 국정원·검찰·군 등 권력기관의 적폐도 수사됐지만, "정치 보복"이라는 반발도 컸습니다.', success_or_failure: '국정농단 수사는 완료됐고 관련자 대부분이 처벌받았습니다. 하지만 "적폐 청산"이 정치적으로 이용됐다는 비판과, 청산이 불충분했다는 양쪽 비판을 모두 받았습니다.', real_example: '박근혜 전 대통령은 징역 20년을 선고받았고, 최순실은 징역 18년을 받았습니다. 삼성 이재용 부회장도 뇌물 혐의로 재판을 받았습니다.' },
      { id: 'mji-a2', president_id: 'mji', agenda_number: 2, goal_category: '국민이 주인인 정부', title: '반부패 개혁으로 청렴한 대한민국', implementation_status: '일부이행', completion_rate: 65, budget_committed: 1200, budget_executed: 980, description: '공수처 설치, 이해충돌방지법 등 반부패 제도 구축', target_metric: '반부패 법안 통과', target_value: '15건', actual_value: '10건', ai_assessment: '공수처 설치는 달성했으나 실효성 논란 지속', plain_explanation: '고위공직자 비리를 전담 수사하는 공수처를 설치하고, 공직자 이해충돌방지법 등 반부패 법률을 만들겠다는 과제입니다.', why_it_matters: '고위공직자의 부패는 국민 세금 낭비와 공정성 훼손으로 직결됩니다. 검찰이 자기 조직의 비리를 수사하는 것은 한계가 있어, 독립 수사기구가 필요하다는 논의가 있었습니다.', citizen_impact: '공수처가 설치되고 이해충돌방지법이 시행됐습니다. 하지만 공수처가 실제로 고위공직자를 기소한 사례가 적어 "유명무실"하다는 비판을 받았습니다.', success_or_failure: '제도적 틀은 만들어졌으나, 공수처의 수사 역량 부족과 정치적 중립성 논란이 계속됐습니다. 15건의 반부패 법안 중 10건만 통과한 것도 아쉬운 점입니다.', real_example: '공수처가 2021년 출범했지만 첫 기소까지 1년 이상 걸렸고, 이후에도 수사관 부족과 경험 미비로 "제 역할을 못 하고 있다"는 평가를 받았습니다.' },
      { id: 'mji-a3', president_id: 'mji', agenda_number: 5, goal_category: '더불어 잘사는 경제', title: '소득 주도 성장을 위한 일자리 경제', implementation_status: '미이행', completion_rate: 35, budget_committed: 50000, budget_executed: 42000, description: '최저임금 인상, 공공일자리 확대 등 소득주도성장 정책', target_metric: '고용률', target_value: '70%', actual_value: '66.5%', ai_assessment: '최저임금 급격 인상의 부작용으로 자영업 타격, 고용의 질 개선은 미흡', plain_explanation: '임금을 올려 소비를 늘리고, 소비가 늘면 기업 매출이 오르고, 그러면 다시 고용이 늘어나는 선순환을 만들겠다는 경제 전략입니다. 최저임금 인상과 공공일자리 확대가 핵심 수단이었습니다.', why_it_matters: '한국 경제는 수출 대기업 중심이라 국내 소비가 약합니다. 소득이 늘면 내수가 살아나고, 자영업자·소상공인도 혜택을 본다는 논리입니다.', citizen_impact: '최저임금 급등으로 편의점·식당 등의 인건비가 크게 올라 알바 자리가 줄었습니다. 고용률은 목표 70%에 한참 못 미친 66.5%에 그쳤습니다.', success_or_failure: '이론적으로는 맞지만 현실에서는 최저임금을 너무 급격히 올린 것이 문제였습니다. 소상공인의 인건비 부담이 커져 고용이 줄고, 자영업 폐업이 증가하는 역효과가 발생했습니다.', real_example: '2018년 "고용 쇼크" — 전년 대비 취업자 증가 수가 월 5만 명 이하로 떨어지는 달이 여러 번 나왔습니다. 편의점 2인 근무가 1인 근무로 줄고, 식당에서 서빙 로봇·키오스크가 급증한 것이 이 시기입니다.' },
      { id: 'mji-a4', president_id: 'mji', agenda_number: 8, goal_category: '더불어 잘사는 경제', title: '혁신 창업 국가 조성', implementation_status: '일부이행', completion_rate: 60, budget_committed: 15000, budget_executed: 13500, description: '벤처·스타트업 생태계 강화, 규제 샌드박스 도입', target_metric: '벤처 투자액', target_value: '10조원', actual_value: '7.7조원', ai_assessment: '벤처 생태계 성장했으나 글로벌 경쟁력 확보에는 한계', plain_explanation: '스타트업이 쉽게 창업하고 성장할 수 있도록 규제를 완화하고, 벤처 투자를 늘리겠다는 과제입니다. "규제 샌드박스"(신기술에 규제를 일시 면제)가 핵심 정책이었습니다.', why_it_matters: '대기업 중심 경제에서 벗어나 혁신적인 스타트업이 성장해야 새로운 일자리와 산업이 만들어집니다. 미국의 실리콘밸리처럼 한국도 창업 생태계를 키워야 합니다.', citizen_impact: '규제 샌드박스로 핀테크, 모빌리티 등 새로운 서비스가 등장했습니다. 토스, 카카오뱅크 같은 핀테크 서비스가 이 시기에 급성장했고, 국민 생활이 편리해졌습니다.', success_or_failure: '벤처 투자액이 4조원에서 7.7조원으로 늘어나는 등 양적으로는 성장했지만, 목표 10조원에는 못 미쳤습니다. 글로벌 유니콘 기업 배출에는 한계가 있었습니다.', real_example: '2019년 "규제 샌드박스" 시행으로 타다(차량호출 서비스)가 출시됐지만, 택시업계 반발로 결국 퇴출됐습니다. 혁신과 기존 산업의 충돌 문제를 해결하지 못한 대표 사례입니다.' },
      { id: 'mji-a5', president_id: 'mji', agenda_number: 12, goal_category: '내 삶을 책임지는 국가', title: '국민의 기본생활을 보장하는 맞춤형 사회보장', implementation_status: '이행완료', completion_rate: 80, budget_committed: 80000, budget_executed: 78000, description: '아동수당, 기초연금 인상, 건강보험 보장성 강화', target_metric: '건보 보장률', target_value: '70%', actual_value: '64.5%', ai_assessment: '사회보장 지출 대폭 확대, 지속가능성 우려도 제기됨', plain_explanation: '아동수당 신설, 기초연금 인상(월 25만원→30만원), 건강보험 보장률 확대 등 사회보장 제도를 대폭 강화하겠다는 과제입니다.', why_it_matters: '한국의 사회보장 지출은 GDP 대비 12%로 OECD 평균(20%)보다 훨씬 낮습니다. 저출산·고령화 시대에 사회 안전망을 확충하지 않으면 노인 빈곤과 양육 포기가 심화됩니다.', citizen_impact: '아동수당(월 10만원), 기초연금 인상, MRI·초음파 건보 적용 등 많은 혜택이 새로 생겼습니다. 하지만 건보료·국민연금 보험료도 올라 월급에서 빠지는 돈이 늘었습니다.', success_or_failure: '복지 혜택을 확대한 점은 성과이지만, 건보 보장률은 목표 70%에 못 미친 64.5%에 그쳤습니다. 복지 지출 증가 속도가 경제 성장 속도보다 빨라 재정 건전성 우려가 커졌습니다.', real_example: '기초연금이 25만원에서 30만원으로 올라 독거 어르신들에게 도움이 됐지만, 월 30만원으로 생활이 어려운 것은 마찬가지라는 목소리도 높았습니다.' },
      { id: 'mji-a6', president_id: 'mji', agenda_number: 15, goal_category: '내 삶을 책임지는 국가', title: '서민이 안심하는 주거환경 조성', implementation_status: '미이행', completion_rate: 20, budget_committed: 30000, budget_executed: 25000, description: '부동산 투기 억제, 공공임대주택 확대', target_metric: '서울 집값 안정', target_value: '안정', actual_value: '80% 상승', ai_assessment: '25차례 부동산 대책에도 불구하고 집값 폭등, 핵심 실패 과제로 평가', plain_explanation: '부동산 투기를 막고 공공임대주택을 늘려 서민이 주거 걱정 없이 살 수 있게 하겠다는 과제입니다. 다주택자 세금 강화, 대출 규제, 임대차 3법 등이 핵심이었습니다.', why_it_matters: '집은 생활의 기본입니다. 집값이 폭등하면 "가진 자"와 "못 가진 자"의 격차가 걷잡을 수 없이 벌어지고, 청년들은 내 집 마련의 꿈을 포기하게 됩니다.', citizen_impact: '서울 아파트 평균 매매가가 6억원대에서 12억원대로 약 80% 폭등했습니다. 전세값도 급등해 "전세 대란"이 발생했고, 월세 전환이 가속화됐습니다.', success_or_failure: '문재인 정부 최대의 실패 과제로 평가받습니다. 규제 일변도 정책으로 매물이 잠겨 오히려 집값이 올랐고, 임대차 3법(계약갱신청구권 등)은 전세값 폭등의 원인이 됐습니다.', real_example: '2020년 "임대차 3법" 시행 후, 전세 갱신 시 집주인이 5% 인상 상한에 맞추지 못해 "월세 전환"을 하거나, 신규 계약에서 한꺼번에 올려받는 일이 속출했습니다.' },
      { id: 'mji-a7', president_id: 'mji', agenda_number: 20, goal_category: '고르게 발전하는 지역', title: '지역 주도 균형발전', implementation_status: '일부이행', completion_rate: 55, budget_committed: 20000, budget_executed: 17500, description: '균형발전특별법 전면 개정, 지방분권 강화', target_metric: '수도권-비수도권 격차', target_value: '감소', actual_value: '정체', ai_assessment: '제도적 기반 마련에는 성공했으나 체감 수준의 균형발전에는 미흡', plain_explanation: '수도권에 쏠린 인구와 경제를 지방으로 분산하고, 지자체가 스스로 발전 방향을 결정할 수 있도록 권한을 넘기겠다는 과제입니다.', why_it_matters: '수도권에 전체 인구의 50% 이상이 살고, 비수도권 지역은 인구가 줄어 소멸 위기에 처해 있습니다. 지방이 죽으면 국가 전체의 활력이 떨어집니다.', citizen_impact: '균형발전특별법이 개정되고 지방재정분권 강화가 추진됐지만, 수도권-비수도권 격차는 줄지 않았습니다. 오히려 서울·경기 집값 폭등으로 자산 격차가 더 벌어졌습니다.', success_or_failure: '법적·제도적 기반은 마련했으나, 실질적 인구 이동이나 기업 이전은 미미했습니다. 지방 대학 정원 미달, 지방 청년 유출 등 현실은 나아지지 않았습니다.', real_example: '2020년 기준 비수도권 대학 입학 정원 미달률이 20%를 넘었고, 졸업생의 60% 이상이 수도권으로 떠났습니다. "서울 공화국" 현상은 오히려 심화됐습니다.' },
      { id: 'mji-a8', president_id: 'mji', agenda_number: 35, goal_category: '평화와 번영의 한반도', title: '남북 간 화해·협력 추진', implementation_status: '일부이행', completion_rate: 45, budget_committed: 5000, budget_executed: 3200, description: '남북정상회담, 판문점 선언 등 대화 재개', target_metric: '남북 교류 건수', target_value: '100건', actual_value: '45건', ai_assessment: '역사적 정상회담 성과 있으나 이후 북핵 문제 교착으로 동력 상실', plain_explanation: '남북 관계를 개선해 대화와 교류를 재개하겠다는 과제입니다. 2018년 세 차례 남북정상회담을 열고, 판문점 선언과 평양 공동선언을 발표했습니다.', why_it_matters: '남북 관계가 좋아지면 군사적 긴장이 줄고, 이산가족 상봉·경제 협력·관광 등 다양한 교류가 가능해집니다. 궁극적으로 한반도 평화와 통일의 기반이 됩니다.', citizen_impact: '2018년 남북정상회담 시 "한반도 평화"에 대한 기대감이 매우 높았습니다. 하지만 하노이 회담 결렬 후 남북관계가 다시 경색되면서 이산가족 상봉도 중단됐습니다.', success_or_failure: '2018년 세 차례 정상회담은 역사적 성과이지만, 비핵화 합의 불이행으로 지속성이 없었습니다. 2020년 북한의 남북공동연락사무소 폭파로 관계가 완전히 단절됐습니다.', real_example: '2018년 4월 판문점에서 남북 정상이 손잡고 군사분계선을 넘는 장면은 전 세계에 감동을 줬습니다. 하지만 2020년 6월 북한이 연락사무소를 폭파하면서 "평화의 시대"는 끝났습니다.' },
      { id: 'mji-a9', president_id: 'mji', agenda_number: 42, goal_category: '평화와 번영의 한반도', title: '국제협력 주도적 참여', implementation_status: '이행완료', completion_rate: 75, budget_committed: 8000, budget_executed: 7200, description: '신남방·신북방 정책 추진, 다자외교 강화', target_metric: '정상외교 횟수', target_value: '50회', actual_value: '48회', ai_assessment: '아세안·인도 관계 강화 성과, 신북방 정책은 러시아 제재로 제한적', plain_explanation: '미국·중국에만 의존하지 않고 동남아(ASEAN)·인도(신남방)와 러시아·중앙아시아(신북방) 등으로 외교를 다변화하겠다는 과제입니다.', why_it_matters: '한국 경제가 미국과 중국에 과도하게 의존하면, 미중 갈등 시 피해를 크게 봅니다. 동남아·인도는 인구 30억 명의 거대 시장이자 새로운 성장 파트너입니다.', citizen_impact: '아세안 국가와의 FTA 확대, 인도 시장 진출 확대, 한류의 동남아 확산 등 가시적 성과가 있었습니다. 베트남·인도네시아 등이 한국 기업의 주요 생산기지로 성장했습니다.', success_or_failure: '신남방 정책은 아세안·인도와의 관계를 격상하는 데 성공했습니다. 하지만 신북방 정책은 러시아·우크라이나 전쟁과 국제 제재로 사실상 멈췄습니다.', real_example: '베트남이 한국의 3대 수출국으로 성장한 것이 신남방 정책의 대표 성과입니다. 삼성·LG 등 대기업이 베트남에 대규모 공장을 짓고, 한류로 한국 제품 인기가 높아졌습니다.' },
      { id: 'mji-a10', president_id: 'mji', agenda_number: 50, goal_category: '내 삶을 책임지는 국가', title: '미세먼지·기후변화 대응', implementation_status: '일부이행', completion_rate: 55, budget_committed: 10000, budget_executed: 8500, description: '미세먼지 특별법 제정, 석탄발전소 가동 중단', target_metric: '초미세먼지 농도', target_value: '20㎍/㎥', actual_value: '23㎍/㎥', ai_assessment: '미세먼지 농도 일부 개선됐으나 기후위기 대응은 선언적 수준에 그침', plain_explanation: '미세먼지 줄이기와 기후변화 대응을 위해 석탄발전소를 줄이고, 노후 경유차를 퇴출하고, 2050 탄소중립 선언을 하겠다는 과제입니다.', why_it_matters: '미세먼지는 국민 건강을 직접 위협합니다. 초미세먼지(PM2.5)는 폐암·심장질환의 원인이 되며, 대한민국은 OECD 국가 중 공기 질이 최하위 수준이었습니다.', citizen_impact: '미세먼지 특별법 시행으로 비상저감조치(차량 제한, 발전소 가동 중단) 등이 이뤄졌습니다. 초미세먼지 농도가 일부 개선됐지만, 봄철 중국발 미세먼지는 여전히 심각합니다.', success_or_failure: '미세먼지 농도는 일부 줄었지만 목표(20㎍/㎥)에는 못 미쳤습니다. 기후변화 대응은 2050 탄소중립 선언까지 했으나 구체적 실행 계획은 미흡했습니다.', real_example: '2019년 3월 초미세먼지 비상저감조치가 7일 연속 발령되면서 학교 체육 수업이 취소되고 마스크 착용이 일상이 됐습니다. (코로나 이전에 이미 마스크 생활이 시작된 겁니다.)' },
    ],
    ysk: [
      { id: 'ysk-a1', president_id: 'ysk', agenda_number: 1, goal_category: '정치개혁', title: '금융실명제 시행', implementation_status: '이행완료', completion_rate: 100, description: '비실명 금융거래 금지로 금융 투명성 확보', ai_assessment: '한국 경제 투명성의 획기적 전환점', plain_explanation: '가짜 이름으로 은행 거래하는 것을 금지하는 제도입니다. 이전에는 정치인·기업인이 차명 계좌로 비자금을 만들고 탈세할 수 있었습니다.', why_it_matters: '차명 거래가 가능하면 누가 얼마나 재산을 가졌는지 알 수 없어, 세금도 제대로 걷을 수 없고 부패도 추적할 수 없습니다. 경제 투명성의 가장 기본적인 인프라입니다.', citizen_impact: '실명제 시행 후 비자금·차명 거래가 크게 줄었습니다. 하지만 시행 직후 주가 폭락과 부동산 시장 위축 등 단기 충격이 있어 일부 국민은 경제적 손실을 봤습니다.', success_or_failure: '역대 가장 성공적인 경제 개혁으로 평가받습니다. 한국 경제 투명성의 기틀을 마련했고, 이후 모든 금융 감독·세무 행정의 기반이 됐습니다.', real_example: '시행 당일 밤, 비실명 예금을 인출하려는 사람들이 은행에 몰려들었습니다. 수백억 원대 차명 예금이 드러나면서 정치인과 재벌의 비자금 실체가 밝혀지기 시작했습니다.' },
      { id: 'ysk-a2', president_id: 'ysk', agenda_number: 2, goal_category: '정치개혁', title: '지방자치 부활', implementation_status: '이행완료', completion_rate: 90, description: '30년 만에 지방자치선거 실시', ai_assessment: '풀뿌리 민주주의 기틀 마련', plain_explanation: '1961년 군사 쿠데타 이후 중단됐던 지방자치제를 되살려, 시장·군수·구청장과 지방의회 의원을 주민이 직접 투표로 뽑게 만드는 과제입니다.', why_it_matters: '중앙정부가 모든 것을 결정하면 지역 주민의 목소리가 반영되지 않습니다. 지방자치는 "우리 동네 일은 우리가 결정"하는 민주주의의 근본입니다.', citizen_impact: '1995년 전국 지방선거가 실시되면서 주민이 직접 지역 대표를 선출하게 됐습니다. 지역 현안에 대한 주민 관심과 참여가 높아졌습니다.', success_or_failure: '지방자치 부활 자체는 성공적이었습니다. 다만 지방재정 자립도가 낮고, 지방의원의 전문성 부족 등 풀어야 할 과제가 남았습니다.', real_example: '1995년 첫 전국 동시 지방선거에서 투표율 68.4%를 기록했습니다. 각 지역에서 "우리 동네 ○○ 유치" 같은 지역 밀착형 선거 공약이 처음 등장했습니다.' },
      { id: 'ysk-a3', president_id: 'ysk', agenda_number: 3, goal_category: '경제개방', title: 'OECD 가입 추진', implementation_status: '이행완료', completion_rate: 95, description: '선진국 클럽 가입으로 경제 위상 제고', ai_assessment: '급격한 개방의 양면성 존재', plain_explanation: '선진 경제국 모임인 OECD에 가입해 한국의 국제적 위상을 높이는 과제입니다. 가입 조건으로 자본시장과 금융시장 개방이 요구됐습니다.', why_it_matters: 'OECD 가입은 "선진국 클럽에 들어갔다"는 상징적 의미가 큽니다. 국제 신용도가 올라가고, 외국인 투자가 늘어나는 효과가 있습니다.', citizen_impact: '1996년 12월 OECD 29번째 회원국으로 가입했지만, 가입 조건인 급격한 자본시장 개방이 1년 후 IMF 외환위기의 원인이 됐습니다.', success_or_failure: '가입 자체는 성공했으나, 준비 없는 개방의 대가가 너무 컸습니다. "선진국 됐다" 기뻐한 지 1년 만에 IMF 구제금융을 받는 아이러니가 벌어졌습니다.', real_example: '가입 당시 "대한민국 선진국 반열에!" 뉴스가 넘쳤지만, 개방된 자본시장을 통해 단기 외자가 밀려들었다가 빠져나가면서 1997년 외환위기가 터졌습니다.' },
      { id: 'ysk-a4', president_id: 'ysk', agenda_number: 4, goal_category: '정치개혁', title: '역사바로세우기 운동', implementation_status: '이행완료', completion_rate: 80, description: '12.12 및 5.18 관련 전두환·노태우 재판', ai_assessment: '과거 청산의 상징적 성과, 사회적 통합에는 한계', plain_explanation: '12·12 군사반란과 5·18 광주민주화운동 유혈 진압의 주범인 전두환·노태우 두 전직 대통령을 법정에 세우는 과제입니다.', why_it_matters: '쿠데타와 학살의 주범을 처벌하는 것은 "불법적 권력 장악은 절대 용납하지 않겠다"는 민주주의의 선언입니다. 피해자와 유족에게는 수십 년 만의 정의 실현입니다.', citizen_impact: '전두환에 무기징역, 노태우에 징역 17년이 선고되면서 "군사독재 시대의 종결"이라는 상징적 의미가 컸습니다. 5·18 유족들에게 큰 위안이 됐습니다.', success_or_failure: '재판과 처벌은 이뤄졌지만, 김영삼 대통령이 임기 말 특별사면으로 두 사람을 풀어줘 "불완전한 정의"라는 비판을 받았습니다.', real_example: '1996년 법정에 선 전두환이 "5·18에 대해 사과할 것이 없다"고 발언하며 유족과 국민의 분노를 샀습니다. 결국 특별사면으로 1년여 만에 석방됐습니다.' },
      { id: 'ysk-a5', president_id: 'ysk', agenda_number: 5, goal_category: '경제개방', title: '세계화 추진', implementation_status: '일부이행', completion_rate: 50, description: '급격한 자본시장 개방과 세계화 추진', ai_assessment: '외환위기의 원인 중 하나로 평가되는 성급한 개방', plain_explanation: '한국 경제를 세계화(globalization)해 자본시장을 개방하고, 무역 장벽을 낮추겠다는 과제입니다. "세계화"를 국정의 최우선 기조로 내세웠습니다.', why_it_matters: '세계화는 수출 중심 한국에 필수적인 방향이지만, 준비 없이 자본시장을 열면 외국 자본의 급격한 유출입에 경제가 취약해집니다.', citizen_impact: '금융시장 개방으로 외국 자본이 밀려들었다가 빠져나가면서 1997년 IMF 외환위기가 터졌습니다. 대량 실업, 가정 해체, 자살률 급증 등 국가적 재앙이었습니다.', success_or_failure: '세계화의 방향 자체는 맞았으나 속도 조절에 완전히 실패했습니다. 금융감독 체계가 미비한 상태에서 개방을 강행해 단기 외채가 폭증하고 외환위기를 초래했습니다.', real_example: '외환위기 직전 종금사(종합금융회사)가 해외에서 단기 달러를 마구 빌려오다가, 갚을 수 없게 되면서 위기가 터졌습니다. 준비 없는 개방의 전형적 실패 사례입니다.' },
    ],
    kdj: [
      { id: 'kdj-a1', president_id: 'kdj', agenda_number: 1, goal_category: '경제위기 극복', title: 'IMF 외환위기 극복', implementation_status: '이행완료', completion_rate: 95, budget_committed: 195000, budget_executed: 195000, description: 'IMF 차관 조기 상환 및 경제 구조조정', ai_assessment: '세계적으로 유례없는 빠른 위기 극복', plain_explanation: '1997년 말 한국이 국가 부도 위기에 몰려 IMF에서 빌린 돈을 갚고, 경제를 정상화하는 과제입니다. 기업 구조조정, 금융 개혁, 노동시장 유연화 등 "4대 부문 개혁"을 추진했습니다.', why_it_matters: 'IMF 위기는 대한민국 역사상 최대의 경제 위기였습니다. 기업이 줄도산하고, 실업자가 178만 명까지 치솟아 수많은 가정이 파탄났습니다.', citizen_impact: '국민 350만 명이 금 모으기 운동에 참여해 227톤의 금을 모았습니다. 2001년 8월 IMF 차관 195억 달러를 예정보다 3년 일찍 전액 상환했습니다.', success_or_failure: '세계적으로 가장 빠른 위기 극복이라는 평가를 받았습니다. 하지만 구조조정 과정에서 비정규직 급증, 양극화 심화 등 "1997년 체제"의 후유증이 지금까지 이어지고 있습니다.', real_example: '2001년 8월 23일 IMF 차관 완제 기념식에서 온 국민이 환호했습니다. 하지만 위기 극복의 비용은 정리해고된 노동자, 폐업한 자영업자, 가정이 해체된 서민이 치렀습니다.' },
      { id: 'kdj-a2', president_id: 'kdj', agenda_number: 2, goal_category: '민주주의 발전', title: '남북 화해·협력', implementation_status: '이행완료', completion_rate: 85, description: '최초 남북정상회담, 햇볕정책 추진', ai_assessment: '노벨평화상 수상으로 국제적 인정', plain_explanation: '북한과 대화하고 교류해 남북 관계를 개선하겠다는 "햇볕정책"입니다. 2000년 분단 이후 최초의 남북정상회담을 성사시켰습니다.', why_it_matters: '남북 대화가 없으면 군사적 긴장이 계속되고, 이산가족은 만날 수 없고, 경제 협력도 불가능합니다. 평화적 관계 개선은 한반도의 근본적 과제입니다.', citizen_impact: '2000년 6·15 남북정상회담 이후 이산가족 상봉이 성사되어 수만 가족이 50년 만에 만났습니다. 금강산 관광이 시작돼 일반 시민도 북한을 방문할 수 있게 됐습니다.', success_or_failure: '정상회담과 노벨평화상 수상은 큰 성과이지만, 북한의 핵개발은 계속됐고 "대북 송금 특검"(현대의 5억 달러 대북 송금)이라는 논란도 있었습니다.', real_example: '2000년 6월 평양 공항에서 김대중 대통령과 김정일 위원장이 악수하는 장면이 생중계됐습니다. 이산가족 상봉 장면은 전 국민을 울렸습니다.' },
      { id: 'kdj-a3', president_id: 'kdj', agenda_number: 3, goal_category: '경제위기 극복', title: 'IT 강국 건설', implementation_status: '이행완료', completion_rate: 95, budget_committed: 30000, budget_executed: 28000, description: '초고속인터넷 인프라, 벤처 육성', ai_assessment: '한국 IT 산업의 황금기를 열었다는 평가', plain_explanation: '초고속인터넷 인프라를 전국에 깔고, 벤처기업을 육성하고, 전자정부를 구축해 "IT 강국 대한민국"을 만들겠다는 과제입니다.', why_it_matters: 'IMF 위기로 기존 제조업이 한계를 드러낸 상황에서, IT는 적은 자본으로 빠르게 성장할 수 있는 유일한 돌파구였습니다. 이때의 투자가 지금 K-디지털의 기반입니다.', citizen_impact: '초고속인터넷 보급률 세계 1위를 달성했습니다. PC방이 전국에 퍼지고, 네이버·다음·싸이월드 같은 한국형 인터넷 서비스가 탄생했습니다. 일상에서 인터넷이 당연해진 시대가 열렸습니다.', success_or_failure: 'IT 강국의 기틀을 마련한 역대 가장 성공적인 산업 정책으로 평가받습니다. 하지만 벤처 거품 붕괴(2000~2001)로 많은 투자자와 벤처 기업인이 피해를 입기도 했습니다.', real_example: '1999년 PC방이 전국 2만 개를 넘으며 "스타크래프트 열풍"이 불었습니다. 이때 시작된 e스포츠와 온라인 게임 산업은 한국의 대표 문화산업이 됐습니다.' },
      { id: 'kdj-a4', president_id: 'kdj', agenda_number: 4, goal_category: '민주주의 발전', title: '국민기초생활보장', implementation_status: '이행완료', completion_rate: 90, description: '복지 사각지대 해소를 위한 기초생활보장제 도입', ai_assessment: '한국 복지국가의 출발점', plain_explanation: '소득이 일정 기준 이하인 가구에 생계비·의료비·주거비를 국가가 보장하는 제도를 만드는 과제입니다. "아무도 굶어 죽지 않는 나라"가 목표였습니다.', why_it_matters: 'IMF 위기로 수백만 명이 극빈층으로 전락한 상황에서, 최소한의 생존을 국가가 보장하지 않으면 사회가 붕괴됩니다. 한국 복지국가의 출발점으로 평가받습니다.', citizen_impact: '2000년 시행 이래 최저소득층에 생계비·의료비·주거비가 지급되고 있습니다. 노숙자·극빈층의 최후의 안전망 역할을 합니다.', success_or_failure: '한국 복지제도의 기틀을 마련한 성공적 과제입니다. 다만 수급 기준이 엄격해 "차상위 계층" 사각지대가 생긴 점은 아쉽습니다.', real_example: 'IMF 이후 서울역 앞 노숙자 수가 폭증했는데, 기초생활보장제 시행 후 무료 급식·의료·임시 주거가 제공되면서 노숙 인구가 점진적으로 감소했습니다.' },
      { id: 'kdj-a5', president_id: 'kdj', agenda_number: 5, goal_category: '경제위기 극복', title: '재벌 구조개혁', implementation_status: '이행완료', completion_rate: 75, description: '빅딜, 워크아웃 등 기업 구조조정', ai_assessment: '재벌 체제의 투명성 개선에 기여했으나 근본적 개혁에는 한계', plain_explanation: 'IMF 위기의 원인인 재벌의 과다 차입과 불투명 경영을 개혁하는 과제입니다. 대기업 간 사업 교환(빅딜), 회생 프로그램(워크아웃), 부채비율 200% 이하 규제 등을 추진했습니다.', why_it_matters: '30대 재벌의 평균 부채비율이 500%를 넘었습니다. 기업이 빚을 내서 무한 확장하는 구조를 바꾸지 않으면 같은 위기가 반복될 수밖에 없었습니다.', citizen_impact: '대우그룹 해체 등 대기업 구조조정으로 수만 명이 실직했지만, 장기적으로 살아남은 기업들의 재무 건전성이 크게 좋아졌습니다.', success_or_failure: '부채비율 200% 규제, 결합재무제표 도입 등 투명성을 높인 점은 성과입니다. 하지만 삼성·현대 등 최상위 재벌의 순환출자·총수 지배 구조는 근본적으로 바뀌지 않았습니다.', real_example: '대우그룹이 해체되면서 부산의 대우조선소, 인천의 대우자동차 등에서 대규모 실직이 발생했습니다. "대마불사" 신화가 깨졌지만, 그 비용은 노동자가 치렀습니다.' },
    ],
    nmh: [
      { id: 'nmh-a1', president_id: 'nmh', agenda_number: 1, goal_category: '참여민주주의', title: '행정수도 이전', implementation_status: '일부이행', completion_rate: 50, budget_committed: 45000, budget_executed: 20000, description: '행정수도 세종시 이전 추진', ai_assessment: '헌재 위헌 결정으로 축소됐으나 세종시의 토대 마련', plain_explanation: '서울에서 충청권으로 수도를 옮겨 수도권 과밀을 해소하겠다는 과제입니다. 헌법재판소의 위헌 결정으로 "행정중심복합도시"(세종시)로 수정됐습니다.', why_it_matters: '서울에 모든 것이 집중되면 교통 혼잡, 집값 폭등, 지방 소멸이 심화됩니다. 행정 기능을 분산하면 수도권 부담이 줄고 지방 경제가 살아납니다.', citizen_impact: '세종시에 36개 정부 부처와 공공기관이 이전해 인구 40만 도시로 성장했습니다. 하지만 청와대와 국회는 서울에 남아 "반쪽짜리 이전"이라는 한계가 있습니다.', success_or_failure: '헌재의 위헌 결정으로 원래 목표인 수도 이전은 무산됐지만, 세종시라는 새로운 행정도시를 만든 것은 성과입니다. 다만 완전한 균형발전에는 미흡합니다.', real_example: '세종시로 이전한 공무원 중 가족과 떨어져 혼자 사는 "기러기 공무원"이 60% 이상입니다. 장관이 매주 서울-세종을 왕복하며 국회에 출석하는 비효율도 문제입니다.' },
      { id: 'nmh-a2', president_id: 'nmh', agenda_number: 2, goal_category: '균형발전', title: '국가균형발전', implementation_status: '일부이행', completion_rate: 60, budget_committed: 35000, budget_executed: 28000, description: '혁신도시, 기업도시 건설', ai_assessment: '지방 분산의 제도적 기반 마련에 기여', plain_explanation: '전국 10개 혁신도시에 공공기관을 이전하고, 기업도시를 건설해 수도권 집중을 해소하겠다는 과제입니다. 국가균형발전특별법을 제정했습니다.', why_it_matters: 'GDP의 50%, 인구의 50%가 수도권에 집중되어 있습니다. 이 불균형을 해소하지 않으면 지방은 소멸하고 수도권은 과밀로 삶의 질이 떨어집니다.', citizen_impact: '전국 10개 혁신도시가 지정되고 154개 공공기관이 이전을 시작했습니다. 하지만 직원들의 지역 정착이 어렵고, 혁신도시 주변 인프라 부족이 문제였습니다.', success_or_failure: '공공기관 이전이라는 제도적 틀은 만들었으나, 실질적 균형발전까지는 도달하지 못했습니다. 혁신도시가 "섬"처럼 주변 지역과 단절된 채 운영되는 한계가 있었습니다.', real_example: '한국수자원공사가 대전에서 대구로, 한국도로공사가 서울에서 김천으로 이전했습니다. 하지만 직원들 상당수가 주말에 서울로 돌아가는 "기러기 생활"을 했습니다.' },
      { id: 'nmh-a3', president_id: 'nmh', agenda_number: 3, goal_category: '경제성장', title: '한미 FTA 추진', implementation_status: '이행완료', completion_rate: 85, description: '한미 자유무역협정 협상 타결', ai_assessment: '한국 통상정책의 전환점, 발효는 후임 정부에서 이루어짐', plain_explanation: '미국과 자유무역협정(FTA)을 체결해 관세를 없애고 교역을 확대하겠다는 과제입니다. 2006년 협상을 시작해 2007년 타결했습니다.', why_it_matters: '미국은 세계 최대 경제 대국이자 한국의 주요 수출 시장입니다. FTA가 체결되면 한국 기업의 미국 시장 접근성이 크게 좋아집니다.', citizen_impact: '협상 과정에서 "미국산 쇠고기 수입" "의약품 가격 상승" 등의 우려로 대규모 시위가 벌어졌습니다. 실제 발효 후 미국산 농산물 가격이 내려간 반면 국내 농업은 타격을 받았습니다.', success_or_failure: '협상 타결 자체는 성과이지만, 비준은 이명박 정부에서 이뤄졌습니다. FTA 체결 후 한미 교역량이 확대돼 경제적 효과가 있었으나, 농업 부문 피해 보상이 충분하지 않았다는 비판이 있습니다.', real_example: '2006년 한미 FTA 협상 개시 후 서울 도심에서 농민·시민단체의 대규모 반대 시위가 열렸습니다. "쌀 개방 반대" 구호를 외치며 경찰과 충돌하는 장면이 뉴스에 연일 보도됐습니다.' },
      { id: 'nmh-a4', president_id: 'nmh', agenda_number: 4, goal_category: '참여민주주의', title: '권력기관 개혁', implementation_status: '일부이행', completion_rate: 45, description: '국정원, 검찰, 경찰 개혁 추진', ai_assessment: '제도적 개선 시도했으나 완성도는 부족', plain_explanation: '국정원의 정치 개입 금지, 검찰의 독립성 보장, 경찰 자치경찰제 도입 등 권력기관이 정치 도구로 쓰이지 않도록 개혁하겠다는 과제입니다.', why_it_matters: '과거 국정원(안기부)이 선거에 개입하고 정치인을 사찰하는 등 권력기관의 정치 중립이 무너진 역사가 있습니다. 민주주의를 지키려면 권력기관의 개혁이 필수입니다.', citizen_impact: '국정원의 국내 정보 수집 활동을 제한하려 했지만, 법 개정이 국회에서 무산됐습니다. 검찰 인사에 대통령이 개입하지 않으려 노력했으나 한계가 있었습니다.', success_or_failure: '의도는 좋았으나 여소야대와 탄핵 정국(2004년)으로 실행력이 부족했습니다. 권력기관 개혁의 "씨앗"은 뿌렸지만, 열매는 후임 정부들의 과제로 남았습니다.', real_example: '2004년 국회가 노무현 대통령을 탄핵하면서 63일간 직무 정지됐습니다. 이 시기에 권력기관 개혁 추진력이 크게 약화됐습니다.' },
      { id: 'nmh-a5', president_id: 'nmh', agenda_number: 5, goal_category: '경제성장', title: '부동산 안정화', implementation_status: '미이행', completion_rate: 30, description: '종합부동산세 도입 등 부동산 규제 강화', ai_assessment: '강력한 규제에도 집값 상승 억제에 한계', plain_explanation: '집값 폭등을 막기 위해 종합부동산세(종부세)를 신설하고, 양도소득세를 강화하는 등 세금으로 부동산 투기를 잡겠다는 과제입니다.', why_it_matters: '2003~2007년 서울 강남 아파트 가격이 2배로 뛰면서 "가진 자"와 "못 가진 자"의 격차가 급격히 벌어졌습니다. 부동산은 한국 사회 불평등의 핵심 원인입니다.', citizen_impact: '종부세 도입으로 다주택자 세금이 늘었지만, 집값 상승분이 세금보다 훨씬 커서 투기 억제 효과는 미미했습니다. 오히려 "세금 폭탄"이라는 불만이 커졌습니다.', success_or_failure: '세금 규제만으로는 집값을 잡을 수 없다는 것을 보여준 실패 사례입니다. 공급 부족 문제를 해결하지 못한 채 규제만 쌓으니 효과가 없었습니다.', real_example: '서울 강남 아파트 가격이 2003년 평당 1,500만원에서 2007년 3,000만원대로 두 배가 됐습니다. "부동산으로 돈 번 사람"과 "열심히 일해도 집을 못 사는 사람" 사이의 갈등이 심화됐습니다.' },
    ],
    lmb: [
      { id: 'lmb-a1', president_id: 'lmb', agenda_number: 1, goal_category: '경제성장', title: '747 경제성장 계획', implementation_status: '미이행', completion_rate: 20, description: '연 7% 성장, 1인당 국민소득 4만 달러, 세계 7대 경제강국', ai_assessment: '글로벌 금융위기로 목표 전면 미달', plain_explanation: '"매년 7% 경제성장, 1인당 국민소득 4만 달러, 세계 7대 경제강국"이라는 세 가지 7을 달성하겠다는 핵심 국정과제입니다.', why_it_matters: '경제 성장은 일자리와 소득에 직결됩니다. 7%라는 목표가 달성되면 국민 소득이 빠르게 늘어 선진국 수준의 삶에 가까워집니다.', citizen_impact: '취임 직후 글로벌 금융위기가 터져 성장률이 0.7%까지 떨어졌습니다. 임기 평균 성장률은 3.2%에 그쳤고, 국민소득 4만 달러와 7대 강국 진입은 달성하지 못했습니다.', success_or_failure: '2008년 글로벌 금융위기라는 외부 요인이 결정적이었지만, 처음부터 7%라는 목표 자체가 비현실적이었다는 비판이 많습니다.', real_example: '취임 첫해인 2008년 리먼 브라더스 파산으로 세계 경제가 멈추면서 747 공약은 사실상 불가능해졌습니다. 이후 "누가 7%를 공약했느냐"는 해명이 나오기도 했습니다.' },
      { id: 'lmb-a2', president_id: 'lmb', agenda_number: 2, goal_category: '녹색성장', title: '4대강 살리기', implementation_status: '이행완료', completion_rate: 90, budget_committed: 22000, budget_executed: 22000, description: '4대강 정비 사업 추진', ai_assessment: '환경 파괴 논란과 비용 대비 효과에 대한 비판이 큼', plain_explanation: '한강·낙동강·금강·영산강에 16개 보(댐)를 설치하고, 강바닥을 파내고(준설), 자전거 도로를 만드는 22조원 규모 국책사업입니다.', why_it_matters: '정부는 홍수 예방, 수자원 확보, 수질 개선을 목표로 내세웠지만, 환경단체와 학계는 생태계 파괴와 세금 낭비를 우려했습니다. 역대 가장 논란이 큰 국책사업 중 하나입니다.', citizen_impact: '4대강 주변에 자전거 도로와 수변 공원이 생긴 것은 인기를 끌었지만, 보 설치로 녹조가 심각해져 "녹조 라떼"라는 말이 유행했습니다.', success_or_failure: '사업 자체는 예산 내에서 완공됐지만, 환경 파괴와 수질 악화라는 부작용이 컸습니다. 감사원이 부실 시공을 지적했고, 후임 정부에서 일부 보를 해체하기도 했습니다.', real_example: '낙동강 보에서 매년 여름 녹조가 심하게 발생해 대구·부산 등 상수원 수질에 대한 불안이 커졌습니다. 4대강 자전거길은 인기를 끌어 "라이딩 명소"가 되기도 했습니다.' },
      { id: 'lmb-a3', president_id: 'lmb', agenda_number: 3, goal_category: '경제성장', title: '글로벌 금융위기 대응', implementation_status: '이행완료', completion_rate: 80, budget_committed: 50000, budget_executed: 45000, description: '경기부양 패키지, G20 의장국 역할', ai_assessment: 'OECD 중 가장 빠른 경기 회복 달성', plain_explanation: '2008년 미국발 글로벌 금융위기에 대응해 대규모 재정 투입, 금리 인하, 한미 통화스와프 체결 등으로 경제를 살리겠다는 과제입니다.', why_it_matters: '리먼 브라더스 파산으로 세계 경제가 공황 직전까지 갔습니다. 1997년 IMF 위기의 트라우마가 있는 한국에서 "또 외환위기가 오는 것 아닌가"라는 공포가 컸습니다.', citizen_impact: 'OECD 국가 중 가장 빠르게 경기를 회복했고, 2010년 서울 G20 정상회의를 개최해 국격을 높였습니다. 하지만 경기부양을 위한 저금리가 가계부채 급증을 불렀습니다.', success_or_failure: '위기 대응 자체는 성공적이었습니다. 하지만 그 과정에서 가계부채가 급증하고, 부동산 투기가 재발하는 등 후유증이 남았습니다.', real_example: '2008년 한미 통화스와프(300억 달러) 체결 소식에 환율이 안정됐고, 주가도 반등했습니다. 2010년 서울 G20에서 이명박 대통령이 "글로벌 금융 안전망"을 주도했습니다.' },
      { id: 'lmb-a4', president_id: 'lmb', agenda_number: 4, goal_category: '녹색성장', title: '저탄소 녹색성장', implementation_status: '일부이행', completion_rate: 50, description: '녹색성장기본법 제정, 녹색기술 육성', ai_assessment: '선언적 수준에 그친 측면이 강함', plain_explanation: '탄소 배출을 줄이면서 경제를 성장시키는 "저탄소 녹색성장"을 국가 비전으로 삼겠다는 과제입니다. 녹색성장기본법을 만들고 녹색기술에 투자하겠다고 했습니다.', why_it_matters: '기후변화가 세계적 의제로 부상하면서, 탄소 배출을 줄이지 않는 나라는 국제사회에서 불이익을 받게 됩니다. 녹색기술은 미래 산업의 핵심이기도 합니다.', citizen_impact: '녹색성장기본법이 제정되고 녹색성장위원회가 만들어졌지만, 국민 생활에서 체감하는 변화는 미미했습니다. 탄소 배출은 오히려 증가했습니다.', success_or_failure: '법과 조직은 만들어졌지만 실행이 부족했습니다. 4대강 사업을 "녹색 사업"으로 포장한 것이 신뢰를 떨어뜨렸고, 원전 확대와 녹색성장의 모순도 지적됐습니다.', real_example: '녹색성장위원회가 수립한 "그린 홈 100만호" 계획은 목표의 10%도 달성하지 못했습니다. 말은 녹색이었지만 실행은 "그레이(회색)"였다는 평가를 받았습니다.' },
      { id: 'lmb-a5', president_id: 'lmb', agenda_number: 5, goal_category: '사회안전', title: '한반도 대운하', implementation_status: '폐기', completion_rate: 0, description: '한반도 대운하 건설 계획', ai_assessment: '국민 반대로 사업 전면 백지화', plain_explanation: '서울에서 부산까지 한반도를 가로지르는 대규모 운하를 건설하는 계획입니다. 물류비 절감과 관광 활성화를 목표로 했지만, 국민 반대로 폐기됐습니다.', why_it_matters: '수십조 원의 세금이 들어가는 사업이므로 경제성 분석이 중요합니다. 환경 파괴 없이 동일한 물류 효과를 얻을 수 있는 대안(철도, 도로)이 있는지도 따져봐야 합니다.', citizen_impact: '국민 70% 이상이 반대하면서 취임 초기에 폐기됐습니다. 하지만 4대강 사업이 "이름만 바꾼 대운하"라는 논란이 이어졌습니다.', success_or_failure: '여론과 전문가 의견을 반영해 폐기한 것은 긍정적이지만, 4대강 사업으로 사실상 전환됐다는 비판이 거셉니다.', real_example: '2008년 초 대운하 반대 여론이 거세지자, 이명박 대통령이 "국민이 반대하면 안 하겠다"고 선언했습니다. 이후 4대강 살리기 사업을 추진하면서 "대운하의 변형"이라는 의혹을 받았습니다.' },
    ],
    pgh: [
      { id: 'pgh-a1', president_id: 'pgh', agenda_number: 1, goal_category: '경제혁신', title: '창조경제', implementation_status: '미이행', completion_rate: 25, budget_committed: 15000, budget_executed: 8000, description: '창조경제혁신센터 설치, 창업 생태계 조성', ai_assessment: '개념 자체가 모호하다는 비판, 구체적 성과 부족', plain_explanation: 'ICT와 문화 콘텐츠를 기존 산업에 융합해 새로운 가치를 만들겠다는 경제 전략입니다. 전국 17개 "창조경제혁신센터"를 설치하고 대기업이 참여하는 구조였습니다.', why_it_matters: '한국이 제조업 중심 경제에서 벗어나 혁신 기반 경제로 전환하는 것은 미래 경쟁력의 핵심입니다. 하지만 "창조경제"가 무엇인지 명확하지 않으면 실행이 불가능합니다.', citizen_impact: '창조경제혁신센터가 설치됐지만 "뭘 하는 곳인지 모르겠다"는 반응이 대부분이었습니다. 일반 시민의 생활에 변화를 준 성과를 찾기 어렵습니다.', success_or_failure: '가장 큰 문제는 "창조경제"라는 개념이 너무 모호했다는 것입니다. 구체적 KPI 없이 센터만 만들어놓으니 전시 행정에 그쳤고, 국정농단 이후 완전히 방치됐습니다.', real_example: '대전 창조경제혁신센터에 SK가 배치됐지만, 현장 관계자들은 "대기업이 형식적으로 참여하는 수준"이라고 했습니다. 성과 보고회에서 숫자만 부풀리는 전시 행정이라는 비판이 거셌습니다.' },
      { id: 'pgh-a2', president_id: 'pgh', agenda_number: 2, goal_category: '경제민주화', title: '경제민주화 실현', implementation_status: '미이행', completion_rate: 20, description: '재벌 구조 개선, 공정거래 강화', ai_assessment: '대선 핵심 공약이었으나 취임 후 사실상 후퇴', plain_explanation: '재벌의 불공정 행위를 막고, 대기업과 중소기업 간 공정한 경쟁 환경을 만들겠다는 과제입니다. 순환출자 금지, 일감 몰아주기 규제 등이 포함됐습니다.', why_it_matters: '대기업이 하청업체에 납품 단가를 무리하게 깎거나, 일감을 총수 일가 회사에 몰아주면 중소기업과 소상공인이 피해를 봅니다. 공정한 경제가 건강한 시장의 기본입니다.', citizen_impact: '대선에서 강하게 약속했지만 취임 후 거의 이행되지 않았습니다. 오히려 삼성 경영권 승계에 국민연금이 동원되는 등 경제민주화와 반대 방향의 사건이 벌어졌습니다.', success_or_failure: '대선 당시 보수 후보가 경제민주화를 내세운 것 자체가 파격이었지만, 실행은 전혀 되지 않았습니다. "대선용 공약"이라는 비판이 정당했음이 드러났습니다.', real_example: '2015년 삼성물산-제일모직 합병에서 국민연금이 삼성 측 찬성에 투표한 것이 국정농단의 핵심 비리 중 하나로 드러났습니다. "경제민주화"와 정반대의 행태였습니다.' },
      { id: 'pgh-a3', president_id: 'pgh', agenda_number: 3, goal_category: '사회안전', title: '4대 사회악 근절', implementation_status: '일부이행', completion_rate: 40, description: '성폭력, 학교폭력, 가정폭력, 불량식품 근절', ai_assessment: '초기 집중 후 세월호 사태로 동력 상실', plain_explanation: '성폭력, 학교폭력, 가정폭력, 불량식품 4가지를 "사회악"으로 규정하고 강력히 단속하겠다는 과제입니다. 관련 법률 강화와 처벌 강화를 추진했습니다.', why_it_matters: '성범죄, 학교폭력, 가정폭력은 시민의 안전과 직결되며, 불량식품은 건강을 위협합니다. 특히 학교폭력은 청소년 자살의 주요 원인이어서 시급한 해결이 필요했습니다.', citizen_impact: '초기에 성범죄자 전자발찌 확대, 학교 CCTV 설치 등의 조치가 있었지만, 2014년 세월호 참사 이후 정부 신뢰가 무너지면서 "안전한 사회" 자체가 의문시됐습니다.', success_or_failure: '구호는 좋았으나 실행이 지속되지 못했습니다. 세월호 참사로 국정 동력이 상실되면서, "4대 사회악 근절"보다 "국민 안전 시스템 부재"가 더 큰 문제로 드러났습니다.', real_example: '2014년 4월 세월호 참사로 304명이 사망했습니다. "안전한 대한민국"을 외쳤던 정부가 구조 과정에서 무능과 거짓말을 보여주면서, 4대 사회악 근절이라는 구호가 공허해졌습니다.' },
      { id: 'pgh-a4', president_id: 'pgh', agenda_number: 4, goal_category: '복지확대', title: '누리과정 정상화', implementation_status: '이행완료', completion_rate: 85, budget_committed: 25000, budget_executed: 23000, description: '무상보육·교육 확대', ai_assessment: '재원 분담 논란에도 무상보육 제도 정착', plain_explanation: '만 3~5세 아이의 어린이집·유치원 비용을 국가가 지원하는 "누리과정"을 안정적으로 운영하겠다는 과제입니다. 0~2세 무상보육도 포함됐습니다.', why_it_matters: '맞벌이 가정에서 아이 보육비는 매달 30~50만원의 고정 지출입니다. 무상보육은 양육 부담을 줄여 출산을 장려하고, 여성의 경제활동 참여를 높이는 효과가 있습니다.', citizen_impact: '누리과정이 전면 시행되면서 영유아 보육비 부담이 크게 줄었습니다. 하지만 국비와 지방비 분담을 놓고 정부와 교육청이 갈등을 빚었습니다.', success_or_failure: '무상보육 제도 자체는 정착시킨 성과가 있습니다. 다만 사립 어린이집의 보육 질 문제(비리, 아동학대 등)는 해결되지 않았습니다.', real_example: '2015~2016년 누리과정 예산을 둘러싸고 교육부와 시·도 교육청이 "예산 없다"며 공방을 벌였습니다. 일부 어린이집에서 교사 급여를 못 주는 사태까지 벌어졌습니다.' },
      { id: 'pgh-a5', president_id: 'pgh', agenda_number: 5, goal_category: '통일외교', title: '한반도 신뢰프로세스', implementation_status: '미이행', completion_rate: 15, description: '남북 신뢰 구축을 통한 통일 준비', ai_assessment: '북핵 도발 지속으로 사실상 작동 불능', plain_explanation: '남북 간 신뢰를 쌓아 궁극적으로 통일의 기반을 만들겠다는 과제입니다. "통일은 대박"이라며 통일준비위원회를 설치했습니다.', why_it_matters: '남북 분단 상황에서 군사적 긴장을 줄이고 평화적 관계를 만드는 것은 한반도의 근본적 과제입니다. 통일이 되면 7,500만 인구의 거대 경제권이 탄생합니다.', citizen_impact: '임기 중 남북관계가 오히려 경색됐습니다. 2016년 개성공단이 전면 폐쇄되면서 남북 경제협력의 마지막 상징이 사라졌습니다.', success_or_failure: '북한의 핵·미사일 도발이 지속되고, 정부가 강경 대응으로 일관하면서 "신뢰"를 쌓기는커녕 관계가 최악으로 치달았습니다. 통일준비위원회도 유명무실했습니다.', real_example: '2016년 2월 개성공단 전면 폐쇄 후, 입주 기업 대표들이 "하루아침에 모든 걸 잃었다"며 호소했습니다. 개성공단에서 일하던 북한 근로자 5만 4천 명도 일자리를 잃었습니다.' },
    ],
    ysy: [
      { id: 'ysy-a1', president_id: 'ysy', agenda_number: 1, goal_category: '법치주의', title: '검찰 독립성 회복', implementation_status: '일부이행', completion_rate: 40, description: '검찰 수사권 환원, 공수처 기능 조정', ai_assessment: '정치적 논란 속에 추진, 비상계엄으로 중단', plain_explanation: '문재인 정부에서 검찰에서 경찰로 넘어간 수사권을 일부 되돌리고, 공수처의 기능을 축소하는 과제입니다. 전직 검찰총장 출신 대통령으로서 검찰 권한 강화에 집중했습니다.', why_it_matters: '수사 역량이 분산되면 대형 부패·비리를 제대로 수사하기 어렵다는 우려가 있었습니다. 반면 검찰이 너무 강해지면 "검찰 독재"가 될 수 있다는 반론도 있습니다.', citizen_impact: '검찰 수사권이 일부 복원됐지만, 야당 대표에 대한 집중 수사가 "정치 검찰"이라는 비판을 받으면서 국민 사이에서 의견이 극명하게 갈렸습니다.', success_or_failure: '비상계엄 선포(2024년 12월)와 탄핵 파면으로 임기가 조기 종료되면서, 검찰 개혁 과제가 미완성으로 끝났습니다. 대통령 본인이 수사를 받게 된 것이 아이러니입니다.', real_example: '2023~2024년 이재명 더불어민주당 대표에 대한 검찰 수사가 "선택적 기소"라는 비판을 받았습니다. 반면 검찰은 "법 앞의 평등"이라고 반박했습니다.' },
      { id: 'ysy-a2', president_id: 'ysy', agenda_number: 2, goal_category: '경제성장', title: '원전 산업 정상화', implementation_status: '일부이행', completion_rate: 55, budget_committed: 80000, budget_executed: 30000, description: '신한울 3·4호기 건설 재개, 원전 수출', ai_assessment: '에너지 정책 전환을 시도했으나 임기 단축으로 미완', plain_explanation: '문재인 정부의 탈원전 정책을 뒤집고, 원전을 핵심 에너지원으로 되살리는 과제입니다. 중단된 원전 건설을 재개하고 해외 수출도 추진했습니다.', why_it_matters: 'AI·반도체 시대에 전력 수요가 급증하고 있습니다. 원전은 탄소 배출이 적고 발전 단가가 저렴해 안정적 전력 공급의 핵심입니다. 동시에 안전 우려도 있습니다.', citizen_impact: '신한울 3·4호기 건설이 재개되고, 체코 원전 수출 우선 협상권을 따냈습니다. 원전 관련 일자리가 되살아나기 시작했습니다.', success_or_failure: '에너지 정책 방향을 전환한 것은 성과이지만, 비상계엄과 탄핵으로 정책 연속성이 불확실해졌습니다. 체코 원전 최종 계약도 마무리하지 못했습니다.', real_example: '체코 원전 수주전에서 한수원이 프랑스 EDF를 누르고 우선 협상 대상에 선정돼 "K-원전 부활"이라는 평가를 받았습니다. 약 24조원 규모의 초대형 계약이었습니다.' },
      { id: 'ysy-a3', president_id: 'ysy', agenda_number: 3, goal_category: '경제성장', title: '반도체 초강대국', implementation_status: '추진중', completion_rate: 45, budget_committed: 30000, budget_executed: 12000, description: '반도체 특별법, 용인 클러스터 조성', ai_assessment: '장기 과제로 초기 단계에서 정권 교체', plain_explanation: '삼성·SK하이닉스를 중심으로 한국을 세계 반도체 최강국으로 만들겠다는 과제입니다. 용인에 세계 최대 반도체 메가 클러스터를 조성하고, 세제 혜택을 확대하는 내용입니다.', why_it_matters: '반도체는 한국 수출의 20% 이상을 차지합니다. AI 시대에 반도체 수요가 폭발적으로 증가하고 있어, 미국·일본·EU 모두 반도체 자국 생산을 확대하는 "칩 전쟁" 중입니다.', citizen_impact: '반도체 특별법이 제정되고 용인 클러스터 계획이 발표됐습니다. 장기적으로 반도체 산업 일자리와 경제 효과가 기대되지만, 실현까지 수년이 걸립니다.', success_or_failure: '반도체 인재 양성, 세제 혜택, 클러스터 조성 등 방향은 올바르지만, 비상계엄·탄핵으로 정책이 중단된 것이 아쉽습니다. 2023년 반도체 업황 악화도 투자 지연의 원인이었습니다.', real_example: '용인 반도체 클러스터(300조원 투자 계획)는 전력·용수 공급 인프라가 아직 확보되지 않아 실현 가능성에 의문이 제기됐습니다.' },
      { id: 'ysy-a4', president_id: 'ysy', agenda_number: 4, goal_category: '부동산', title: '250만호 주택 공급', implementation_status: '미이행', completion_rate: 30, budget_committed: 50000, budget_executed: 15000, description: '대규모 주택 공급 계획', ai_assessment: '건설 경기 침체로 공급 부족 지속', plain_explanation: '5년 임기 동안 전국에 250만호 주택을 공급하겠다는 과제입니다. 재건축·재개발 규제를 완화하고, 신규 택지를 개발해 "공급으로 집값 잡기"를 추진했습니다.', why_it_matters: '집값 안정의 근본은 충분한 공급입니다. 문재인 정부가 규제로 집값을 잡으려다 실패한 경험에서, "공급을 확 늘려야 한다"는 인식이 커졌습니다.', citizen_impact: '고금리·고물가 상황에서 건설 경기가 얼어붙어 실제 공급은 목표에 한참 못 미쳤습니다. 미분양이 늘고 건설사 부도가 이어졌습니다.', success_or_failure: '금리 인상(연 3.5%)으로 건설비와 대출 이자가 치솟으면서 공급 목표 달성이 불가능해졌습니다. 비상계엄·탄핵으로 정책 추진도 중단됐습니다.', real_example: '2023~2024년 전국 미분양 주택이 7만 호를 넘었고, 태영건설 워크아웃 등 건설사 유동성 위기가 심화됐습니다. "집을 지어도 팔리지 않는" 상황이 벌어졌습니다.' },
      { id: 'ysy-a5', president_id: 'ysy', agenda_number: 5, goal_category: '외교안보', title: '한미동맹 강화', implementation_status: '이행완료', completion_rate: 75, description: '한미 정상회담, 캠프데이비드 한미일 정상회의', ai_assessment: '한미동맹 격상에 성과, 대중·대러 관계 악화 우려', plain_explanation: '한미동맹을 "핵 기반 동맹"으로 격상하고, 한미일 3국 안보 협력을 강화하겠다는 과제입니다. 2023년 캠프데이비드 한미일 정상회의가 대표적 성과입니다.', why_it_matters: '북핵 위협과 미중 패권 경쟁 속에서 한미동맹은 한국 안보의 근간입니다. 동시에 중국은 한국의 최대 교역국이라 미국 일변도 외교는 경제적 리스크가 있습니다.', citizen_impact: '한미동맹이 "핵 기반 동맹"으로 격상되고, 주한미군 역할이 확대됐습니다. 하지만 한중 관계가 냉각되면서 중국 관련 무역·관광에 부정적 영향이 우려됐습니다.', success_or_failure: '한미동맹 강화와 한미일 안보 협력 구축은 외교적 성과입니다. 다만 중국·러시아와의 관계 악화, "미국 편들기"라는 비판도 있었습니다.', real_example: '2023년 8월 캠프데이비드에서 한미일 정상이 만나 "안보 협력 원칙"에 합의했습니다. 한미일 군사훈련이 정례화되는 등 3국 협력이 강화됐지만, 중국은 이를 "동북아 NATO"라며 강하게 반발했습니다.' },
    ],
    ljm: [
      { id: 'ljm-a1', president_id: 'ljm', agenda_number: 1, goal_category: '경제회복', title: '민생경제 안정', implementation_status: '추진중', completion_rate: 20, budget_committed: 50000, budget_executed: 10000, description: '물가안정, 소상공인 지원, 일자리 창출', ai_assessment: '취임 초기로 성과 판단 시기상조', plain_explanation: '코로나 이후와 윤석열 정부 탄핵 혼란 이후 불안정한 경제를 안정시키고, 물가를 잡고, 소상공인을 지원하겠다는 과제입니다.', why_it_matters: '물가가 오르면 서민 생활이 직격탄을 맞습니다. 소상공인 폐업이 늘면 자영업자 수백만 명의 생계가 위협받고, 일자리도 줄어듭니다.', citizen_impact: '취임 초기라 아직 체감할 수 있는 변화는 제한적입니다. 소상공인 긴급 지원금, 물가 안정 대책 등이 추진 중입니다.', success_or_failure: '아직 초기 단계로 성과를 판단하기 이릅니다. 고금리·고물가·저성장이라는 어려운 경제 환경에서 민생경제를 안정시킬 수 있을지 주목됩니다.', real_example: '2025년 소비자물가 상승률이 3%대를 유지하면서 장바구니 물가 부담이 큰 상황입니다. 특히 외식비, 공공요금 인상이 서민 생활을 압박하고 있습니다.' },
      { id: 'ljm-a2', president_id: 'ljm', agenda_number: 2, goal_category: '디지털혁신', title: 'AI 기반 디지털 정부', implementation_status: '추진중', completion_rate: 15, budget_committed: 20000, budget_executed: 3000, description: 'AI 행정서비스, 디지털 원패스 등', ai_assessment: '야심찬 계획이나 실행은 초기 단계', plain_explanation: '정부 행정 서비스에 AI를 도입해 민원 처리를 빠르고 편리하게 만들겠다는 과제입니다. 모든 정부 서비스를 하나의 앱에서 처리하는 "디지털 원패스"가 핵심입니다.', why_it_matters: '한국은 전자정부 세계 2위이지만, 여전히 동사무소에 직접 가야 하는 민원이 많습니다. AI 도입으로 24시간 민원 처리가 가능해지면 시민 편의가 크게 높아집니다.', citizen_impact: '아직 기본계획 수립과 시범사업 단계라 시민이 직접 체감하는 변화는 제한적입니다. 정부24 앱의 기능 확대가 진행 중입니다.', success_or_failure: '초기 단계라 성과를 판단하기 이릅니다. 개인정보 보호, 디지털 취약 계층(어르신) 지원, 시스템 통합의 기술적 난이도 등 과제가 많습니다.', real_example: '경기도지사 시절 "AI 민원 챗봇"을 시범 운영한 경험이 있습니다. 이를 전국으로 확대하는 것이 목표이지만, 부처 간 데이터 연동이라는 난제를 풀어야 합니다.' },
      { id: 'ljm-a3', president_id: 'ljm', agenda_number: 3, goal_category: '복지확대', title: '기본소득 시범 도입', implementation_status: '추진중', completion_rate: 10, budget_committed: 150000, description: '단계적 기본소득 도입 추진', ai_assessment: '재원 확보 방안이 관건', plain_explanation: '모든 국민에게 조건 없이 일정 금액을 지급하는 "기본소득"을 시범적으로 도입하겠다는 과제입니다. 연간 약 15조원의 재원이 필요한 대형 복지정책입니다.', why_it_matters: 'AI와 자동화로 일자리가 줄어드는 시대에, 일하지 않아도 최소한의 소득을 보장하는 기본소득은 미래 사회 안전망으로 주목받고 있습니다.', citizen_impact: '아직 시범사업 설계 단계라 시민이 직접 혜택을 받진 않았습니다. 재원 조달 방법(증세, 기존 복지 통합 등)이 가장 큰 쟁점입니다.', success_or_failure: '아직 초기 단계라 판단하기 이릅니다. 연 15조원이라는 막대한 재원을 어떻게 마련할지가 최대 관건이며, 야당과 경제학자들의 반대도 거셉니다.', real_example: '성남시 청년배당(연 24만원 지역화폐)이 기본소득의 원형이었습니다. 코로나 시기 전 국민 재난지원금(1인 25만원)이 기본소득의 맛보기였는데, 당시 소비 진작 효과가 검증됐습니다.' },
      { id: 'ljm-a4', president_id: 'ljm', agenda_number: 4, goal_category: '외교안보', title: '균형외교 복원', implementation_status: '추진중', completion_rate: 15, description: '한미동맹 유지하며 한중 관계 정상화', ai_assessment: '미중 사이 균형외교의 성공 여부 주목', plain_explanation: '윤석열 정부에서 미국 쪽으로 기울어진 외교를 "균형"으로 되돌리겠다는 과제입니다. 한미동맹을 유지하되, 냉각된 한중 관계를 정상화하겠다는 방향입니다.', why_it_matters: '미국은 안보 동맹이고, 중국은 최대 교역국입니다. 어느 한쪽에만 기울면 안보 또는 경제에 큰 타격을 받습니다. "안미경중(안보는 미국, 경제는 중국)"이 현실적 전략입니다.', citizen_impact: '아직 초기 단계라 실질적 변화는 제한적입니다. 한중 고위급 교류 재개, 한일 관계 재정립 등이 추진될 예정입니다.', success_or_failure: '미중 패권 경쟁이 심화되는 상황에서 "균형"을 잡는 것이 가능한지가 최대 과제입니다. 양쪽 모두에서 불만이 나올 수 있는 어려운 외교 전략입니다.', real_example: '윤석열 정부 시기 한중 관계가 냉각되면서 중국 관광객이 급감하고, 중국의 대한국 무역 규제 우려가 커졌습니다. 이를 정상화하면서 한미동맹은 유지하는 것이 과제입니다.' },
      { id: 'ljm-a5', president_id: 'ljm', agenda_number: 5, goal_category: '환경에너지', title: '탄소중립 가속화', implementation_status: '추진중', completion_rate: 10, budget_committed: 30000, budget_executed: 2000, description: '2050 탄소중립 로드맵 재수립', ai_assessment: '에너지 전환 정책의 구체성이 필요', plain_explanation: '2050년까지 탄소 순배출을 0으로 만드는 "탄소중립"을 가속화하겠다는 과제입니다. 윤석열 정부에서 후퇴한 기후 정책을 다시 강화하는 방향입니다.', why_it_matters: 'EU의 탄소국경세(CBAM) 시행으로 탄소 많이 배출하는 한국 기업의 수출이 불리해집니다. 기후변화 대응은 도덕적 의무이자 경제적 필요입니다.', citizen_impact: '아직 로드맵 재수립 단계라 시민이 체감하는 변화는 없습니다. 향후 전기차 보조금 확대, 태양광·풍력 투자 확대 등이 예상됩니다.', success_or_failure: '초기 단계라 판단이 이릅니다. 탄소중립에는 산업 구조 전환, 에너지 전환, 국민적 동의 등 복합적 과제가 얽혀 있어 장기적 추진이 필요합니다.', real_example: '2025년부터 EU 탄소국경세(CBAM)가 본격 시행되면서, 한국 철강·석유화학 업계가 수출 단가 상승 압박을 받기 시작했습니다. 탄소중립은 "선택"이 아닌 "생존" 문제가 됐습니다.' },
    ],
  };
  return agendas[presidentId] || [];
}

// ========================================
// 성과분석 (Report Card) 데이터
// ========================================

export function getReportCardByPresident(presidentId: string): ReportCardMetric[] {
  const metrics: Record<string, ReportCardMetric[]> = {
    // ==================== 김영삼 (YSK) ====================
    ysk: [
      {
        id: 'ysk-r1', president_id: 'ysk', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 6.8, baseline_year: 1993, final_value: -5.1, unit: '%', trend: 'worsened', grade: 'D',
        source: '한국은행 ECOS', note: '1997년 IMF 외환위기로 급락',
        progressive_frame: '재벌 중심 성장 모델의 구조적 취약성을 방치하고, 성급한 자본시장 개방이 외환위기를 초래. 금융감독 체계 미비가 근본 원인',
        conservative_frame: '세계화 흐름에 맞춘 OECD 가입과 자본시장 개방은 불가피했으나, 기업 구조조정 지연과 관치금융 잔존이 위기를 키움',
        citizen_reality: '하루아침에 실직하고 가정이 해체되는 대량 해고 사태. 중산층이 노숙자로 전락하는 충격을 전 국민이 체험',
        context_note: '1997년 태국발 아시아 금융위기가 한국으로 전이. 외환보유고 부족과 단기외채 과다가 직접 원인',
        real_world_example: '대기업 부도 연쇄: 한보, 삼미, 진로, 기아 등 30대 재벌 중 절반이 부도 처리',
      },
      {
        id: 'ysk-r2', president_id: 'ysk', category: '경제', metric_name: '외환보유고',
        baseline_value: 204, baseline_year: 1993, final_value: 89, unit: '억달러', trend: 'worsened', grade: 'F',
        source: '한국은행', note: 'IMF 위기 시 바닥',
        progressive_frame: '무분별한 자본시장 개방 속도 조절 실패. 관료들의 위기 인식 부재와 대응 지연이 외환보유고 고갈을 가속',
        conservative_frame: '외환위기 직전까지 외환보유고 규모를 과대 발표하며 시장을 호도. 투명한 정보 공개가 부재했던 것이 문제',
        citizen_reality: '금 모으기 운동에 국민 350만 명이 참여해 227톤의 금을 모았으나, 근본적 해결보다 국민 부담 전가라는 비판도',
        context_note: '가용 외환보유고는 공식 발표보다 훨씬 적었음. 한국은행이 종금사에 예치한 달러는 이미 유동성을 상실한 상태',
      },
      {
        id: 'ysk-r3', president_id: 'ysk', category: '사회', metric_name: '실업률',
        baseline_value: 2.9, baseline_year: 1993, final_value: 6.8, unit: '%', trend: 'worsened', grade: 'D',
        source: '통계청',
        progressive_frame: '정리해고제 도입으로 노동자 보호 장치 없이 대량 해고가 가능해짐. 노동유연화의 피해가 노동자에게 집중',
        conservative_frame: '경직된 노동시장이 기업의 구조조정을 지연시켜 위기를 키웠으며, 정리해고제는 기업 생존을 위한 불가피한 선택',
        citizen_reality: '1998년 공식 실업자 178만 명. 비공식 포함 체감 실업률은 15% 이상. 가장 해고가 자살로 이어지는 비극 속출',
      },
      {
        id: 'ysk-r4', president_id: 'ysk', category: '외교', metric_name: 'OECD 가입',
        baseline_value: 0, baseline_year: 1993, final_value: 1, unit: '달성', trend: 'improved', grade: 'A',
        source: 'OECD',
        progressive_frame: 'OECD 가입 자체는 의미 있으나, 가입 조건인 자본시장 개방을 충분한 준비 없이 급하게 추진해 외환위기의 빌미 제공',
        conservative_frame: '선진국 클럽 진입이라는 역사적 성과. 한국의 국제적 위상을 높이고 글로벌 스탠다드 도입의 계기',
        citizen_reality: '당시 언론에서는 "선진국 진입"을 대대적으로 보도했으나, 1년 후 IMF 사태로 체감하는 현실과 큰 괴리',
        context_note: 'OECD 29번째 회원국 가입(1996.12). 가입 조건으로 자본시장 자유화, 금융개방 등을 약속',
      },
      {
        id: 'ysk-r5', president_id: 'ysk', category: '사회', metric_name: '금융 투명성',
        baseline_value: 0, baseline_year: 1993, final_value: 100, unit: '%', trend: 'improved', grade: 'A',
        source: '금융위원회', note: '금융실명제 도입',
        progressive_frame: '군사정권 이후 최대의 개혁 조치. 차명거래를 통한 정경유착과 부정부패의 고리를 끊는 역사적 결단',
        conservative_frame: '금융실명제의 취지는 옳았으나 시행 시기와 방법에서 경제 충격을 최소화하는 단계적 접근이 필요했다는 지적',
        citizen_reality: '부유층의 차명계좌가 드러나며 사회적 공정성에 대한 기대감이 높아졌으나, 실제 지하경제 양성화에는 한계',
        context_note: '1993년 8월 12일 긴급재정경제명령으로 전격 시행. 취임 4개월 만의 결단',
        real_world_example: '실명제 시행 직후 주가 폭락과 부동산 시장 위축이 있었으나, 장기적으로 금융 투명성의 토대를 마련',
      },
    ],

    // ==================== 김대중 (KDJ) ====================
    kdj: [
      {
        id: 'kdj-r1', president_id: 'kdj', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: -5.1, baseline_year: 1998, final_value: 7.4, unit: '%', trend: 'improved', grade: 'A',
        source: '한국은행 ECOS',
        progressive_frame: 'IMF 위기를 조기 극복한 리더십은 높이 평가하되, 구조조정 과정에서 비정규직 양산과 소득 양극화라는 부작용 초래',
        conservative_frame: '기업 구조조정과 금융 개혁을 통한 V자 반등은 탁월한 경제 운영. 다만 공적자금 투입 과정의 도덕적 해이 문제 존재',
        citizen_reality: '경제는 회복되었으나, 정리해고와 비정규직 확산으로 고용 불안이 일상화. 중산층 축소의 시작점',
        context_note: '1999년 GDP 성장률 11.5%로 V자 반등. IMF 구제금융 195억 달러를 2001년 8월 조기 상환',
        real_world_example: '대우그룹 해체(1999), 쌍용자동차 매각 등 대규모 구조조정 과정에서 수만 명이 직장을 잃음',
      },
      {
        id: 'kdj-r2', president_id: 'kdj', category: '경제', metric_name: '외환보유고',
        baseline_value: 89, baseline_year: 1998, final_value: 1214, unit: '억달러', trend: 'improved', grade: 'A',
        source: '한국은행',
        progressive_frame: '외환위기 재발 방지를 위한 적극적 외환보유고 확충은 적절. 다만 수출 주도형 성장 모델의 한계는 여전',
        conservative_frame: '시장 개방과 외국인 투자 유치를 통한 외환보유고 확충은 경제 체질 개선의 결과. 건전한 정책 성과',
        citizen_reality: '외환위기의 트라우마로 국민들이 달러와 금에 대한 불안감이 지속. "외환보유고" 수치에 민감하게 반응하는 사회 분위기 형성',
      },
      {
        id: 'kdj-r3', president_id: 'kdj', category: '사회', metric_name: '인터넷 보급률',
        baseline_value: 6.8, baseline_year: 1998, final_value: 65.5, unit: '%', trend: 'improved', grade: 'A',
        source: '한국인터넷진흥원',
        progressive_frame: 'IT 인프라 투자와 벤처 육성은 미래 성장 동력 확보라는 점에서 탁월. 디지털 격차 해소 노력도 긍정적',
        conservative_frame: 'IT 버블 우려에도 과감한 투자로 한국을 인터넷 강국으로 만든 선견지명. 민간 주도 혁신의 모범 사례',
        citizen_reality: '초고속인터넷 보급으로 "PC방 문화"가 확산. 온라인 쇼핑, 인터넷 뱅킹 등 생활 방식이 근본적으로 변화',
        context_note: '2002년 초고속인터넷 보급률 세계 1위 달성. 전자정부 구축, 사이버코리아21 전략 추진',
        real_world_example: '1999년 코스닥 붐과 벤처 열풍. 새롬기술 등 벤처 신화가 탄생했으나, 이후 버블 붕괴로 많은 투자자 피해',
      },
      {
        id: 'kdj-r4', president_id: 'kdj', category: '외교', metric_name: '남북관계',
        baseline_value: 0, baseline_year: 1998, final_value: 85, unit: '점', trend: 'improved', grade: 'A',
        source: '통일부',
        progressive_frame: '분단 55년 만의 첫 남북정상회담과 6·15 공동선언은 한반도 평화의 역사적 전환점. 햇볕정책의 당위성 입증',
        conservative_frame: '대북 송금 비밀 특검에서 드러났듯 정상회담의 대가로 4.5억 달러를 비밀 송금. 퍼주기 외교의 시작',
        citizen_reality: '이산가족 상봉에 온 국민이 눈물. 금강산 관광으로 통일에 대한 기대감이 높아졌으나, 지속성에 의문',
        context_note: '2000년 6월 15일 평양에서 역사적 첫 남북정상회담. 같은 해 노벨평화상 수상',
        real_world_example: '금강산 관광 사업(1998~2008)으로 약 200만 명의 남한 국민이 북한을 방문',
      },
      {
        id: 'kdj-r5', president_id: 'kdj', category: '복지', metric_name: '기초생활수급자',
        baseline_value: 0, baseline_year: 1998, final_value: 150, unit: '만명', trend: 'improved', grade: 'A',
        source: '보건복지부', note: '국민기초생활보장제 도입',
        progressive_frame: '생활보호제도에서 국민기초생활보장제로의 전환은 복지국가로의 중요한 진전. 사회안전망의 기초를 마련',
        conservative_frame: '빈곤층 보호는 필요하나, 수급 기준과 도덕적 해이 방지 장치가 미흡. 복지 의존성 우려가 이미 제기',
        citizen_reality: 'IMF 이후 극빈층이 급증하면서 기초생활보장 없이는 생존이 불가능한 계층이 대거 발생. 최소한의 안전망 역할',
      },
    ],

    // ==================== 노무현 (NMH) ====================
    nmh: [
      {
        id: 'nmh-r1', president_id: 'nmh', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 3.1, baseline_year: 2003, final_value: 5.5, unit: '%', trend: 'improved', grade: 'B',
        source: '한국은행 ECOS',
        progressive_frame: '참여정부 시기 경제성장은 글로벌 호황의 영향도 있으나, 균형발전과 혁신도시 정책이 지방 경제 활성화에 기여',
        conservative_frame: '세계 경제 호황기에 한국만 성장률이 상대적으로 낮았음. 반기업 정서와 규제 강화가 투자를 위축시킨 측면',
        citizen_reality: '경제는 성장했으나 체감경기는 좋지 않았음. 자영업자 부도 증가, 카드대란 후유증이 여전',
        context_note: '2003~2007년 세계 경제가 동반 성장한 시기. 중국의 급성장이 한국 수출에 긍정적 영향',
      },
      {
        id: 'nmh-r2', president_id: 'nmh', category: '경제', metric_name: '1인당 국민소득',
        baseline_value: 14000, baseline_year: 2003, final_value: 23000, unit: '달러', trend: 'improved', grade: 'A',
        source: '한국은행',
        progressive_frame: '원화 강세가 달러 기준 소득 증가에 기여한 측면이 있으나, 수출 기업의 채산성 악화라는 양면성 존재',
        conservative_frame: '2만 달러 시대 진입은 경제 성장의 결과이나, 원화 강세 효과를 제외하면 실질 성장은 제한적',
        citizen_reality: '통계상 소득은 늘었으나 부동산 가격 급등으로 실질 구매력은 오히려 감소했다고 느끼는 시민이 다수',
      },
      {
        id: 'nmh-r3', president_id: 'nmh', category: '부동산', metric_name: '서울 아파트 가격',
        baseline_value: 2.5, baseline_year: 2003, final_value: 4.2, unit: '억원', trend: 'worsened', grade: 'D',
        source: 'KB부동산',
        progressive_frame: '종합부동산세 도입 등 투기 억제 정책을 적극 추진했으나, 강남 재건축·재개발 수요와 글로벌 유동성을 완전히 통제하기 어려웠음',
        conservative_frame: '반시장적 부동산 규제가 오히려 매물 잠김 현상을 유발. 공급 확대 대신 규제 일변도 정책이 가격 상승을 부추김',
        citizen_reality: '강남 집값이 폭등하면서 강남·강북 격차가 극심해짐. "강남 불패" 신화가 굳어진 시기',
        context_note: '8·31 부동산 대책(2005), 종합부동산세 신설 등 강력한 규제 정책 추진. 그러나 서울 아파트 가격은 연평균 6.5% 상승',
        real_world_example: '2003년 강남 은마아파트 5억원대에서 2007년 12억원대로 급등. "부동산 투기와의 전쟁"을 선언했으나 결과적으로 패배',
      },
      {
        id: 'nmh-r4', president_id: 'nmh', category: '외교', metric_name: '남북 교류',
        baseline_value: 30, baseline_year: 2003, final_value: 55, unit: '건', trend: 'improved', grade: 'B',
        source: '통일부',
        progressive_frame: '2차 남북정상회담과 10·4 선언은 남북 경제협력의 새로운 장을 열었음. 개성공단 본격 가동으로 실질적 교류 확대',
        conservative_frame: '핵실험(2006.10)에도 불구하고 대북 지원을 지속한 것은 안보를 경시한 처사. 북핵 억지에 실패',
        citizen_reality: '개성공단에서 일하는 북한 근로자와의 만남이 통일에 대한 현실감을 높였으나, 핵실험 소식에 불안감도 공존',
        context_note: '개성공단 2005년 본격 가동, 2007년 10월 평양 정상회담. 같은 해 한미FTA 타결',
      },
      {
        id: 'nmh-r5', president_id: 'nmh', category: '사회', metric_name: '비정규직 비율',
        baseline_value: 32.6, baseline_year: 2003, final_value: 35.9, unit: '%', trend: 'worsened', grade: 'D',
        source: '통계청',
        progressive_frame: '비정규직 보호법(2007) 시행 등 제도적 노력을 했으나, 기업들이 정규직 전환 대신 계약 해지로 대응하면서 실효성 미흡',
        conservative_frame: '과도한 정규직 보호 규제가 오히려 기업의 비정규직 활용을 촉진. 노동시장 이중구조를 심화시킨 정책 실패',
        citizen_reality: '비정규직법 시행 전후로 대규모 해고 사태 발생. 이랜드, 기륭전자 등에서 비정규직 노동자 투쟁이 사회적 이슈화',
        context_note: '2007년 비정규직보호법 시행. 2년 이상 비정규직 사용 시 정규직 전환 의무화가 핵심',
        real_world_example: '이랜드 뉴코아 비정규직 해고 사태(2007): 비정규직법 시행 직전 500여 명 대량 해고로 사회적 파장',
      },
    ],

    // ==================== 이명박 (LMB) ====================
    lmb: [
      {
        id: 'lmb-r1', president_id: 'lmb', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 2.8, baseline_year: 2008, final_value: 2.3, unit: '%', trend: 'worsened', grade: 'C',
        source: '한국은행 ECOS', note: '글로벌 금융위기 영향',
        progressive_frame: '글로벌 금융위기 대응은 인정하나, 감세와 대기업 우대 정책이 서민경제 회복에는 기여하지 못함. 양극화 심화',
        conservative_frame: '리먼 사태 와중에 OECD 국가 중 가장 빠른 경기 회복을 달성. 적극적 재정정책과 환율 정책의 성과',
        citizen_reality: '2009년 대량 해고와 임금 삭감을 경험. 경기가 회복되었다는 통계와 달리 자영업자·비정규직의 체감경기는 여전히 불황',
        context_note: '2008년 9월 리먼브라더스 파산으로 글로벌 금융위기 발생. 한국은 2009년 0.8% 성장으로 마이너스 성장은 면함',
      },
      {
        id: 'lmb-r2', president_id: 'lmb', category: '경제', metric_name: '국가채무',
        baseline_value: 309, baseline_year: 2008, final_value: 443, unit: '조원', trend: 'worsened', grade: 'C',
        source: '기획재정부',
        progressive_frame: '4대강 사업에 22조원을 투입하면서 국가채무가 급증. 환경 파괴와 재정 낭비가 동시에 발생한 대표적 토건 정책',
        conservative_frame: '금융위기 극복을 위한 재정 확대는 불가피했으며, 4대강 사업은 수자원 관리와 일자리 창출이라는 복합적 목적의 국가 사업',
        citizen_reality: '4대강 사업 현장 근처 주민들은 공사 소음과 환경 변화를 체감. 일자리 효과는 건설 현장 중심의 단기 일자리에 그침',
        context_note: '4대강 사업(2009~2012) 총사업비 22.2조원. 녹조 발생 등 환경 문제로 감사원 감사와 논란 지속',
        real_world_example: '낙동강 보 완공 이후 매년 녹조 대발생. 2018년 감사원은 "4대강 사업의 보 건설은 수질 개선 효과 없음" 판단',
      },
      {
        id: 'lmb-r3', president_id: 'lmb', category: '외교', metric_name: 'G20 의장국',
        baseline_value: 0, baseline_year: 2008, final_value: 1, unit: '달성', trend: 'improved', grade: 'A',
        source: 'G20',
        progressive_frame: 'G20 서울 정상회의 개최는 외교적 성과이나, 실질적 경제 이익보다 대통령 개인의 국제적 입지 과시 성격이 강했다는 평가',
        conservative_frame: '비서구 국가 최초 G20 의장국으로서 글로벌 경제 거버넌스 논의를 주도. 한국의 국제적 위상을 한 단계 끌어올린 성과',
        citizen_reality: '서울 시내 교통 통제와 보안 강화에 시민 불편이 컸으나, "한국이 세계 무대에서 인정받았다"는 자부심도 상존',
      },
      {
        id: 'lmb-r4', president_id: 'lmb', category: '고용', metric_name: '고용률',
        baseline_value: 59.5, baseline_year: 2008, final_value: 59.4, unit: '%', trend: 'stable', grade: 'C',
        source: '통계청',
        progressive_frame: '747 공약(7% 성장, 4만 달러, 7대 강국) 달성에 완전 실패. 실질적 일자리 창출보다 통계 조작에 가까운 단기 일자리 위주',
        conservative_frame: '글로벌 금융위기라는 초유의 상황에서 고용률을 유지한 것 자체가 성과. 위기 시 고용 감소를 최소화',
        citizen_reality: '비정규직과 파견직 비율이 늘면서 "고용의 질" 악화를 체감. 정규직 전환의 꿈이 더 멀어진 시기',
        context_note: '취임 공약 "747 비전"은 글로벌 금융위기로 사실상 폐기. 실제 평균 성장률 3.2%, 1인당 GDP 2.4만 달러',
      },
      {
        id: 'lmb-r5', president_id: 'lmb', category: '사회', metric_name: '가계부채',
        baseline_value: 723, baseline_year: 2008, final_value: 964, unit: '조원', trend: 'worsened', grade: 'D',
        source: '한국은행',
        progressive_frame: '부동산 경기 부양을 위해 DTI·LTV 규제를 완화하면서 가계부채가 급증하는 구조적 위험을 만들어낸 정책',
        conservative_frame: '금융위기 극복을 위한 경기 부양 과정에서 불가피한 측면이 있었으며, 가계대출은 주택 구입이라는 자산 형성의 수단',
        citizen_reality: '전세가격 상승으로 전세대출이 급증하고, "하우스푸어" 문제가 사회적 이슈로 부상. 빚에 허덕이는 가정 증가',
        real_world_example: '2011~2012년 "하우스푸어" 신조어 등장. 집을 샀지만 원리금 상환에 허덕이는 가정이 사회 문제화',
      },
    ],

    // ==================== 박근혜 (PGH) ====================
    pgh: [
      {
        id: 'pgh-r1', president_id: 'pgh', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 2.9, baseline_year: 2013, final_value: 2.9, unit: '%', trend: 'stable', grade: 'C',
        source: '한국은행 ECOS',
        progressive_frame: '창조경제를 내세웠으나 구체적 성과 없이 저성장이 고착화. 세월호 참사와 국정농단으로 경제 운영에 공백 발생',
        conservative_frame: '중국 경제 둔화와 글로벌 저성장 기조 속에서 2%대 후반 성장을 유지한 것은 방어적 성과. 한중FTA 발효는 긍정적',
        citizen_reality: '취업난이 심화되면서 "이태백(이십대 태반이 백수)", "삼포세대" 등 신조어가 등장. 청년층의 절망감 확산',
        context_note: '2014~2016년 세계 경제가 저성장 기조. 한국 경제도 잠재성장률 하락 추세',
      },
      {
        id: 'pgh-r2', president_id: 'pgh', category: '경제', metric_name: '국가채무',
        baseline_value: 490, baseline_year: 2013, final_value: 627, unit: '조원', trend: 'worsened', grade: 'C',
        source: '기획재정부',
        progressive_frame: '증세 없는 복지를 약속하고 결국 복지 축소와 국가채무 증가가 동시에 발생. 재정 건전성도 복지도 놓친 정책 실패',
        conservative_frame: '복지 수요 증가에 대응한 지출 확대는 불가피. 채무비율이 OECD 평균보다 낮아 재정 건전성은 양호한 수준 유지',
        citizen_reality: '기초연금 도입(2014)으로 노인층 소득이 개선되었으나, "증세 없는 복지"라는 약속은 결국 지켜지지 않았다는 비판',
      },
      {
        id: 'pgh-r3', president_id: 'pgh', category: '사회', metric_name: '합계출산율',
        baseline_value: 1.19, baseline_year: 2013, final_value: 1.05, unit: '명', trend: 'worsened', grade: 'D',
        source: '통계청',
        progressive_frame: '주거비·교육비·양육비 부담 해소 없이 형식적 출산장려 정책만으로는 저출생 문제 해결 불가. 근본 원인 방치',
        conservative_frame: '저출생 문제는 사회·문화적 구조 변화의 결과이며, 어떤 정부도 단기간에 해결하기 어려운 과제. 무상보육 확대는 긍정적 노력',
        citizen_reality: '결혼과 출산을 포기하는 청년이 늘어나면서 "N포세대" 담론 확산. 높은 주거비와 양육비가 핵심 장벽',
        context_note: '2015년 합계출산율 1.24에서 2016년 1.17로 하락. 정부는 저출산 대책에 15년간 200조원 이상 투입했으나 효과 미미',
        real_world_example: '서울 강남·서초의 영유아 학원비가 월 100만원을 넘어서면서 "강남 엄마"가 아니면 교육 경쟁에서 뒤처진다는 불안감 확산',
      },
      {
        id: 'pgh-r4', president_id: 'pgh', category: '복지', metric_name: '무상보육 예산',
        baseline_value: 3.0, baseline_year: 2013, final_value: 5.2, unit: '조원', trend: 'improved', grade: 'B',
        source: '보건복지부',
        progressive_frame: '누리과정 예산 국가·지방 간 갈등으로 현장 혼란 초래. 무상보육의 취지는 좋으나, 예산 분담 문제를 해결하지 못한 채 시행',
        conservative_frame: '보육 예산 확대는 여성의 경제활동 참여를 높이고 저출생 문제에 대응하는 합리적 정책. 복지 확충의 긍정적 성과',
        citizen_reality: '어린이집에 아이를 맡길 수 있게 된 것은 좋았으나, 보육의 "질"에 대한 불만 지속. 국공립 어린이집 부족',
      },
      {
        id: 'pgh-r5', president_id: 'pgh', category: '고용', metric_name: '청년실업률',
        baseline_value: 8.0, baseline_year: 2013, final_value: 9.8, unit: '%', trend: 'worsened', grade: 'D',
        source: '통계청',
        progressive_frame: '비정규직 양산과 노동시장 이중구조를 해결하지 못한 채 "창조경제" 구호만 내세운 결과. 청년 고용의 질적 악화',
        conservative_frame: '글로벌 저성장과 4차 산업혁명 전환기의 구조적 문제. 청년인턴제, 일학습병행제 등 다양한 대안을 모색',
        citizen_reality: '대학 졸업 후 취업까지 평균 11개월. "스펙 쌓기" 경쟁이 과열되면서 해외 취업, 공무원 시험 쏠림 현상 심화',
        context_note: '공식 청년실업률 9.8%이나, 체감실업률(확장실업률)은 21%를 상회. 취업 준비생과 구직 단념자를 포함하면 훨씬 심각',
        real_world_example: '서울 노량진 학원가에 10만여 명의 공무원 시험 준비생이 밀집. "공시생"이 사회 현상으로 자리잡음',
      },
    ],

    // ==================== 문재인 (MJI) ====================
    mji: [
      {
        id: 'mji-r1', president_id: 'mji', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 3.2, baseline_year: 2017, target_value: 3.5, final_value: 4.1, unit: '%', trend: 'improved', grade: 'B',
        source: '한국은행 ECOS', note: '2020년 코로나 제외 시 평균 2.8%',
        progressive_frame: '코로나 팬데믹이라는 전례 없는 위기 속에서 OECD 국가 중 가장 낮은 경기 침체폭(-0.7%)을 기록. K-방역과 적극 재정이 경제 방어에 기여',
        conservative_frame: '코로나 이전 소득주도성장 정책으로 이미 성장률이 둔화 추세. 최저임금 급격 인상이 자영업·중소기업 경영 악화를 초래한 것이 본질적 문제',
        citizen_reality: '코로나 시기 자영업자 폐업이 속출하고 소상공인 매출이 급감. 재난지원금이 급한 불은 껐으나 장기적 경영난은 지속',
        context_note: '2020년 코로나19 충격으로 -0.7% 역성장 후 2021년 4.3% 반등. 임기 전반 2.9%(2017~2019) → 임기 후반 코로나 충격 포함',
        real_world_example: '2020~2021년 서울 명동·이태원·홍대 상권 공실률 급등. 코로나 이전부터 소득주도성장 논쟁과 맞물려 자영업 위기 심화',
      },
      {
        id: 'mji-r2', president_id: 'mji', category: '경제', metric_name: '국가채무',
        baseline_value: 660, baseline_year: 2017, target_value: 700, final_value: 971, unit: '조원', trend: 'worsened', grade: 'D',
        source: '기획재정부', note: '코로나 대응 추경으로 급증',
        progressive_frame: '코로나 위기 대응과 사회안전망 강화를 위한 확장재정은 불가피한 선택. 한국의 국가채무 비율은 OECD 평균의 절반 수준으로 재정 여력이 충분했음',
        conservative_frame: '임기 5년간 국가채무 47% 증가는 역대 최대. 코로나 이전부터 확장재정 기조를 유지하며 재정 건전성을 훼손. 미래 세대에 빚을 떠넘기는 결과',
        citizen_reality: '재난지원금 수령은 환영했으나, "이 빚을 결국 세금으로 갚아야 한다"는 불안감 공존. 물가 상승의 원인으로 지목되기도',
        context_note: 'GDP 대비 국가채무 비율이 36%(2017)에서 50%(2021)로 상승. 다만 OECD 평균(약 120%)보다는 여전히 양호한 수준',
        real_world_example: '2020~2021년 4차례 추가경정예산 총 규모 약 110조원. 전 국민 재난지원금, 소상공인 손실보상금 등 지급',
      },
      {
        id: 'mji-r3', president_id: 'mji', category: '사회', metric_name: '자살률',
        baseline_value: 24.3, baseline_year: 2017, target_value: 20.0, final_value: 23.6, unit: '명/10만명', trend: 'improved', grade: 'C',
        source: '통계청', note: 'OECD 최고 수준 여전',
        progressive_frame: '자살예방 국가행동계획을 수립하고 예산을 확대했으나, 사회구조적 문제(양극화, 고용불안, 주거비 부담)의 근본 해결 없이 수치 개선에 한계',
        conservative_frame: '자살률 소폭 개선은 사회적 인식 변화와 예방 체계 구축의 결과. 다만 여전히 OECD 1위라는 근본적 문제는 해결하지 못함',
        citizen_reality: '코로나 시기 고립감과 경제적 어려움으로 정신건강이 악화. 특히 2030 세대 우울증 진단이 급증',
        context_note: '한국 자살률은 OECD 국가 중 2003년 이후 지속적으로 1위. 인구 10만 명당 약 24명 수준',
      },
      {
        id: 'mji-r4', president_id: 'mji', category: '외교', metric_name: '남북교류 건수',
        baseline_value: 12, baseline_year: 2017, target_value: 100, final_value: 45, unit: '건', trend: 'improved', grade: 'B',
        source: '통일부', note: '2018년 정상회담 후 감소',
        progressive_frame: '세 차례 남북정상회담과 판문점선언은 한반도 평화 프로세스의 역사적 진전. 하노이 회담 결렬은 미국 측 요인이 결정적',
        conservative_frame: '북한 핵 고도화를 저지하지 못한 채 대화만 반복. 하노이 결렬 후 남북관계는 원점 회귀. 연락사무소 폭파(2020)로 대화 성과 무위',
        citizen_reality: '2018년 판문점 정상회담 생중계에 전 국민이 감동했으나, 이후 실질적 변화가 없어 "평화쇼" 비판도. 금강산·개성공단 재개 기대 무산',
        context_note: '2018년 3차례 남북정상회담(판문점·평양), 싱가포르 북미정상회담. 2019년 하노이 회담 결렬 후 교착',
        real_world_example: '2018년 4월 27일 판문점선언. 문 대통령과 김정은 위원장이 군사분계선을 넘는 장면이 전 세계에 생중계',
      },
      {
        id: 'mji-r5', president_id: 'mji', category: '복지', metric_name: '건강보험 보장률',
        baseline_value: 62.7, baseline_year: 2017, target_value: 70.0, final_value: 64.5, unit: '%', trend: 'improved', grade: 'C',
        source: '건강보험심사평가원',
        progressive_frame: '문재인 케어로 비급여 항목을 대폭 급여화하면서 보장성이 확대. 3대 비급여(특실·선택진료·상급종합병원) 해소에 기여',
        conservative_frame: '건강보험 재정 적자 우려를 무시한 급격한 보장성 확대. 보험료 인상과 의료기관 수익 악화로 의료 서비스 질 저하 우려',
        citizen_reality: 'MRI·초음파 검사 비용이 줄어드는 등 체감 혜택이 있었으나, 여전히 중증질환 치료 시 개인 부담이 큰 구조',
        context_note: '문재인 케어(2017~2022): 비급여의 급여 전환을 통해 건강보험 보장률 70% 달성 목표. 최종 64.5%로 미달성',
      },
      {
        id: 'mji-r6', president_id: 'mji', category: '부동산', metric_name: '서울 아파트 중위가격',
        baseline_value: 6.0, baseline_year: 2017, target_value: 6.0, final_value: 10.8, unit: '억원', trend: 'worsened', grade: 'F',
        source: 'KB부동산', note: '80% 상승',
        progressive_frame: '투기세력 차단과 공급확대를 추진했으나 글로벌 저금리와 유동성 확대라는 구조적 요인을 극복하지 못함. 공급 확대 정책(3기 신도시)은 후반부에 추진',
        conservative_frame: '26차례 부동산 규제로 시장을 왜곡하고 공급을 억제하여 역대 최대 집값 상승을 초래. 임대차3법이 전세가격 폭등을 가속',
        citizen_reality: '청년층 내집마련 사실상 불가능해짐. "영끌"(영혼까지 끌어모아 대출) 현상 확산. 전세가도 동반 상승하여 주거비 부담 역대 최고',
        context_note: '같은 기간 전 세계 대도시 부동산 가격이 상승했으나, 서울의 상승률은 OECD 주요 도시 중 상위권. 26차례 부동산 대책 발표',
        real_world_example: '2017년 마포구 아파트 매입 가능했던 맞벌이 부부가 2022년에는 같은 단지 전세도 어려운 상황. 임대차3법 이후 전세 매물 실종 현상',
      },
      {
        id: 'mji-r7', president_id: 'mji', category: '고용', metric_name: '고용률',
        baseline_value: 60.8, baseline_year: 2017, target_value: 70.0, final_value: 61.7, unit: '%', trend: 'stable', grade: 'C',
        source: '통계청', note: '코로나 영향으로 2020년 급락 후 회복',
        progressive_frame: '최저임금 인상으로 저임금 노동자의 소득이 향상되었으며, 공공부문 일자리 확대로 고용 안정성 제고. 코로나라는 불가항력이 고용률 목표 달성을 저해',
        conservative_frame: '급격한 최저임금 인상(16.4%, 10.9%)이 소상공인·자영업자의 인건비 부담을 가중시켜 오히려 고용 감소 초래. "고용 참사"를 자초',
        citizen_reality: '편의점·식당 아르바이트 자리가 줄고, 무인 키오스크가 늘어남. 공공 일자리(단기 노인 일자리)가 통계를 왜곡한다는 비판도',
        context_note: '2018년 최저임금 16.4% 인상(6,470→7,530원), 2019년 10.9% 인상(8,350원). 공약 "최저임금 1만원"은 달성하지 못함',
        real_world_example: '2018년 고용 쇼크: 취업자 증가 폭이 월 1만 명 이하로 추락. 자영업 폐업률 증가와 맞물려 사회적 충격',
      },
      {
        id: 'mji-r8', president_id: 'mji', category: '경제', metric_name: '가계부채',
        baseline_value: 1451, baseline_year: 2017, final_value: 1863, unit: '조원', trend: 'worsened', grade: 'D',
        source: '한국은행', note: '가처분소득 대비 가계부채 비율 OECD 최고',
        progressive_frame: '저금리 기조에서 부동산 대출이 급증한 것은 전 세계적 현상. 가계부채 관리를 위해 DSR 규제를 도입하는 등 제도적 장치 마련에 노력',
        conservative_frame: '부동산 규제로 시장을 왜곡하면서 갭투자·영끌 대출을 부추김. 가계부채 GDP 대비 비율이 세계 최고 수준으로 치솟은 것은 정책 실패',
        citizen_reality: '영끌 대출로 집을 산 청년·신혼부부가 금리 인상기에 원리금 상환 부담으로 고통. "빚투" 문화가 확산',
        context_note: '가계부채/GDP 비율이 100%를 돌파(2021). 코로나 시기 저금리와 부동산 가격 상승이 복합적으로 작용',
      },
      {
        id: 'mji-r9', president_id: 'mji', category: '사회', metric_name: '합계출산율',
        baseline_value: 1.05, baseline_year: 2017, target_value: 1.5, final_value: 0.81, unit: '명', trend: 'worsened', grade: 'F',
        source: '통계청', note: '세계 최저 출산율 기록',
        progressive_frame: '출산율 하락은 주거비·교육비·양육비 부담이라는 사회구조적 문제의 결과. 근본 해결 없이 현금 지원만으로는 한계. 성평등 정책은 장기적으로 긍정적',
        conservative_frame: '페미니즘 정책과 성별 갈등 조장이 결혼·출산에 대한 사회적 인식을 부정적으로 변화시킨 측면. 실효성 있는 출산장려보다 이념적 정책에 치중',
        citizen_reality: '결혼하고 싶어도 집값 때문에 못 하고, 아이를 낳고 싶어도 교육비가 무서워 포기. "비혼·비출산"이 합리적 선택이 된 시대',
        context_note: '2018년 합계출산율 0.98로 사상 최초 1.0 이하. 이후 매년 최저 기록 경신. 정부는 15년간 저출산 대책에 280조원 이상 투입',
        real_world_example: '서울 출산율 0.64(2021)로 전국 최저. 강남구·서초구 등 고소득 지역의 출산율도 0.6대로 소득과 무관한 구조적 문제 확인',
      },
      {
        id: 'mji-r10', president_id: 'mji', category: '복지', metric_name: '기초연금 수급액',
        baseline_value: 20, baseline_year: 2017, target_value: 30, final_value: 30, unit: '만원/월', trend: 'improved', grade: 'A',
        source: '보건복지부',
        progressive_frame: '기초연금 30만원 인상은 노인 빈곤율 개선에 실질적으로 기여한 핵심 복지 성과. 하위 70% 노인에게 보편적 혜택 제공',
        conservative_frame: '기초연금 인상의 취지는 인정하나, 재정 부담 증가와 국민연금과의 정합성 문제를 해결하지 못한 채 확대. 지속가능성에 의문',
        citizen_reality: '독거노인이나 저소득 노인 가정에서 월 30만원은 생활에 실질적 도움. 다만 물가 상승을 고려하면 충분하지 않다는 반응도',
        context_note: '기초연금 수급자 약 580만 명(하위 70%). 월 25만원→30만원 인상(2021). 노인 빈곤율은 여전히 OECD 최고 수준(약 40%)',
      },
    ],

    // ==================== 윤석열 (YSY) ====================
    ysy: [
      {
        id: 'ysy-r1', president_id: 'ysy', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 2.6, baseline_year: 2022, final_value: 1.4, unit: '%', trend: 'worsened', grade: 'D',
        source: '한국은행 ECOS',
        progressive_frame: '건전재정을 명분으로 경기 부양에 소극적으로 대응하면서 내수 침체를 방치. 세수 결손으로 오히려 재정 운영이 파탄',
        conservative_frame: '글로벌 고금리·고물가 환경에서 1.4% 성장은 불가피한 측면. 반도체 수출 회복이 하반기 경기 반등을 견인하기 시작',
        citizen_reality: '체감경기가 역대 최악이라는 반응이 다수. 자영업 폐업 증가, 내수 소비 위축으로 골목 상권 쇠퇴 가속',
        context_note: '2023년 GDP 성장률 1.4%는 코로나 시기(-0.7%, 2020년)를 제외하면 글로벌 금융위기(2009년, 0.8%) 이후 최저',
        real_world_example: '2023년 소상공인 폐업률 역대 최고. 서울 종로·명동 등 주요 상권에서 장기 공실 증가. "경기침체의 늪"이라는 표현이 언론에 빈번',
      },
      {
        id: 'ysy-r2', president_id: 'ysy', category: '경제', metric_name: '국가채무',
        baseline_value: 1068, baseline_year: 2022, final_value: 1222, unit: '조원', trend: 'worsened', grade: 'C',
        source: '기획재정부',
        progressive_frame: '건전재정을 내세웠으나 세수 결손(2023년 56조, 2024년 31조)으로 오히려 재정 건전성이 악화. 감세 정책이 세수 기반을 약화시킨 결과',
        conservative_frame: '전 정부의 방만한 재정 확대를 수습하면서 국가채무 증가 속도를 억제한 성과. 채무 비율 안정화에 기여',
        citizen_reality: '세수 부족으로 지방교부세 감소, 교육 예산 삭감 등 공공서비스 질 저하를 체감. "건전재정이 긴축재정이 되었다"는 비판',
        context_note: '2023년 세수 결손 56.4조원은 역대 최대. 법인세 감소(반도체 실적 악화)와 양도소득세 감소(부동산 거래 위축)가 주요 원인',
        real_world_example: '2023년 하반기 지방자치단체 재정 위기. 일부 지자체가 공무원 급여 지급에도 어려움을 겪는 사태 발생',
      },
      {
        id: 'ysy-r3', president_id: 'ysy', category: '사회', metric_name: '합계출산율',
        baseline_value: 0.78, baseline_year: 2022, final_value: 0.68, unit: '명', trend: 'worsened', grade: 'F',
        source: '통계청',
        progressive_frame: '출산율 반등을 위한 구조적 대책(주거, 돌봄, 노동시간 단축)보다 현금 지원에 치중. 성평등과 일·생활 균형 정책이 후퇴하면서 여성의 출산 기피 심화',
        conservative_frame: '저출생 문제는 어느 정부에서도 해결하지 못한 구조적 난제. 인구감소위원회 출범과 부모급여 신설 등 나름의 대응 노력',
        citizen_reality: '부모급여 월 100만원 지급은 환영하지만 "아이 하나 키우는 비용에 비하면 턱없이 부족"하다는 반응. 여전히 결혼·출산 포기가 대세',
        context_note: '2023년 합계출산율 0.72명으로 세계 유일의 0.7명대. 부모급여(2023.1 도입) 월 70만원→100만원 지급에도 효과 미미',
        real_world_example: '2024년 3분기 출생아 수 5.5만 명으로 역대 최저 분기 기록. 산부인과·소아과 폐업이 전국적으로 확산',
      },
      {
        id: 'ysy-r4', president_id: 'ysy', category: '부동산', metric_name: '서울 아파트 중위가격',
        baseline_value: 10.5, baseline_year: 2022, final_value: 9.8, unit: '억원', trend: 'improved', grade: 'C',
        source: 'KB부동산',
        progressive_frame: '금리 인상에 따른 자연스러운 가격 조정이지 정책 효과가 아님. 2024년 하반기 다시 상승세로 전환되면서 정책 효과 의문',
        conservative_frame: '부동산 규제 완화(LTV·DTI 완화, 재건축 허용)로 시장을 정상화하고, 공급 확대 기반을 마련. 연착륙에 성공',
        citizen_reality: '가격이 빠졌다고 하지만 여전히 서울 아파트 중위가격이 10억원 내외. 금리 상승으로 이자 부담이 오히려 늘어 내 집 마련은 더 어려워진 체감',
        context_note: '한국은행 기준금리가 0.5%(2021.8)에서 3.5%(2023.1)로 급등. 부동산 거래 절벽 현상 후 2024년 하반기 반등',
        real_world_example: '2022~2023년 "영끌" 세대 이자 부담 급증. 변동금리 주택담보대출 이자가 월 50만원에서 120만원으로 증가한 사례 다수',
      },
      {
        id: 'ysy-r5', president_id: 'ysy', category: '외교', metric_name: '한미동맹 신뢰도',
        baseline_value: 60, baseline_year: 2022, final_value: 78, unit: '점', trend: 'improved', grade: 'B',
        source: '외교부',
        progressive_frame: '한미동맹 강화가 한중관계 악화와 외교적 자율성 축소를 대가로 이루어짐. 일본 강제징용 제3자 변제는 국민 정서에 반하는 굴욕 외교',
        conservative_frame: '워싱턴선언과 캠프데이비드 한미일 정상회의는 안보 동맹을 질적으로 격상시킨 역사적 성과. 글로벌 공급망 재편에 전략적 대응',
        citizen_reality: '한일관계 정상화에 대해 "과거사를 덮고 가는 것"이라는 불만과 "현실적 필요"라는 인식이 세대별로 극명하게 갈림',
        context_note: '워싱턴선언(2023.4): 한미 핵협의그룹(NCG) 설치, 미 전략핵잠수함 한반도 배치. 캠프데이비드 한미일 정상회의(2023.8)',
        real_world_example: '강제징용 제3자 변제안(2023.3) 발표 후 피해자 단체 반발. 여론조사에서 국민 60% 이상이 "반대" 의견',
      },
    ],

    // ==================== 이재명 (LJM) ====================
    ljm: [
      {
        id: 'ljm-r1', president_id: 'ljm', category: '경제', metric_name: 'GDP 성장률',
        baseline_value: 1.4, baseline_year: 2025, final_value: 2.1, unit: '%', trend: 'improved', grade: 'B',
        source: '한국은행 ECOS', note: '취임 초기 수치',
        progressive_frame: '취임 초기 적극 재정과 내수 활성화 정책으로 성장률 반등의 계기를 마련. 소상공인 지원과 재난지원금 정책이 소비를 견인',
        conservative_frame: '글로벌 반도체 사이클 회복에 따른 수출 반등이 주요 원인이며, 정부 정책 효과는 제한적. 재정 확대의 부작용 우려',
        citizen_reality: '취임 초기라 아직 체감할 수 있는 변화가 크지 않다는 반응이 다수. 물가 안정에 대한 기대감은 있으나 관망세',
        context_note: '2025년 하반기~2026년 반도체 수출 호조와 함께 경기 회복 기대. 다만 미중 무역갈등 격화에 따른 불확실성 존재',
      },
      {
        id: 'ljm-r2', president_id: 'ljm', category: '경제', metric_name: '소비자물가상승률',
        baseline_value: 3.6, baseline_year: 2025, final_value: 2.8, unit: '%', trend: 'improved', grade: 'B',
        source: '통계청',
        progressive_frame: '농산물 가격 안정화와 에너지 보조금 정책이 물가 안정에 기여. 서민경제 우선이라는 정책 기조의 성과',
        conservative_frame: '글로벌 원자재 가격 하락에 따른 자연스러운 물가 안정이며, 정부 정책 효과로 보기 어려움. 재정 확대가 인플레이션 재발 요인',
        citizen_reality: '장바구니 물가는 여전히 높다는 반응. 외식비, 과일값 등 생필품 가격이 코로나 이전보다 30~50% 높은 수준 유지',
      },
      {
        id: 'ljm-r3', president_id: 'ljm', category: '고용', metric_name: '고용률',
        baseline_value: 62.1, baseline_year: 2025, final_value: 62.5, unit: '%', trend: 'improved', grade: 'C',
        source: '통계청',
        progressive_frame: '공공 일자리 확대와 디지털 전환 인력 양성 프로그램이 고용 시장에 긍정적 신호. 플랫폼 노동자 보호 정책도 추진',
        conservative_frame: '인구감소에 따른 구인난이 고용률 개선의 주요 원인. 양질의 일자리 창출보다 통계적 개선에 그칠 우려',
        citizen_reality: '취업 시장이 약간 나아졌다는 느낌은 있으나, 대기업·공공기관 채용은 여전히 좁은 문. 중소기업 구인난과 청년 구직난이 공존',
      },
      {
        id: 'ljm-r4', president_id: 'ljm', category: '사회', metric_name: '합계출산율',
        baseline_value: 0.65, baseline_year: 2025, final_value: 0.68, unit: '명', trend: 'stable', grade: 'F',
        source: '통계청',
        progressive_frame: '주거비 부담 완화, 공공보육 확대, 육아휴직 활성화 등 구조적 접근을 시작. 단기 수치보다 장기적 환경 조성이 핵심',
        conservative_frame: '역대 최저 출산율 상황에서 획기적 대책 없이 기존 정책의 연장선. 결혼·가족 가치에 대한 사회적 인식 개선 노력 부족',
        citizen_reality: '여전히 결혼과 출산을 경제적 이유로 미루거나 포기하는 2030세대가 다수. "구조가 바뀌지 않는 한 아이를 낳지 않겠다"는 반응',
        context_note: '2025년 출생아 수 약 22만 명 추정으로 역대 최저 전망. 인구감소 대응 종합계획 수립 예정',
      },
      {
        id: 'ljm-r5', president_id: 'ljm', category: '외교', metric_name: '한중 관계',
        baseline_value: 40, baseline_year: 2025, final_value: 55, unit: '점', trend: 'improved', grade: 'C',
        source: '외교부',
        progressive_frame: '한중관계 복원과 균형외교는 경제적 실익과 외교적 자율성 확보를 위해 필수적. 미중 사이에서 전략적 공간을 확보하려는 시도',
        conservative_frame: '한미동맹 약화와 중국 경사 우려. 사드 문제 미해결 상태에서 한중관계 개선은 안보적 양보를 수반할 수 있음',
        citizen_reality: '중국산 제품 안전성과 문화 갈등 등으로 대중 감정은 여전히 부정적. 경제적 필요와 국민 감정 사이의 괴리가 큰 상황',
        context_note: '취임 후 한중 정상회담 추진. 사드 갈등 해소와 경제 협력 확대가 핵심 과제. 미중 갈등 속 균형외교 노선',
      },
    ],
  };
  return metrics[presidentId] || [];
}

// ========================================
// 예산 비교 데이터
// ========================================

export interface BudgetComparison {
  area: string;
  pledged: number;
  approved: number;
  executed: number;
  execution_rate: number;
}

export function getBudgetComparisonByPresident(presidentId: string): BudgetComparison[] {
  const budgets: Record<string, BudgetComparison[]> = {
    mji: [
      { area: '보건·복지', pledged: 180, approved: 165, executed: 158, execution_rate: 95.8 },
      { area: '교육', pledged: 75, approved: 70, executed: 68, execution_rate: 97.1 },
      { area: '국방', pledged: 52, approved: 50, executed: 49, execution_rate: 98.0 },
      { area: '일자리', pledged: 55, approved: 42, executed: 38, execution_rate: 90.5 },
      { area: '부동산', pledged: 40, approved: 35, executed: 28, execution_rate: 80.0 },
      { area: '에너지', pledged: 30, approved: 25, executed: 22, execution_rate: 88.0 },
      { area: '외교·통일', pledged: 15, approved: 12, executed: 10, execution_rate: 83.3 },
      { area: 'R&D', pledged: 25, approved: 22, executed: 21, execution_rate: 95.5 },
    ],
    ysk: [
      { area: '경제개혁', pledged: 35, approved: 30, executed: 28, execution_rate: 93.3 },
      { area: '행정개혁', pledged: 15, approved: 12, executed: 11, execution_rate: 91.7 },
      { area: '국방', pledged: 20, approved: 18, executed: 17, execution_rate: 94.4 },
      { area: '사회간접자본', pledged: 25, approved: 22, executed: 20, execution_rate: 90.9 },
      { area: '교육', pledged: 18, approved: 15, executed: 14, execution_rate: 93.3 },
    ],
    kdj: [
      { area: '경제구조조정', pledged: 120, approved: 110, executed: 108, execution_rate: 98.2 },
      { area: 'IT산업', pledged: 30, approved: 28, executed: 27, execution_rate: 96.4 },
      { area: '복지', pledged: 25, approved: 22, executed: 20, execution_rate: 90.9 },
      { area: '남북협력', pledged: 10, approved: 8, executed: 7, execution_rate: 87.5 },
      { area: '교육', pledged: 20, approved: 18, executed: 17, execution_rate: 94.4 },
    ],
    nmh: [
      { area: '균형발전', pledged: 45, approved: 38, executed: 32, execution_rate: 84.2 },
      { area: '복지', pledged: 35, approved: 30, executed: 28, execution_rate: 93.3 },
      { area: '부동산대책', pledged: 20, approved: 15, executed: 12, execution_rate: 80.0 },
      { area: '국방', pledged: 28, approved: 26, executed: 25, execution_rate: 96.2 },
      { area: '교육', pledged: 22, approved: 20, executed: 19, execution_rate: 95.0 },
    ],
    lmb: [
      { area: '4대강', pledged: 22, approved: 22, executed: 22, execution_rate: 100.0 },
      { area: '녹색성장', pledged: 18, approved: 12, executed: 9, execution_rate: 75.0 },
      { area: '경기부양', pledged: 50, approved: 45, executed: 43, execution_rate: 95.6 },
      { area: '국방', pledged: 35, approved: 32, executed: 31, execution_rate: 96.9 },
      { area: '교육', pledged: 25, approved: 22, executed: 21, execution_rate: 95.5 },
    ],
    pgh: [
      { area: '창조경제', pledged: 20, approved: 15, executed: 10, execution_rate: 66.7 },
      { area: '복지', pledged: 45, approved: 40, executed: 37, execution_rate: 92.5 },
      { area: '국방', pledged: 38, approved: 36, executed: 35, execution_rate: 97.2 },
      { area: '교육', pledged: 30, approved: 27, executed: 25, execution_rate: 92.6 },
      { area: '문화', pledged: 12, approved: 10, executed: 8, execution_rate: 80.0 },
    ],
    ysy: [
      { area: '원전', pledged: 15, approved: 12, executed: 8, execution_rate: 66.7 },
      { area: '반도체', pledged: 25, approved: 18, executed: 12, execution_rate: 66.7 },
      { area: '국방', pledged: 65, approved: 62, executed: 60, execution_rate: 96.8 },
      { area: '복지', pledged: 55, approved: 48, executed: 42, execution_rate: 87.5 },
      { area: '교육', pledged: 30, approved: 25, executed: 22, execution_rate: 88.0 },
    ],
    ljm: [
      { area: '민생경제', pledged: 50, approved: 40, executed: 10, execution_rate: 25.0 },
      { area: '디지털', pledged: 20, approved: 15, executed: 3, execution_rate: 20.0 },
      { area: '복지', pledged: 60, approved: 50, executed: 12, execution_rate: 24.0 },
      { area: '국방', pledged: 60, approved: 58, executed: 15, execution_rate: 25.9 },
      { area: '환경', pledged: 30, approved: 22, executed: 2, execution_rate: 9.1 },
    ],
  };
  return budgets[presidentId] || [];
}

// ========================================
// 법안 시드 데이터
// ========================================

const BILLS_DATA: Bill[] = [
  {
    id: 'bill-001', bill_no: '2200001', title: '간호법', proposed_date: '2024-06-15',
    proposer_type: '의원', proposer_name: '주호영 외 12인', committee: '보건복지위원회',
    status: '가결', status_detail: '본회의 가결 (2025-09-18)',
    vote_result: { total: 298, yes: 163, no: 105, abstain: 18, absent: 12 },
    ai_summary: '간호사의 업무 범위를 법적으로 명확히 하고, 간호사의 독자적 전문직 지위를 확립하는 법안입니다. 의사단체의 강한 반대에도 불구하고 간호사의 열악한 근무환경 개선 필요성에 힘입어 통과되었습니다.',
    ai_category: '보건의료', ai_controversy_score: 85,
    ai_citizen_impact: '간호사 독립적 업무 범위 확대로 지역사회 건강관리 서비스 개선 기대. 다만 의료계 내 갈등이 진료 체계에 미칠 영향 우려.',
    co_sponsors_count: 12,
  },
  {
    id: 'bill-002', bill_no: '2200045', title: '노란봉투법 (노동조합법 개정안)', proposed_date: '2024-03-20',
    proposer_type: '의원', proposer_name: '이수진 외 35인', committee: '환경노동위원회',
    status: '가결', status_detail: '본회의 가결 (2025-11-05)',
    vote_result: { total: 295, yes: 189, no: 84, abstain: 14, absent: 8 },
    ai_summary: '파업 시 사용자의 노조에 대한 손해배상 청구를 제한하고, 하청 노동자의 원청 사용자에 대한 교섭권을 확대하는 법안입니다.',
    ai_category: '노동', ai_controversy_score: 78,
    ai_citizen_impact: '노동자의 파업권 실질적 보장으로 노동환경 개선 기대. 기업 측은 경영 불확실성 증가를 우려.',
    co_sponsors_count: 35,
  },
  {
    id: 'bill-003', bill_no: '2200102', title: '양곡관리법 개정안', proposed_date: '2024-05-10',
    proposer_type: '의원', proposer_name: '김성환 외 28인', committee: '농림축산식품해양수산위원회',
    status: '폐기', status_detail: '대통령 거부권 행사 후 재의결 실패',
    vote_result: { total: 290, yes: 175, no: 103, abstain: 5, absent: 7 },
    ai_summary: '쌀값 안정을 위해 정부가 초과 생산 양곡을 의무적으로 매입하도록 하는 법안입니다. 농민 소득 보호 vs 재정 부담 논란이 있었습니다.',
    ai_category: '농업', ai_controversy_score: 62,
    ai_citizen_impact: '쌀값 하락으로 고통받는 농민 보호 목적이나, 시장 왜곡과 재정 부담 증가로 쌀 소비자인 시민에게도 간접적 부담.',
    co_sponsors_count: 28,
  },
  {
    id: 'bill-004', bill_no: '2200200', title: '플랫폼 종사자 보호법', proposed_date: '2024-09-03',
    proposer_type: '의원', proposer_name: '한정애 외 22인', committee: '환경노동위원회',
    status: '계류', status_detail: '소위원회 심사 중',
    ai_summary: '배달·택시 등 플랫폼 노동자에게 산재보험, 고용보험 등 사회안전망을 확대 적용하는 법안입니다. 전통적 노동법이 포괄하지 못하는 새로운 고용 형태를 규율합니다.',
    ai_category: '노동', ai_controversy_score: 55,
    ai_citizen_impact: '플랫폼 종사자 약 220만명의 사회적 보호 강화. 배달비·요금 인상 가능성.',
    co_sponsors_count: 22,
  },
  {
    id: 'bill-005', bill_no: '2200305', title: '기후위기 대응을 위한 탄소중립·녹색성장 기본법 개정안', proposed_date: '2025-01-15',
    proposer_type: '의원', proposer_name: '양이원영 외 18인', committee: '환경노동위원회',
    status: '계류', status_detail: '법제사법위원회 체계·자구 심사',
    ai_summary: '2030년 온실가스 감축 목표를 40%에서 45%로 상향하고, 석탄발전 퇴출 시한을 2035년으로 명시하는 법안입니다.',
    ai_category: '환경', ai_controversy_score: 68,
    ai_citizen_impact: '탄소중립 가속화로 에너지 전환 투자 확대 및 신산업 창출 기대. 전기요금 인상 가능성과 에너지 집약 산업의 경쟁력 우려.',
    co_sponsors_count: 18,
  },
  {
    id: 'bill-006', bill_no: '2200410', title: '디지털자산 기본법', proposed_date: '2025-03-20',
    proposer_type: '의원', proposer_name: '노웅래 외 30인', committee: '정무위원회',
    status: '계류', status_detail: '소위원회 심사 중',
    ai_summary: '가상자산(암호화폐) 거래의 법적 근거를 마련하고 투자자 보호 규정을 강화하는 법안입니다. 스테이블코인, NFT, 디파이 등 새로운 자산 유형에 대한 규제 체계를 포함합니다.',
    ai_category: '금융', ai_controversy_score: 58,
    ai_citizen_impact: '가상자산 투자자 약 700만명의 보호 강화. 거래소 건전성 기준 강화로 투기성 코인 상장 제한 가능.',
    co_sponsors_count: 30,
  },
  {
    id: 'bill-007', bill_no: '2200512', title: '반도체산업 경쟁력 강화 특별법', proposed_date: '2025-02-08',
    proposer_type: '의원', proposer_name: '양향자 외 42인', committee: '산업통상자원중소벤처기업위원회',
    status: '가결', status_detail: '본회의 가결 (2025-12-10)',
    vote_result: { total: 291, yes: 272, no: 8, abstain: 5, absent: 6 },
    ai_summary: '반도체 설비투자 세액공제 25%, 전략물자 수출입 간소화, 반도체 클러스터 부지 지원 등을 담은 초당적 법안입니다.',
    ai_category: '산업', ai_controversy_score: 15,
    ai_citizen_impact: '반도체 산업 투자 확대로 고용 창출 및 수출 증가 기대. 세액공제에 따른 세수 감소는 다른 분야 예산에 영향.',
    co_sponsors_count: 42,
  },
  {
    id: 'bill-008', bill_no: '2200620', title: '인공지능 기본법', proposed_date: '2025-05-22',
    proposer_type: '정부', proposer_name: '정부 제출', committee: '과학기술정보방송통신위원회',
    status: '계류', status_detail: '전체회의 상정',
    ai_summary: 'AI 개발·활용의 기본 원칙, 고위험 AI 사전 평가 의무, AI 윤리위원회 설치, AI 피해 구제 절차를 규정하는 포괄적 법안입니다. EU AI Act를 참고하되 한국 실정에 맞게 설계되었습니다.',
    ai_category: '기술', ai_controversy_score: 45,
    ai_citizen_impact: 'AI 서비스 이용 시 투명성 보장과 피해 구제 가능. 과도한 규제가 AI 스타트업 성장을 저해할 수 있다는 우려.',
    co_sponsors_count: 0,
  },
  {
    id: 'bill-009', bill_no: '2200735', title: '방송법 개정안 (방송3법)', proposed_date: '2024-07-25',
    proposer_type: '의원', proposer_name: '최민희 외 25인', committee: '과학기술정보방송통신위원회',
    status: '가결', status_detail: '본회의 가결 (2025-08-20)',
    vote_result: { total: 288, yes: 187, no: 92, abstain: 3, absent: 6 },
    ai_summary: '방송통신위원회 의사정족수를 2인 이상으로 변경하고, 공영방송 이사 추천 시 시청자위원회 참여를 의무화하는 법안입니다. 방송 독립성 강화 vs 여당 영향력 확대 논란이 있습니다.',
    ai_category: '미디어', ai_controversy_score: 92,
    ai_citizen_impact: '공영방송의 정치적 독립성에 직접 영향. 방송 편성권의 향배에 따라 시민이 접하는 뉴스의 다양성이 변화.',
    co_sponsors_count: 25,
  },
  {
    id: 'bill-010', bill_no: '2200850', title: '전국민 돌봄법', proposed_date: '2025-07-12',
    proposer_type: '의원', proposer_name: '강은미 외 19인', committee: '보건복지위원회',
    status: '계류', status_detail: '소위원회 심사 중',
    ai_summary: '아동·장애인·노인 돌봄의 국가 책임을 법제화하고, 돌봄 종사자 처우 개선 및 돌봄 바우처 확대를 내용으로 합니다.',
    ai_category: '복지', ai_controversy_score: 32,
    ai_citizen_impact: '돌봄 공백 해소로 맞벌이 가구의 부담 경감. 연간 15~20조원의 재정 소요 예상.',
    co_sponsors_count: 19,
  },
  {
    id: 'bill-011', bill_no: '2200920', title: '부동산 실거래 투명화법', proposed_date: '2025-09-05',
    proposer_type: '의원', proposer_name: '소병훈 외 15인', committee: '국토교통위원회',
    status: '계류', status_detail: '소위원회 심사 중',
    ai_summary: '부동산 실거래 허위신고 처벌 강화, 법인의 부동산 취득 시 자금출처 공개 의무화, 분양권 전매 제한 강화를 내용으로 합니다.',
    ai_category: '부동산', ai_controversy_score: 52,
    ai_citizen_impact: '투기 억제로 실수요자 보호. 거래 투명성 향상으로 시장 신뢰도 제고.',
    co_sponsors_count: 15,
  },
  {
    id: 'bill-012', bill_no: '2201010', title: '청년기본소득법', proposed_date: '2025-10-20',
    proposer_type: '의원', proposer_name: '용혜인 외 10인', committee: '기획재정위원회',
    status: '계류', status_detail: '소위원회 회부',
    ai_summary: '만 19~34세 청년에게 월 30만원의 기본소득을 지급하는 법안입니다. 이재명 정부의 기본소득 확대 기조와 맞물려 주목받고 있습니다.',
    ai_category: '복지', ai_controversy_score: 75,
    ai_citizen_impact: '청년 약 1,100만명 대상. 연간 40조원 이상 재원 필요. 청년 소비 활성화 vs 재정 건전성 논란.',
    co_sponsors_count: 10,
  },
  {
    id: 'bill-013', bill_no: '2201105', title: '공직자 이해충돌방지법 개정안', proposed_date: '2025-06-30',
    proposer_type: '의원', proposer_name: '전현희 외 20인', committee: '정무위원회',
    status: '가결', status_detail: '본회의 가결 (2026-01-15)',
    vote_result: { total: 293, yes: 245, no: 28, abstain: 12, absent: 8 },
    ai_summary: '공직자의 가상자산 거래 신고 의무화, 배우자·직계가족의 이해충돌 신고 범위 확대, 퇴직 후 민간 취업 제한 기간 연장 등을 담고 있습니다.',
    ai_category: '반부패', ai_controversy_score: 25,
    ai_citizen_impact: '공직 사회 투명성 강화. 공무원의 사적 이익 추구 차단으로 정부 신뢰도 향상.',
    co_sponsors_count: 20,
  },
  {
    id: 'bill-014', bill_no: '2201200', title: '채용절차공정화법 개정안', proposed_date: '2025-08-14',
    proposer_type: '의원', proposer_name: '이은주 외 17인', committee: '환경노동위원회',
    status: '계류', status_detail: '소위원회 심사 중',
    ai_summary: 'AI 채용 시스템 사용 시 알고리즘 투명성 의무화, 블라인드 채용 확대, 채용비리 처벌 강화를 내용으로 하는 법안입니다.',
    ai_category: '노동', ai_controversy_score: 40,
    ai_citizen_impact: 'AI 기반 채용 과정의 공정성 확보. 기업의 채용 자율성과 효율성에 일정 부분 제약.',
    co_sponsors_count: 17,
  },
  {
    id: 'bill-015', bill_no: '2201310', title: '전기통신사업법 개정안 (망 사용료)', proposed_date: '2025-11-02',
    proposer_type: '의원', proposer_name: '박성중 외 24인', committee: '과학기술정보방송통신위원회',
    status: '계류', status_detail: '전체회의 상정',
    ai_summary: '대형 콘텐츠 사업자(넷플릭스, 유튜브 등)에 망 사용료 부과 근거를 마련하는 법안입니다. 통신사와 글로벌 플랫폼 간 갈등의 핵심 쟁점입니다.',
    ai_category: '기술', ai_controversy_score: 70,
    ai_citizen_impact: '망 사용료가 소비자 구독료에 전가될 가능성. 반면 통신 인프라 투자 재원 확보로 서비스 품질 개선 기대.',
    co_sponsors_count: 24,
  },
  {
    id: 'bill-016', bill_no: '2201405', title: '재난안전관리 기본법 개정안', proposed_date: '2025-04-10',
    proposer_type: '정부', proposer_name: '정부 제출', committee: '행정안전위원회',
    status: '가결', status_detail: '본회의 가결 (2025-10-25)',
    vote_result: { total: 287, yes: 265, no: 10, abstain: 6, absent: 6 },
    ai_summary: '이태원 참사와 비상계엄 사태를 계기로 재난 대응 체계를 전면 개편하는 법안입니다. 재난안전처 독립기관화, 재난 조기경보 시스템 의무화, 민간 전문가 참여 확대를 포함합니다.',
    ai_category: '안전', ai_controversy_score: 12,
    ai_citizen_impact: '재난 대응 속도와 효과성 개선으로 시민 안전 강화. 지방자치단체의 재난 대응 역량 강화에 기여.',
    co_sponsors_count: 0,
  },
];

export function getBills(): Bill[] { return BILLS_DATA; }
export function getBillById(id: string): Bill | undefined { return BILLS_DATA.find(b => b.id === id); }
export function getBillsByStatus(status: string): Bill[] { return BILLS_DATA.filter(b => b.status === status); }
export function getBillsByCommittee(committee: string): Bill[] { return BILLS_DATA.filter(b => b.committee === committee); }
export function getBillsByCategory(category: string): Bill[] { return BILLS_DATA.filter(b => b.ai_category === category); }

// ========================================
// 뉴스 이벤트 시드 데이터
// ========================================

const NEWS_EVENTS_DATA: NewsEvent[] = [
  {
    id: 'news-001', title: '2026년 예산안 728조 국회 통과', event_date: '2026-01-15',
    category: '경제',
    ai_summary: '이재명 정부 첫 본예산 728조원이 여야 협의를 거쳐 국회를 통과했습니다. R&D 예산 19.3% 증가가 핵심이며, 복지 지출도 7.5% 확대되었습니다.',
    key_facts: [
      '총 728조원 (전년 대비 7.5% 증가)',
      'R&D 예산 33.8조원으로 19.3% 대폭 증가',
      '보건·복지·고용 269.1조원 (37.0%)',
      '국방비 66.3조원 (4.5% 증가)',
      '국가채무 1,222조원으로 증가 전망',
    ],
    progressive_frame: {
      emphasis: '윤석열 정부가 삭감한 R&D 예산을 정상화하고, 민생 회복을 위한 적극 재정 편성',
      headline: '민생경제 살리기 위한 확장재정... R&D 정상화가 핵심',
      tone: '긍정적 — 적극 재정으로 경기 회복 기대',
    },
    conservative_frame: {
      emphasis: '나랏빚 1,200조 돌파가 우려되는 방만한 예산안',
      headline: '빚더미 예산... 국가채무 1,222조 시대 개막',
      tone: '비판적 — 재정건전성 악화 우려',
    },
    citizen_takeaway: '728조 예산 중 복지(37%)가 최대 비중. R&D 대폭 증가는 미래 산업에 긍정적이나, 국가채무 증가 속도 모니터링이 필요합니다.',
    article_count: 342,
    coverage: [
      { outlet_id: 'chosun', outlet_name: '조선일보', headline: '나랏빚 1,222조... 역대 최대 빚잔치 예산', spectrum_score: 4.5, category: 'conservative' },
      { outlet_id: 'joongang', outlet_name: '중앙일보', headline: '728조 슈퍼 예산, 건전재정은 뒷전', spectrum_score: 3.8, category: 'conservative' },
      { outlet_id: 'hankyoreh', outlet_name: '한겨레', headline: 'R&D 정상화·민생 회복에 방점... 728조 예산안 통과', spectrum_score: 1.2, category: 'progressive' },
      { outlet_id: 'khan', outlet_name: '경향신문', headline: '삭감된 R&D 복원하고 복지 확대... 민생 중심 예산', spectrum_score: 1.5, category: 'progressive' },
      { outlet_id: 'hankookilbo', outlet_name: '한국일보', headline: '728조 예산 국회 통과... R&D 대폭 증가·복지 확대', spectrum_score: 2.8, category: 'center' },
      { outlet_id: 'donga', outlet_name: '동아일보', headline: '국채 의존 심화... 재정 건전성 경고등', spectrum_score: 4.0, category: 'conservative' },
    ],
  },
  {
    id: 'news-002', title: '비상계엄 사태 이후 헌정질서 회복', event_date: '2025-04-04',
    category: '정치',
    ai_summary: '2024년 12월 3일 비상계엄 선포 이후 약 4개월간의 헌정 위기가 헌법재판소의 탄핵 인용으로 마무리되었습니다. 대한민국 역사상 유례없는 현직 대통령의 계엄 선포와 탄핵이라는 헌정 사상 초유의 사태였습니다.',
    key_facts: [
      '2024-12-03: 윤석열 대통령 비상계엄 선포 (6시간 만에 해제)',
      '2024-12-14: 국회 탄핵 소추안 가결 (204:85)',
      '2025-01-15: 윤석열 대통령 체포',
      '2025-04-04: 헌법재판소 탄핵 인용 (만장일치)',
      '2025-06-04: 조기 대선 실시, 이재명 당선',
    ],
    progressive_frame: {
      emphasis: '민주주의 수호와 시민의 승리. 촛불의 힘으로 쿠데타를 막아낸 역사적 사건',
      headline: '시민이 지킨 민주주의... 계엄 쿠데타 좌절의 기록',
      tone: '강하게 비판 — 민주주의 위기에 대한 경각심',
    },
    conservative_frame: {
      emphasis: '정치 혼란으로 인한 경제·외교적 피해. 절차적 문제점과 정치 보복 우려',
      headline: '장기간 정치 혼란에 경제·외교 타격 불가피',
      tone: '우려 — 정치적 안정 필요성 강조',
    },
    citizen_takeaway: '비상계엄 사태는 헌법재판소의 탄핵 인용으로 헌정질서가 회복되었습니다. 시민의 저항이 민주주의를 지켰으나, 향후 재발 방지를 위한 제도적 보완이 필요합니다.',
    article_count: 1205,
    coverage: [
      { outlet_id: 'hankyoreh', outlet_name: '한겨레', headline: '촛불이 다시 한번... 계엄 쿠데타 좌절시킨 시민의 힘', spectrum_score: 1.2, category: 'progressive' },
      { outlet_id: 'khan', outlet_name: '경향신문', headline: '헌재 만장일치 파면... 대한민국 민주주의 승리의 날', spectrum_score: 1.5, category: 'progressive' },
      { outlet_id: 'chosun', outlet_name: '조선일보', headline: '4개월 정치 혼란 마무리... 조기 대선으로 안정 회복해야', spectrum_score: 4.5, category: 'conservative' },
      { outlet_id: 'joongang', outlet_name: '중앙일보', headline: '탄핵 인용, 이제 경제·민생에 집중할 때', spectrum_score: 3.8, category: 'conservative' },
      { outlet_id: 'hankookilbo', outlet_name: '한국일보', headline: '윤석열 파면... 헌정질서 회복, 과제는 통합', spectrum_score: 2.8, category: 'center' },
    ],
  },
  {
    id: 'news-003', title: 'R&D 예산 대폭 증가와 과학기술계 반응', event_date: '2026-02-10',
    category: '과학기술',
    ai_summary: '이재명 정부가 R&D 예산을 33.8조원으로 19.3% 증액하면서 윤석열 정부 때 16.6% 삭감된 연구개발 예산이 정상화되었습니다. 과학기술계는 환영하지만, 예산 효율성과 선택·집중 전략에 대한 논의가 필요합니다.',
    key_facts: [
      '2024년 R&D 예산: 28.7조원 (전년 대비 16.6% 삭감 — 윤석열 정부)',
      '2025년: 28.3조원 (소폭 감소)',
      '2026년: 33.8조원 (19.3% 증가 — 이재명 정부)',
      'AI·반도체·바이오 3대 분야 집중 투자',
      '기초과학 연구비 비중 30%로 확대',
    ],
    progressive_frame: {
      emphasis: '윤석열 정부의 R&D 삭감이라는 역사적 실수를 바로잡은 정책',
      headline: 'R&D 정상화로 과학기술 강국 복원... "잃어버린 2년" 만회',
      tone: '긍정적 — 과학기술 투자 회복 환영',
    },
    conservative_frame: {
      emphasis: '예산 증가 자체보다 효율적 집행과 성과 관리가 핵심',
      headline: 'R&D 예산 급증... 효율성 없는 "퍼주기"가 되면 안 된다',
      tone: '조건부 긍정 — 성과 관리 강조',
    },
    citizen_takeaway: 'R&D 예산 대폭 증가는 AI·반도체 경쟁에서 뒤처지지 않기 위한 조치입니다. 다만 예산이 실질적 연구 성과로 이어지려면 투명한 집행과 성과 평가가 필요합니다.',
    article_count: 156,
    coverage: [
      { outlet_id: 'hankyoreh', outlet_name: '한겨레', headline: '"잃어버린 2년" 끝... R&D 예산 33.8조 시대', spectrum_score: 1.2, category: 'progressive' },
      { outlet_id: 'chosun', outlet_name: '조선일보', headline: 'R&D 예산 급증, 성과 없으면 세금 낭비', spectrum_score: 4.5, category: 'conservative' },
      { outlet_id: 'hankookilbo', outlet_name: '한국일보', headline: 'R&D 19% 증가... AI·반도체에 집중투자', spectrum_score: 2.8, category: 'center' },
    ],
  },
  {
    id: 'news-004', title: '합계출산율 0.68명, 사상 최저 기록 갱신', event_date: '2026-02-25',
    category: '사회',
    ai_summary: '2025년 합계출산율이 0.68명으로 전년 대비 하락하며 다시 세계 최저 기록을 갱신했습니다. 정부는 "인구비상사태"를 선언하고 출산·양육 지원 패키지를 발표했습니다.',
    key_facts: [
      '2025년 합계출산율 0.68명 (2024년 0.72명에서 하락)',
      '연간 출생아 수 약 21만명 (사상 최저)',
      '서울 합계출산율 0.55명 (전국 최저)',
      '정부, 결혼·출산·양육 원스톱 지원 패키지 발표',
      '출산 시 2,000만원 바우처 지급 방안 추진',
    ],
    progressive_frame: {
      emphasis: '구조적 문제(주거비·교육비·고용 불안)를 해결하지 않으면 현금 지원만으로 출산율 반등 불가',
      headline: '집값·교육비·고용불안... 구조적 문제 외면한 현금 퍼주기로는 해결 안 된다',
      tone: '비판적 — 근본적 구조 개혁 필요',
    },
    conservative_frame: {
      emphasis: '파격적 출산 지원금으로 출산 의지를 자극하고, 이민 정책과 병행해야',
      headline: '인구절벽 앞에 선 대한민국... "국가 비상사태" 수준의 대응 필요',
      tone: '위기의식 — 과감한 정책 전환 촉구',
    },
    citizen_takeaway: '출산율 0.68명은 인구 유지에 필요한 2.1명의 1/3 수준입니다. 현금 지원과 함께 주거·고용·양육 부담 감소라는 구조적 개혁이 동시에 필요합니다.',
    article_count: 428,
    coverage: [
      { outlet_id: 'khan', outlet_name: '경향신문', headline: '"돈 준다고 아이 낳나"... 구조 개혁 외면한 저출산 대책의 한계', spectrum_score: 1.5, category: 'progressive' },
      { outlet_id: 'hankyoreh', outlet_name: '한겨레', headline: '0.68명, 또 최저... 집값·교육비가 출산율 잡아먹는다', spectrum_score: 1.2, category: 'progressive' },
      { outlet_id: 'chosun', outlet_name: '조선일보', headline: '출산율 0.68명 충격... 이대로면 2100년 인구 2,000만명대', spectrum_score: 4.5, category: 'conservative' },
      { outlet_id: 'donga', outlet_name: '동아일보', headline: '"인구절벽" 현실화... 이민·출산 동시 추진해야', spectrum_score: 4.0, category: 'conservative' },
      { outlet_id: 'hankookilbo', outlet_name: '한국일보', headline: '사상 최저 0.68명... 인구위기 해법, 구조와 지원 동시에', spectrum_score: 2.8, category: 'center' },
      { outlet_id: 'joongang', outlet_name: '중앙일보', headline: '0.68명 쇼크, 국가소멸 카운트다운', spectrum_score: 3.8, category: 'conservative' },
    ],
  },
  {
    id: 'news-005', title: '삼성전자 AI 반도체 투자 100조원 계획 발표', event_date: '2026-03-05',
    category: '경제',
    ai_summary: '삼성전자가 향후 5년간 AI 반도체(HBM, GAA 공정)에 100조원을 투자하겠다고 발표했습니다. 정부의 반도체특별법과 세액공제 확대가 투자 결정에 기여했다는 분석입니다.',
    key_facts: [
      '삼성전자, 5년간 AI 반도체 100조원 투자 계획',
      'HBM(고대역폭메모리) 생산 능력 3배 확대',
      'GAA 2나노 공정 2027년 양산 목표',
      '용인 반도체 클러스터에 50조원 집중 투자',
      '5만개 이상 고급 일자리 창출 전망',
    ],
    progressive_frame: {
      emphasis: '정부 지원에 상응하는 고용·지역경제 기여가 필요. 대기업 특혜 논란',
      headline: '100조 투자 환영하지만... 세금 혜택에 걸맞은 고용 책임 요구',
      tone: '조건부 긍정 — 기업의 사회적 책임 강조',
    },
    conservative_frame: {
      emphasis: '글로벌 AI 패권 경쟁에서 한국이 반도체 강국 지위를 수성할 핵심 투자',
      headline: '삼성 100조 투자로 AI 반도체 패권 경쟁 본격화',
      tone: '긍정적 — 산업 경쟁력 강화 환영',
    },
    citizen_takeaway: '100조원 투자는 일자리와 수출에 긍정적이지만, 세액공제(국민 세금)와의 균형이 중요합니다. 투자가 고용 창출과 지역경제 활성화로 이어지는지 모니터링이 필요합니다.',
    article_count: 267,
    coverage: [
      { outlet_id: 'chosun', outlet_name: '조선일보', headline: '삼성 100조 베팅... AI 반도체 패권 전쟁 선전포고', spectrum_score: 4.5, category: 'conservative' },
      { outlet_id: 'hankyoreh', outlet_name: '한겨레', headline: '100조 투자에 세금 혜택은 얼마?... 기업 책임도 함께 논의해야', spectrum_score: 1.2, category: 'progressive' },
      { outlet_id: 'hankookilbo', outlet_name: '한국일보', headline: '삼성전자 AI 반도체 100조 투자... 5만 일자리 기대', spectrum_score: 2.8, category: 'center' },
    ],
  },
  {
    id: 'news-006', title: '국민연금 개혁안 국회 논의 시작', event_date: '2026-03-15',
    category: '복지',
    ai_summary: '국민연금 기금 고갈 시점(2055년)이 다가옴에 따라 정부가 보험료율 인상(9%→13%)과 수급 개시 연령 상향(65→68세) 등을 포함한 개혁안을 국회에 제출했습니다.',
    key_facts: [
      '현행 보험료율 9% → 13%로 단계적 인상 (매년 0.5%p)',
      '수급 개시 연령 65세 → 68세로 단계적 상향',
      '소득대체율 40% 유지 (인하 없음)',
      '기금 고갈 시점 2055년 → 2072년으로 연기 효과',
      '최저보장연금 도입으로 사각지대 해소',
    ],
    progressive_frame: {
      emphasis: '보험료 인상은 불가피하나, 소득대체율 인하 없이 "더 내고 같이 받는" 구조가 핵심',
      headline: '연금 개혁의 핵심은 소득대체율 사수... 노인 빈곤 해소가 우선',
      tone: '조건부 지지 — 소득대체율 유지 환영',
    },
    conservative_frame: {
      emphasis: '보험료율 인상만으로는 기금 고갈을 막을 수 없으며, 소득대체율 조정이 불가피',
      headline: '보험료 13%로 올려도 2072년이면 고갈... 근본 개혁이 아닌 미봉책',
      tone: '비판적 — 더 과감한 개혁 요구',
    },
    citizen_takeaway: '보험료율 인상(월급 대비 4% 추가 부담)은 직장인에게 체감이 큰 변화입니다. 청년 세대의 연금 수급 가능성과 노인 세대의 빈곤 방지 사이의 세대 간 균형이 핵심입니다.',
    article_count: 389,
    coverage: [
      { outlet_id: 'khan', outlet_name: '경향신문', headline: '"더 내고 같이 받자"... 연금 개혁의 핵심은 소득대체율 사수', spectrum_score: 1.5, category: 'progressive' },
      { outlet_id: 'chosun', outlet_name: '조선일보', headline: '보험료 13%로 올려도 2072년 고갈... 이게 개혁인가', spectrum_score: 4.5, category: 'conservative' },
      { outlet_id: 'joongang', outlet_name: '중앙일보', headline: '연금 개혁 첫발... 2072년까지 17년 더 버틴다', spectrum_score: 3.8, category: 'conservative' },
      { outlet_id: 'hankyoreh', outlet_name: '한겨레', headline: '연금 개혁안, 최저보장연금 도입은 긍정... 보험료 인상 속도는 논란', spectrum_score: 1.2, category: 'progressive' },
      { outlet_id: 'hankookilbo', outlet_name: '한국일보', headline: '국민연금 보험료 13%... 월급쟁이 부담은 얼마나 늘어나나', spectrum_score: 2.8, category: 'center' },
      { outlet_id: 'donga', outlet_name: '동아일보', headline: '연금 기금 고갈 17년 연기... 미래세대 부담은 여전', spectrum_score: 4.0, category: 'conservative' },
    ],
  },
];

const MEDIA_OUTLETS_DATA: MediaOutlet[] = [
  { id: 'chosun', name: '조선일보', type: 'newspaper', spectrum_score: 4.5, category: 'conservative', rss_url: 'https://www.chosun.com/arc/outboundfeeds/rss/', website_url: 'https://www.chosun.com' },
  { id: 'joongang', name: '중앙일보', type: 'newspaper', spectrum_score: 3.8, category: 'conservative', rss_url: 'https://rss.joins.com/joins_news_list.xml', website_url: 'https://www.joongang.co.kr' },
  { id: 'donga', name: '동아일보', type: 'newspaper', spectrum_score: 4.0, category: 'conservative', rss_url: 'https://rss.donga.com/total.xml', website_url: 'https://www.donga.com' },
  { id: 'hankyoreh', name: '한겨레', type: 'newspaper', spectrum_score: 1.2, category: 'progressive', rss_url: 'https://www.hani.co.kr/rss/', website_url: 'https://www.hani.co.kr' },
  { id: 'khan', name: '경향신문', type: 'newspaper', spectrum_score: 1.5, category: 'progressive', rss_url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml', website_url: 'https://www.khan.co.kr' },
  { id: 'hankookilbo', name: '한국일보', type: 'newspaper', spectrum_score: 2.8, category: 'center', website_url: 'https://www.hankookilbo.com' },
  { id: 'munhwa', name: '문화일보', type: 'newspaper', spectrum_score: 3.5, category: 'conservative', website_url: 'https://www.munhwa.com' },
  { id: 'segye', name: '세계일보', type: 'newspaper', spectrum_score: 3.2, category: 'conservative', website_url: 'https://www.segye.com' },
  { id: 'kbs', name: 'KBS', type: 'broadcast', spectrum_score: 2.5, category: 'center', website_url: 'https://news.kbs.co.kr' },
  { id: 'mbc', name: 'MBC', type: 'broadcast', spectrum_score: 2.0, category: 'progressive', website_url: 'https://imnews.imbc.com' },
  { id: 'sbs', name: 'SBS', type: 'broadcast', spectrum_score: 2.8, category: 'center', website_url: 'https://news.sbs.co.kr' },
  { id: 'jtbc', name: 'JTBC', type: 'broadcast', spectrum_score: 2.2, category: 'progressive', website_url: 'https://news.jtbc.co.kr' },
  { id: 'ytn', name: 'YTN', type: 'broadcast', spectrum_score: 2.5, category: 'center', website_url: 'https://www.ytn.co.kr' },
  { id: 'tvchosun', name: 'TV조선', type: 'broadcast', spectrum_score: 4.2, category: 'conservative', website_url: 'https://news.tvchosun.com' },
  { id: 'channela', name: '채널A', type: 'broadcast', spectrum_score: 4.0, category: 'conservative', website_url: 'https://www.ichannela.com' },
];

export function getNewsEvents(): NewsEvent[] { return NEWS_EVENTS_DATA; }
export function getNewsEventById(id: string): NewsEvent | undefined { return NEWS_EVENTS_DATA.find(e => e.id === id); }
export function getMediaOutlets(): MediaOutlet[] { return MEDIA_OUTLETS_DATA; }
export function getMediaOutletById(id: string): MediaOutlet | undefined { return MEDIA_OUTLETS_DATA.find(o => o.id === id); }

// ========================================
// 대통령 비교 지표 (심층 비교용)
// ========================================

// Verified social/governance indicators per president
const PRESIDENT_SOCIAL_DATA: Record<string, {
  unemployment_avg: number;
  housing_price_change: number;
  birth_rate_end: number;
  approval_avg: number;
  corruption_index_end: number;
}> = {
  ysk: { unemployment_avg: 3.1, housing_price_change: 12, birth_rate_end: 1.54, approval_avg: 32, corruption_index_end: 43 },
  kdj: { unemployment_avg: 4.8, housing_price_change: -5, birth_rate_end: 1.30, approval_avg: 38, corruption_index_end: 45 },
  nmh: { unemployment_avg: 3.5, housing_price_change: 35, birth_rate_end: 1.26, approval_avg: 25, corruption_index_end: 51 },
  lmb: { unemployment_avg: 3.4, housing_price_change: 18, birth_rate_end: 1.24, approval_avg: 29, corruption_index_end: 56 },
  pgh: { unemployment_avg: 3.6, housing_price_change: 22, birth_rate_end: 1.17, approval_avg: 26, corruption_index_end: 53 },
  mji: { unemployment_avg: 3.8, housing_price_change: 52, birth_rate_end: 0.81, approval_avg: 45, corruption_index_end: 62 },
  ysy: { unemployment_avg: 2.8, housing_price_change: -8, birth_rate_end: 0.72, approval_avg: 22, corruption_index_end: 63 },
  ljm: { unemployment_avg: 3.0, housing_price_change: 2, birth_rate_end: 0.68, approval_avg: 52, corruption_index_end: 63 },
};

export function getPresidentComparisonMetrics(): PresidentComparisonMetrics[] {
  const presidents = getPresidents();

  return presidents.map(p => {
    const fiscal = getFiscalByPresident(p.id);
    const social = PRESIDENT_SOCIAL_DATA[p.id] || {
      unemployment_avg: 0, housing_price_change: 0, birth_rate_end: 0,
      approval_avg: 0, corruption_index_end: 0,
    };

    // Fiscal calculations
    const spending = fiscal.map(f => f.total_spending || 0).filter(v => v > 0);
    const debt = fiscal.map(f => f.national_debt || 0).filter(v => v > 0);
    const debtToGdp = fiscal.map(f => f.debt_to_gdp).filter((v): v is number => v !== undefined && v > 0);

    const avg_spending = spending.length
      ? spending.reduce((a, b) => a + b, 0) / spending.length
      : 0;
    const spending_growth_pct = spending.length >= 2
      ? ((spending[spending.length - 1] - spending[0]) / spending[0]) * 100
      : 0;
    const debt_growth_pct = debt.length >= 2
      ? ((debt[debt.length - 1] - debt[0]) / debt[0]) * 100
      : 0;
    const avg_debt_to_gdp = debtToGdp.length
      ? debtToGdp.reduce((a, b) => a + b, 0) / debtToGdp.length
      : 0;

    // Governance from existing data
    const policies = getPoliciesByPresident(p.id);
    const keyEvents = getKeyEventsByPresident(p.id);
    const pledges = getCampaignPledgesByPresident(p.id);
    const pledge_fulfillment_avg = pledges.length
      ? pledges.reduce((sum, pl) => sum + (pl.fulfillment_pct || 0), 0) / pledges.length
      : 0;

    return {
      id: p.id,
      name: p.name,
      era: p.era || '',
      party: p.party,
      term_start: p.term_start,
      term_end: p.term_end,
      gdp_growth_avg: p.gdp_growth_avg,
      avg_spending: Math.round(avg_spending * 10) / 10,
      spending_growth_pct: Math.round(spending_growth_pct * 10) / 10,
      debt_growth_pct: Math.round(debt_growth_pct * 10) / 10,
      avg_debt_to_gdp: Math.round(avg_debt_to_gdp * 10) / 10,
      unemployment_avg: social.unemployment_avg,
      housing_price_change: social.housing_price_change,
      birth_rate_end: social.birth_rate_end,
      approval_avg: social.approval_avg,
      policies_count: policies.length,
      key_events_count: keyEvents.length,
      pledge_fulfillment_avg: Math.round(pledge_fulfillment_avg * 10) / 10,
      corruption_index_end: social.corruption_index_end,
    };
  });
}
