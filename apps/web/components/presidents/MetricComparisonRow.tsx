'use client';
// 지표 비교 행 — Baseline → Target → Final, 등급 배지, 다른 시각 패널
import type { ReportCardMetric } from '@/lib/types';
import PerspectivePanel, { hasPerspectiveData } from './PerspectivePanel';

interface MetricComparisonRowProps {
  metric: ReportCardMetric;
}

function getTrendArrow(trend: string): { icon: string; color: string } {
  switch (trend) {
    case 'improved': return { icon: '▲', color: '#22c55e' };
    case 'worsened': return { icon: '▼', color: '#ef4444' };
    case 'stable': return { icon: '→', color: '#6b7280' };
    default: return { icon: '→', color: '#6b7280' };
  }
}

function getGradeBg(grade: string | undefined): string {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700';
    case 'B': return 'bg-blue-100 text-blue-700';
    case 'C': return 'bg-yellow-100 text-yellow-700';
    case 'D': return 'bg-orange-100 text-orange-700';
    case 'F': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value}%`;
  if (unit === '조원') return `${value}조`;
  if (unit === '억원') return `${value}억`;
  if (unit === '달성') return value ? '달성' : '-';
  if (unit === '점') return `${value}점`;
  if (unit === '명') return `${value}명`;
  if (unit === '명/10만명') return `${value}`;
  if (unit === '만원/월') return `${value}만원`;
  if (unit === '달러') return `$${value.toLocaleString()}`;
  if (unit === '억달러') return `${value}억$`;
  if (unit === '건') return `${value}건`;
  return `${value}${unit}`;
}

export default function MetricComparisonRow({ metric }: MetricComparisonRowProps) {
  const trend = getTrendArrow(metric.trend);
  const gradeBg = getGradeBg(metric.grade);
  const showPerspective = hasPerspectiveData({
    progressive_frame: metric.progressive_frame,
    conservative_frame: metric.conservative_frame,
    citizen_reality: metric.citizen_reality,
    context_note: metric.context_note,
    real_world_example: metric.real_world_example,
  });

  return (
    <div className={`border-b border-gray-50 last:border-0 ${showPerspective ? 'pb-1' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-4 py-3">
        {/* 지표명 + 카테고리 */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{metric.metric_name}</div>
          <div className="text-[10px] text-gray-400">{metric.category} · {metric.source}</div>
        </div>

        {/* 수치 흐름: 취임→목표→퇴임 */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs flex-shrink-0">
          <div className="text-center min-w-[40px]">
            <div className="text-gray-400 text-[9px]">취임</div>
            <div className="font-medium text-gray-600">{formatValue(metric.baseline_value, metric.unit)}</div>
          </div>
          {metric.target_value !== undefined && (
            <>
              <span className="text-gray-300">→</span>
              <div className="text-center min-w-[40px]">
                <div className="text-gray-400 text-[9px]">목표</div>
                <div className="font-medium text-blue-600">{formatValue(metric.target_value, metric.unit)}</div>
              </div>
            </>
          )}
          <span className="text-gray-300">→</span>
          <div className="text-center min-w-[40px]">
            <div className="text-gray-400 text-[9px]">최종</div>
            <div className="font-bold text-gray-900">{formatValue(metric.final_value, metric.unit)}</div>
          </div>
        </div>

        {/* 추세 화살표 */}
        <span className="text-sm font-bold flex-shrink-0" style={{ color: trend.color }}>
          {trend.icon}
        </span>

        {/* 등급 배지 */}
        {metric.grade && (
          <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${gradeBg}`}>
            {metric.grade}
          </span>
        )}
      </div>

      {/* 다른 시각 패널 */}
      {showPerspective && (
        <PerspectivePanel
          progressive_frame={metric.progressive_frame}
          conservative_frame={metric.conservative_frame}
          citizen_reality={metric.citizen_reality}
          context_note={metric.context_note}
          real_world_example={metric.real_world_example}
        />
      )}
    </div>
  );
}
