'use client';

interface AuditHeroProps {
  totalFindings: number;
  totalAmount: number;
  topInstitution: string;
  topPatternName: string;
  generatedAt?: string;
}

function formatAmount(n: number): string {
  if (n === 0) return '0원';
  const jo = Math.floor(n / 1_000_000_000_000);
  const remainder = n % 1_000_000_000_000;
  const eok = Math.floor(remainder / 100_000_000);

  if (jo > 0 && eok > 0) {
    return `${jo}조 ${eok}억`;
  }
  if (jo > 0) {
    return `${jo}조`;
  }
  if (eok > 0) {
    return `${eok}억`;
  }
  const man = Math.floor(n / 10_000);
  if (man > 0) {
    return `${man.toLocaleString()}만원`;
  }
  return `${n.toLocaleString()}원`;
}

export default function AuditHero({
  totalFindings,
  totalAmount,
  topInstitution,
  topPatternName,
  generatedAt,
}: AuditHeroProps) {
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      }}
    >
      <div className="px-5 sm:px-8 pt-7 pb-5">
        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,59,48,0.18)', color: '#FF6B6B' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
          AI 자동 감사 결과
          {dateStr && <span className="opacity-70 font-normal">· {dateStr}</span>}
        </div>

        {/* Main Headline */}
        <h1
          className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2"
          style={{ color: '#FFFFFF' }}
        >
          이번 분석: {formatAmount(totalAmount)} 규모 의심 계약{' '}
          <span style={{ color: '#FF9500' }}>{totalFindings.toLocaleString()}건</span> 발견
        </h1>

        {/* Sub-text */}
        <p className="text-sm sm:text-base mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
          가장 많은 이상 징후가 발견된 기관:{' '}
          <span className="font-semibold" style={{ color: '#5AC8FA' }}>{topInstitution}</span>
        </p>

        {/* Disclaimer */}
        <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.38)' }}>
          * 본 분석은 패턴 기반 자동 감사입니다. 법적 판단이 아닙니다.
        </p>
      </div>

      {/* 3-stat strip */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{
          background: 'rgba(0,0,0,0.28)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="px-4 sm:px-6 py-4 text-center">
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FF9500' }}>
            {totalFindings.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            총 의심 건수
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 text-center">
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FF6B6B' }}>
            {formatAmount(totalAmount)}
          </div>
          <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            의심 금액 합계
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 text-center">
          <div
            className="text-xs sm:text-sm font-semibold truncate"
            style={{ color: '#5AC8FA' }}
            title={topPatternName}
          >
            {topPatternName}
          </div>
          <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            최다 발견 패턴
          </div>
        </div>
      </div>
    </div>
  );
}
