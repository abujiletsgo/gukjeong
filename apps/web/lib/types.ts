// 국정투명 TypeScript 타입 정의
// packages/shared/types 와 동기화 유지

export interface President {
  id: string;
  name: string;
  nameEn?: string;
  name_en?: string;
  termStart: string;
  termEnd?: string | null;
  term_start?: string;
  term_end?: string | null;
  party?: string;
  era?: string;
  gdpGrowthAvg?: number;
  gdp_growth_avg?: number;
  portraitUrl?: string;
  portrait_url?: string;
  note?: string;
  fiscalData?: FiscalYearly[];
}

export interface FiscalYearly {
  year: number;
  totalSpending?: number;
  total_spending?: number;
  totalRevenue?: number;
  total_revenue?: number;
  taxRevenue?: number;
  tax_revenue?: number;
  nationalDebt?: number;
  national_debt?: number;
  gdp?: number;
  debtToGdp?: number;
  debt_to_gdp?: number;
  fiscalBalance?: number;
  fiscal_balance?: number;
  presidentId?: string;
  president_id?: string;
}

export interface FiscalBySector {
  sector: string;
  amount: number;
  percentage?: number;
  yoy_change?: number;
  year?: number;
}

export interface Bill {
  id: string;
  billNo?: string;
  title: string;
  proposedDate?: string;
  status?: string;
  aiSummary?: string;
  aiCategory?: string;
  aiControversyScore?: number;
  aiCitizenImpact?: string;
}

export interface Legislator {
  id: string;
  name: string;
  party?: string;
  district?: string;
  attendanceRate?: number;
  aiActivityScore?: number;
  consistencyScore?: number;
  billsProposedCount?: number;
}

export interface AuditFlag {
  id: string;
  patternType: string;
  pattern_type?: string;
  severity: string;
  suspicionScore: number;
  suspicion_score?: number;
  targetType?: string;
  target_type?: string;
  targetId?: string;
  target_id?: string;
  detail?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  aiAnalysis?: string;
  ai_analysis?: string;
  status: string;
  createdAt?: string;
  created_at?: string;
}

export interface DepartmentScore {
  department: string;
  suspicionScore: number;
  suspicion_score?: number;
  flagCount: number;
  flag_count?: number;
  transparencyRank?: number;
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
}

export interface NewsEvent {
  id: string;
  title: string;
  eventDate?: string;
  category?: string;
  aiSummary?: string;
  keyFacts?: string[];
  progressiveFrame?: Record<string, string>;
  conservativeFrame?: Record<string, string>;
  citizenTakeaway?: string;
  articleCount?: number;
}

export interface MediaOutlet {
  id: string;
  name: string;
  type: string;
  spectrumScore: number;
  category: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  totalResponses: number;
  representativenessScore?: number;
}

export interface User {
  id: string;
  nickname?: string;
  tier: 'free' | 'citizen_pro' | 'institution';
}

export interface CreditBalance {
  balance: number;
  history: Array<{
    amount: number;
    reason: string;
    description?: string;
    createdAt: string;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  message?: string;
}
