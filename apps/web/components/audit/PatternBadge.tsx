'use client';
// 감사 패턴 뱃지 — 아이콘 포함

interface PatternBadgeProps {
  pattern: string;
  score?: number;
  size?: 'sm' | 'md';
}

const PATTERN_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  yearend_spike: { label: '연말 급증', icon: '📈', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  vendor_concentration: { label: '업체 집중', icon: '🏢', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  inflated_pricing: { label: '고가 계약', icon: '💰', color: 'bg-red-50 text-red-700 border-red-200' },
  contract_splitting: { label: '계약 분할', icon: '✂️', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  zombie_project: { label: '좀비 사업', icon: '🧟', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  revolving_door: { label: '전관예우', icon: '🚪', color: 'bg-red-50 text-red-700 border-red-200' },
  paper_company: { label: '페이퍼 컴퍼니', icon: '📄', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  unnecessary_renovation: { label: '불필요 개보수', icon: '🔧', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  poor_roi: { label: '낮은 ROI', icon: '📉', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  bid_rigging: { label: '입찰 담합', icon: '🤝', color: 'bg-red-50 text-red-700 border-red-200' },
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
