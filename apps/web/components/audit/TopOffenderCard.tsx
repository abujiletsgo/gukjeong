'use client';

import PatternBadge from './PatternBadge';

interface TopOffenderCardProps {
  institution: string;
  findingCount: number;
  patternTypes: string[];
  suspicionScore: number;
  totalAmount: number;
}

function formatAmountShort(n: number): string {
  if (n === 0) return '-';
  const jo = Math.floor(n / 1_000_000_000_000);
  const eok = Math.floor((n % 1_000_000_000_000) / 100_000_000);
  if (jo > 0 && eok > 0) return `${jo}조 ${eok}억`;
  if (jo > 0) return `${jo}조`;
  if (eok > 0) return `${eok}억`;
  const man = Math.floor(n / 10_000);
  if (man > 0) return `${man.toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

export default function TopOffenderCard({
  institution,
  findingCount,
  patternTypes,
  totalAmount,
}: TopOffenderCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-4 border"
      style={{
        background: '#FFFFFF',
        borderColor: 'var(--apple-gray-5)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: text */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-gray-900 truncate">{institution}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--apple-gray-1)' }}>
          <span className="font-semibold" style={{ color: 'var(--apple-red)' }}>
            {findingCount}건 발견
          </span>
          {totalAmount > 0 && (
            <> · {formatAmountShort(totalAmount)}</>
          )}
        </p>
        {patternTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {patternTypes.slice(0, 4).map((pt) => (
              <PatternBadge key={pt} pattern={pt} size="sm" />
            ))}
            {patternTypes.length > 4 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--apple-gray-6)', color: 'var(--apple-gray-1)' }}
              >
                +{patternTypes.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: finding count badge */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: 'rgba(255,59,48,0.10)', color: 'var(--apple-red)' }}
      >
        {findingCount}
      </div>
    </div>
  );
}
