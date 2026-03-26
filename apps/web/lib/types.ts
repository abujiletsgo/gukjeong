// 국정투명 TypeScript 타입 정의
// Backend Pydantic 스키마가 source of truth (snake_case).
// 프론트엔드에서는 API 응답 그대로 snake_case 필드를 사용합니다.

export interface President {
  id: string;
  name: string;
  name_en?: string;
  term_start: string;
  term_end?: string | null;
  party?: string;
  era?: string;
  gdp_growth_avg?: number;
  portrait_url?: string;
  key_metric?: string;
  note?: string;
  fiscal_data?: FiscalYearly[];
}

export interface FiscalYearly {
  year: number;
  total_spending?: number;
  total_revenue?: number;
  tax_revenue?: number;
  national_debt?: number;
  gdp?: number;
  debt_to_gdp?: number;
  fiscal_balance?: number;
  president_id?: string;
}

export interface FiscalBySector {
  year?: number;
  sector: string;
  amount?: number;
  percentage?: number;
  yoy_change?: number;
}

export interface FiscalByDepartment {
  department: string;
  year?: number;
  budget_proposed?: number;
  budget_approved?: number;
  budget_executed?: number;
  execution_rate?: number;
}

export interface Bill {
  id: string;
  bill_no?: string;
  title: string;
  proposed_date?: string;
  proposer_type?: string;
  proposer_name?: string;
  committee?: string;
  status?: string;
  status_detail?: string;
  vote_result?: BillVoteResult;
  ai_summary?: string;
  ai_category?: string;
  ai_controversy_score?: number;
  ai_citizen_impact?: string;
  co_sponsors_count?: number;
  related_bills?: string[];
}

export interface Legislator {
  id: string;
  name: string;
  name_en?: string;
  party?: string;
  district?: string;
  region?: string;
  elected_count?: number;         // 당선 횟수
  committee?: string;             // 소속 위원회
  // 성과 지표
  attendance_rate?: number;
  vote_participation_rate?: number;
  pledge_fulfillment_rate?: number;
  ai_activity_score?: number;
  consistency_score?: number;
  bills_proposed_count?: number;
  bills_passed_count?: number;
  speech_count?: number;          // 본회의 발언 수
  asset_total?: number;           // 재산 총액 (억원)
  // 말과 행동 분석
  consistency_details?: ConsistencyItem[];
  // 프로필
  photo_url?: string;
  age?: number;
  gender?: string;
  career_summary?: string;        // 약력 요약
}

export interface ConsistencyItem {
  topic: string;
  speech_stance: string;          // 발언에서의 입장
  vote_stance: string;            // 실제 투표
  is_consistent: boolean;
  explanation?: string;
}

export interface AuditFlag {
  id: string;
  pattern_type: string;
  severity: string;
  suspicion_score: number;
  target_type?: string;
  target_id?: string;
  detail?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  ai_analysis?: string;
  related_bai_case?: string;
  status: string;
  created_at?: string;
  // 시민을 위한 상세 설명
  plain_explanation?: string;     // 이 패턴이 뭔지 쉽게 설명
  why_it_matters?: string;        // 왜 의심스러운지
  innocent_explanation?: string;  // 비리가 아닐 수 있는 합리적 이유
  citizen_impact?: string;        // 세금이 어떻게 낭비될 수 있는지
  what_should_happen?: string;    // 어떤 조치가 필요한지
  real_case_example?: string;     // 요약 (기존 호환)
  similar_cases?: SimilarCase[];   // 상세 유사 사례 목록
  // 관련 링크
  related_links?: AuditLink[];
  // 관련 계약 정보
  contracts?: AuditContract[];
  // 타임라인
  timeline?: AuditTimelineItem[];
}

export interface SimilarCase {
  title: string;              // e.g., "2019년 한국도로공사 연말 밀어내기"
  year: number;
  source: string;             // e.g., "감사원 감사결과보고서"
  department: string;
  summary: string;            // 2-3 sentences
  amount_involved: string;    // e.g., "287억원"
  outcome: string;            // 어떤 조치가 내려졌는지
  current_status: string;     // 현재 상태
}

export interface AuditLink {
  title: string;
  url: string;
  source: string;
}

export interface AuditContract {
  title: string;
  amount: number;            // 원
  vendor: string;
  date: string;
  method: string;            // 일반경쟁, 수의계약, 제한경쟁 등
  // 프로세스 상세
  approver?: string;         // 승인자 직위
  competitors?: ContractBid[];  // 경쟁 입찰 현황 (경쟁입찰인 경우)
  justification?: string;    // 수의계약 사유 (수의계약인 경우)
  budget_code?: string;      // 예산 항목 코드
  execution_period?: string; // 계약 이행 기간
}

export interface ContractBid {
  vendor: string;
  bid_amount: number;    // 입찰 금액
  selected: boolean;     // 낙찰 여부
  note?: string;         // 비고 (e.g., "최저가", "기술평가 1위")
}

export interface AuditTimelineItem {
  date: string;
  event: string;
  type: 'detection' | 'investigation' | 'resolution' | 'info';
}

export interface DepartmentScore {
  department: string;
  year?: number;
  quarter?: number;
  suspicion_score: number;
  flag_count: number;
  transparency_rank?: number;
  details?: Record<string, unknown>;
}

