// 국정투명 — 시드 데이터 로더
// MVP에서는 하드코딩된 시드 데이터를 사용합니다.
// 프로덕션에서는 API 클라이언트(api.ts)로 교체됩니다.

import type { President, FiscalYearly, FiscalBySector, AuditFlag, DepartmentScore } from './types';

// ========================================
// 대통령 데이터 (data/seed/presidents.json 기반)
// ========================================

const PRESIDENTS_DATA: President[] = [
  { id: "ysk", name: "김영삼", nameEn: "Kim Young-sam", name_en: "Kim Young-sam", termStart: "1993-02-25", termEnd: "1998-02-24", term_start: "1993-02-25", term_end: "1998-02-24", party: "민주자유당→신한국당", era: "문민정부", gdpGrowthAvg: 5.7, gdp_growth_avg: 5.7 },
  { id: "kdj", name: "김대중", nameEn: "Kim Dae-jung", name_en: "Kim Dae-jung", termStart: "1998-02-25", termEnd: "2003-02-24", term_start: "1998-02-25", term_end: "2003-02-24", party: "새정치국민회의→새천년민주당", era: "국민의 정부", gdpGrowthAvg: 5.2, gdp_growth_avg: 5.2 },
  { id: "nmh", name: "노무현", nameEn: "Roh Moo-hyun", name_en: "Roh Moo-hyun", termStart: "2003-02-25", termEnd: "2008-02-24", term_start: "2003-02-25", term_end: "2008-02-24", party: "새천년민주당→열린우리당", era: "참여정부", gdpGrowthAvg: 4.3, gdp_growth_avg: 4.3 },
  { id: "lmb", name: "이명박", nameEn: "Lee Myung-bak", name_en: "Lee Myung-bak", termStart: "2008-02-25", termEnd: "2013-02-24", term_start: "2008-02-25", term_end: "2013-02-24", party: "한나라당→새누리당", era: "이명박 정부", gdpGrowthAvg: 3.2, gdp_growth_avg: 3.2 },
  { id: "pgh", name: "박근혜", nameEn: "Park Geun-hye", name_en: "Park Geun-hye", termStart: "2013-02-25", termEnd: "2017-03-10", term_start: "2013-02-25", term_end: "2017-03-10", party: "새누리당", era: "박근혜 정부", gdpGrowthAvg: 2.9, gdp_growth_avg: 2.9, note: "탄핵 파면" },
  { id: "mji", name: "문재인", nameEn: "Moon Jae-in", name_en: "Moon Jae-in", termStart: "2017-05-10", termEnd: "2022-05-09", term_start: "2017-05-10", term_end: "2022-05-09", party: "더불어민주당", era: "문재인 정부", gdpGrowthAvg: 2.3, gdp_growth_avg: 2.3 },
  { id: "ysy", name: "윤석열", nameEn: "Yoon Suk-yeol", name_en: "Yoon Suk-yeol", termStart: "2022-05-10", termEnd: "2025-04-04", term_start: "2022-05-10", term_end: "2025-04-04", party: "국민의힘", era: "윤석열 정부", gdpGrowthAvg: 1.8, gdp_growth_avg: 1.8, note: "비상계엄→탄핵 파면" },
  { id: "ljm", name: "이재명", nameEn: "Lee Jae-myung", name_en: "Lee Jae-myung", termStart: "2025-06-04", termEnd: undefined, term_start: "2025-06-04", term_end: undefined, party: "더불어민주당", era: "이재명 정부" },
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
      { sector: '보건·복지·고용', amount: 269.1, percentage: 37.0, yoy_change: 7.5 },
      { sector: '일반·지방행정', amount: 121.1, percentage: 16.6, yoy_change: 5.2 },
      { sector: '교육', amount: 99.8, percentage: 13.7, yoy_change: 6.8 },
      { sector: '국방', amount: 66.3, percentage: 9.1, yoy_change: 4.5 },
      { sector: '산업·중소기업·에너지', amount: 37.2, percentage: 5.1, yoy_change: 8.3 },
      { sector: 'R&D', amount: 33.8, percentage: 4.6, yoy_change: 19.3 },
      { sector: '공공질서·안전', amount: 25.4, percentage: 3.5, yoy_change: 3.2 },
      { sector: 'SOC', amount: 28.5, percentage: 3.9, yoy_change: 11.2 },
      { sector: '농림·수산·식품', amount: 24.8, percentage: 3.4, yoy_change: 2.1 },
      { sector: '환경', amount: 13.2, percentage: 1.8, yoy_change: 5.8 },
      { sector: '문화·체육·관광', amount: 9.8, percentage: 1.3, yoy_change: 4.1 },
    ],
    2025: [
      { sector: '보건·복지·고용', amount: 250.3, percentage: 37.0, yoy_change: 4.2 },
      { sector: '일반·지방행정', amount: 115.1, percentage: 17.0, yoy_change: 3.8 },
      { sector: '교육', amount: 93.5, percentage: 13.8, yoy_change: 5.1 },
      { sector: '국방', amount: 63.4, percentage: 9.4, yoy_change: 4.7 },
      { sector: '산업·중소기업·에너지', amount: 34.3, percentage: 5.1, yoy_change: 3.5 },
      { sector: 'R&D', amount: 28.3, percentage: 4.2, yoy_change: -1.2 },
      { sector: '공공질서·안전', amount: 24.6, percentage: 3.6, yoy_change: 2.8 },
      { sector: 'SOC', amount: 25.6, percentage: 3.8, yoy_change: 8.5 },
      { sector: '농림·수산·식품', amount: 24.3, percentage: 3.6, yoy_change: 1.5 },
      { sector: '환경', amount: 12.5, percentage: 1.8, yoy_change: 3.2 },
      { sector: '문화·체육·관광', amount: 9.4, percentage: 1.4, yoy_change: 3.3 },
    ],
    2024: [
      { sector: '보건·복지·고용', amount: 240.3, percentage: 36.6, yoy_change: 2.8 },
      { sector: '일반·지방행정', amount: 110.9, percentage: 16.9, yoy_change: 4.1 },
      { sector: '교육', amount: 89.0, percentage: 13.5, yoy_change: 3.5 },
      { sector: '국방', amount: 60.5, percentage: 9.2, yoy_change: 4.2 },
      { sector: '산업·중소기업·에너지', amount: 33.1, percentage: 5.0, yoy_change: 2.1 },
      { sector: 'R&D', amount: 28.7, percentage: 4.4, yoy_change: -16.6 },
      { sector: '공공질서·안전', amount: 23.9, percentage: 3.6, yoy_change: 3.5 },
      { sector: 'SOC', amount: 23.6, percentage: 3.6, yoy_change: 6.2 },
      { sector: '농림·수산·식품', amount: 23.9, percentage: 3.6, yoy_change: 1.2 },
      { sector: '환경', amount: 12.1, percentage: 1.8, yoy_change: 2.5 },
      { sector: '문화·체육·관광', amount: 9.1, percentage: 1.4, yoy_change: 2.8 },
    ],
  };
  return data[year] || data[2026];
}

