'use client';
import type { AuditFlag } from '@/lib/types';
import { getSeverityColor, getSeverityLabel } from '@/lib/utils';
import PatternBadge from './PatternBadge';

function VerdictBadge({ verdict }: { verdict: AuditFlag['verdict'] }) {
  if (!verdict) return null;
  const cfg = {
    suspicious:  { label: '의심 확실', bg: 'rgba(255,59,48,0.10)',  color: 'var(--apple-red)',    dot: 'var(--apple-red)' },
    investigate: { label: '조사 필요', bg: 'rgba(255,159,10,0.12)', color: 'var(--apple-orange)', dot: 'var(--apple-orange)' },
    legitimate:  { label: '정상 가능성', bg: 'rgba(52,199,89,0.10)', color: 'var(--apple-green)',  dot: 'var(--apple-green)' },
  }[verdict];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: cfg.bg }}>
      <div style={{ width: 6, height: 6, borderRadius: 3, background: cfg.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: '0.2px' }}>{cfg.label}</span>
    </div>
  );
}

const PATTERN_LABELS: Record<string, string> = {
  ghost_company: '유령업체 의심',
  zero_competition: '경쟁 부재',
  bid_rate_anomaly: '예정가격 유출 의심',
  new_company_big_win: '신생업체 고액수주',
  vendor_concentration: '업체 집중',
  repeated_sole_source: '반복 수의계약',
  repeat_sole_source: '반복 수의계약',
  contract_splitting: '계약 분할 의심',
  low_bid_competition: '과소 경쟁',
  high_value_sole_source: '고액 수의계약',
  yearend_budget_dump: '연말 예산소진',
  related_companies: '동일주소/대표 업체',
  same_winner_repeat: '동일업체 반복수주',
  amount_spike: '계약금액 급증',
  bid_rigging: '입찰담합',
  contract_inflation: '계약변경 증액',
  cross_pattern: '복합 의심',
  systemic_risk: '체계적 위험',
  sanctioned_vendor: '제재 업체',
  price_clustering: '투찰가 군집',
  network_collusion: '업체 네트워크',
};

function SeverityRing({ score }: { score: number }) {
  const color =
    score >= 80 ? 'var(--apple-red)' :
    score >= 60 ? 'var(--apple-orange)' :
    score >= 40 ? '#FFCC00' :
    'var(--apple-green)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1.5px solid ${color}30`,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
          {score}
        </span>
      </div>
      <span style={{ fontSize: 10, color: 'var(--apple-gray-1)', fontWeight: 400 }}>
        {getSeverityLabel(score)}
      </span>
    </div>
  );
}

export default function SuspicionCard({ flag }: { flag: AuditFlag }) {
  const score = flag.suspicion_score;
  const patternType = flag.pattern_type;
  const targetId = flag.target_id || flag.target_institution || '';

  return (
    <a
      href={`/audit/${flag.id}`}
      className="card block group"
      style={{
        textDecoration: 'none',
        transition: 'box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.05)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <PatternBadge pattern={patternType} score={score} />
            <VerdictBadge verdict={flag.verdict} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-label)', marginTop: 4 }}>
            {PATTERN_LABELS[patternType] || patternType}
          </div>
          {targetId && (
            <div style={{ fontSize: 12, color: 'var(--apple-gray-1)', marginTop: 3 }}>
              {targetId}
            </div>
          )}
        </div>
        <SeverityRing score={score} />
      </div>

      {/* Verdict reason — specific, data-driven */}
      {flag.verdict_reason && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '0.5px solid rgba(60,60,67,0.10)',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-label-secondary)', lineHeight: 1.5, margin: 0 }} className="line-clamp-2">
            {flag.verdict_reason}
          </p>
        </div>
      )}

      {/* Key evidence — specific contract details */}
      {flag.key_evidence && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--apple-gray-6)',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--apple-gray-1)', lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
            {flag.key_evidence}
          </span>
        </div>
      )}

      {/* More link */}
      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--apple-blue)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          자세히 보기
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </a>
  );
}
