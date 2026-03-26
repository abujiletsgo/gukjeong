'use client';
// 감사 패턴 뱃지
export default function PatternBadge({ pattern, score }: { pattern: string; score: number }) {
  const labels: Record<string, string> = {
    yearend_spike: '연말 급증',
    vendor_concentration: '업체 집중',
    contract_splitting: '계약 분할',
    inflated_pricing: '고가 계약',
    bid_rigging: '입찰 담합',
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
      {labels[pattern] || pattern} ({score})
    </span>
  );
}
