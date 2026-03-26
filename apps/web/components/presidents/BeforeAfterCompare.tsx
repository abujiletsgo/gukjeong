'use client';
// 취임-퇴임 비교 인포그래픽 — 핵심 지표 변화 시각화
import type { ReportCardMetric } from '@/lib/types';

interface BeforeAfterCompareProps {
  metrics: ReportCardMetric[];
}

function getChangeColor(trend: 'improved' | 'worsened' | 'stable'): string {
  if (trend === 'improved') return '#22c55e';
  if (trend === 'worsened') return '#ef4444';
  return '#6b7280';
}

function getChangeBg(trend: 'improved' | 'worsened' | 'stable'): string {
  if (trend === 'improved') return 'bg-green-50 border-green-200';
  if (trend === 'worsened') return 'bg-red-50 border-red-200';
  return 'bg-gray-50 border-gray-200';
}

function getArrow(trend: 'improved' | 'worsened' | 'stable'): string {
  if (trend === 'improved') return '\u2191'; // up arrow
  if (trend === 'worsened') return '\u2193'; // down arrow
  return '\u2192'; // right arrow
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === '조원') return `${value.toFixed(1)}조원`;
  if (unit === '억원') return `${value.toFixed(0)}억원`;
  if (unit === '만원') return `${value.toLocaleString('ko-KR')}만원`;
  if (unit === '명') return `${value.toFixed(2)}명`;
  return `${value.toLocaleString('ko-KR')}${unit}`;
}

function computeChange(baseline: number, final: number, unit: string): string {
  const diff = final - baseline;
  const sign = diff >= 0 ? '+' : '';
  if (unit === '%') return `${sign}${diff.toFixed(1)}%p`;
  if (unit === '조원') return `${sign}${diff.toFixed(1)}조원`;
  if (unit === '억원') return `${sign}${diff.toFixed(0)}억원`;
  if (unit === '만원') return `${sign}${diff.toLocaleString('ko-KR')}만원`;
  if (unit === '명') return `${sign}${diff.toFixed(2)}명`;
  return `${sign}${diff.toLocaleString('ko-KR')}${unit}`;
}

export default function BeforeAfterCompare({ metrics }: BeforeAfterCompareProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400 py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">비교 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-3">
      {metrics.map((metric) => {
        const changeColor = getChangeColor(metric.trend);
        const arrow = getArrow(metric.trend);
        const changeBg = getChangeBg(metric.trend);
        const changeText = computeChange(metric.baseline_value, metric.final_value, metric.unit);

        return (
          <div
            key={metric.id}
            className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
          >
            {/* Metric name header */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">{metric.metric_name}</h4>
                {metric.grade && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: changeColor,
                      backgroundColor: metric.trend === 'improved' ? '#f0fdf4' : metric.trend === 'worsened' ? '#fef2f2' : '#f9fafb',
                    }}
                  >
                    {metric.grade}
                  </span>
                )}
              </div>
            </div>

            {/* Values row */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">
              {/* Baseline (left) */}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">
                  취임 시 ({metric.baseline_year})
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-700 tabular-nums">
                  {formatValue(metric.baseline_value, metric.unit)}
                </div>
              </div>

              {/* Arrow (center) */}
              <div className="flex flex-col items-center gap-1 px-2">
                <div
                  className={`text-2xl font-bold leading-none`}
                  style={{ color: changeColor }}
                >
                  {arrow}
                </div>
                <div
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${changeBg}`}
                  style={{ color: changeColor }}
                >
                  {changeText}
                </div>
              </div>

              {/* Final (right) */}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">퇴임 시</div>
                <div
                  className="text-lg sm:text-xl font-bold tabular-nums"
                  style={{ color: changeColor }}
                >
                  {formatValue(metric.final_value, metric.unit)}
                </div>
              </div>
            </div>

            {/* Source footer */}
            {metric.source && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-gray-300">출처: {metric.source}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
