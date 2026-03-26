'use client';
// KPI 카드 — 핵심 성과 지표 표시

interface KPIProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  source?: string;
}

export default function KPI({ label, value, change, trend, source }: KPIProps) {
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-500';

  return (
    <div className="card text-center">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {change && (
        <div className={`text-xs mt-1 ${trendColor}`}>{change}</div>
      )}
      {source && (
        <div className="text-[10px] text-gray-300 mt-1">출처: {source}</div>
      )}
    </div>
  );
}
