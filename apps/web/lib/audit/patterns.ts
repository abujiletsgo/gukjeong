// 국정투명 -- 계약 감사 패턴 탐지 알고리즘
// 나라장터(G2B) 계약 데이터를 분석하여 의심 패턴을 탐지합니다.
//
// 5가지 패턴:
//   1. 연말 급증 (Year-end Spike)        -- 4분기 예산 소진 밀어내기
//   2. 업체 집중 (Vendor Concentration)   -- 특정 업체 과도한 점유
//   3. 계약 분할 (Contract Splitting)     -- 수의계약 한도 회피
//   4. 반복 수의계약 (Repeated Sole-Source) -- 경쟁 없는 반복 발주
//   5. 고가 계약 (Inflated Pricing)       -- 유사 계약 대비 가격 부풀리기

import type { G2BContractInfo } from '../g2b/client';

// -- Output types --

export interface AuditFinding {
  pattern_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suspicion_score: number;          // 0-100
  target_institution: string;       // 기관명
  target_type: 'department' | 'local_government';
  summary: string;                  // Korean, citizen-friendly
  detail: Record<string, unknown>;  // Raw numbers
  evidence_contracts: EvidenceContract[];
  innocent_explanation: string;     // Balanced alternative explanation
}

export interface EvidenceContract {
  cntrctNo: string;
  cntrctNm: string;
  cntrctAmt: number;
  cntrctorNm: string;
  cntrctCnclsDt: string;
  cntrctMthdNm?: string;
}

// -- Helpers --

/** 지방자치단체 키워드로 target_type 결정 */
function classifyInstitution(name: string): 'department' | 'local_government' {
  const localPatterns = [
    '시청', '군청', '구청', '도청',
    '특별시', '광역시', '특별자치',
    '시립', '군립', '구립', '도립',
    '교육청', '소방서', '경찰서',
    '읍사무소', '면사무소', '동사무소', '주민센터',
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  ];
  return localPatterns.some((p) => name.includes(p))
    ? 'local_government'
    : 'department';
}

/** 계약일 문자열에서 월(1-12) 추출. YYYYMMDD 또는 YYYY-MM-DD 모두 지원. */
function extractMonth(dateStr: string): number {
  if (!dateStr) return 0;
  const cleaned = dateStr.replace(/-/g, '');
  return parseInt(cleaned.substring(4, 6), 10) || 0;
}

/** 계약일 문자열에서 연도(YYYY) 추출 */
function extractYear(dateStr: string): number {
  if (!dateStr) return 0;
  return parseInt(dateStr.substring(0, 4), 10) || 0;
}

/** 계약 -> 증거 레코드 변환 */
function toEvidence(c: G2BContractInfo): EvidenceContract {
  return {
    cntrctNo: c.cntrctNo,
    cntrctNm: c.cntrctNm,
    cntrctAmt: c.cntrctAmt,
    cntrctorNm: c.cntrctorNm ?? '(미상)',
    cntrctCnclsDt: c.cntrctCnclsDt,
    cntrctMthdNm: c.cntrctMthdNm,
  };
}

/** 금액을 읽기 좋은 한글로 변환 */
function formatKRW(amount: number): string {
  if (amount >= 1_000_000_000_000) {
    return `${(amount / 1_000_000_000_000).toFixed(1)}조원`;
  }
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

/** Record-based groupBy (avoids Map iteration issues with es5 target) */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  return map;
}

/** Iterate Record entries (typed convenience wrapper) */
function entries<T>(obj: Record<string, T>): Array<[string, T]> {
  return Object.entries(obj) as Array<[string, T]>;
}

/** 두 문자열의 유사도 (0-1). Bigram Dice coefficient. */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));

  let intersection = 0;
  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    bigramsB.add(bigram);
    if (bigramsA.has(bigram)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/** 계약명에서 차수/호수 등 변동 접미사 제거하여 비교용 정규화 */
function normalizeContractName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/[0-9]+차/g, '')
    .replace(/[0-9]+호/g, '')
    .replace(/[0-9]+건/g, '')
    .replace(/외\d+건/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/제\d+/g, '')
    .trim();
}

