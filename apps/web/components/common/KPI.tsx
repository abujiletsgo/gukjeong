'use client';
// KPI 카드 — 핵심 성과 지표 표시

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
    trend === 'up' ? 'text-red-500' :
    trend === 'down' ? 'text-green-600' :
    'text-gray-500';

  const trendArrow =
    trend === 'up' ? '▲' :
    trend === 'down' ? '▼' :
    '';

  return (
    <div className={`card text-center relative overflow-hidden ${className}`}>
      {icon && (
        <div className="text-2xl mb-2 opacity-60">{icon}</div>
      )}
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1 font-medium">{label}</div>
      {change && (
        <div className={`text-xs mt-2 font-medium ${trendColor}`}>
          {trendArrow} {change}
        </div>
      )}
      {source && (
        <div className="text-[10px] text-gray-300 mt-2">출처: {source}</div>
      )}
    </div>
  );
}
