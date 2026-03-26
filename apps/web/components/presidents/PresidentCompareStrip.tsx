'use client';
// 대통령 비교 스트립 — 전 대통령 수평 비교 시각화
import { useState, useMemo } from 'react';
import type { President } from '@/lib/types';
import { getPresidentColor, getPresidentBgColor, getTermYears } from '@/lib/utils';

interface PresidentCompareStripProps {
  presidents: President[];
  metric?: string;
}

const METRIC_OPTIONS = [
  { key: 'gdp_growth_avg', label: 'GDP 성장률', unit: '%', format: (v: number) => `${v.toFixed(1)}%` },
  { key: 'term_years', label: '재임 기간', unit: '년', format: (v: number) => `${v.toFixed(1)}년` },
] as const;

function getTermYearsNum(start: string, end: string | null | undefined): number {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  return (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function getMetricValue(president: President, metricKey: string): number | null {
  switch (metricKey) {
    case 'gdp_growth_avg':
      return president.gdp_growth_avg ?? null;
    case 'term_years':
      return getTermYearsNum(president.term_start, president.term_end);
    default:
      return null;
  }
}

export default function PresidentCompareStrip({
  presidents,
  metric: defaultMetric = 'gdp_growth_avg',
}: PresidentCompareStripProps) {
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);

  const metricConfig = METRIC_OPTIONS.find((m) => m.key === selectedMetric) || METRIC_OPTIONS[0];

  const presidentData = useMemo(() => {
    return presidents.map((p) => ({
      ...p,
      metricValue: getMetricValue(p, selectedMetric),
    }));
  }, [presidents, selectedMetric]);

  const maxValue = useMemo(() => {
    const values = presidentData
      .map((p) => p.metricValue)
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.max(...values.map(Math.abs)) : 1;
  }, [presidentData]);

  if (!presidents || presidents.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400 py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">대통령 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Metric selector */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs text-gray-500 font-medium">비교 지표:</span>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable strip */}
      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="flex gap-3 min-w-max">
          {presidentData.map((president) => {
            const color = getPresidentColor(president.party);
            const bgColor = getPresidentBgColor(president.party);
            const value = president.metricValue;
            const barPct = value !== null ? (Math.abs(value) / maxValue) * 100 : 0;
            const isNegative = value !== null && value < 0;

            return (
              <div
                key={president.id}
                className="flex flex-col items-center w-20 sm:w-24 flex-shrink-0"
              >
                {/* Avatar placeholder */}
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {president.name.slice(-2)}
                </div>

                {/* Name */}
                <p className="text-xs font-bold text-gray-900 text-center leading-tight">
                  {president.name}
                </p>

                {/* Term */}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {president.term_start.slice(0, 4)}-{president.term_end?.slice(0, 4) || '현재'}
                </p>

                {/* Party */}
                {president.party && (
                  <p className="text-[10px] mt-0.5 font-medium truncate max-w-full" style={{ color }}>
                    {president.party}
                  </p>
                )}

                {/* Bar */}
                <div className="w-full mt-3 flex flex-col items-center">
                  <div className="w-full h-24 flex items-end justify-center relative">
                    {value !== null ? (
                      <div
                        className="w-8 sm:w-10 rounded-t-md transition-all duration-700 ease-out relative"
                        style={{
                          height: `${Math.max(barPct, 5)}%`,
                          backgroundColor: isNegative ? '#ef4444' : color,
                          opacity: 0.8,
                        }}
                      >
                        {/* Value label on top */}
                        <div
                          className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold tabular-nums"
                          style={{ color: isNegative ? '#ef4444' : color }}
                        >
                          {metricConfig.format(value)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-300 text-xs">-</div>
                    )}
                  </div>
                  {/* Baseline */}
                  <div className="w-full h-px bg-gray-300 mt-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
