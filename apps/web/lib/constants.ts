// 공유 상수 — 하드코딩된 값들을 한곳에서 관리

// 정당 색상
export const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1a5dab',
  '국민의힘': '#e6002d',
  '정의당': '#fdcc00',
  '국민의당': '#ea5504',
  '새누리당': '#e6002d',
  '한나라당': '#0066b3',
  '열린우리당': '#009a4e',
  '새천년민주당': '#0066b3',
  '민주자유당': '#0066b3',
  '새정치국민회의': '#0066b3',
  '신한국당': '#0066b3',
  '무소속': '#6b7280',
};

// 분야별 색상 (예산 차트)
export const SECTOR_COLORS: Record<string, string> = {
  '보건·복지·고용': '#3b82f6',
  '일반·지방행정': '#8b5cf6',
  '교육': '#06b6d4',
  '국방': '#ef4444',
  '산업·중소기업·에너지': '#f97316',
  'R&D': '#10b981',
  '공공질서·안전': '#6366f1',
  'SOC': '#d97706',
  '농림·수산·식품': '#84cc16',
  '환경': '#14b8a6',
  '문화·체육·관광': '#ec4899',
};

// 대통령별 색상
export const PRESIDENT_COLORS: Record<string, string> = {
  ysk: '#6b7280',
  kdj: '#3b82f6',
  nmh: '#10b981',
  lmb: '#ef4444',
  pgh: '#ec4899',
  mji: '#3b82f6',
  ysy: '#ef4444',
  ljm: '#3b82f6',
};

// 심각도 색상
export const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
  EXTREME: '#1f2937',
};

// 심각도 라벨
export const SEVERITY_LABELS: Record<string, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  CRITICAL: '심각',
  EXTREME: '극심',
};

// 감사 패턴 라벨
export const PATTERN_LABELS: Record<string, string> = {
  yearend_spike: '연말 지출 급증',
  vendor_concentration: '업체 집중도',
  contract_splitting: '계약 분할',
  inflated_pricing: '과다 단가',
  zombie_project: '좀비 사업',
  revolving_door: '관피아',
  paper_company: '페이퍼컴퍼니',
  unnecessary_renovation: '반복 보수',
  poor_roi: '저효율 사업',
  bid_rigging: '입찰 담합',
};

// 감사 패턴 아이콘
export const PATTERN_ICONS: Record<string, string> = {
  yearend_spike: '📅',
  vendor_concentration: '🏢',
  contract_splitting: '✂️',
  inflated_pricing: '💸',
  zombie_project: '🧟',
  revolving_door: '🚪',
  paper_company: '📄',
  unnecessary_renovation: '🔨',
  poor_roi: '📉',
  bid_rigging: '🤝',
};

// 차트 기본 색상 팔레트
export const DEFAULT_CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#d97706', '#6366f1',
  '#14b8a6',
];

// 미디어 스펙트럼 색상
export const MEDIA_SPECTRUM = {
  STRONG_PROGRESSIVE: { min: 1.0, max: 1.5, color: '#1d4ed8', label: '강한진보' },
  PROGRESSIVE: { min: 1.5, max: 2.5, color: '#3b82f6', label: '진보' },
  CENTER: { min: 2.5, max: 3.5, color: '#6b7280', label: '중도' },
  CONSERVATIVE: { min: 3.5, max: 4.5, color: '#ef4444', label: '보수' },
  STRONG_CONSERVATIVE: { min: 4.5, max: 5.0, color: '#b91c1c', label: '강한보수' },
};

// 의안 상태 색상
export const BILL_STATUS_COLORS: Record<string, string> = {
  '계류': '#eab308',
  '가결': '#22c55e',
  '폐기': '#6b7280',
  '부결': '#ef4444',
  '철회': '#9ca3af',
  '수정가결': '#3b82f6',
  '임기만료폐기': '#a1a1aa',
};
