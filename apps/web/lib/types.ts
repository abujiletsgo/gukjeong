// 국정투명 TypeScript 타입 정의
// packages/shared/types 와 동기화 유지

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

export interface FiscalYearly {
  year: number;
  totalSpending?: number;
  totalRevenue?: number;
  taxRevenue?: number;
  nationalDebt?: number;
  gdp?: number;
  debtToGdp?: number;
  presidentId?: string;
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
  severity: string;
  suspicionScore: number;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  aiAnalysis?: string;
  status: string;
}

export interface DepartmentScore {
  department: string;
  suspicionScore: number;
  flagCount: number;
  transparencyRank?: number;
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
