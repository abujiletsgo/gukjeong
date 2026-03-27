'use client';
// 크레딧 뱃지 — 현재 크레딧 잔액 표시

interface CreditBadgeProps {
  balance: number;
}

export default function CreditBadge({ balance }: CreditBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm"
      aria-label={`크레딧 잔액: ${balance.toLocaleString()}`}
    >
      <span aria-hidden="true">💰</span>
      <span className="font-semibold">{balance.toLocaleString()}</span>
      <span className="text-xs">크레딧</span>
    </div>
  );
}
