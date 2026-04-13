// 국정투명 — 감사 컨텍스트 분석 엔진
// 단순 패턴 매칭을 넘어 맥락을 이해하는 감사 시스템
//
// 핵심 원칙: 의심은 실제 공적 피해 가능성에 비례해야 한다.
// "같은 업체가 또 수주했다"가 아니라 "이 계약이 국민에게 손해인가?"를 묻는다.
//
// Knowledge Base: data/knowledge/*.json (government-orgs, org-relationships,
// industry-context, procurement-rules) — loaded via ./knowledge.ts

import {
  findRelationship,
  isGovOrg,
  getIndustryContext,
  getProcurementProfile,
  isParentChild,
  normalizeName,
} from './knowledge';

// ── Types ──────────────────────────────────────────────────────────────

export interface BidderRecord {
  vendor: string;
  bizno: string;
  ceo?: string;
  amount: number;
  rate: number;
  won: boolean;
}

export interface VendorProfile {
  ceo_name?: string;
  employee_count?: string | number;
  reg_date?: string;
  address?: string;
  bizno?: string;
}

export interface RealEvidenceContract {
  no: string;
  name: string;
  amount: number;
  vendor: string;
  date: string;
  method: string;
  reason?: string;
  url: string;
  all_bidders?: BidderRecord[];
}

export interface RawFinding {
  id?: string;
  pattern_type: string;
  severity: string;
  suspicion_score: number;
  target_institution: string;
  summary: string;
  detail: Record<string, unknown>;
  evidence_contracts: RealEvidenceContract[];
  innocent_explanation: string;
  // Rich narrative fields (from generate-audit.py)
  plain_explanation?: string;
  why_it_matters?: string;
  citizen_impact?: string;
  what_should_happen?: string;
  related_links?: { title: string; url: string; source: string }[];
  // Verdict fields
  verdict?: 'suspicious' | 'investigate' | 'legitimate';
  verdict_reason?: string;
  key_evidence?: string;
  vendor_profile?: VendorProfile;
  priority_tier?: number;
}

export type RiskLevel = 'CONCERN' | 'WATCH' | 'LOW_RISK' | 'NORMAL';

export interface MitigatingFactor {
  id: string;
  label: string;
  explanation: string;
  score_reduction: number;
}

export interface AggravatingFactor {
  id: string;
  label: string;
  explanation: string;
  score_increase: number;
}

export interface DataQuality {
  duplicate_contracts: number;    // How many dupes were found
  unique_contracts: number;       // After dedup
  single_day_snapshot: boolean;   // All contracts from same date
  small_sample: boolean;          // < 10 contracts from this institution
}

export interface EnrichedFinding extends RawFinding {
  // Adjusted scoring
  adjusted_score: number;
  raw_score: number;
  risk_level: RiskLevel;
  risk_label: string;

  // Context analysis
  mitigating_factors: MitigatingFactor[];
  aggravating_factors: AggravatingFactor[];
  contextual_analysis: string;
  what_to_watch_for: string;

  // Data quality
  data_quality: DataQuality;
  deduplicated_contracts: RealEvidenceContract[];

  // Public harm
  amount_tier: string;
  amount_tier_label: string;
}

// ── Commodity Classification ───────────────────────────────────────────
// Products/services where vendor concentration is structurally expected

interface CommodityRule {
  keywords: string[];
  label: string;
  reduction: number;
  reason: string;
}

