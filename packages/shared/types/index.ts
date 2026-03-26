// 국정투명 공유 TypeScript 타입

// 대통령
export interface President {
  id: string;
  name: string;
  nameEn?: string;
  termStart: string;
  termEnd?: string | null;
  party?: string;
  era?: string;
  gdpGrowthAvg?: number;
  portraitUrl?: string;
}

// 재정
export interface FiscalYearly {
  year: number;
  totalSpending?: number;
  totalRevenue?: number;
  taxRevenue?: number;
  nationalDebt?: number;
  gdp?: number;
  debtToGdp?: number;
  fiscalBalance?: number;
  presidentId?: string;
}

// 법안
export interface Bill {
  id: string;
  billNo?: string;
  title: string;
  proposedDate?: string;
  status?: string;
  aiSummary?: string;
  aiCategory?: string;
  aiControversyScore?: number;
}

// 국회의원
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

// 감사 플래그
export interface AuditFlag {
  id: string;
  patternType: string;
  severity: string;
  suspicionScore: number;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  aiAnalysis?: string;
  status: string;
}

// 부처별 감사 점수
export interface DepartmentScore {
  department: string;
  suspicionScore: number;
  flagCount: number;
  transparencyRank?: number;
}

// 뉴스 이벤트
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

// 미디어 매체
export interface MediaOutlet {
  id: string;
  name: string;
  type: string;
  spectrumScore: number;
  category: string;
  rssUrl?: string;
  websiteUrl?: string;
}

// 설문
export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  totalResponses: number;
  representativenessScore?: number;
}

// 사용자
export interface User {
  id: string;
  nickname?: string;
  tier: 'free' | 'citizen_pro' | 'institution';
  regionSido?: string;
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
  createdAt: string;
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
