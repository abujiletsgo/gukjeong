// 국정투명 공유 TypeScript 타입
// Backend Pydantic 스키마가 source of truth (snake_case).

// 대통령
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
}

// 재정
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

// 법안
export interface Bill {
  id: string;
  bill_no?: string;
  title: string;
  proposed_date?: string;
  proposer_type?: string;
  proposer_name?: string;
  committee?: string;
  status?: string;
  vote_result?: Record<string, unknown>;
  ai_summary?: string;
  ai_category?: string;
  ai_controversy_score?: number;
  ai_citizen_impact?: string;
}

// 국회의원
export interface Legislator {
  id: string;
  name: string;
  party?: string;
  district?: string;
  attendance_rate?: number;
  vote_participation_rate?: number;
  pledge_fulfillment_rate?: number;
  ai_activity_score?: number;
  consistency_score?: number;
  bills_proposed_count?: number;
}

// 감사 플래그
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
}

// 부처별 감사 점수
export interface DepartmentScore {
  department: string;
  year?: number;
  quarter?: number;
  suspicion_score: number;
  flag_count: number;
  transparency_rank?: number;
  details?: Record<string, unknown>;
}

// 뉴스 이벤트
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
}

// 미디어 매체
export interface MediaOutlet {
  id: string;
  name: string;
  type: string;
  spectrum_score: number;
  category: string;
  rss_url?: string;
  website_url?: string;
}

// 설문
export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  total_responses: number;
  representativeness_score?: number;
}

// 사용자
export interface User {
  id: string;
  nickname?: string;
  tier: 'free' | 'citizen_pro' | 'institution';
  region_sido?: string;
}

// 크레딧
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

// 정책
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

// 주요 사건
export interface KeyEvent {
  id: string;
  event_date: string;
  title: string;
  description?: string;
  impact_type?: string;
  significance_score?: number;
}

// 계약
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

// 티어 제한
export interface TierLimits {
  searchPerDay: number;
  results: number;
  filters: string[] | 'all';
  downloads?: number;
  api?: number;
}

// API 응답 래퍼
export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  message?: string;
}