const COMMODITY_RULES: CommodityRule[] = [
  {
    keywords: ['액화석유가스', 'LPG', 'LNG', '등유', '경유', '유류', '연료', '가스 공급', '가스공급', '난방유'],
    label: '에너지/연료 공급',
    reduction: 45,
    reason: '에너지/연료는 지역별 공급업체가 한정되어 있으며, 가격은 정부가 고시하는 시장 기준을 따릅니다. 공급업체를 자주 변경하면 오히려 공급 안정성이 떨어지고 전환 비용이 발생합니다.',
  },
  {
    keywords: ['교과용도서', '교과서', '도서 공급', '도서공급', '교재 공급'],
    label: '교과서/도서 공급',
    reduction: 55,
    reason: '교과서는 교육부가 지정한 출판사만 공급할 수 있으며, 교육지원청별 교과서 배분 체계에 따라 지정된 서점을 통해 공급됩니다. 수의계약이 법적으로 의무화된 구조입니다.',
  },
  {
    keywords: ['COMSOL', 'AutoCAD', 'MATLAB', '라이선스', 'S/W 유지', '소프트웨어 유지', 'SW 유지'],
    label: '소프트웨어 라이선스',
    reduction: 35,
    reason: '소프트웨어 라이선스는 공식 리셀러/총판을 통해서만 구매 가능합니다. 제조사가 지정한 유통 경로가 정해져 있어 업체 선택의 폭이 구조적으로 제한됩니다.',
  },
  {
    keywords: ['검출기', 'Detector', 'Scintillator', 'Analyzer', '분석기', '스펙트로미터', 'Spectrometer', '센서'],
    label: '과학/연구 장비',
    reduction: 30,
    reason: '과학 연구 장비는 전 세계적으로 소수 제조사만 생산하며, 국내에는 공인 대리점이 1~2곳인 경우가 대부분입니다. 장비 간 호환성과 기존 연구 시스템 연속성도 중요합니다.',
  },
  {
    keywords: ['의약품', '의료기기', '진료', '백신', '혈액'],
    label: '의약품/의료기기',
    reduction: 30,
    reason: '의약품과 의료기기는 식약처 인허가를 받은 제품만 사용 가능하며, 특정 장비의 소모품은 해당 제조사 전용인 경우가 많습니다.',
  },
  {
    keywords: ['묘목', '종자', '비료', '상토', '퇴비', '조림'],
    label: '농림/묘목',
    reduction: 25,
    reason: '묘목 및 종자는 계절성이 강하고 지역 생산자가 한정되어 있습니다. 특히 특정 수종(편백, 상수리 등)의 묘목은 전문 재배 농원만 공급 가능합니다.',
  },
  {
    keywords: ['이형관', '연결구', 'PEP', '밸브', '배관', '수도관', '관급자재'],
    label: '인프라 호환 부품',
    reduction: 35,
    reason: '기존 배관/설비와의 호환성이 필수적인 부품입니다. 다른 제조사 제품을 사용하면 접합 불량, 누수, 안전사고 위험이 있어 동일 제조사 제품 사용이 기술적으로 합리적입니다.',
  },
  {
    keywords: ['수중펌프', '펌프', '부스터펌프', '양수기'],
    label: '펌프/기계 설비',
    reduction: 20,
    reason: '펌프는 설치 환경별 사양이 달라 호환 제품이 제한적이며, 기존 시스템과의 연동이 필요합니다. 다만 일반 범용 펌프는 대체 제품이 존재할 수 있습니다.',
  },
  {
    keywords: ['MTU', '주기관', '선박', '해양', '함정', '어뢰', '소나'],
    label: '군/해양 특수 장비',
    reduction: 35,
    reason: '군함/해양경찰 장비는 제조사가 극소수이며, 정비 부품은 원제조사나 공인 정비업체만 공급 가능합니다. 안보와 인명 안전이 직결되어 검증된 업체 사용이 필수적입니다.',
  },
  {
    keywords: ['폐기물', '폐기물처리', '폐기물 처리', '쓰레기'],
    label: '폐기물 처리',
    reduction: 15,
    reason: '폐기물 처리는 환경부 허가를 받은 업체만 가능하며, 지역별로 허가 업체가 제한적입니다. 다만 허가 업체가 여러 곳인 지역에서는 경쟁이 가능할 수 있습니다.',
  },
  {
    keywords: ['태양광', '발전 설비', '태양전지', '인버터', '모듈'],
    label: '태양광/발전 설비',
    reduction: 15,
    reason: '태양광 설비는 설계-시공 통합이 일반적이며, 여러 사업장의 설비를 동일 업체가 표준화하여 시공하는 것이 유지보수 효율상 합리적일 수 있습니다.',
  },
];

// ── Competition Method Scoring ──────────────────────────────────────────
// 경쟁 입찰을 통한 결과는 담합이 아닌 시장 경쟁의 결과

interface CompetitionRule {
  keywords: string[];
  label: string;
  reduction: number;
  reason: string;
}

const COMPETITION_RULES: CompetitionRule[] = [
  {
    keywords: ['일반경쟁'],
    label: '공개 경쟁 입찰',
    reduction: 35,
    reason: '일반경쟁입찰은 모든 업체가 참여 가능한 가장 투명한 조달 방식입니다. 이 방식으로 같은 업체가 반복 수주했다면 해당 업체가 가격/기술 경쟁에서 이긴 결과입니다.',
  },
  {
    keywords: ['제한경쟁'],
    label: '제한 경쟁 입찰',
    reduction: 25,
    reason: '제한경쟁은 자격 요건(면허, 실적 등)을 충족한 업체 간의 경쟁입니다. 일반경쟁보다 참여 범위가 좁지만, 여전히 경쟁 절차를 거칩니다.',
  },
  {
    keywords: ['협상에 의한 계약', '협상계약'],
    label: '협상 계약',
    reduction: 15,
    reason: '협상에 의한 계약은 제안서 평가와 가격 협상을 거치는 방식입니다. 수의계약보다 투명하지만 일반경쟁보다는 재량이 넓습니다.',
  },
];

// ── Legal Basis Analysis ───────────────────────────────────────────────
// 법적 근거가 명시된 수의계약은 합법적 절차를 따른 것

interface LegalBasisRule {
  keywords: string[];
  label: string;
  reduction: number;
  reason: string;
}

