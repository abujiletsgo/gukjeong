'use client';
// 감사 패턴 뱃지 — 아이콘 포함

interface PatternBadgeProps {
  pattern: string;
  score?: number;
  size?: 'sm' | 'md';
}

const PATTERN_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  // Core patterns (detected from data)
  ghost_company: { label: '유령업체', icon: '👻', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  zero_competition: { label: '경쟁 부재', icon: '🚫', color: 'bg-red-50 text-red-700 border-red-200' },
  bid_rate_anomaly: { label: '예정가격 유출 의심', icon: '🎯', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  new_company_big_win: { label: '신생업체 고액수주', icon: '🆕', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  vendor_concentration: { label: '업체 집중', icon: '🏢', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  repeated_sole_source: { label: '반복 수의계약', icon: '🔄', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  repeat_sole_source: { label: '반복 수의계약', icon: '🔄', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  contract_splitting: { label: '계약 분할', icon: '✂️', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  low_bid_competition: { label: '과소 경쟁', icon: '🤝', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  high_value_sole_source: { label: '고액 수의계약', icon: '💰', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  // Legacy / future patterns
  yearend_spike: { label: '연말 급증', icon: '📈', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  inflated_pricing: { label: '고가 계약', icon: '💰', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  bid_rigging: { label: '입찰 담합', icon: '🤝', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  revolving_door: { label: '전관예우', icon: '🚪', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  paper_company: { label: '페이퍼 컴퍼니', icon: '📄', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function PatternBadge({ pattern, score, size = 'sm' }: PatternBadgeProps) {
  const config = PATTERN_CONFIG[pattern] || {
    label: pattern,
    icon: '🔍',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const sizeClass = size === 'sm'
    ? 'text-[10px] sm:text-xs px-1.5 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${config.color} ${sizeClass} font-medium`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
