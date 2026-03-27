'use client';

import { useState, useMemo } from 'react';
import type { InternationalComparison } from '@/lib/types';

// Metric pill label mapping (shorter labels for pills)
const METRIC_PILLS: { id: string; label: string; icon: string }[] = [
  { id: 'debt_to_gdp', label: '국가채무', icon: '💰' },
  { id: 'gov_spending_gdp', label: '정부지출', icon: '🏛' },
  { id: 'fertility_rate', label: '출산율', icon: '👶' },
  { id: 'unemployment', label: '실업률', icon: '📊' },
  { id: 'gdp_per_capita', label: '1인당 GDP', icon: '💵' },
  { id: 'corruption_index', label: '부패인식', icon: '🔍' },
  { id: 'defense_spending', label: '국방비', icon: '🛡' },
  { id: 'rd_spending', label: 'R&D 투자', icon: '🔬' },
];

function formatValue(value: number, unit: string): string {
  if (unit === '$') {
    return `$${value.toLocaleString('en-US')}`;
  }
  if (unit === '명') {
    return `${value.toFixed(2)}명`;
  }
  if (unit.includes('0-100')) {
    return `${value}점`;
  }
  return `${value}${unit}`;
}

function formatValueShort(value: number, unit: string): string {
  if (unit === '$') {
    if (value >= 10000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toLocaleString('en-US')}`;
  }
  if (unit === '명') return value.toFixed(2);
  if (unit.includes('0-100')) return `${value}`;
  return `${value}`;
}

interface ComparePageClientProps {
  metrics: InternationalComparison[];
}

export default function ComparePageClient({ metrics }: ComparePageClientProps) {
  const [selectedId, setSelectedId] = useState(metrics[0]?.metric_id || 'debt_to_gdp');

  const selected = useMemo(
    () => metrics.find((m) => m.metric_id === selectedId) || metrics[0],
    [metrics, selectedId],
  );

  // Sort countries by value descending (highest first for bar chart)
  const sortedCountries = useMemo(() => {
    if (!selected) return [];
    return [...selected.countries].sort((a, b) => b.value - a.value);
  }, [selected]);

  const maxValue = useMemo(
    () => Math.max(...sortedCountries.map((c) => c.value)),
    [sortedCountries],
  );

  const oecdAvg = useMemo(
    () => selected?.countries.find((c) => c.country === 'OECD 평균'),
    [selected],
  );

  const koreaData = useMemo(
    () => selected?.countries.find((c) => c.is_korea),
    [selected],
  );

  // Determine if Korea is "better" than a country for this metric
  const isBetterThanKorea = (countryValue: number): boolean | null => {
    if (!koreaData || !selected) return null;
    if (selected.lower_is_better) {
      return countryValue > koreaData.value; // higher is worse when lower is better
    }
    return countryValue > koreaData.value; // higher is better
  };

  // Bar color logic
  const getBarColor = (country: { country: string; is_korea?: boolean; value: number }) => {
    if (country.is_korea) return 'bg-[#ff6b35]';
    if (country.country === 'OECD 평균') return 'bg-slate-400';
    return 'bg-slate-300 dark:bg-slate-600';
  };

  const getBarTextColor = (country: { country: string; is_korea?: boolean }) => {
    if (country.is_korea) return 'text-[#ff6b35] font-bold';
    if (country.country === 'OECD 평균') return 'text-slate-500 font-medium';
    return 'text-gray-700 dark:text-gray-300';
  };

  // Compute Korea's rank among the countries (sorted by "better" direction)
  const koreaRank = useMemo(() => {
    if (!selected || !koreaData) return null;
    const sorted = [...selected.countries]
      .filter((c) => c.country !== 'OECD 평균')
      .sort((a, b) => (selected.lower_is_better ? a.value - b.value : b.value - a.value));
    const idx = sorted.findIndex((c) => c.is_korea);
    return idx >= 0 ? idx + 1 : null;
  }, [selected, koreaData]);

  const totalCountries = useMemo(
    () => selected?.countries.filter((c) => c.country !== 'OECD 평균').length || 0,
    [selected],
  );

  if (!selected) return null;

  // OECD average line position (percentage from left)
  const oecdLinePercent = oecdAvg ? (oecdAvg.value / maxValue) * 100 : null;

  return (
    <div className="container-page py-6 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          국제 비교
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
          OECD 국가와 비교한 대한민국의 위치를 데이터로 확인합니다
        </p>
      </div>

      {/* Metric Selector Pills */}
      <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 md:flex-wrap">
          {METRIC_PILLS.map((pill) => {
            const isActive = pill.id === selectedId;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedId(pill.id)}
                className={`
                  shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-[#ff6b35] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className="mr-1">{pill.icon}</span>
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Metric Title */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {selected.metric_name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          단위: {selected.unit} | {selected.year}년 기준
          {selected.lower_is_better
            ? ' | 낮을수록 양호'
            : selected.metric_id === 'gov_spending_gdp' || selected.metric_id === 'defense_spending'
              ? ''
              : ' | 높을수록 양호'
          }
        </p>
      </div>

      {/* Main Bar Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
        <div className="relative">
          {sortedCountries.map((country, idx) => {
            const barPercent = (country.value / maxValue) * 100;
            const isKorea = country.is_korea;
            const isOecd = country.country === 'OECD 평균';

            return (
              <div
                key={country.country}
                className={`
                  flex items-center gap-3 py-2 md:py-2.5 group
                  ${isKorea ? 'bg-orange-50 dark:bg-orange-950/20 -mx-4 px-4 md:-mx-6 md:px-6 rounded-lg' : ''}
                `}
              >
                {/* Country name */}
                <div className={`w-20 md:w-28 shrink-0 text-right text-sm md:text-base ${getBarTextColor(country)}`}>
                  {isOecd ? (
                    <span className="italic">{country.country}</span>
                  ) : (
                    country.country
                  )}
                </div>

                {/* Bar container */}
                <div className="flex-1 relative h-7 md:h-8">
                  {/* OECD average reference line */}
                  {oecdLinePercent && idx === 0 && (
                    <div
                      className="absolute top-0 h-full z-10 pointer-events-none"
                      style={{
                        left: `${oecdLinePercent}%`,
                        height: `${sortedCountries.length * (typeof window !== 'undefined' && window.innerWidth >= 768 ? 44 : 40)}px`,
                      }}
                    >
                      <div className="w-px h-full border-l-2 border-dashed border-slate-400 dark:border-slate-500 opacity-60" />
                    </div>
                  )}

                  {/* The bar */}
                  <div
                    className={`
                      h-full rounded-r-md transition-all duration-500 ease-out relative
                      ${isKorea ? 'bg-[#ff6b35]' : isOecd ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-200 dark:bg-slate-700'}
                      ${isKorea ? 'shadow-sm shadow-orange-200 dark:shadow-orange-900/40' : ''}
                    `}
                    style={{ width: `${barPercent}%`, minWidth: '2px' }}
                  >
                    {/* Value label inside or outside bar */}
                    <span
                      className={`
                        absolute right-2 top-1/2 -translate-y-1/2 text-xs md:text-sm whitespace-nowrap
                        ${isKorea
                          ? 'text-white font-bold'
                          : barPercent > 30
                            ? 'text-white/80 dark:text-white/70'
                            : 'text-gray-600 dark:text-gray-400 -right-2 translate-x-full ml-2'
                        }
                      `}
                      style={barPercent <= 30 ? { right: 'auto', left: '100%', paddingLeft: '8px' } : {}}
                    >
                      {formatValue(country.value, selected.unit)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* OECD avg label */}
          {oecdLinePercent && (
            <div
              className="absolute -top-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
              style={{ left: `calc(5rem + 12px + ${oecdLinePercent}%)`, transform: 'translateX(-50%)' }}
            >
              OECD 평균
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Description */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            이 지표는
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {selected.description}
          </p>
        </div>

        {/* Why it matters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            왜 중요한가
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {selected.why_it_matters}
          </p>
        </div>
      </div>

      {/* Korea Position Highlight Card */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-xl border border-orange-200 dark:border-orange-800/40 p-5 md:p-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#ff6b35] flex items-center justify-center text-white text-lg font-bold shrink-0">
              KR
            </div>
            <div>
              <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">한국의 위치</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {selected.korea_position}
              </p>
            </div>
          </div>
          <div className="md:ml-auto flex gap-6">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#ff6b35]">
                {formatValueShort(koreaData?.value || 0, selected.unit)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">대한민국</p>
            </div>
            {oecdAvg && (
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-slate-500 dark:text-slate-400">
                  {formatValueShort(oecdAvg.value, selected.unit)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">OECD 평균</p>
              </div>
            )}
            {koreaRank && (
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
                  {koreaRank}<span className="text-base">/{totalCountries}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">비교 국가 중</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Metrics Overview Grid */}
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
          전체 지표 한눈에
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {metrics.map((metric) => {
            const korea = metric.countries.find((c) => c.is_korea);
            const oecd = metric.countries.find((c) => c.country === 'OECD 평균');
            const isActive = metric.metric_id === selectedId;
            const pill = METRIC_PILLS.find((p) => p.id === metric.metric_id);

            // Compute rank
            const ranked = [...metric.countries]
              .filter((c) => c.country !== 'OECD 평균')
              .sort((a, b) => (metric.lower_is_better ? a.value - b.value : b.value - a.value));
            const rank = ranked.findIndex((c) => c.is_korea) + 1;
            const total = ranked.length;

            return (
              <button
                key={metric.metric_id}
                onClick={() => {
                  setSelectedId(metric.metric_id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`
                  text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                  ${isActive
                    ? 'border-[#ff6b35] bg-orange-50 dark:bg-orange-950/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{pill?.icon}</span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {metric.metric_name}
                  </span>
                </div>

                <p className={`text-xl md:text-2xl font-bold ${isActive ? 'text-[#ff6b35]' : 'text-gray-900 dark:text-white'}`}>
                  {korea ? formatValueShort(korea.value, metric.unit) : '-'}
                  <span className="text-xs font-normal text-gray-400 ml-1">{metric.unit === '$' ? '' : metric.unit.replace(/\s*\(.*\)/, '')}</span>
                </p>

                <div className="flex items-center justify-between mt-2">
                  {oecd && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      OECD {formatValueShort(oecd.value, metric.unit)}
                    </p>
                  )}
                  {rank > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {rank}/{total}위
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center py-6 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          모든 데이터는 OECD, IMF, World Bank 공개 데이터 기반입니다 (2024년 기준).
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          OECD 평균은 38개 회원국 기준이며, 일부 지표는 최신 보고 연도 기준입니다.
        </p>
      </div>
    </div>
  );
}
