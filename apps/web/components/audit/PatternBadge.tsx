'use client';

interface PatternBadgeProps {
  pattern: string;
  score?: number;
  size?: 'sm' | 'md';
}

// SF Symbols-style SVG icons (stroke, 1.5px weight)
const PatternIcon = ({ type, size = 14 }: { type: string; size?: number }) => {
  const s = size;
  switch (type) {
    case 'ghost_company':
    case 'paper_company':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 018 8v10l-3-2-3 2-3-2-3 2-3-2V10a8 8 0 018-8z"/>
          <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      );
    case 'zero_competition':
    case 'low_bid_competition':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M4.93 4.93l14.14 14.14"/>
        </svg>
      );
    case 'bid_rate_anomaly':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
        </svg>
      );
    case 'new_company_big_win':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M6.3 6.3l-2.8-2.8M4 12H2M6.3 17.7l-2.8 2.8M12 18v4M17.7 17.7l2.8 2.8M20 12h2M17.7 6.3l2.8-2.8"/>
        </svg>
      );
    case 'vendor_concentration':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="8" height="8" rx="2"/>
          <rect x="13" y="3" width="8" height="8" rx="2"/>
          <rect x="3" y="13" width="8" height="8" rx="2"/>
          <rect x="13" y="13" width="8" height="8" rx="2"/>
        </svg>
      );
    case 'repeated_sole_source':
    case 'repeat_sole_source':
    case 'same_winner_repeat':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 2l4 4-4 4"/>
          <path d="M3 11V9a4 4 0 014-4h14"/>
          <path d="M7 22l-4-4 4-4"/>
          <path d="M21 13v2a4 4 0 01-4 4H3"/>
        </svg>
      );
    case 'contract_splitting':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12a1 1 0 011 1v3a1 1 0 01-.29.71L13 13.41V21l-4-2v-5.59L5.29 7.71A1 1 0 015 7V4a1 1 0 011-1z"/>
        </svg>
      );
    case 'high_value_sole_source':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2.5-3 2.5-3 1.1-3 2.5 1.3 2.5 3 2.5 3-1.1 3-2.5"/>
        </svg>
      );
    case 'yearend_budget_dump':
    case 'yearend_spike':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
          <path d="M8 14h2v4H8z" fill="currentColor" stroke="none"/>
          <path d="M14 12h2v6h-2z" fill="currentColor" stroke="none"/>
        </svg>
      );
    case 'related_companies':
    case 'network_collusion':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="4" cy="19" r="2"/>
          <circle cx="20" cy="19" r="2"/>
          <path d="M12 7v5M12 12l-6.5 5M12 12l6.5 5"/>
        </svg>
      );
    case 'amount_spike':
    case 'inflated_pricing':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
      );
    case 'bid_rigging':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5m4 0h4M5 14v6a1 1 0 001 1h12a1 1 0 001-1v-6M5 14h14"/>
        </svg>
      );
    case 'contract_inflation':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/>
          <path d="M12 8v4l3 3"/>
          <path d="M9 12h3"/>
        </svg>
      );
    case 'cross_pattern':
    case 'systemic_risk':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
    case 'sanctioned_vendor':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      );
    case 'price_clustering':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
          <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
          <circle cx="18" cy="14" r="1" fill="currentColor" stroke="none"/>
        </svg>
      );
    case 'revolving_door':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h5M21 12h-5M12 3v5M12 21v-5"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M6.34 6.34l1.42 1.42M16.24 16.24l1.42 1.42M6.34 17.66l1.42-1.42M16.24 7.76l1.42-1.42"/>
        </svg>
      );
    case 'rebid_same_winner':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6"/>
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      );
  }
};