export interface Contract {
  id: string;
  g2b_id?: string;
  title?: string;
  department?: string;
  vendor_name?: string;
  vendor_id?: string;
  amount?: number;
  contract_method?: string;
  contract_date?: string;
  category?: string;
}

export interface Policy {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: string;
  impact_score?: number;
  ai_summary?: string;
  start_date?: string;
  end_date?: string;
}

export interface KeyEvent {
  id: string;
  event_date: string;
  title: string;
  description?: string;
  impact_type?: string;
  significance_score?: number;
  // 시민을 위한 상세 설명
  why_it_matters?: string;       // 왜 이 사건이 중요한가 (쉬운 설명)
  citizen_impact?: string;       // 시민 생활에 미친 구체적 영향
  background?: string;           // 배경 — 이 사건이 일어나게 된 맥락
  what_happened_after?: string;  // 이후 어떻게 됐는가
  related_numbers?: string;      // 관련 수치 (사망자, 금액 등)
}

export interface NewsEvent {
  id: string;
  title: string;
  event_date?: string;
  category?: string;
  ai_summary?: string;
  key_facts?: string[];
  progressive_frame?: Record<string, string>;
  conservative_frame?: Record<string, string>;
  citizen_takeaway?: string;
  article_count?: number;
  coverage?: NewsArticle[];
}

export interface NewsArticle {
  outlet_id: string;
  outlet_name: string;
  headline: string;
  spectrum_score: number;
  category: string;
  url?: string;
}

export interface BillVoteResult {
  total: number;
  yes: number;
  no: number;
  abstain: number;
  absent: number;
}

export interface MediaOutlet {
  id: string;
  name: string;
  type: string;
  spectrum_score: number;
  category: string;
  rss_url?: string;
  website_url?: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  total_responses: number;
  representativeness_score?: number;
}

export interface User {
  id: string;
  nickname?: string;
  tier: 'free' | 'citizen_pro' | 'institution';
  region_sido?: string;
}

export interface CreditBalance {
  balance: number;
  history: CreditEntry[];
}

export interface CreditEntry {
  amount: number;
  reason: string;
  description?: string;
  created_at?: string;
}

export interface NationalAgenda {
  id: string;
  president_id: string;
  agenda_number: number;
  goal_category: string;
  strategy?: string;
  title: string;
  description?: string;
  implementation_status: string;
  completion_rate: number;
  budget_committed?: number;
  budget_executed?: number;
  target_metric?: string;
  target_value?: string;
  actual_value?: string;
  outcome_summary?: string;
  ai_assessment?: string;
  ai_citizen_impact?: string;
  // 시민을 위한 상세 설명
  plain_explanation?: string;    // 이 과제가 뭔지 쉽게 설명
  why_it_matters?: string;       // 왜 중요한가
  citizen_impact?: string;       // 시민 생활에 미친 영향
  success_or_failure?: string;   // 성공/실패 이유
  real_example?: string;         // 실제 체감 사례
}

export interface ReportCardMetric {
  id: string;
  president_id: string;
  category: string;
  metric_name: string;
  baseline_value: number;
  baseline_year: number;
  target_value?: number;
  final_value: number;
  unit: string;
  trend: 'improved' | 'worsened' | 'stable';
  grade?: string;
  source: string;
  note?: string;
  // 다른 시각 (Multiple Perspectives)
  progressive_frame?: string;   // 진보 언론 평가
  conservative_frame?: string;  // 보수 언론 평가
  citizen_reality?: string;     // 실제 시민 체감
  context_note?: string;        // 맥락 설명 (왜 이 수치가 중요한지)
  real_world_example?: string;  // 구체적 사례
}

export interface CampaignPledge {
  id: string;
  president_id: string;
  pledge_text: string;
  category: string;
  pledge_source: string;
  pledge_date?: string;
  fulfillment_status: string;
  fulfillment_pct: number;
  outcome_summary?: string;
  budget_impact?: string;
  related_bills?: string[];
  // 시민을 위한 상세 설명
  plain_explanation?: string;    // 이 공약이 뭔지 쉽게 설명
  why_it_matters?: string;       // 왜 이 공약이 중요한가
  citizen_impact?: string;       // 시민 생활에 미친 영향
  what_went_wrong?: string;      // 미이행/일부이행인 경우 왜 안 됐는지
  real_example?: string;         // 실제 체감 사례
}

export interface PresidentComparisonMetrics {
  id: string;
  name: string;
  era: string;
  party?: string;
  term_start: string;
  term_end?: string | null;
  gdp_growth_avg?: number;
  // Fiscal
  avg_spending: number;          // avg annual spending (조원)
  spending_growth_pct: number;   // % increase start to end
  debt_growth_pct: number;       // % increase start to end
  avg_debt_to_gdp: number;      // average debt/GDP ratio
  // Social indicators (verified data)
  unemployment_avg: number;      // 평균 실업률 %
  housing_price_change: number;  // 서울 주택가격 변동률 %
  birth_rate_end: number;        // 임기 마지막 해 합계출산율
  approval_avg: number;          // 평균 지지율 %
  // Governance
  policies_count: number;        // 주요 정책 수
  key_events_count: number;      // 주요 사건 수
  pledge_fulfillment_avg: number; // 공약 평균 이행률 %
  corruption_index_end: number;  // 임기말 CPI (투명성 지수, 100점 만점)
}

export interface SubSectorData {
  sector: string;
  sub_sector: string;
  amount: number;  // 조원
  percentage: number; // of parent sector
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  message?: string;
}