const LEGAL_BASIS_RULES: LegalBasisRule[] = [
  {
    keywords: ['2천만원 이하', '추정가격 2천만원'],
    label: '소액 수의계약 (2천만원 이하)',
    reduction: 20,
    reason: '추정가격 2천만원 이하의 계약은 법령에 따라 수의계약이 허용됩니다. 소액 건마다 입찰 절차를 거치면 행정 비용이 계약 금액을 초과할 수 있어, 이 기준은 합리적입니다.',
  },
  {
    keywords: ['호환성', '부품공급 및 설비확충'],
    label: '설비 호환성',
    reduction: 25,
    reason: '기존 설비와의 호환성이 필요한 부품/자재는 동일 제조사 제품 사용이 기술적으로 필수적입니다. 지방계약법 제25조제1항4호타목에 근거합니다.',
  },
  {
    keywords: ['특수한설비', '특수한 설비', '기술의보유', '기술의 보유', '실적(물품제조)'],
    label: '특수 설비/기술 보유',
    reduction: 20,
    reason: '특수한 설비나 기술을 보유한 업체가 제한적인 경우, 해당 업체와의 수의계약이 법적으로 허용됩니다.',
  },
  {
    keywords: ['농공단지 입주공장', '입주공장 생산품'],
    label: '농공단지 우선 구매',
    reduction: 15,
    reason: '농공단지 입주 기업의 생산품 우선 구매는 지역 경제 활성화를 위한 법적 근거가 있습니다. 다만 이 제도의 남용 여부는 별도로 점검할 필요가 있습니다.',
  },
  {
    keywords: ['긴급', '재해', '재난', '응급'],
    label: '긴급/재해 대응',
    reduction: 20,
    reason: '재해 복구나 긴급 상황에서는 신속한 조달이 필수적이므로 수의계약이 허용됩니다.',
  },
];

// ── Institutional Context ──────────────────────────────────────────────
// 기관 특성에 따라 수의계약 비율이 구조적으로 높은 곳

interface InstitutionRule {
  keywords: string[];
  label: string;
  reduction: number;
  reason: string;
}

const INSTITUTION_RULES: InstitutionRule[] = [
  {
    keywords: ['원자력', '핵융합', '가속기', '방사선'],
    label: '원자력/핵 연구기관',
    reduction: 15,
    reason: '원자력 관련 연구기관은 특수 장비와 규제 물품을 다루므로 공인된 업체와의 거래가 필수적입니다.',
  },
  {
    keywords: ['교육청', '교육지원청', '초등학교', '중학교', '고등학교'],
    label: '교육기관',
    reduction: 10,
    reason: '교육기관은 교과서 구매, 급식 재료 등 지정 공급 구조의 조달이 많아 수의계약 비율이 구조적으로 높습니다.',
  },
  {
    keywords: ['산림조합', '농협', '수협', '축협'],
    label: '특수법인 조합',
    reduction: 10,
    reason: '산림/농/수/축협은 조합원 간 거래나 지정 공급 체계를 따르는 경우가 많아 수의계약 비율이 높습니다.',
  },
  {
    keywords: ['해양경찰', '군부대', '병무청', '국방부'],
    label: '국방/안보 기관',
    reduction: 10,
    reason: '국방 및 안보 기관은 보안 요구사항과 군용 규격 적합 업체가 한정되어 있어 특정 업체와의 거래가 집중됩니다.',
  },
];

// ── Amount Tiers ───────────────────────────────────────────────────────

function getAmountTier(amount: number): { tier: string; label: string; multiplier: number } {
  if (amount < 5_000_000) return { tier: 'trivial', label: '소규모 (500만원 미만)', multiplier: 0.3 };
  if (amount < 50_000_000) return { tier: 'small', label: '소액 (5천만원 미만)', multiplier: 0.6 };
  if (amount < 500_000_000) return { tier: 'medium', label: '중규모 (5억원 미만)', multiplier: 0.85 };
  if (amount < 5_000_000_000) return { tier: 'large', label: '대규모 (50억원 미만)', multiplier: 1.0 };
  return { tier: 'mega', label: '초대형 (50억원 이상)', multiplier: 1.2 };
}

// ── Risk Level Classification ──────────────────────────────────────────

function classifyRisk(score: number): { level: RiskLevel; label: string } {
  if (score >= 60) return { level: 'CONCERN', label: '점검 권고' };
  if (score >= 35) return { level: 'WATCH', label: '관심 관찰' };
  if (score >= 15) return { level: 'LOW_RISK', label: '낮은 위험' };
  return { level: 'NORMAL', label: '정상 범위' };
}

// ── Deduplication ──────────────────────────────────────────────────────

function deduplicateContracts(contracts: RealEvidenceContract[]): {
  unique: RealEvidenceContract[];
  duplicateCount: number;
} {
  const seen = new Map<string, RealEvidenceContract>();
  for (const c of contracts) {
    if (!seen.has(c.no)) {
      seen.set(c.no, c);
    }
  }
  return {
    unique: Array.from(seen.values()),
    duplicateCount: contracts.length - seen.size,
  };
}

