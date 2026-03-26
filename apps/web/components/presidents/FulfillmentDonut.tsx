'use client';
// 공약 이행률 도넛 차트 — 상태별 분류 시각화
import { useMemo } from 'react';

interface FulfillmentDonutProps {
  fulfilled: number;
  inProgress: number;
  partial: number;
  unfulfilled: number;
  dropped: number;
}

const STATUS_CONFIG = [
  { key: 'fulfilled', label: '이행완료', color: '#22c55e' },
  { key: 'inProgress', label: '추진중', color: '#3b82f6' },
  { key: 'partial', label: '일부이행', color: '#f59e0b' },
  { key: 'unfulfilled', label: '미이행', color: '#ef4444' },
  { key: 'dropped', label: '폐기', color: '#6b7280' },
] as const;

export default function FulfillmentDonut({
  fulfilled,
  inProgress,
  partial,
  unfulfilled,
  dropped,
}: FulfillmentDonutProps) {
  const values: Record<string, number> = {
    fulfilled,
    inProgress,
    partial,
    unfulfilled,
    dropped,
  };

  const total = fulfilled + inProgress + partial + unfulfilled + dropped;
  const fulfillmentRate = total > 0 ? Math.round((fulfilled / total) * 100) : 0;

  const segments = useMemo(() => {
    if (total === 0) return [];

    const cx = 100;
    const cy = 100;
    const r = 80;
    const circumference = 2 * Math.PI * r;
    let cumulativeOffset = 0;

    return STATUS_CONFIG.map(({ key, label, color }) => {
      const value = values[key];
      const pct = value / total;
      const dashLength = pct * circumference;
      const dashOffset = -cumulativeOffset;
      cumulativeOffset += dashLength;

      return {
        key,
        label,
        color,
        value,
        pct,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset,
        circumference,
      };
    }).filter(s => s.value > 0);
  }, [fulfilled, inProgress, partial, unfulfilled, dropped, total]);

  if (total === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400 py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">공약 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      {/* Donut SVG */}
      <div className="relative w-52 h-52 sm:w-64 sm:h-64">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="24"
          />
          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={seg.color}
              strokeWidth="24"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-1000 ease-out"
              style={{
                ['--gauge-circumference' as string]: `${seg.circumference}`,
                ['--gauge-offset' as string]: `${seg.dashOffset}`,
              }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {fulfillmentRate}%
          </span>
          <span className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            이행률
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
        {STATUS_CONFIG.map(({ key, label, color }) => {
          const v = values[key];
          if (v === 0) return null;
          const pct = Math.round((v / total) * 100);
          return (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">{label}</span>
              <span className="font-semibold text-gray-900 ml-auto tabular-nums">
                {v}
                <span className="text-gray-400 text-xs ml-0.5">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