// ========================================
// Sankey 데이터
// ========================================

export function getSankeyData(year: number = 2026) {
  const sectors = getSectorData(year);
  const totalSpending = sectors.reduce((s, d) => s + d.amount, 0);
  const revenueNodes = [
    { name: '소득세', value: 115.2 },
    { name: '법인세', value: 80.3 },
    { name: '부가가치세', value: 82.1 },
    { name: '기타세입', value: 59.0 },
    { name: '국채', value: Math.max(0, totalSpending - 336.6) },
  ].filter(n => n.value > 0);

  const spendingNodes = sectors.map(s => ({ name: s.sector, value: s.amount }));
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
    suspicionScore: Math.max(5, Math.min(85, 15 + Math.floor(Math.sin(i * 2.7) * 30 + Math.cos(i * 1.3) * 20))),
    flagCount: Math.max(0, Math.floor(Math.sin(i * 3.1) * 8 + 5)),
    transparencyRank: i + 1,
  })).sort((a, b) => b.suspicionScore - a.suspicionScore);
}

export function getAuditFlags(): AuditFlag[] {
  return [
    { id: 'af-001', patternType: 'yearend_spike', severity: 'HIGH', suspicionScore: 72, targetType: 'department', targetId: '국토교통부', detail: { q4_ratio: 62.3, q4_total: 4500000000, yearly_total: 7222222222, year: 2025 }, evidence: { threshold: '40%', actual: '62.3%', description: '국토교통부의 2025년 Q4 지출이 연간의 62.3%를 차지합니다.' }, aiAnalysis: '국토교통부의 4분기 집중 지출 패턴이 감지되었습니다. 연간 예산의 62.3%가 10~12월에 집중 집행되었으며, 이는 예산 소진 압력에 의한 비효율적 집행 가능성을 시사합니다.', status: 'detected', createdAt: '2026-01-15' },
    { id: 'af-002', patternType: 'vendor_concentration', severity: 'HIGH', suspicionScore: 65, targetType: 'department', targetId: '국방부', detail: { vendor_name: '(주)한국방산기술', concentration_ratio: 42.8, contract_count: 15 }, evidence: { threshold: '30%', actual: '42.8%' }, aiAnalysis: '국방부 계약의 42.8%가 단일 업체에 집중되어 있습니다. 방산 분야의 특수성을 감안하더라도 경쟁 입찰 없는 수의계약 비율이 높아 주의가 필요합니다.', status: 'detected', createdAt: '2026-01-14' },
    { id: 'af-003', patternType: 'contract_splitting', severity: 'HIGH', suspicionScore: 58, targetType: 'department', targetId: '환경부', detail: { vendors: [{ vendor_name: '(주)그린솔루션', split_count: 5 }] }, evidence: { threshold: '수의계약 한도(2000만원)의 80-100% 범위 계약 3건 이상' }, aiAnalysis: '환경부에서 수의계약 한도(2,000만원) 직하 금액의 계약이 동일 업체로 5건 반복 발생했습니다. 입찰 회피를 위한 계약 분할 가능성이 있습니다.', status: 'detected', createdAt: '2026-01-13' },
    { id: 'af-004', patternType: 'yearend_spike', severity: 'MEDIUM', suspicionScore: 45, targetType: 'department', targetId: '교육부', detail: { q4_ratio: 48.2, year: 2025 }, evidence: { threshold: '40%', actual: '48.2%' }, aiAnalysis: '교육부의 4분기 지출 비중이 48.2%로 기준치를 초과했습니다. 연말 학교 시설 보수 계약이 집중된 것으로 보이나, 긴급성 대비 금액이 높습니다.', status: 'detected', createdAt: '2026-01-12' },
    { id: 'af-005', patternType: 'vendor_concentration', severity: 'MEDIUM', suspicionScore: 42, targetType: 'department', targetId: '과학기술정보통신부', detail: { vendor_name: '(주)IT컨설팅코리아', concentration_ratio: 35.1, contract_count: 8 }, evidence: { threshold: '30%', actual: '35.1%' }, aiAnalysis: 'IT 용역 계약에서 특정 업체 집중도가 35.1%로 나타났습니다. 기술 전문성 요구에 의한 것일 수 있으나, 다양한 업체 참여 기회가 제한된 것은 아닌지 확인이 필요합니다.', status: 'detected', createdAt: '2026-01-11' },
    { id: 'af-006', patternType: 'contract_splitting', severity: 'MEDIUM', suspicionScore: 38, targetType: 'department', targetId: '행정안전부', detail: { vendors: [{ vendor_name: '(주)디지털행정', split_count: 4 }] }, evidence: { threshold: '수의계약 한도(2000만원)의 80-100% 범위 계약 3건 이상' }, aiAnalysis: '행정안전부 전산 장비 구매에서 1,800~1,980만원 범위의 계약이 4건 발생했습니다. 수의계약 한도 직하 금액의 반복 패턴이 의심됩니다.', status: 'detected', createdAt: '2026-01-10' },
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
