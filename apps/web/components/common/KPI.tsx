'use client';

interface KPIProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  source?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function KPI({ label, value, change, trend, source, icon, className = '' }: KPIProps) {
  const trendColor =
    trend === 'up' ? 'var(--apple-red)' :
    trend === 'down' ? 'var(--apple-green)' :
    'var(--apple-gray-1)';

  const trendIcon =
    trend === 'up' ? (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    ) : trend === 'down' ? (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    ) : null;

  return (
    <div className={`card text-center relative overflow-hidden ${className}`}>
      {icon && (
        <div className="flex justify-center mb-3" style={{ color: 'var(--apple-blue)', opacity: 0.8 }}>
          {icon}
        </div>
      )}
      <div
        className="font-bold tabular-nums tracking-tight"
        style={{ fontSize: 32, lineHeight: 1, color: 'var(--color-label)', letterSpacing: '-1px' }}
      >
        {value}
      </div>
      <div
        className="mt-1.5"
        style={{ fontSize: 13, color: 'var(--color-label-secondary)', fontWeight: 400 }}
      >
        {label}
      </div>
      {change && (
        <div
          className="flex items-center justify-center gap-1 mt-2"
          style={{ fontSize: 12, fontWeight: 500, color: trendColor }}
        >
          {trendIcon}
          <span>{change}</span>
        </div>
      )}
      {source && (
        <div
          className="mt-2"
          style={{ fontSize: 11, color: 'var(--apple-gray-2)' }}
        >
          출처: {source}
        </div>
      )}
    </div>
  );
}
