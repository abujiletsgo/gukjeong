'use client';
// 취임 전 vs 퇴임 후 비교 카드
import type { ReportCardMetric } from '@/lib/types';

interface BeforeAfterCardProps {
  metric: ReportCardMetric;
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improved': return '#22c55e';
    case 'worsened': return '#ef4444';
    case 'stable': return '#6b7280';
    default: return '#6b7280';
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value}%`;
  if (unit === '조원') return `${value}조원`;
  if (unit === '억원') return `${value}억원`;
  if (unit === '달성') return value ? '달성' : '-';
  if (unit === '점') return `${value}점`;
  if (unit === '명') return `${value}명`;
  if (unit === '명/10만명') return `${value}명`;
  if (unit === '만원/월') return `${value}만원`;
  if (unit === '달러') return `$${value.toLocaleString()}`;
  if (unit === '억달러') return `${value}억$`;
  if (unit === '건') return `${value}건`;
  return `${value} ${unit}`;
}

export default function BeforeAfterCard({ metric }: BeforeAfterCardProps) {
  const trendColor = getTrendColor(metric.trend);
  const diff = metric.final_value - metric.baseline_value;
  const diffPct = metric.baseline_value !== 0
    ? ((diff / Math.abs(metric.baseline_value)) * 100).toFixed(1)
    : '-';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">{metric.category}</span>
        {metric.grade && (
          <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
            metric.grade === 'A' ? 'bg-green-100 text-green-700' :
            metric.grade === 'B' ? 'bg-blue-100 text-blue-700' :
            metric.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
            metric.grade === 'D' ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>
            {metric.grade}
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-gray-900 mb-3">{metric.metric_name}</h4>

      <div className="flex items-center gap-3">
        {/* 취임 시 */}
        <div className="flex-1 text-center bg-gray-50 rounded-lg p-2.5">
          <div className="text-[10px] text-gray-400 mb-1">취임 시 ({metric.baseline_year})</div>
          <div className="text-base font-bold text-gray-700">
            {formatValue(metric.baseline_value, metric.unit)}
          </div>
        </div>

        {/* 화살표 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14m-4-4l4 4-4 4" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {diffPct !== '-' && (
            <span className="text-[10px] font-medium" style={{ color: trendColor }}>
              {Number(diffPct) > 0 ? '+' : ''}{diffPct}%
            </span>
          )}
        </div>

        {/* 퇴임 시 */}
        <div className="flex-1 text-center rounded-lg p-2.5" style={{ backgroundColor: `${trendColor}10` }}>
          <div className="text-[10px] text-gray-400 mb-1">최종</div>
          <div className="text-base font-bold" style={{ color: trendColor }}>
            {formatValue(metric.final_value, metric.unit)}
          </div>
        </div>
      </div>

      {metric.note && (
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{metric.note}</p>
      )}
    </div>
  );
}
