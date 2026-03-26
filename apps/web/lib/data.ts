// 국정투명 -- 시드 데이터 로더
// MVP에서는 하드코딩된 시드 데이터를 사용합니다.
// 프로덕션에서는 API 클라이언트(api.ts)로 교체됩니다.

import type { President, FiscalYearly, FiscalBySector, AuditFlag, DepartmentScore, NationalAgenda, CampaignPledge, ReportCardMetric, KeyEvent } from './types';

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
      { id: 'mji-e1', event_date: '2017-05-10', title: '제19대 대통령 취임', description: '촛불혁명 이후 조기 대선으로 당선, 적폐청산과 국민통합 강조', impact_type: 'positive', significance_score: 90 },
      { id: 'mji-e2', event_date: '2018-04-27', title: '판문점 남북정상회담', description: '김정은 위원장과 판문점 선언 채택, 한반도 비핵화 합의', impact_type: 'positive', significance_score: 95 },
      { id: 'mji-e3', event_date: '2018-06-12', title: '싱가포르 북미정상회담 중재', description: '역사적 첫 북미정상회담 성사에 기여', impact_type: 'positive', significance_score: 88 },
      { id: 'mji-e4', event_date: '2018-09-19', title: '평양 남북정상회담', description: '9월 평양공동선언, 군사분야 합의서 채택', impact_type: 'positive', significance_score: 82 },
      { id: 'mji-e5', event_date: '2019-02-28', title: '하노이 북미정상회담 결렬', description: '비핵화 협상 교착, 한반도 평화 프로세스 동력 상실', impact_type: 'negative', significance_score: 85 },
      { id: 'mji-e6', event_date: '2019-08-22', title: '한일 GSOMIA 종료 결정', description: '일본 수출규제 보복에 대한 한일 군사정보보호협정 종료 통보 (이후 조건부 유지)', impact_type: 'neutral', significance_score: 70 },
      { id: 'mji-e7', event_date: '2020-01-20', title: '코로나19 첫 확진자 발생', description: '대한민국 코로나19 팬데믹 시작', impact_type: 'negative', significance_score: 95 },
      { id: 'mji-e8', event_date: '2020-04-15', title: '21대 총선 여당 압승', description: '더불어민주당 180석 확보, 역대 최다 의석 기록', impact_type: 'positive', significance_score: 80 },
      { id: 'mji-e9', event_date: '2020-07-10', title: '부동산 대책 25번째 발표', description: '잇따른 부동산 규제에도 주택가격 상승 지속, 정책 실효성 논란', impact_type: 'negative', significance_score: 78 },
      { id: 'mji-e10', event_date: '2021-03-24', title: 'LH 직원 투기 사건', description: '한국토지주택공사 직원들의 신도시 땅 투기 사건으로 공직자 윤리 논란', impact_type: 'negative', significance_score: 75 },
      { id: 'mji-e11', event_date: '2021-10-25', title: '코로나19 위드코로나 전환', description: '단계적 일상회복 이행, 이후 오미크론 변이로 다시 강화', impact_type: 'neutral', significance_score: 65 },
      { id: 'mji-e12', event_date: '2022-03-09', title: '제20대 대통령 선거', description: '윤석열 국민의힘 후보 당선, 여야 정권 교체', impact_type: 'neutral', significance_score: 85 },
    ],
    ysk: [
      { id: 'ysk-e1', event_date: '1993-02-25', title: '제14대 대통령 취임', description: '32년 만의 문민정부 출범', impact_type: 'positive', significance_score: 90 },
      { id: 'ysk-e2', event_date: '1993-08-12', title: '금융실명제 전격 실시', description: '대통령 긴급재정경제명령으로 금융실명제 즉시 시행', impact_type: 'positive', significance_score: 95 },
      { id: 'ysk-e3', event_date: '1995-06-29', title: '삼풍백화점 붕괴', description: '502명 사망, 역대 최대 건물 붕괴 참사', impact_type: 'negative', significance_score: 88 },
      { id: 'ysk-e4', event_date: '1996-12-12', title: 'OECD 가입', description: '경제협력개발기구 29번째 회원국 가입', impact_type: 'positive', significance_score: 82 },
      { id: 'ysk-e5', event_date: '1997-11-21', title: 'IMF 구제금융 신청', description: '외환보유고 고갈로 IMF에 구제금융 요청, 경제 주권 위기', impact_type: 'negative', significance_score: 98 },
    ],
    kdj: [
      { id: 'kdj-e1', event_date: '1998-02-25', title: 'IMF 외환위기 중 취임', description: '국가 부도 위기 속 경제 위기 극복 과제 부여', impact_type: 'negative', significance_score: 92 },
      { id: 'kdj-e2', event_date: '1998-06-15', title: '금 모으기 운동', description: '국민 자발적 금 모으기로 외환보유고 확충', impact_type: 'positive', significance_score: 80 },
      { id: 'kdj-e3', event_date: '2000-06-15', title: '제1차 남북정상회담', description: '분단 55년 만에 첫 남북정상회담, 6.15 공동선언', impact_type: 'positive', significance_score: 98 },
      { id: 'kdj-e4', event_date: '2000-12-10', title: '노벨평화상 수상', description: '한국 최초 노벨상, 남북 화해에 기여한 공로', impact_type: 'positive', significance_score: 95 },
      { id: 'kdj-e5', event_date: '2001-08-23', title: 'IMF 조기 졸업 선언', description: '예정보다 3년 일찍 IMF 자금 전액 상환', impact_type: 'positive', significance_score: 90 },
    ],
    nmh: [
      { id: 'nmh-e1', event_date: '2003-02-25', title: '제16대 대통령 취임', description: '참여정부 출범, 분권과 자율 강조', impact_type: 'positive', significance_score: 80 },
      { id: 'nmh-e2', event_date: '2004-03-12', title: '국회 탄핵 소추', description: '야당 주도 탄핵 소추안 가결', impact_type: 'negative', significance_score: 90 },
      { id: 'nmh-e3', event_date: '2004-05-14', title: '헌법재판소 탄핵 기각', description: '탄핵 심판 인용 기각, 대통령직 복귀', impact_type: 'positive', significance_score: 88 },
      { id: 'nmh-e4', event_date: '2006-04-01', title: '한미 FTA 협상 개시', description: '한미 자유무역협정 공식 협상 개시', impact_type: 'neutral', significance_score: 78 },
      { id: 'nmh-e5', event_date: '2007-10-04', title: '제2차 남북정상회담', description: '10.4 남북공동선언, 경제협력 합의', impact_type: 'positive', significance_score: 85 },
    ],
    lmb: [
      { id: 'lmb-e1', event_date: '2008-02-25', title: '제17대 대통령 취임', description: '실용정부 표방, 경제 살리기 강조', impact_type: 'positive', significance_score: 78 },
      { id: 'lmb-e2', event_date: '2008-06-10', title: '미국산 쇠고기 수입 촛불시위', description: '광우병 우려로 대규모 촛불집회, 100만 시위대', impact_type: 'negative', significance_score: 85 },
      { id: 'lmb-e3', event_date: '2008-09-15', title: '리먼 브라더스 파산', description: '글로벌 금융위기 발생, 한국 경제에 직격탄', impact_type: 'negative', significance_score: 90 },
      { id: 'lmb-e4', event_date: '2009-01-20', title: '4대강 정비사업 발표', description: '22조원 규모 4대강 사업 발표, 환경 논란', impact_type: 'neutral', significance_score: 82 },
      { id: 'lmb-e5', event_date: '2010-11-12', title: 'G20 서울 정상회의', description: '한국 첫 G20 의장국, 국제적 위상 강화', impact_type: 'positive', significance_score: 88 },
    ],
    pgh: [
      { id: 'pgh-e1', event_date: '2013-02-25', title: '제18대 대통령 취임', description: '최초의 여성 대통령, 경제민주화와 창조경제 표방', impact_type: 'positive', significance_score: 85 },
      { id: 'pgh-e2', event_date: '2014-04-16', title: '세월호 참사', description: '304명 사망, 대한민국 역대 최악의 해양 참사', impact_type: 'negative', significance_score: 98 },
      { id: 'pgh-e3', event_date: '2015-06-09', title: 'MERS 사태', description: '중동호흡기증후군 확산, 38명 사망, 방역 체계 논란', impact_type: 'negative', significance_score: 75 },
      { id: 'pgh-e4', event_date: '2016-10-24', title: '최순실 국정농단 보도', description: 'JTBC 태블릿PC 보도로 국정농단 실체 드러남', impact_type: 'negative', significance_score: 95 },
      { id: 'pgh-e5', event_date: '2017-03-10', title: '헌재 탄핵 인용, 파면', description: '헌법재판소 만장일치 파면 결정', impact_type: 'negative', significance_score: 98 },
    ],
    ysy: [
      { id: 'ysy-e1', event_date: '2022-05-10', title: '제20대 대통령 취임', description: '검찰총장 출신 대통령, 법치와 자유 강조', impact_type: 'positive', significance_score: 78 },
      { id: 'ysy-e2', event_date: '2022-10-29', title: '이태원 참사', description: '159명 사망, 핼러윈 압사 사고', impact_type: 'negative', significance_score: 95 },
      { id: 'ysy-e3', event_date: '2023-03-16', title: '한일 정상회담', description: '12년 만의 한일 셔틀외교 재개, 강제징용 해법 논란', impact_type: 'neutral', significance_score: 78 },
      { id: 'ysy-e4', event_date: '2024-04-10', title: '22대 총선 야당 압승', description: '야당 192석 확보, 역대 최대 의석차로 여소야대', impact_type: 'negative', significance_score: 85 },
      { id: 'ysy-e5', event_date: '2024-12-03', title: '비상계엄 선포', description: '야당을 내란세력으로 규정, 12월 3일 밤 비상계엄 선포 후 6시간 만에 해제', impact_type: 'negative', significance_score: 99 },
      { id: 'ysy-e6', event_date: '2024-12-14', title: '국회 탄핵 소추안 가결', description: '국회 본회의 204:85로 탄핵 소추안 가결', impact_type: 'negative', significance_score: 95 },
      { id: 'ysy-e7', event_date: '2025-04-04', title: '헌재 탄핵 인용, 파면', description: '헌법재판소 탄핵 인용 결정, 대통령직 파면', impact_type: 'negative', significance_score: 98 },
    ],
    ljm: [
      { id: 'ljm-e1', event_date: '2025-06-04', title: '제21대 대통령 취임', description: '조기 대선 당선, 경제회복과 민생안정 과제', impact_type: 'positive', significance_score: 85 },
      { id: 'ljm-e2', event_date: '2025-07-15', title: '긴급 민생안정 대책 발표', description: '물가안정, 소상공인 지원 등 긴급 경제 대책 발표', impact_type: 'positive', significance_score: 70 },
      { id: 'ljm-e3', event_date: '2025-09-01', title: '디지털 정부 혁신 로드맵', description: 'AI 기반 공공서비스 혁신 계획 발표', impact_type: 'positive', significance_score: 65 },
      { id: 'ljm-e4', event_date: '2025-11-20', title: '한중 정상회담', description: '취임 후 첫 한중 정상회담 개최', impact_type: 'neutral', significance_score: 72 },
      { id: 'ljm-e5', event_date: '2026-01-15', title: '2026 예산안 국회 통과', description: '728조 규모 역대 최대 예산안 국회 의결', impact_type: 'positive', significance_score: 75 },
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
      { id: 'mji-p1', president_id: 'mji', pledge_text: '최저임금 1만원 달성', category: '경제', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 45, outcome_summary: '2022년 최저임금 9,160원으로 목표 미달성', budget_impact: '연간 사업주 부담 약 3조원 증가', related_bills: ['최저임금법 개정안'] },
      { id: 'mji-p2', president_id: 'mji', pledge_text: '공공부문 일자리 81만개 창출', category: '일자리', pledge_source: '제19대 대선공약집', fulfillment_status: '일부이행', fulfillment_pct: 60, outcome_summary: '공공부문 약 50만개 일자리 창출, 단기 일자리 비중 높아 질적 한계', budget_impact: '5년간 약 10조원 투입', related_bills: ['공공기관 채용확대 특별법'] },
      { id: 'mji-p3', president_id: 'mji', pledge_text: '건강보험 보장률 70% 달성 (문재인케어)', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '일부이행', fulfillment_pct: 65, outcome_summary: '2021년 기준 보장률 64.5%, 목표 70%에 미달', budget_impact: '5년간 건보 지출 약 30조원 증가', related_bills: ['국민건강보험법 개정안'] },
      { id: 'mji-p4', president_id: 'mji', pledge_text: '한반도 비핵화와 평화체제 구축', category: '외교', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 30, outcome_summary: '3차례 남북정상회담 성사했으나 비핵화 합의 미이행', budget_impact: '-' },
      { id: 'mji-p5', president_id: 'mji', pledge_text: '수사권·기소권 분리 (검찰개혁)', category: '사법', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '고위공직자범죄수사처(공수처) 설치, 검경 수사권 조정 완료', budget_impact: '연간 약 300억원', related_bills: ['고위공직자범죄수사처 설치법', '형사소송법 개정안'] },
      { id: 'mji-p6', president_id: 'mji', pledge_text: '탈원전 에너지 전환', category: '에너지', pledge_source: '제19대 대선공약집', fulfillment_status: '일부이행', fulfillment_pct: 50, outcome_summary: '신규 원전 건설 중단, 재생에너지 비중 확대했으나 목표 미달', budget_impact: '재생에너지 투자 약 12조원' },
      { id: 'mji-p7', president_id: 'mji', pledge_text: '주 52시간 근무제 정착', category: '노동', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '근로기준법 개정으로 주 52시간 상한제 시행', budget_impact: '-', related_bills: ['근로기준법 개정안'] },
      { id: 'mji-p8', president_id: 'mji', pledge_text: '유치원·어린이집 국공립 비율 40%', category: '교육', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 35, outcome_summary: '국공립 비율 30% 수준으로 목표 미달', budget_impact: '5년간 약 2조원 투입' },
      { id: 'mji-p9', president_id: 'mji', pledge_text: '국민연금 소득대체율 50%로 인상', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 10, outcome_summary: '국민연금 개혁 논의 시작했으나 법안 통과 실패', budget_impact: '-', related_bills: ['국민연금법 개정안 (미통과)'] },
      { id: 'mji-p10', president_id: 'mji', pledge_text: '아동수당 도입', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '2018년 아동수당 월 10만원 도입, 이후 대상 확대', budget_impact: '연간 약 2조원', related_bills: ['아동수당법'] },
      { id: 'mji-p11', president_id: 'mji', pledge_text: '국가 치매 책임제', category: '복지', pledge_source: '제19대 대선공약집', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: '치매안심센터 전국 256개소 설치, 치매 국가 책임제 시행', budget_impact: '연간 약 1.5조원' },
      { id: 'mji-p12', president_id: 'mji', pledge_text: '부동산 투기 근절', category: '부동산', pledge_source: '제19대 대선공약집', fulfillment_status: '미이행', fulfillment_pct: 15, outcome_summary: '25차례 부동산 대책에도 서울 아파트 가격 80% 이상 상승', budget_impact: '-', related_bills: ['부동산거래신고법', '종합부동산세법 개정안'] },
    ],
    ysk: [
      { id: 'ysk-p1', president_id: 'ysk', pledge_text: '금융실명제 도입', category: '경제', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 100, outcome_summary: '1993년 전격 시행, 금융 투명성의 기틀 마련' },
      { id: 'ysk-p2', president_id: 'ysk', pledge_text: '지방자치제 부활', category: '행정', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '1995년 지방선거 실시로 30년 만에 지방자치 부활' },
      { id: 'ysk-p3', president_id: 'ysk', pledge_text: 'OECD 가입', category: '외교', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '1996년 29번째 OECD 회원국으로 가입' },
      { id: 'ysk-p4', president_id: 'ysk', pledge_text: '역사바로세우기', category: '정치', pledge_source: '제14대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: '전두환·노태우 전 대통령 구속 및 재판' },
      { id: 'ysk-p5', president_id: 'ysk', pledge_text: '경제 세계화·개방화', category: '경제', pledge_source: '제14대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 55, outcome_summary: '급격한 개방으로 외환위기 촉발, 양면적 결과' },
    ],
    kdj: [
      { id: 'kdj-p1', president_id: 'kdj', pledge_text: 'IMF 외환위기 극복', category: '경제', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '예정보다 3년 앞서 IMF 차관 전액 상환' },
      { id: 'kdj-p2', president_id: 'kdj', pledge_text: '남북 화해·협력', category: '외교', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '2000년 역사적 남북정상회담, 금강산 관광, 개성공단 추진' },
      { id: 'kdj-p3', president_id: 'kdj', pledge_text: 'IT 산업 육성', category: '산업', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 95, outcome_summary: '초고속인터넷 보급 세계 1위, 벤처 붐 조성' },
      { id: 'kdj-p4', president_id: 'kdj', pledge_text: '국민기초생활보장제 도입', category: '복지', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '1999년 국민기초생활보장법 제정, 최저생활 보장 체계 구축' },
      { id: 'kdj-p5', president_id: 'kdj', pledge_text: '기업 구조조정', category: '경제', pledge_source: '제15대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: '재벌 구조개혁, 빅딜 추진, 대우그룹 해체' },
    ],
    nmh: [
      { id: 'nmh-p1', president_id: 'nmh', pledge_text: '행정수도 이전', category: '행정', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 50, outcome_summary: '헌재 위헌 결정으로 행정중심복합도시로 수정 추진' },
      { id: 'nmh-p2', president_id: 'nmh', pledge_text: '국가균형발전', category: '행정', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 60, outcome_summary: '혁신도시, 기업도시 추진으로 지방 발전 기틀 마련' },
      { id: 'nmh-p3', president_id: 'nmh', pledge_text: '한미 FTA 체결', category: '경제', pledge_source: '제16대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '2007년 한미 FTA 협상 타결 (발효는 이명박 정부)' },
      { id: 'nmh-p4', president_id: 'nmh', pledge_text: '부동산 투기 억제', category: '부동산', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 40, outcome_summary: '종합부동산세 도입 등 규제 강화했으나 효과 제한적' },
      { id: 'nmh-p5', president_id: 'nmh', pledge_text: '권력기관 개혁', category: '정치', pledge_source: '제16대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 45, outcome_summary: '국정원 개혁, 검찰 중립성 강화 시도했으나 한계' },
    ],
    lmb: [
      { id: 'lmb-p1', president_id: 'lmb', pledge_text: '747 공약 (7% 성장, 4만불, 7대 강국)', category: '경제', pledge_source: '제17대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 20, outcome_summary: '글로벌 금융위기로 성장률 평균 3.2%, 목표 전면 미달' },
      { id: 'lmb-p2', president_id: 'lmb', pledge_text: '4대강 살리기 사업', category: '환경', pledge_source: '제17대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 90, outcome_summary: '22조원 투입, 사업 완료했으나 환경 파괴 논란 지속' },
      { id: 'lmb-p3', president_id: 'lmb', pledge_text: '글로벌 금융위기 극복', category: '경제', pledge_source: '대통령 국정과제', fulfillment_status: '이행완료', fulfillment_pct: 80, outcome_summary: 'OECD 중 빠른 회복세, 2010년 G20 의장국 역할' },
      { id: 'lmb-p4', president_id: 'lmb', pledge_text: '녹색성장', category: '환경', pledge_source: '제17대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 50, outcome_summary: '녹색성장위원회 설치, 그린뉴딜 추진했으나 실효성 논란' },
      { id: 'lmb-p5', president_id: 'lmb', pledge_text: '한반도 대운하 건설', category: '사회간접자본', pledge_source: '제17대 대선공약', fulfillment_status: '폐기', fulfillment_pct: 0, outcome_summary: '국민 반대로 사업 폐기, 4대강 사업으로 전환' },
    ],
    pgh: [
      { id: 'pgh-p1', president_id: 'pgh', pledge_text: '창조경제 실현', category: '경제', pledge_source: '제18대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 25, outcome_summary: '창조경제혁신센터 설치했으나 구체적 성과 미흡' },
      { id: 'pgh-p2', president_id: 'pgh', pledge_text: '경제민주화', category: '경제', pledge_source: '제18대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 20, outcome_summary: '재벌 개혁 관련 법안 대부분 무산' },
      { id: 'pgh-p3', president_id: 'pgh', pledge_text: '4대 사회악 근절', category: '사회', pledge_source: '제18대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 40, outcome_summary: '성폭력, 학교폭력, 가정폭력, 불량식품 대응 강화' },
      { id: 'pgh-p4', president_id: 'pgh', pledge_text: '무상보육 실현', category: '복지', pledge_source: '제18대 대선공약', fulfillment_status: '이행완료', fulfillment_pct: 85, outcome_summary: '누리과정 도입으로 무상보육 실현' },
      { id: 'pgh-p5', president_id: 'pgh', pledge_text: '통일 준비', category: '외교', pledge_source: '제18대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 15, outcome_summary: '한반도 신뢰프로세스 추진했으나 남북관계 경색' },
    ],
    ysy: [
      { id: 'ysy-p1', president_id: 'ysy', pledge_text: '검찰 독립성 회복', category: '사법', pledge_source: '제20대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 40, outcome_summary: '공수처 기능 축소 시도, 검찰 수사권 강화', budget_impact: '-' },
      { id: 'ysy-p2', president_id: 'ysy', pledge_text: '원전 산업 정상화', category: '에너지', pledge_source: '제20대 대선공약', fulfillment_status: '일부이행', fulfillment_pct: 55, outcome_summary: '신한울 3·4호기 건설 재개, 원전 수출 추진', budget_impact: '약 8조원 투입 계획' },
      { id: 'ysy-p3', president_id: 'ysy', pledge_text: '250만호 주택 공급', category: '부동산', pledge_source: '제20대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 30, outcome_summary: '공급 목표 대비 실적 부진, 건설 경기 침체', budget_impact: '-' },
      { id: 'ysy-p4', president_id: 'ysy', pledge_text: '반도체 초강대국 도약', category: '산업', pledge_source: '제20대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 45, outcome_summary: '반도체 특별법 제정, 용인 클러스터 추진', budget_impact: '10년간 300조 민간투자 유도' },
      { id: 'ysy-p5', president_id: 'ysy', pledge_text: '교육 대개혁', category: '교육', pledge_source: '제20대 대선공약', fulfillment_status: '미이행', fulfillment_pct: 15, outcome_summary: '교육부 폐지 등 대선 공약 대부분 미추진' },
    ],
    ljm: [
      { id: 'ljm-p1', president_id: 'ljm', pledge_text: '기본소득 기반 복지 확대', category: '복지', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 20, outcome_summary: '기본소득 시범사업 설계 단계', budget_impact: '연간 약 15조원 예상' },
      { id: 'ljm-p2', president_id: 'ljm', pledge_text: '디지털 정부 혁신', category: '행정', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 25, outcome_summary: 'AI 행정서비스 기본계획 수립 중' },
      { id: 'ljm-p3', president_id: 'ljm', pledge_text: '경제민주화 2.0', category: '경제', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 15, outcome_summary: '공정경제 관련 법안 국회 발의 예정' },
      { id: 'ljm-p4', president_id: 'ljm', pledge_text: '기후위기 대응 강화', category: '환경', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 10, outcome_summary: '2050 탄소중립 로드맵 재수립 착수' },
      { id: 'ljm-p5', president_id: 'ljm', pledge_text: '주거안정 대책', category: '부동산', pledge_source: '제21대 대선공약', fulfillment_status: '추진중', fulfillment_pct: 15, outcome_summary: '공공주택 공급 확대 계획 수립 중' },
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
      { id: 'mji-a1', president_id: 'mji', agenda_number: 1, goal_category: '국민이 주인인 정부', title: '적폐의 철저한 청산', implementation_status: '이행완료', completion_rate: 85, budget_committed: 500, budget_executed: 480, description: '권력기관 적폐 청산 및 국정농단 진상규명', target_metric: '적폐 청산 과제', target_value: '100건', actual_value: '85건', ai_assessment: '국정농단 수사 완료, 일부 과제는 정치적 논란 속에 완결' },
      { id: 'mji-a2', president_id: 'mji', agenda_number: 2, goal_category: '국민이 주인인 정부', title: '반부패 개혁으로 청렴한 대한민국', implementation_status: '일부이행', completion_rate: 65, budget_committed: 1200, budget_executed: 980, description: '공수처 설치, 이해충돌방지법 등 반부패 제도 구축', target_metric: '반부패 법안 통과', target_value: '15건', actual_value: '10건', ai_assessment: '공수처 설치는 달성했으나 실효성 논란 지속' },
      { id: 'mji-a3', president_id: 'mji', agenda_number: 5, goal_category: '더불어 잘사는 경제', title: '소득 주도 성장을 위한 일자리 경제', implementation_status: '미이행', completion_rate: 35, budget_committed: 50000, budget_executed: 42000, description: '최저임금 인상, 공공일자리 확대 등 소득주도성장 정책', target_metric: '고용률', target_value: '70%', actual_value: '66.5%', ai_assessment: '최저임금 급격 인상의 부작용으로 자영업 타격, 고용의 질 개선은 미흡' },
      { id: 'mji-a4', president_id: 'mji', agenda_number: 8, goal_category: '더불어 잘사는 경제', title: '혁신 창업 국가 조성', implementation_status: '일부이행', completion_rate: 60, budget_committed: 15000, budget_executed: 13500, description: '벤처·스타트업 생태계 강화, 규제 샌드박스 도입', target_metric: '벤처 투자액', target_value: '10조원', actual_value: '7.7조원', ai_assessment: '벤처 생태계 성장했으나 글로벌 경쟁력 확보에는 한계' },
      { id: 'mji-a5', president_id: 'mji', agenda_number: 12, goal_category: '내 삶을 책임지는 국가', title: '국민의 기본생활을 보장하는 맞춤형 사회보장', implementation_status: '이행완료', completion_rate: 80, budget_committed: 80000, budget_executed: 78000, description: '아동수당, 기초연금 인상, 건강보험 보장성 강화', target_metric: '건보 보장률', target_value: '70%', actual_value: '64.5%', ai_assessment: '사회보장 지출 대폭 확대, 지속가능성 우려도 제기됨' },
      { id: 'mji-a6', president_id: 'mji', agenda_number: 15, goal_category: '내 삶을 책임지는 국가', title: '서민이 안심하는 주거환경 조성', implementation_status: '미이행', completion_rate: 20, budget_committed: 30000, budget_executed: 25000, description: '부동산 투기 억제, 공공임대주택 확대', target_metric: '서울 집값 안정', target_value: '안정', actual_value: '80% 상승', ai_assessment: '25차례 부동산 대책에도 불구하고 집값 폭등, 핵심 실패 과제로 평가' },
      { id: 'mji-a7', president_id: 'mji', agenda_number: 20, goal_category: '고르게 발전하는 지역', title: '지역 주도 균형발전', implementation_status: '일부이행', completion_rate: 55, budget_committed: 20000, budget_executed: 17500, description: '균형발전특별법 전면 개정, 지방분권 강화', target_metric: '수도권-비수도권 격차', target_value: '감소', actual_value: '정체', ai_assessment: '제도적 기반 마련에는 성공했으나 체감 수준의 균형발전에는 미흡' },
      { id: 'mji-a8', president_id: 'mji', agenda_number: 35, goal_category: '평화와 번영의 한반도', title: '남북 간 화해·협력 추진', implementation_status: '일부이행', completion_rate: 45, budget_committed: 5000, budget_executed: 3200, description: '남북정상회담, 판문점 선언 등 대화 재개', target_metric: '남북 교류 건수', target_value: '100건', actual_value: '45건', ai_assessment: '역사적 정상회담 성과 있으나 이후 북핵 문제 교착으로 동력 상실' },
      { id: 'mji-a9', president_id: 'mji', agenda_number: 42, goal_category: '평화와 번영의 한반도', title: '국제협력 주도적 참여', implementation_status: '이행완료', completion_rate: 75, budget_committed: 8000, budget_executed: 7200, description: '신남방·신북방 정책 추진, 다자외교 강화', target_metric: '정상외교 횟수', target_value: '50회', actual_value: '48회', ai_assessment: '아세안·인도 관계 강화 성과, 신북방 정책은 러시아 제재로 제한적' },
      { id: 'mji-a10', president_id: 'mji', agenda_number: 50, goal_category: '내 삶을 책임지는 국가', title: '미세먼지·기후변화 대응', implementation_status: '일부이행', completion_rate: 55, budget_committed: 10000, budget_executed: 8500, description: '미세먼지 특별법 제정, 석탄발전소 가동 중단', target_metric: '초미세먼지 농도', target_value: '20㎍/㎥', actual_value: '23㎍/㎥', ai_assessment: '미세먼지 농도 일부 개선됐으나 기후위기 대응은 선언적 수준에 그침' },
    ],
    ysk: [
      { id: 'ysk-a1', president_id: 'ysk', agenda_number: 1, goal_category: '정치개혁', title: '금융실명제 시행', implementation_status: '이행완료', completion_rate: 100, description: '비실명 금융거래 금지로 금융 투명성 확보', ai_assessment: '한국 경제 투명성의 획기적 전환점' },
      { id: 'ysk-a2', president_id: 'ysk', agenda_number: 2, goal_category: '정치개혁', title: '지방자치 부활', implementation_status: '이행완료', completion_rate: 90, description: '30년 만에 지방자치선거 실시', ai_assessment: '풀뿌리 민주주의 기틀 마련' },
      { id: 'ysk-a3', president_id: 'ysk', agenda_number: 3, goal_category: '경제개방', title: 'OECD 가입 추진', implementation_status: '이행완료', completion_rate: 95, description: '선진국 클럽 가입으로 경제 위상 제고', ai_assessment: '급격한 개방의 양면성 존재' },
      { id: 'ysk-a4', president_id: 'ysk', agenda_number: 4, goal_category: '정치개혁', title: '역사바로세우기 운동', implementation_status: '이행완료', completion_rate: 80, description: '12.12 및 5.18 관련 전두환·노태우 재판', ai_assessment: '과거 청산의 상징적 성과, 사회적 통합에는 한계' },
      { id: 'ysk-a5', president_id: 'ysk', agenda_number: 5, goal_category: '경제개방', title: '세계화 추진', implementation_status: '일부이행', completion_rate: 50, description: '급격한 자본시장 개방과 세계화 추진', ai_assessment: '외환위기의 원인 중 하나로 평가되는 성급한 개방' },
    ],
    kdj: [
      { id: 'kdj-a1', president_id: 'kdj', agenda_number: 1, goal_category: '경제위기 극복', title: 'IMF 외환위기 극복', implementation_status: '이행완료', completion_rate: 95, budget_committed: 195000, budget_executed: 195000, description: 'IMF 차관 조기 상환 및 경제 구조조정', ai_assessment: '세계적으로 유례없는 빠른 위기 극복' },
      { id: 'kdj-a2', president_id: 'kdj', agenda_number: 2, goal_category: '민주주의 발전', title: '남북 화해·협력', implementation_status: '이행완료', completion_rate: 85, description: '최초 남북정상회담, 햇볕정책 추진', ai_assessment: '노벨평화상 수상으로 국제적 인정' },
      { id: 'kdj-a3', president_id: 'kdj', agenda_number: 3, goal_category: '경제위기 극복', title: 'IT 강국 건설', implementation_status: '이행완료', completion_rate: 95, budget_committed: 30000, budget_executed: 28000, description: '초고속인터넷 인프라, 벤처 육성', ai_assessment: '한국 IT 산업의 황금기를 열었다는 평가' },
      { id: 'kdj-a4', president_id: 'kdj', agenda_number: 4, goal_category: '민주주의 발전', title: '국민기초생활보장', implementation_status: '이행완료', completion_rate: 90, description: '복지 사각지대 해소를 위한 기초생활보장제 도입', ai_assessment: '한국 복지국가의 출발점' },
      { id: 'kdj-a5', president_id: 'kdj', agenda_number: 5, goal_category: '경제위기 극복', title: '재벌 구조개혁', implementation_status: '이행완료', completion_rate: 75, description: '빅딜, 워크아웃 등 기업 구조조정', ai_assessment: '재벌 체제의 투명성 개선에 기여했으나 근본적 개혁에는 한계' },
    ],
    nmh: [
      { id: 'nmh-a1', president_id: 'nmh', agenda_number: 1, goal_category: '참여민주주의', title: '행정수도 이전', implementation_status: '일부이행', completion_rate: 50, budget_committed: 45000, budget_executed: 20000, description: '행정수도 세종시 이전 추진', ai_assessment: '헌재 위헌 결정으로 축소됐으나 세종시의 토대 마련' },
      { id: 'nmh-a2', president_id: 'nmh', agenda_number: 2, goal_category: '균형발전', title: '국가균형발전', implementation_status: '일부이행', completion_rate: 60, budget_committed: 35000, budget_executed: 28000, description: '혁신도시, 기업도시 건설', ai_assessment: '지방 분산의 제도적 기반 마련에 기여' },
      { id: 'nmh-a3', president_id: 'nmh', agenda_number: 3, goal_category: '경제성장', title: '한미 FTA 추진', implementation_status: '이행완료', completion_rate: 85, description: '한미 자유무역협정 협상 타결', ai_assessment: '한국 통상정책의 전환점, 발효는 후임 정부에서 이루어짐' },
      { id: 'nmh-a4', president_id: 'nmh', agenda_number: 4, goal_category: '참여민주주의', title: '권력기관 개혁', implementation_status: '일부이행', completion_rate: 45, description: '국정원, 검찰, 경찰 개혁 추진', ai_assessment: '제도적 개선 시도했으나 완성도는 부족' },
      { id: 'nmh-a5', president_id: 'nmh', agenda_number: 5, goal_category: '경제성장', title: '부동산 안정화', implementation_status: '미이행', completion_rate: 30, description: '종합부동산세 도입 등 부동산 규제 강화', ai_assessment: '강력한 규제에도 집값 상승 억제에 한계' },
    ],
    lmb: [
      { id: 'lmb-a1', president_id: 'lmb', agenda_number: 1, goal_category: '경제성장', title: '747 경제성장 계획', implementation_status: '미이행', completion_rate: 20, description: '연 7% 성장, 1인당 국민소득 4만 달러, 세계 7대 경제강국', ai_assessment: '글로벌 금융위기로 목표 전면 미달' },
      { id: 'lmb-a2', president_id: 'lmb', agenda_number: 2, goal_category: '녹색성장', title: '4대강 살리기', implementation_status: '이행완료', completion_rate: 90, budget_committed: 22000, budget_executed: 22000, description: '4대강 정비 사업 추진', ai_assessment: '환경 파괴 논란과 비용 대비 효과에 대한 비판이 큼' },
      { id: 'lmb-a3', president_id: 'lmb', agenda_number: 3, goal_category: '경제성장', title: '글로벌 금융위기 대응', implementation_status: '이행완료', completion_rate: 80, budget_committed: 50000, budget_executed: 45000, description: '경기부양 패키지, G20 의장국 역할', ai_assessment: 'OECD 중 가장 빠른 경기 회복 달성' },
      { id: 'lmb-a4', president_id: 'lmb', agenda_number: 4, goal_category: '녹색성장', title: '저탄소 녹색성장', implementation_status: '일부이행', completion_rate: 50, description: '녹색성장기본법 제정, 녹색기술 육성', ai_assessment: '선언적 수준에 그친 측면이 강함' },
      { id: 'lmb-a5', president_id: 'lmb', agenda_number: 5, goal_category: '사회안전', title: '한반도 대운하', implementation_status: '폐기', completion_rate: 0, description: '한반도 대운하 건설 계획', ai_assessment: '국민 반대로 사업 전면 백지화' },
    ],
    pgh: [
      { id: 'pgh-a1', president_id: 'pgh', agenda_number: 1, goal_category: '경제혁신', title: '창조경제', implementation_status: '미이행', completion_rate: 25, budget_committed: 15000, budget_executed: 8000, description: '창조경제혁신센터 설치, 창업 생태계 조성', ai_assessment: '개념 자체가 모호하다는 비판, 구체적 성과 부족' },
      { id: 'pgh-a2', president_id: 'pgh', agenda_number: 2, goal_category: '경제민주화', title: '경제민주화 실현', implementation_status: '미이행', completion_rate: 20, description: '재벌 구조 개선, 공정거래 강화', ai_assessment: '대선 핵심 공약이었으나 취임 후 사실상 후퇴' },
      { id: 'pgh-a3', president_id: 'pgh', agenda_number: 3, goal_category: '사회안전', title: '4대 사회악 근절', implementation_status: '일부이행', completion_rate: 40, description: '성폭력, 학교폭력, 가정폭력, 불량식품 근절', ai_assessment: '초기 집중 후 세월호 사태로 동력 상실' },
      { id: 'pgh-a4', president_id: 'pgh', agenda_number: 4, goal_category: '복지확대', title: '누리과정 정상화', implementation_status: '이행완료', completion_rate: 85, budget_committed: 25000, budget_executed: 23000, description: '무상보육·교육 확대', ai_assessment: '재원 분담 논란에도 무상보육 제도 정착' },
      { id: 'pgh-a5', president_id: 'pgh', agenda_number: 5, goal_category: '통일외교', title: '한반도 신뢰프로세스', implementation_status: '미이행', completion_rate: 15, description: '남북 신뢰 구축을 통한 통일 준비', ai_assessment: '북핵 도발 지속으로 사실상 작동 불능' },
    ],
    ysy: [
      { id: 'ysy-a1', president_id: 'ysy', agenda_number: 1, goal_category: '법치주의', title: '검찰 독립성 회복', implementation_status: '일부이행', completion_rate: 40, description: '검찰 수사권 환원, 공수처 기능 조정', ai_assessment: '정치적 논란 속에 추진, 비상계엄으로 중단' },
      { id: 'ysy-a2', president_id: 'ysy', agenda_number: 2, goal_category: '경제성장', title: '원전 산업 정상화', implementation_status: '일부이행', completion_rate: 55, budget_committed: 80000, budget_executed: 30000, description: '신한울 3·4호기 건설 재개, 원전 수출', ai_assessment: '에너지 정책 전환을 시도했으나 임기 단축으로 미완' },
      { id: 'ysy-a3', president_id: 'ysy', agenda_number: 3, goal_category: '경제성장', title: '반도체 초강대국', implementation_status: '추진중', completion_rate: 45, budget_committed: 30000, budget_executed: 12000, description: '반도체 특별법, 용인 클러스터 조성', ai_assessment: '장기 과제로 초기 단계에서 정권 교체' },
      { id: 'ysy-a4', president_id: 'ysy', agenda_number: 4, goal_category: '부동산', title: '250만호 주택 공급', implementation_status: '미이행', completion_rate: 30, budget_committed: 50000, budget_executed: 15000, description: '대규모 주택 공급 계획', ai_assessment: '건설 경기 침체로 공급 부족 지속' },
      { id: 'ysy-a5', president_id: 'ysy', agenda_number: 5, goal_category: '외교안보', title: '한미동맹 강화', implementation_status: '이행완료', completion_rate: 75, description: '한미 정상회담, 캠프데이비드 한미일 정상회의', ai_assessment: '한미동맹 격상에 성과, 대중·대러 관계 악화 우려' },
    ],
    ljm: [
      { id: 'ljm-a1', president_id: 'ljm', agenda_number: 1, goal_category: '경제회복', title: '민생경제 안정', implementation_status: '추진중', completion_rate: 20, budget_committed: 50000, budget_executed: 10000, description: '물가안정, 소상공인 지원, 일자리 창출', ai_assessment: '취임 초기로 성과 판단 시기상조' },
      { id: 'ljm-a2', president_id: 'ljm', agenda_number: 2, goal_category: '디지털혁신', title: 'AI 기반 디지털 정부', implementation_status: '추진중', completion_rate: 15, budget_committed: 20000, budget_executed: 3000, description: 'AI 행정서비스, 디지털 원패스 등', ai_assessment: '야심찬 계획이나 실행은 초기 단계' },
      { id: 'ljm-a3', president_id: 'ljm', agenda_number: 3, goal_category: '복지확대', title: '기본소득 시범 도입', implementation_status: '추진중', completion_rate: 10, budget_committed: 150000, description: '단계적 기본소득 도입 추진', ai_assessment: '재원 확보 방안이 관건' },
      { id: 'ljm-a4', president_id: 'ljm', agenda_number: 4, goal_category: '외교안보', title: '균형외교 복원', implementation_status: '추진중', completion_rate: 15, description: '한미동맹 유지하며 한중 관계 정상화', ai_assessment: '미중 사이 균형외교의 성공 여부 주목' },
      { id: 'ljm-a5', president_id: 'ljm', agenda_number: 5, goal_category: '환경에너지', title: '탄소중립 가속화', implementation_status: '추진중', completion_rate: 10, budget_committed: 30000, budget_executed: 2000, description: '2050 탄소중립 로드맵 재수립', ai_assessment: '에너지 전환 정책의 구체성이 필요' },
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