// ── Pattern Matching Helpers ───────────────────────────────────────────

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function findMatchingRules<T extends { keywords: string[] }>(
  text: string,
  rules: T[],
): T[] {
  return rules.filter(rule => matchesAny(text, rule.keywords));
}

// ── Main Enrichment Function ───────────────────────────────────────────

export function enrichFinding(finding: RawFinding): EnrichedFinding {
  const mitigating: MitigatingFactor[] = [];
  const aggravating: AggravatingFactor[] = [];

  // ---- Step 1: Deduplicate evidence contracts ----
  const { unique: deduped, duplicateCount } = deduplicateContracts(finding.evidence_contracts);

  const allDates = deduped.map(c => c.date).filter(Boolean);
  const uniqueDates = new Set(allDates);
  const singleDaySnapshot = uniqueDates.size <= 1 && allDates.length > 0;

  const dataQuality: DataQuality = {
    duplicate_contracts: duplicateCount,
    unique_contracts: deduped.length,
    single_day_snapshot: singleDaySnapshot,
    small_sample: deduped.length < 5,
  };

  // Data quality mitigating factors
  if (duplicateCount > 0) {
    mitigating.push({
      id: 'data_dedup',
      label: '중복 데이터 보정',
      explanation: `원본 데이터에서 동일 계약번호가 ${duplicateCount}건 중복 집계되었습니다. 실제 고유 계약은 ${deduped.length}건입니다. 나라장터 API에서 변경차수(ctrtChgOrd)별로 별도 행이 반환되기 때문입니다.`,
      score_reduction: Math.min(30, duplicateCount * 10),
    });
  }

  if (dataQuality.small_sample) {
    mitigating.push({
      id: 'small_sample',
      label: '제한된 표본 크기',
      explanation: `이 기관의 분석 대상 계약이 ${deduped.length}건에 불과합니다. 이렇게 작은 표본에서 나온 비율(예: "100% 집중")은 통계적으로 의미 있는 결론을 내리기에 불충분합니다. 이 기관의 전체 계약 이력을 확인해야 정확한 판단이 가능합니다.`,
      score_reduction: 15,
    });
  }

  // Aggregate text for pattern matching
  const allContractNames = deduped.map(c => c.name).join(' ');
  const allMethods = deduped.map(c => c.method).join(' ');
  const allReasons = deduped.map(c => c.reason || '').join(' ');
  const instName = finding.target_institution;
  const vendorName = String(finding.detail['업체'] ?? finding.detail['vendor'] ?? '');
  const searchText = `${allContractNames} ${vendorName} ${instName}`;

  // ---- Step 2: Commodity classification ----
  const commodityMatches = findMatchingRules(searchText, COMMODITY_RULES);
  for (const rule of commodityMatches) {
    mitigating.push({
      id: `commodity_${rule.label}`,
      label: `${rule.label} (구조적 공급 제한)`,
      explanation: rule.reason,
      score_reduction: rule.reduction,
    });
  }

  // ---- Step 3: Competition method analysis ----
  const competitionMatches = findMatchingRules(allMethods, COMPETITION_RULES);
  for (const rule of competitionMatches) {
    mitigating.push({
      id: `competition_${rule.label}`,
      label: `${rule.label} 방식 사용`,
      explanation: rule.reason,
      score_reduction: rule.reduction,
    });
  }

  // Conversely, if ALL contracts are 수의계약 and none of the above apply
  const allSoleSource = deduped.every(c => c.method.includes('수의'));
  if (allSoleSource && competitionMatches.length === 0 && deduped.length >= 3) {
    // But check if there are legal reasons
    const hasLegalBasis = deduped.some(c => c.reason && c.reason.length > 5);
    if (!hasLegalBasis) {
      aggravating.push({
        id: 'all_sole_source_no_reason',
        label: '전건 수의계약 (법적 근거 미표기)',
        explanation: `${deduped.length}건 전체가 수의계약이며 법적 근거가 표기되지 않았습니다. 각 계약의 수의계약 사유서를 확인하여 적법성을 검증할 필요가 있습니다.`,
        score_increase: 10,
      });
    }
  }

  // ---- Step 4: Legal basis analysis ----
  const legalMatches = findMatchingRules(allReasons, LEGAL_BASIS_RULES);
  for (const rule of legalMatches) {
    mitigating.push({
      id: `legal_${rule.label}`,
      label: `법적 근거: ${rule.label}`,
      explanation: rule.reason,
      score_reduction: rule.reduction,
    });
  }

  // ---- Step 5: Institutional context ----
  const instMatches = findMatchingRules(instName, INSTITUTION_RULES);
  for (const rule of instMatches) {
    mitigating.push({
      id: `inst_${rule.label}`,
      label: `기관 특성: ${rule.label}`,
      explanation: rule.reason,
      score_reduction: rule.reduction,
    });
  }

  // ---- Step 5b: Knowledge Base — entity relationships ----
  // Check if vendor is a child org of the institution (procurement is expected/normal)
  for (const c of deduped) {
    if (!c.vendor) continue;
    const rel = findRelationship(c.vendor, instName);
    if (rel && rel.normalProcurement) {
      mitigating.push({
        id: `kb_relationship_${normalizeName(c.vendor)}`,
        label: `산하기관 관계: ${normalizeName(c.vendor)} → ${instName}`,
        explanation: `${normalizeName(c.vendor)}은(는) ${instName}의 ${rel.typeInfo.label}입니다. 설립 목적에 부합하는 정상적 조달입니다.`,
        score_reduction: Math.max(20, 100 - rel.scoreCap),
      });
      break; // Only apply once
    }
    // Fallback: check if vendor is any gov org
    if (isGovOrg(c.vendor) && !rel) {
      mitigating.push({
        id: `kb_gov_org_${normalizeName(c.vendor)}`,
        label: `정부 관련 기관: ${normalizeName(c.vendor)}`,
        explanation: `${normalizeName(c.vendor)}은(는) 정부 산하기관/출연연구기관으로, 모 부처 위탁 사업 수주는 설립 목적에 부합합니다.`,
        score_reduction: 25,
      });
      break;
    }
  }

  // ---- Step 5c: Knowledge Base — industry context ----
  const kbIndustry = getIndustryContext(searchText);
  if (kbIndustry && !commodityMatches.length) {
    // Only add if not already caught by COMMODITY_RULES
    mitigating.push({
      id: `kb_industry_${kbIndustry.category}`,
      label: `${kbIndustry.label} (지식 베이스)`,
      explanation: kbIndustry.reason,
      score_reduction: kbIndustry.scoreReduction,
    });
  }

  // ---- Step 5d: Knowledge Base — procurement profile ----
  const profile = getProcurementProfile(instName);
  if (profile && finding.pattern_type === 'repeated_sole_source') {
    const soleRatio = Number(finding.detail['수의계약_비율']?.toString().replace('%', '') || 0);
    if (soleRatio > 0 && soleRatio <= profile.expectedSoleSourcePct.max) {
      mitigating.push({
        id: `kb_profile_expected`,
        label: `${profile.label} 기관 — 수의계약 비율 정상 범위`,
        explanation: `${instName}은(는) ${profile.label} 유형 기관입니다. 이 유형의 기관은 수의계약 비율 ${profile.expectedSoleSourcePct.min}-${profile.expectedSoleSourcePct.max}%가 정상 범위이며, 현재 ${soleRatio}%는 이 범위 내입니다.`,
        score_reduction: 20,
      });
    }
  }

  // ---- Step 6: Amount-based assessment ----
  const totalAmount = Number(
    finding.detail['업체_계약총액'] ?? finding.detail['단독응찰_총액'] ??
    finding.detail['반복낙찰_총액'] ?? finding.detail['낙찰총액'] ??
    finding.detail['수의계약_총액'] ?? finding.detail['한도근처_총액'] ??
    finding.detail['계약금액'] ?? finding.detail['총액'] ?? finding.detail['total_amount'] ??
    // Fallback: sum evidence contract amounts
    finding.evidence_contracts.reduce((s, c) => s + (c.amount || 0), 0)
  );
  const amountInfo = getAmountTier(totalAmount);

  if (amountInfo.multiplier < 0.7) {
    mitigating.push({
      id: 'low_amount',
      label: `${amountInfo.label}`,
      explanation: `총 계약 금액이 ${formatAmount(totalAmount)}으로, 이 규모의 계약에서 업체 집중이나 수의계약은 행정 효율상 일반적입니다. 소액 건에 대해 매번 입찰을 실시하면 행정 비용이 계약 금액에 비해 과도할 수 있습니다.`,
      score_reduction: 15,
    });
  }

  // Large amounts without competition are more concerning
  if (amountInfo.multiplier >= 1.0 && allSoleSource && deduped.length >= 3) {
    aggravating.push({
      id: 'large_sole_source',
      label: `대규모 수의계약 (${formatAmount(totalAmount)})`,
      explanation: `총 ${formatAmount(totalAmount)} 규모의 계약이 전부 수의계약으로 체결되었습니다. 이 규모에서는 경쟁 입찰을 통한 가격 절감 효과가 상당할 수 있으므로, 수의계약 사유의 타당성을 면밀히 검토할 필요가 있습니다.`,
      score_increase: 15,
    });
  }

  // ---- Step 7: Multi-location standardization (for vendor_concentration) ----
  if (finding.pattern_type === 'vendor_concentration') {
    // Check if contracts are across different sub-locations
    const contractNames = deduped.map(c => c.name);
    const locationKeywords = ['공장', '지구', '지역', '단지', '센터', '사업장'];
    const hasMultiLocation = locationKeywords.some(kw =>
      contractNames.filter(n => n.includes(kw)).length >= 2
    );
    if (hasMultiLocation) {
      mitigating.push({
        id: 'multi_location',
        label: '다중 사업장 표준화',
        explanation: '여러 사업장/지역에 걸친 동일 유형의 계약입니다. 설비 표준화와 유지보수 효율을 위해 동일 업체를 사용하는 것은 합리적인 운영 판단입니다.',
        score_reduction: 15,
      });
    }
  }

  // ---- Step 8: "Repeated sole source" for education textbooks ----
  if (finding.pattern_type === 'repeated_sole_source') {
    const isTextbook = allContractNames.match(/교과용도서|교과서/);
    if (isTextbook) {
      mitigating.push({
        id: 'textbook_system',
        label: '교과서 지정 공급 체계',
        explanation: '대한민국 교과서 공급은 교육부 지정 출판사 → 시도교육청 배정 → 지정 서점 공급의 법정 체계를 따릅니다. 수의계약은 이 구조의 결과이며, 교육지원청에 재량권이 없습니다.',
        score_reduction: 50,
      });
    }
  }

  // ---- Step 9: Check for contracts at different vendors (for repeated_sole_source at institution level) ----
  if (finding.pattern_type === 'repeated_sole_source') {
    const uniqueVendors = new Set(deduped.map(c => c.vendor));
    if (uniqueVendors.size >= 3) {
      mitigating.push({
        id: 'diverse_vendors',
        label: `다양한 업체와 거래 (${uniqueVendors.size}개 업체)`,
        explanation: `수의계약이긴 하나 ${uniqueVendors.size}개의 서로 다른 업체와 거래하고 있어 특정 업체에 대한 편중이 아닙니다. 각 분야의 전문 업체와 개별 거래한 결과입니다.`,
        score_reduction: 20,
      });
    }
  }

  // ---- Step 10: Calculate adjusted score ----
  const rawScore = finding.suspicion_score;
  const totalMitigation = mitigating.reduce((sum, f) => sum + f.score_reduction, 0);
  const totalAggravation = aggravating.reduce((sum, f) => sum + f.score_increase, 0);

  // Apply amount multiplier
  let adjustedScore = rawScore - totalMitigation + totalAggravation;
  adjustedScore = Math.round(adjustedScore * amountInfo.multiplier);
  adjustedScore = Math.max(0, Math.min(100, adjustedScore));

  const risk = classifyRisk(adjustedScore);

  // ---- Step 11: Generate contextual analysis ----
  const contextualAnalysis = generateContextualAnalysis(finding, deduped, mitigating, aggravating, adjustedScore);
  const whatToWatchFor = generateWatchList(finding, deduped, mitigating);

  return {
    ...finding,
    adjusted_score: adjustedScore,
    raw_score: rawScore,
    risk_level: risk.level,
    risk_label: risk.label,
    mitigating_factors: mitigating,
    aggravating_factors: aggravating,
    contextual_analysis: contextualAnalysis,
    what_to_watch_for: whatToWatchFor,
    data_quality: dataQuality,
    deduplicated_contracts: deduped,
    amount_tier: amountInfo.tier,
    amount_tier_label: amountInfo.label,
  };
}