const PATTERN_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  ghost_company:        { label: '유령업체',       bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  zero_competition:     { label: '경쟁 부재',       bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  bid_rate_anomaly:     { label: '예정가격 유출',   bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  new_company_big_win:  { label: '신생업체 고액수주', bg: 'rgba(255,149,0,0.10)', color: 'var(--apple-orange)' },
  vendor_concentration: { label: '업체 집중',       bg: 'rgba(88,86,214,0.10)',   color: 'var(--apple-indigo, #5856D6)' },
  repeated_sole_source: { label: '반복 수의계약',   bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  repeat_sole_source:   { label: '반복 수의계약',   bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  contract_splitting:   { label: '계약 분할',       bg: 'rgba(255,204,0,0.12)',   color: '#B8860B' },
  low_bid_competition:  { label: '과소 경쟁',       bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  high_value_sole_source: { label: '고액 수의계약', bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  yearend_budget_dump:  { label: '연말 예산소진',   bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  related_companies:    { label: '동일주소/대표',   bg: 'rgba(88,86,214,0.10)',   color: 'var(--apple-indigo, #5856D6)' },
  same_winner_repeat:   { label: '동일업체 반복',   bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  amount_spike:         { label: '계약금액 급증',   bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  bid_rigging:          { label: '입찰담합',        bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  contract_inflation:   { label: '계약변경 증액',   bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  cross_pattern:        { label: '복합 의심',       bg: 'rgba(255,59,48,0.14)',   color: 'var(--apple-red)' },
  systemic_risk:        { label: '체계적 위험',     bg: 'rgba(255,59,48,0.14)',   color: 'var(--apple-red)' },
  sanctioned_vendor:    { label: '제재 업체',       bg: 'rgba(255,59,48,0.14)',   color: 'var(--apple-red)' },
  price_clustering:     { label: '투찰가 군집',     bg: 'rgba(255,59,48,0.12)',   color: 'var(--apple-red)' },
  network_collusion:    { label: '업체 네트워크',   bg: 'rgba(88,86,214,0.12)',   color: 'var(--apple-indigo, #5856D6)' },
  price_divergence:     { label: '가격 이탈',       bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  price_vs_catalog:     { label: '표준단가 초과',   bg: 'rgba(255,59,48,0.12)',   color: 'var(--apple-red)' },
  vendor_rotation:      { label: '순번 담합',       bg: 'rgba(255,59,48,0.12)',   color: 'var(--apple-red)' },
  yearend_new_vendor:   { label: '연말 신규업체',   bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  rebid_same_winner:    { label: '재입찰 동일낙찰', bg: 'rgba(255,59,48,0.12)',   color: 'var(--apple-red)' },
  ai_anomaly:           { label: 'AI 이상탐지',     bg: 'rgba(10,132,255,0.10)',  color: 'var(--apple-blue, #007AFF)' },
  yearend_spike:        { label: '연말 급증',       bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
  inflated_pricing:     { label: '고가 계약',       bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  revolving_door:       { label: '전관예우',        bg: 'rgba(255,59,48,0.10)',   color: 'var(--apple-red)' },
  paper_company:        { label: '페이퍼 컴퍼니',   bg: 'rgba(255,149,0,0.10)',   color: 'var(--apple-orange)' },
};

export default function PatternBadge({ pattern, score, size = 'sm' }: PatternBadgeProps) {
  const config = PATTERN_CONFIG[pattern] || {
    label: pattern,
    bg: 'rgba(142,142,147,0.10)',
    color: 'var(--apple-gray-1)',
  };

  const iconSize = size === 'sm' ? 11 : 13;
  const fontSize = size === 'sm' ? 11 : 13;
  const paddingV = size === 'sm' ? 3 : 5;
  const paddingH = size === 'sm' ? 8 : 12;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: `${paddingV}px ${paddingH}px`,
        borderRadius: 100,
        fontSize,
        fontWeight: 500,
        background: config.bg,
        color: config.color,
        letterSpacing: '0.1px',
      }}
    >
      <PatternIcon type={pattern} size={iconSize} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.65, fontWeight: 400 }}>({score})</span>
      )}
    </span>
  );
}
