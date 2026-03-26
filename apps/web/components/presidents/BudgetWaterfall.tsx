'use client';
// 예산 워터폴 차트 — 공약예산 → 확정예산 → 실제집행 흐름
import { useMemo } from 'react';
import { formatTrillions } from '@/lib/utils';

interface BudgetWaterfallProps {
  promised: number;
  approved: number;
  executed: number;
  label?: string;
}

interface WaterfallBar {
  label: string;
  value: number;
  base: number;
  isChange: boolean;
  color: string;
  displayValue: string;
  changeLabel?: string;
}

export default function BudgetWaterfall({
  promised,
  approved,
  executed,
  label,
}: BudgetWaterfallProps) {
  const bars = useMemo<WaterfallBar[]>(() => {
    const approvalDiff = approved - promised;
    const executionDiff = executed - approved;

    return [
      {
        label: '공약예산',
        value: promised,
        base: 0,
        isChange: false,
        color: '#3b82f6',
        displayValue: formatTrillions(promised),
      },
      {
        label: '국회 증감',
        value: Math.abs(approvalDiff),
        base: approvalDiff >= 0 ? promised : approved,
        isChange: true,
        color: approvalDiff >= 0 ? '#22c55e' : '#ef4444',
        displayValue: `${approvalDiff >= 0 ? '+' : '-'}${formatTrillions(Math.abs(approvalDiff))}`,
        changeLabel: approvalDiff >= 0 ? '증액' : '감액',
      },
      {
        label: '확정예산',
        value: approved,
        base: 0,
        isChange: false,
        color: '#6366f1',
        displayValue: formatTrillions(approved),
      },
      {
        label: '미집행분',
        value: Math.abs(executionDiff),
        base: executionDiff >= 0 ? approved : executed,
        isChange: true,
        color: executionDiff >= 0 ? '#22c55e' : '#ef4444',
        displayValue: `${executionDiff >= 0 ? '+' : '-'}${formatTrillions(Math.abs(executionDiff))}`,
        changeLabel: executionDiff >= 0 ? '초과집행' : '미집행',
      },
      {
        label: '실제집행',
        value: executed,
        base: 0,
        isChange: false,
        color: '#0f172a',
        displayValue: formatTrillions(executed),
      },
    ];
  }, [promised, approved, executed]);

  if (promised === 0 && approved === 0 && executed === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400 py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">예산 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(promised, approved, executed);
  const svgWidth = 600;
  const svgHeight = 320;
  const marginLeft = 16;
  const marginRight = 16;
  const marginTop = 50;
  const marginBottom = 50;
  const chartW = svgWidth - marginLeft - marginRight;
  const chartH = svgHeight - marginTop - marginBottom;
  const barW = Math.min(60, chartW / bars.length - 20);
  const barGap = (chartW - barW * bars.length) / (bars.length - 1);

  const scaleY = (v: number) => chartH - (v / maxValue) * chartH;

  return (
    <div className="animate-fade-in w-full overflow-x-auto">
      {label && (
        <p className="text-sm font-medium text-gray-500 mb-3 text-center">{label}</p>
      )}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full min-w-[400px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = marginTop + chartH * (1 - pct);
          return (
            <line
              key={pct}
              x1={marginLeft}
              y1={y}
              x2={svgWidth - marginRight}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
          );
        })}

        {bars.map((bar, i) => {
          const x = marginLeft + i * (barW + barGap);
          const barTop = marginTop + scaleY(bar.base + bar.value);
          const barBottom = marginTop + scaleY(bar.base);
          const barHeight = barBottom - barTop;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x}
                y={barTop}
                width={barW}
                height={Math.max(barHeight, 2)}
                fill={bar.color}
                fillOpacity={bar.isChange ? 0.75 : 0.9}
                rx={4}
                className="transition-all duration-700 ease-out"
              />

              {/* Connector bridge */}
              {i > 0 && !bar.isChange && i < bars.length && (
                <line
                  x1={marginLeft + (i - 1) * (barW + barGap) + barW}
                  y1={marginTop + scaleY(bars[i - 1].base + bars[i - 1].value)}
                  x2={x}
                  y2={marginTop + scaleY(bars[i - 1].base + bars[i - 1].value)}
                  stroke="#d1d5db"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              )}

              {/* Change connector (dashed bridge from previous absolute to this) */}
              {bar.isChange && i > 0 && (
                <>
                  <line
                    x1={marginLeft + (i - 1) * (barW + barGap) + barW}
                    y1={marginTop + scaleY(bars[i - 1].value)}
                    x2={x}
                    y2={marginTop + scaleY(bars[i - 1].value)}
                    stroke="#d1d5db"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                </>
              )}

              {/* Value label above bar */}
              <text
                x={x + barW / 2}
                y={barTop - 8}
                textAnchor="middle"
                fontSize={12}
                fontWeight="700"
                fill={bar.color}
              >
                {bar.displayValue}
              </text>

              {/* Change label */}
              {bar.changeLabel && (
                <text
                  x={x + barW / 2}
                  y={barTop - 22}
                  textAnchor="middle"
                  fontSize={9}
                  fill={bar.color}
                  fontWeight="500"
                >
                  {bar.changeLabel}
                </text>
              )}

              {/* Bottom label */}
              <text
                x={x + barW / 2}
                y={marginTop + chartH + 20}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7280"
                fontWeight="500"
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {/* Execution rate label */}
        {promised > 0 && (
          <text
            x={svgWidth / 2}
            y={svgHeight - 4}
            textAnchor="middle"
            fontSize={11}
            fill="#9ca3af"
          >
            집행률: {((executed / promised) * 100).toFixed(1)}%
          </text>
        )}
      </svg>
    </div>
  );
}
