// 국정투명 공유 상수

// 티어별 제한
export const TIER_LIMITS = {
  anonymous: { searchPerDay: 5, results: 10, filters: ['year', 'sector'] },
  free_registered: { searchPerDay: 15, results: 20, filters: ['year', 'sector', 'department'] },
  citizen_pro: { searchPerDay: -1, results: 100, filters: 'all' as const, downloads: 10 },
  institution: { searchPerDay: -1, results: -1, filters: 'all' as const, api: 100000 },
  api_only: { apiCallsPerMonth: 50000 },
} as const;

// 크레딧 보상
export const CREDIT_REWARDS = {
  profile_level_1: 50,
  profile_level_2: 100,
  profile_level_3: 200,
  basic_survey: 30,
  deliberative_survey: 80,
  citizen_report: 200,
  friend_referral: 100,
  daily_checkin: 5,
  weekly_streak: 50,
} as const;

// Pro 전환 비용
export const PRO_REDEMPTION_COST = 500;

// 감사 패턴 가중치
export const AUDIT_PATTERN_WEIGHTS = {
  yearend_spike: 15,
  vendor_concentration: 15,
  inflated_pricing: 20,
  contract_splitting: 20,
  zombie_project: 10,
  revolving_door: 30,
  paper_company: 25,
  unnecessary_renovation: 10,
  poor_roi: 20,
  bid_rigging: 30,
} as const;

// 의심 점수 등급
export const SEVERITY_SCALE = {
  LOW: { min: 0, max: 20, emoji: '🟢', label: '낮음' },
  MEDIUM: { min: 21, max: 40, emoji: '🟡', label: '보통' },
  HIGH: { min: 41, max: 60, emoji: '🟠', label: '높음' },
  CRITICAL: { min: 61, max: 80, emoji: '🔴', label: '심각' },
  EXTREME: { min: 81, max: 100, emoji: '⚫', label: '극심' },
} as const;

// 미디어 스펙트럼
export const SPECTRUM_LABELS = {
  1.0: '강한 진보',
  2.0: '진보',
  3.0: '중도',
  4.0: '보수',
  5.0: '강한 보수',
} as const;

// 가격 정보
export const PRICING = {
  citizen_pro: { price: 3900, currency: 'KRW', period: 'month', label: '시민 Pro' },
  institution: { price: 190000, currency: 'KRW', period: 'month', label: '기관' },
  api_only: { price: 90000, currency: 'KRW', period: 'month', label: 'API 전용' },
  institution_panel: { price: 390000, currency: 'KRW', period: 'month', label: '기관 + 패널' },
} as const;

// 색상
export const COLORS = {
  headerBg: '#0f172a',
  bodyBg: '#fafaf8',
  accent: '#ff6b35',
  progressive: '#3b82f6',
  conservative: '#ef4444',
  neutral: '#6b7280',
} as const;