// ── Contextual Analysis Generation ─────────────────────────────────────

function generateContextualAnalysis(
  finding: RawFinding,
  contracts: RealEvidenceContract[],
  mitigating: MitigatingFactor[],
  aggravating: AggravatingFactor[],
  adjustedScore: number,
): string {
  const inst = finding.target_institution;
  const vendor = String(finding.detail['업체'] ?? finding.detail['vendor'] ?? '');
  const hasMitigation = mitigating.length > 0;
  const hasAggravation = aggravating.length > 0;

  if (adjustedScore < 15) {
    return `분석 결과, ${inst}의 이 계약 패턴은 정상적인 조달 활동으로 판단됩니다. ${hasMitigation ? `${mitigating[0].label} 등의 구조적 요인이 확인되었으며, ` : ''}해당 분야에서 이러한 계약 패턴은 통상적입니다.`;
  }

  if (adjustedScore < 35) {
    return `${inst}의 계약 패턴에서 통계적 이상이 감지되었으나, ${hasMitigation ? `${mitigating.slice(0, 2).map(m => m.label).join(', ')} 등의 정상적 사유가 확인되었습니다. ` : ''}현재 수준에서는 즉각적인 우려보다는 장기적 모니터링이 적절합니다.`;
  }

  if (adjustedScore < 60) {
    let analysis = `${inst}에서 ${vendor ? `${vendor}과(와)의 거래에서 ` : ''}주의가 필요한 패턴이 확인되었습니다.`;
    if (hasMitigation) {
      analysis += ` ${mitigating[0].label} 등 일부 정상적 사유가 있으나,`;
    }
    if (hasAggravation) {
      analysis += ` ${aggravating[0].label} 등의 요인은 추가 점검이 필요합니다.`;
    } else {
      analysis += ' 계약 사유서와 가격 적정성을 확인하면 더 정확한 판단이 가능합니다.';
    }
    return analysis;
  }

  return `${inst}의 계약 패턴에서 심층 점검이 필요한 요소가 발견되었습니다. ${vendor ? `${vendor}과(와)의 거래 구조를 ` : ''}면밀히 검토하고, 수의계약 사유서, 가격 비교 자료, 대안 업체 존재 여부를 확인할 것을 권고합니다.${hasAggravation ? ` 특히 ${aggravating[0].label}에 주목할 필요가 있습니다.` : ''}`;
}