// -- Pattern 1: 연말 급증 (Year-end Spike) --

/**
 * 기관별로 4분기(10-12월) 계약 비중이 연간 전체의 40%를 초과하는지 검사.
 * 회계연도 말 예산 소진(밀어내기 집행) 의심 패턴.
 *
 * 정상적인 균등 분포라면 Q4는 ~25%. 40% 이상이면 의심.
 * 점수: 40% 기준으로 초과 비율에 비례. 40%=0, 70%=50, 100%=100.
 */
function detectYearendSpike(contracts: G2BContractInfo[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const byInstitution = groupBy(contracts, (c) => c.dminsttNm);

  for (const [inst, instContracts] of entries(byInstitution)) {
    const byYear = groupBy(instContracts, (c) =>
      String(extractYear(c.cntrctCnclsDt)),
    );

    for (const [year, yearContracts] of entries(byYear)) {
      if (!year || year === '0') continue;
      // 최소 4건 이상이어야 의미 있는 분석 가능
      if (yearContracts.length < 4) continue;

      const totalAmount = yearContracts.reduce(
        (s, c) => s + (c.cntrctAmt || 0),
        0,
      );
      if (totalAmount === 0) continue;

      // Q4 계약 필터 (10, 11, 12월)
      const q4Contracts = yearContracts.filter((c) => {
        const month = extractMonth(c.cntrctCnclsDt);
        return month >= 10 && month <= 12;
      });

      const q4Amount = q4Contracts.reduce(
        (s, c) => s + (c.cntrctAmt || 0),
        0,
      );
      const q4Ratio = q4Amount / totalAmount;

      // 40% 초과 시 플래그
      if (q4Ratio <= 0.40) continue;

      // 점수 계산: 40%에서 얼마나 초과했는지
      const rawScore = ((q4Ratio - 0.40) / 0.60) * 100;
      const suspicion_score = Math.min(100, Math.round(rawScore));

      let severity: AuditFinding['severity'];
      if (q4Ratio >= 0.70) severity = 'HIGH';
      else if (q4Ratio >= 0.55) severity = 'MEDIUM';
      else severity = 'LOW';

      // 금액 기준 상위 증거 계약 (최대 10건)
      const evidenceContracts = q4Contracts
        .sort((a, b) => (b.cntrctAmt || 0) - (a.cntrctAmt || 0))
        .slice(0, 10)
        .map(toEvidence);

      findings.push({
        pattern_type: 'YEAREND_SPIKE',
        severity,
        suspicion_score,
        target_institution: inst,
        target_type: classifyInstitution(inst),
        summary:
          `${inst}의 ${year}년 계약 중 ${(q4Ratio * 100).toFixed(1)}%가 ` +
          `4분기(10~12월)에 집중되었습니다. ` +
          `4분기 계약 ${q4Contracts.length}건(${formatKRW(q4Amount)}) / ` +
          `연간 ${yearContracts.length}건(${formatKRW(totalAmount)}). ` +
          `회계연도 말 예산 소진을 위한 '밀어내기 계약' 가능성이 있습니다.`,
        detail: {
          year: parseInt(year),
          q4_count: q4Contracts.length,
          total_count: yearContracts.length,
          q4_amount: q4Amount,
          total_amount: totalAmount,
          q4_ratio: parseFloat(q4Ratio.toFixed(4)),
          q4_contract_ratio: parseFloat(
            (q4Contracts.length / yearContracts.length).toFixed(4),
          ),
        },
        evidence_contracts: evidenceContracts,
        innocent_explanation:
          '연말에 계약이 집중되는 것은 예산 집행 주기상 자연스러울 수 있습니다. ' +
          '상반기에 사업 기획과 입찰 준비를 하고 하반기에 계약을 체결하는 것은 ' +
          '일반적인 행정 절차이며, 다년도 사업의 연차별 계약 시기가 겹칠 수도 있습니다.',
      });
    }
  }

  return findings;
}

// -- Pattern 2: 업체 집중 (Vendor Concentration) --

/**
 * 한 기관에서 특정 업체의 계약 금액 비중이 30%를 초과하는지 검사.
 * 유착 또는 담합 의심.
 *
 * 건수가 2건 이상이면서 금액 비중 30% 초과 시 플래그.
 * 점수: 30% 기준으로 초과 비율에 비례. 30%=0, 65%=50, 100%=100.
 */
function detectVendorConcentration(
  contracts: G2BContractInfo[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const byInstitution = groupBy(contracts, (c) => c.dminsttNm);

  for (const [inst, instContracts] of entries(byInstitution)) {
    // 최소 5건 이상이어야 통계적으로 의미 있는 비중 분석 가능
    // (3건 표본에서 "100% 집중"은 사실상 무의미)
    if (instContracts.length < 5) continue;

    const totalAmount = instContracts.reduce(
      (s, c) => s + (c.cntrctAmt || 0),
      0,
    );
    if (totalAmount === 0) continue;

    // 업체별 금액 + 계약 목록 집계
    const vendorMap: Record<
      string,
      { amount: number; contracts: G2BContractInfo[] }
    > = {};

    for (const c of instContracts) {
      const vendor = c.cntrctorNm || '';
      if (!vendor) continue;

      if (vendorMap[vendor]) {
        vendorMap[vendor].amount += c.cntrctAmt || 0;
        vendorMap[vendor].contracts.push(c);
      } else {
        vendorMap[vendor] = {
          amount: c.cntrctAmt || 0,
          contracts: [c],
        };
      }
    }

    for (const [vendor, data] of entries(vendorMap)) {
      const ratio = data.amount / totalAmount;
      // 30% 이하면 무시
      if (ratio <= 0.30) continue;
      // 대형 단일 계약은 집중이 아님
      if (data.contracts.length < 2) continue;

      const rawScore = ((ratio - 0.30) / 0.70) * 100;
      const suspicion_score = Math.min(100, Math.round(rawScore));

      let severity: AuditFinding['severity'];
      if (ratio >= 0.60) severity = 'HIGH';
      else if (ratio >= 0.45) severity = 'MEDIUM';
      else severity = 'LOW';

      const evidenceContracts = data.contracts
        .sort((a, b) => (b.cntrctAmt || 0) - (a.cntrctAmt || 0))
        .slice(0, 10)
        .map(toEvidence);

      findings.push({
        pattern_type: 'VENDOR_CONCENTRATION',
        severity,
        suspicion_score,
        target_institution: inst,
        target_type: classifyInstitution(inst),
        summary:
          `${inst}에서 '${vendor}'이(가) 전체 계약 금액의 ` +
          `${(ratio * 100).toFixed(1)}%를 수주했습니다. ` +
          `${data.contracts.length}건, 총 ${formatKRW(data.amount)} ` +
          `(기관 전체 ${formatKRW(totalAmount)} 중). ` +
          '특정 업체에 대한 과도한 계약 집중은 유착 가능성을 시사합니다.',
        detail: {
          vendor,
          vendor_count: data.contracts.length,
          vendor_amount: data.amount,
          institution_total_amount: totalAmount,
          concentration_ratio: parseFloat(ratio.toFixed(4)),
          institution_contract_count: instContracts.length,
        },
        evidence_contracts: evidenceContracts,
        innocent_explanation:
          '특정 분야의 전문성을 가진 업체가 제한적인 경우 ' +
          '같은 업체가 반복 수주하는 것은 자연스러울 수 있습니다. ' +
          'IT 유지보수, 특수 장비, 전문 용역 등은 기존 업체가 계속 수행하는 것이 ' +
          '효율적인 경우가 많으며, 공정한 경쟁입찰을 통해 같은 업체가 ' +
          '연속 낙찰된 것일 수도 있습니다.',
      });
    }
  }

  return findings;
}

// -- Pattern 3: 계약 분할 (Contract Splitting) --

/**
 * 같은 업체+기관에서 수의계약 한도 직하(80~100%) 금액의 계약이 3건 이상
 * 반복되는지 검사. 경쟁입찰 회피를 위한 의도적 분할 의심.
 *
 * 수의계약 한도 기준:
 *   - 물품/용역: 2천만원 (소액), 5천만원 (일반)
 *   - 공사: 2억원
 *
 * 각 기준의 80~100% 범위에 3건 이상 몰려있으면 플래그.
 */
function detectContractSplitting(
  contracts: G2BContractInfo[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const thresholds = [
    { label: '2천만원', amount: 20_000_000, lower: 16_000_000 },
    { label: '5천만원', amount: 50_000_000, lower: 40_000_000 },
    { label: '2억원', amount: 200_000_000, lower: 160_000_000 },
  ];

  // 업체+기관 복합키 그룹
  const byVendorInst = groupBy(contracts, (c) => {
    const vendor = c.cntrctorNm || '';
    if (!vendor) return '';
    return `${vendor}|||${c.dminsttNm}`;
  });

  for (const [key, groupContracts] of entries(byVendorInst)) {
    if (!key) continue;
    const [vendor, inst] = key.split('|||');

    for (const threshold of thresholds) {
      // 이 기준선의 80~100% 범위에 해당하는 계약 필터
      const nearThreshold = groupContracts.filter((c) => {
        const amt = c.cntrctAmt || 0;
        return amt >= threshold.lower && amt < threshold.amount;
      });

      // 3건 이상이면 의심
      if (nearThreshold.length < 3) continue;

      const totalSplitAmount = nearThreshold.reduce(
        (s, c) => s + (c.cntrctAmt || 0),
        0,
      );

      // 건수 기반 점수: 3건=30, 5건=50, 10건=80, 15+=100
      const rawScore = Math.min(100, nearThreshold.length * 10);
      const suspicion_score = Math.max(30, rawScore);

      let severity: AuditFinding['severity'];
      if (nearThreshold.length >= 7) severity = 'HIGH';
      else if (nearThreshold.length >= 5) severity = 'MEDIUM';
      else severity = 'LOW';

      const evidenceContracts = nearThreshold
        .sort((a, b) => (b.cntrctAmt || 0) - (a.cntrctAmt || 0))
        .slice(0, 10)
        .map(toEvidence);

      // 날짜 범위 계산
      const dates = nearThreshold
        .map((c) => c.cntrctCnclsDt)
        .filter(Boolean)
        .sort();
      const dateRange =
        dates.length >= 2
          ? `${dates[0]} ~ ${dates[dates.length - 1]}`
          : dates[0] || '(날짜 미상)';

      findings.push({
        pattern_type: 'CONTRACT_SPLITTING',
        severity,
        suspicion_score,
        target_institution: inst,
        target_type: classifyInstitution(inst),
        summary:
          `${inst}에서 '${vendor}'에게 ${threshold.label} 수의계약 한도 직하 ` +
          `금액(${formatKRW(threshold.lower)}~${formatKRW(threshold.amount)})의 ` +
          `계약을 ${nearThreshold.length}건 체결했습니다. ` +
          `총 ${formatKRW(totalSplitAmount)} (기간: ${dateRange}). ` +
          '경쟁입찰을 회피하기 위해 계약을 의도적으로 분할한 가능성이 있습니다.',
        detail: {
          vendor,
          threshold_label: threshold.label,
          threshold_amount: threshold.amount,
          threshold_lower_bound: threshold.lower,
          split_count: nearThreshold.length,
          split_total_amount: totalSplitAmount,
          date_range: dateRange,
          avg_amount: Math.round(totalSplitAmount / nearThreshold.length),
        },
        evidence_contracts: evidenceContracts,
        innocent_explanation:
          '동일한 금액대의 반복 계약은 정기적인 소규모 유지보수, ' +
          '월별 정기 발주, 또는 업무 특성상 건별로 계약해야 하는 경우일 수 있습니다. ' +
          '시설 관리, 소모품 구매, 정기 점검 등은 유사한 금액의 계약이 ' +
          '반복되는 것이 자연스럽습니다.',
      });
    }
  }

  return findings;
}

// -- Pattern 4: 반복 수의계약 (Repeated Sole-Source) --

/**
 * 같은 업체가 같은 기관에서 수의계약을 3회 이상 수주한 경우 탐지.
 * 수의계약은 경쟁입찰 없이 특정 업체와 직접 계약하는 방식.
 *
 * cntrctMthdNm 필드에 '수의' 키워드 포함 여부로 판별.
 * 점수: 건수+금액 복합. 3건=39, 5건=55, 10건=95, 고액 가중.
 */
function detectRepeatedSoleSource(
  contracts: G2BContractInfo[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // 수의계약만 필터
  const soleSourceContracts = contracts.filter((c) => {
    const method = c.cntrctMthdNm || '';
    return method.includes('수의');
  });

  if (soleSourceContracts.length === 0) return findings;

  // 업체+기관 복합키 그룹
  const byVendorInst = groupBy(soleSourceContracts, (c) => {
    const vendor = c.cntrctorNm || '';
    if (!vendor) return '';
    return `${vendor}|||${c.dminsttNm}`;
  });

  for (const [key, groupContracts] of entries(byVendorInst)) {
    if (!key) continue;
    const [vendor, inst] = key.split('|||');

    // 3건 미만이면 무시
    if (groupContracts.length < 3) continue;

    const totalAmount = groupContracts.reduce(
      (s, c) => s + (c.cntrctAmt || 0),
      0,
    );

    // 건수 기반 + 금액 가중
    let rawScore = 15 + groupContracts.length * 8;
    if (totalAmount >= 100_000_000) rawScore += 10;  // 1억 이상 가중
    if (totalAmount >= 500_000_000) rawScore += 10;  // 5억 이상 추가 가중
    const suspicion_score = Math.min(100, Math.round(rawScore));

    let severity: AuditFinding['severity'];
    if (groupContracts.length >= 7 || totalAmount >= 500_000_000)
      severity = 'HIGH';
    else if (groupContracts.length >= 5 || totalAmount >= 200_000_000)
      severity = 'MEDIUM';
    else severity = 'LOW';

    const evidenceContracts = groupContracts
      .sort((a, b) => (b.cntrctAmt || 0) - (a.cntrctAmt || 0))
      .slice(0, 10)
      .map(toEvidence);

    // 기간 분석
    const years = groupContracts
      .map((c) => extractYear(c.cntrctCnclsDt))
      .filter((y) => y > 0);
    const yearSpan =
      years.length > 0
        ? `${Math.min(...years)}~${Math.max(...years)}년`
        : '(기간 미상)';

    findings.push({
      pattern_type: 'REPEATED_SOLE_SOURCE',
      severity,
      suspicion_score,
      target_institution: inst,
      target_type: classifyInstitution(inst),
      summary:
        `${inst}이(가) '${vendor}'에게 수의계약을 ` +
        `${groupContracts.length}회 반복 발주했습니다. ` +
        `총 ${formatKRW(totalAmount)} (${yearSpan}). ` +
        '경쟁입찰 없이 같은 업체에 반복 발주하는 것은 ' +
        '공정성과 투명성 측면에서 문제가 될 수 있습니다.',
      detail: {
        vendor,
        sole_source_count: groupContracts.length,
        total_amount: totalAmount,
        year_span: yearSpan,
        avg_amount: Math.round(totalAmount / groupContracts.length),
        unique_years: Array.from(new Set(years)).sort(),
      },
      evidence_contracts: evidenceContracts,
      innocent_explanation:
        '수의계약은 긴급한 상황, 특허 기술, 기존 시스템 호환성, ' +
        '특수 전문 분야 등 정당한 사유로 허용됩니다. ' +
        '기존 시스템의 유지보수나 업그레이드는 원래 공급업체가 수행하는 것이 ' +
        '기술적으로 합리적인 경우가 많습니다. ' +
        '각 수의계약의 사유서를 확인해야 정확한 판단이 가능합니다.',
    });
  }

  return findings;
}

// -- Pattern 5: 고가 계약 (Inflated Pricing) --

/**
 * 유사한 계약명의 계약들 간 가격을 비교하여 평균 대비 30% 이상 비싼 계약 탐지.
 *
 * 알고리즘:
 *   1. 계약명 정규화 후 앞 6글자로 초벌 그룹핑
 *   2. 그룹 내에서 bigram Dice coefficient >= 0.5 인 것끼리 클러스터링
 *   3. 각 클러스터에서 평균 대비 30% 초과 계약을 이상치로 플래그
 *
 * 점수: 초과 비율 기반. 30%=30, 60%=45, 100%=65, 200%=100.
 */
function detectInflatedPricing(
  contracts: G2BContractInfo[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // 금액이 0이거나 계약명이 없는 건 제외
  const validContracts = contracts.filter(
    (c) => c.cntrctAmt > 0 && c.cntrctNm,
  );
  if (validContracts.length < 5) return findings;

  // 1단계: 계약명 정규화 후 앞부분으로 초벌 그룹핑
  const prefixGroups: Record<string, G2BContractInfo[]> = {};
  for (const c of validContracts) {
    const normalized = normalizeContractName(c.cntrctNm);
    if (normalized.length < 3) continue;
    const prefix = normalized.substring(
      0,
      Math.min(6, normalized.length),
    );
    if (!prefixGroups[prefix]) prefixGroups[prefix] = [];
    prefixGroups[prefix].push(c);
  }

  // 2단계: 초벌 그룹 내에서 유사도 기반 세부 클러스터링
  for (const [, group] of entries(prefixGroups)) {
    if (group.length < 3) continue;

    const clusters: G2BContractInfo[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < group.length; i++) {
      if (assigned.has(i)) continue;

      const cluster: G2BContractInfo[] = [group[i]];
      assigned.add(i);
      const nameI = normalizeContractName(group[i].cntrctNm);

      for (let j = i + 1; j < group.length; j++) {
        if (assigned.has(j)) continue;
        const nameJ = normalizeContractName(group[j].cntrctNm);
        if (stringSimilarity(nameI, nameJ) >= 0.5) {
          cluster.push(group[j]);
          assigned.add(j);
        }
      }

      if (cluster.length >= 3) {
        clusters.push(cluster);
      }
    }

    // 3단계: 각 클러스터에서 이상치 탐지
    for (const cluster of clusters) {
      const amounts = cluster.map((c) => c.cntrctAmt);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      if (avg === 0) continue;

      // 평균 대비 30% 이상 비싼 계약 찾기
      const inflated = cluster.filter((c) => c.cntrctAmt / avg > 1.30);

      for (const c of inflated) {
        const ratio = c.cntrctAmt / avg;
        const overPercent = (ratio - 1) * 100;

        // 점수: 초과 비율 기반
        const rawScore = Math.min(100, Math.round(overPercent * 0.5 + 15));
        const suspicion_score = Math.max(25, rawScore);

        let severity: AuditFinding['severity'];
        if (overPercent >= 100) severity = 'HIGH';
        else if (overPercent >= 60) severity = 'MEDIUM';
        else severity = 'LOW';

        // 비교 대상 계약들 (본 건 제외, 금액 오름차순)
        const comparisons = cluster
          .filter((x) => x.cntrctNo !== c.cntrctNo)
          .sort((a, b) => (a.cntrctAmt || 0) - (b.cntrctAmt || 0))
          .slice(0, 5);

        const evidenceContracts = [
          toEvidence(c),
          ...comparisons.map(toEvidence),
        ];

        const comparisonInstitutions = Array.from(
          new Set(comparisons.map((x) => x.dminsttNm)),
        );

        const sortedAmounts = [...amounts].sort((a, b) => a - b);
        const median =
          sortedAmounts[Math.floor(sortedAmounts.length / 2)];

        findings.push({
          pattern_type: 'INFLATED_PRICING',
          severity,
          suspicion_score,
          target_institution: c.dminsttNm,
          target_type: classifyInstitution(c.dminsttNm),
          summary:
            `${c.dminsttNm}의 '${c.cntrctNm}' 계약(${formatKRW(c.cntrctAmt)})이 ` +
            `유사 계약 평균(${formatKRW(Math.round(avg))}) 대비 ` +
            `${overPercent.toFixed(1)}% 비쌉니다. ` +
            `비교 대상: ${comparisonInstitutions.slice(0, 3).join(', ')} 등 ${cluster.length - 1}건. ` +
            '동일 품목/용역에 대해 다른 기관보다 현저히 높은 가격으로 계약한 것은 ' +
            '가격 부풀리기 가능성을 시사합니다.',
          detail: {
            contract_name: c.cntrctNm,
            contract_amount: c.cntrctAmt,
            cluster_avg_amount: Math.round(avg),
            over_avg_percent: parseFloat(overPercent.toFixed(2)),
            cluster_size: cluster.length,
            cluster_min: Math.min(...amounts),
            cluster_max: Math.max(...amounts),
            cluster_median: median,
            comparison_institutions: comparisonInstitutions,
          },
          evidence_contracts: evidenceContracts,
          innocent_explanation:
            '계약 금액 차이는 계약 범위, 납품 조건, 지역 특성, 긴급도, ' +
            '추가 서비스 포함 여부 등에 따라 달라질 수 있습니다. ' +
            '계약명이 비슷하더라도 실제 규격이나 요구사항이 다를 수 있으며, ' +
            '도서산간 지역 배송비, 설치비, 교육비 등이 포함되었을 수 있습니다. ' +
            '세부 계약 사양서를 비교해야 정확한 판단이 가능합니다.',
        });
      }
    }
  }

  // 중복 제거: 같은 계약번호가 여러 클러스터에서 잡힐 수 있음
  const seen = new Set<string>();
  return findings.filter((f) => {
    const firstContract = f.evidence_contracts[0];
    const key = `${f.target_institution}__${firstContract?.cntrctNo ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// -- Main export --

/**
 * 계약 데이터에 대해 5가지 감사 패턴을 모두 실행하고 결과를 통합 반환.
 *
 * v2: 패턴 탐지 후 맥락 분석(context enrichment)이 프론트엔드에서 적용됩니다.
 * enrichAllFindings()가 상품 특성, 경쟁 입찰 여부, 법적 근거 등을 분석하여
 * 점수를 보정합니다. 이 함수는 1단계 원시 탐지 결과만 반환합니다.
 *
 * suspicion_score 내림차순으로 정렬.
 */
export async function runAuditAnalysis(
  contracts: G2BContractInfo[],
): Promise<AuditFinding[]> {
  if (!contracts || contracts.length === 0) return [];

  // Deduplicate by contract number (나라장터 API returns multiple rows per change order)
  const deduped = deduplicateContracts(contracts);

  const findings: AuditFinding[] = [];

  findings.push(...detectYearendSpike(deduped));
  findings.push(...detectVendorConcentration(deduped));
  findings.push(...detectContractSplitting(deduped));
  findings.push(...detectRepeatedSoleSource(deduped));
  findings.push(...detectInflatedPricing(deduped));

  return findings.sort((a, b) => b.suspicion_score - a.suspicion_score);
}

/**
 * 계약번호(cntrctNo) 기준으로 중복 제거.
 * 나라장터 API는 변경차수(ctrtChgOrd)별로 별도 행을 반환하므로
 * 동일 계약이 여러 번 집계되는 것을 방지합니다.
 * 가장 높은 금액의 행을 유지합니다.
 */
function deduplicateContracts(contracts: G2BContractInfo[]): G2BContractInfo[] {
  const map = new Map<string, G2BContractInfo>();
  for (const c of contracts) {
    const key = c.cntrctNo;
    if (!key) { map.set(`_no_id_${map.size}`, c); continue; }
    const existing = map.get(key);
    if (!existing || (c.cntrctAmt || 0) > (existing.cntrctAmt || 0)) {
      map.set(key, c);
    }
  }
  return Array.from(map.values());
}

// Named exports for individual use and testing
export {
  detectYearendSpike,
  detectVendorConcentration,
  detectContractSplitting,
  detectRepeatedSoleSource,
  detectInflatedPricing,
};