function generateWatchList(
  finding: RawFinding,
  contracts: RealEvidenceContract[],
  mitigating: MitigatingFactor[],
): string {
  const items: string[] = [];
  const inst = finding.target_institution;
  const vendor = String(finding.detail['업체'] ?? finding.detail['vendor'] ?? '');

  if (finding.pattern_type === 'vendor_concentration') {
    items.push(`${vendor}의 계약 단가가 동일 품목의 타 기관 계약 단가와 비교하여 적정한지 확인`);
    items.push('이전 연도에도 동일한 집중 패턴이 반복되는지 확인');
    if (mitigating.length === 0) {
      items.push('해당 분야에 대안 업체가 존재하는지, 입찰 공고가 충분히 공개되었는지 확인');
    }
  }

  if (finding.pattern_type === 'repeated_sole_source') {
    items.push('각 수의계약의 사유서가 법적 요건을 충족하는지 개별 확인');
    items.push(`${inst}의 전체 연간 계약 중 수의계약 비율이 유사 기관 대비 높은지 비교`);
    items.push('동일 업체에 대한 반복 수의계약이 3년 이상 지속되는지 확인');
  }

  if (finding.pattern_type === 'contract_splitting') {
    items.push('분할된 계약들이 실제로 하나의 사업인지, 독립된 별개 사업인지 확인');
    items.push('계약 시기가 비정상적으로 집중되어 있는지 확인');
    items.push('동일 사업에 대한 설계서/사업계획서가 원래 하나였는지 확인');
  }

  return items.length > 0 ? items.join('\n') : '추가 확인이 필요한 특별한 사항이 없습니다.';
}

// ── Batch Processing ───────────────────────────────────────────────────

// ── High-Value Sole-Source Detection ────────────────────────────────────
// The most important signal: individual contracts above thresholds that
// went through sole-source without clear justification.

// Categories that are exempt from high-value sole-source flagging
const EXEMPT_KEYWORDS = [
  '교과용도서', '교과서', '도서 공급',           // Textbooks (legally mandated)
  '사랑상품권', '상품권 제작',                    // Local vouchers (조폐공사 only)
  '학력평가', '성적전산처리',                     // National exam processing (KICE only)
  '교장 자격연수', '교원 양성',                   // Teacher training (designated universities)
  '열전대', 'Scintillator', '검출기', 'Detector', // Scientific instruments (sole supplier)
  'MTU', '주기관', '함정',                        // Military engine parts
];

function isExemptContract(name: string): boolean {
  return EXEMPT_KEYWORDS.some(kw => name.includes(kw));
}

function detectHighValueSoleSource(findings: RawFinding[]): EnrichedFinding[] {
  const hvFindings: EnrichedFinding[] = [];
  const seen = new Set<string>();

  for (const f of findings) {
    const deduped = Array.from(
      new Map(f.evidence_contracts.map(c => [c.no, c])).values()
    );

    for (const c of deduped) {
      // Only flag 수의계약 above ₩1억 without legal basis for the amount
      if (!c.method.includes('수의')) continue;
      if (c.amount < 100_000_000) continue; // 1억원 미만은 스킵
      if (isExemptContract(c.name)) continue;
      if ((c.reason || '').includes('2천만원 이하')) continue;
      if (seen.has(c.no)) continue;
      seen.add(c.no);

      // Check commodity rules for this specific contract
      const contractText = `${c.name} ${c.vendor} ${f.target_institution}`;
      const hasCommodityExemption = COMMODITY_RULES.some(rule =>
        matchesAny(contractText, rule.keywords)
      );

      // Score based on amount: higher amount = more suspicious for sole-source
      let score: number;
      if (c.amount >= 1_000_000_000) score = 85;       // 10억+
      else if (c.amount >= 500_000_000) score = 75;     // 5억+
      else if (c.amount >= 200_000_000) score = 60;     // 2억+
      else score = 45;                                   // 1억+

      // Reduce for commodity exemptions
      if (hasCommodityExemption) score -= 25;
      // Reduce if legal reason is provided
      if (c.reason && c.reason.length > 10) score -= 15;

      score = Math.max(15, Math.min(100, score));

      const risk = classifyRisk(score);
      const amountStr = formatAmount(c.amount);

      const mitigating: MitigatingFactor[] = [];
      const aggravating: AggravatingFactor[] = [];

      if (hasCommodityExemption) {
        mitigating.push({
          id: 'commodity_exemption',
          label: '구조적 공급 제한 품목',
          explanation: '이 품목은 공급업체가 구조적으로 제한된 시장에 해당할 수 있습니다.',
          score_reduction: 25,
        });
      }
      if (c.reason && c.reason.length > 10) {
        mitigating.push({
          id: 'has_legal_basis',
          label: '법적 근거 표기됨',
          explanation: `수의계약 사유: ${c.reason}`,
          score_reduction: 15,
        });
      }

      if (!c.reason || c.reason.length <= 10) {
        aggravating.push({
          id: 'no_reason_cited',
          label: '수의계약 사유 미표기',
          explanation: `${amountStr} 규모의 수의계약에 법적 근거가 표기되지 않았습니다. 이 규모에서는 수의계약 사유서가 반드시 필요합니다.`,
          score_increase: 10,
        });
      }

      if (c.amount >= 500_000_000) {
        aggravating.push({
          id: 'very_large_sole_source',
          label: `${amountStr} 규모 수의계약`,
          explanation: `${amountStr}은 수의계약으로 집행하기에 매우 큰 금액입니다. 이 규모에서는 공개 경쟁 입찰을 통해 가격 절감과 투명성을 확보하는 것이 원칙입니다. 수의계약 한도를 초과했을 가능성이 있습니다.`,
          score_increase: 15,
        });
      }

      const watchItems = [
        `이 계약의 수의계약 사유서를 확인하여 법적 근거의 적법성 검토`,
        `동일 품목의 타 기관 계약 가격과 비교하여 단가 적정성 확인`,
        `${c.vendor}이(가) 이 분야의 유일한 공급업체인지, 대안 업체가 존재하는지 확인`,
        c.amount >= 500_000_000 ? '경쟁 입찰 불가 사유가 실제로 존재하는지 확인 (특허, 호환성, 긴급성 등)' : '',
      ].filter(Boolean);

      hvFindings.push({
        pattern_type: 'high_value_sole_source',
        severity: score >= 60 ? 'HIGH' : 'MEDIUM',
        suspicion_score: score,
        target_institution: f.target_institution,
        summary: `${f.target_institution}에서 ${c.vendor}에게 ${amountStr} 규모의 수의계약을 체결했습니다. "${c.name}"`,
        detail: {
          '기관': f.target_institution,
          '업체': c.vendor,
          '계약명': c.name,
          '계약금액': c.amount,
          '계약방식': c.method,
          '법적근거': c.reason || '(미표기)',
        },
        evidence_contracts: [c],
        innocent_explanation: '',
        adjusted_score: score,
        raw_score: score,
        risk_level: risk.level,
        risk_label: risk.label,
        mitigating_factors: mitigating,
        aggravating_factors: aggravating,
        contextual_analysis: `${f.target_institution}에서 "${c.name}" 계약(${amountStr})이 경쟁 입찰 없이 ${c.vendor}에게 수의계약으로 발주되었습니다. 이 규모에서는 공개 경쟁 입찰이 원칙이며, 수의계약 사유의 적법성을 확인할 필요가 있습니다.`,
        what_to_watch_for: watchItems.join('\n'),
        data_quality: {
          duplicate_contracts: 0,
          unique_contracts: 1,
          single_day_snapshot: false,
          small_sample: false,
        },
        deduplicated_contracts: [c],
        amount_tier: c.amount >= 500_000_000 ? 'large' : 'medium',
        amount_tier_label: c.amount >= 500_000_000 ? '대규모' : '중규모',
      });
    }
  }

  return hvFindings;
}

// ── Batch Processing ───────────────────────────────────────────────────

export function enrichAllFindings(findings: RawFinding[]): EnrichedFinding[] {
  // Enrich existing pattern-based findings
  const enriched = findings.map(enrichFinding);

  // Add high-value sole-source findings (individual contract analysis)
  const highValue = detectHighValueSoleSource(findings);
  enriched.push(...highValue);

  return enriched.sort((a, b) => b.adjusted_score - a.adjusted_score);
}

// ── Risk Level Styling ─────────────────────────────────────────────────

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'CONCERN': return '#dc2626';
    case 'WATCH': return '#d97706';
    case 'LOW_RISK': return '#6b7280';
    case 'NORMAL': return '#16a34a';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'CONCERN': return '#fef2f2';
    case 'WATCH': return '#fffbeb';
    case 'LOW_RISK': return '#f9fafb';
    case 'NORMAL': return '#f0fdf4';
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000_000) return `${(amount / 1_000_000_000_000).toFixed(1)}조원`;
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억원`;
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만원`;
  return `${amount.toLocaleString()}원`;
}
