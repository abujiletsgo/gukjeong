'use client';
// 예산 시각화 — 클라이언트 컴포넌트
import { useState, useMemo } from 'react';
import type { FiscalYearly, FiscalBySector, SubSectorData } from '@/lib/types';
import { getSubSectorData } from '@/lib/data';
import KPI from '@/components/common/KPI';
import StackedArea from '@/components/charts/StackedArea';
import DebtChart from '@/components/charts/DebtChart';
import TreeMapChart from '@/components/charts/TreeMap';
import SankeyChart from '@/components/charts/SankeyChart';
import { formatTrillions, formatPercent } from '@/lib/utils';

// 분야별 색상 매핑 (TreeMap과 동일 색상 계열)
const SECTOR_COLORS: Record<string, { base: string; gradient: string[] }> = {
  '보건·복지·고용': { base: '#3b82f6', gradient: ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93bbfd', '#bfdbfe', '#dbeafe', '#eff6ff', '#c7d9f7', '#a5c4f3'] },
  '교육': { base: '#8b5cf6', gradient: ['#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'] },
  '국방': { base: '#ef4444', gradient: ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5'] },
  '일반·지방행정': { base: '#f59e0b', gradient: ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a'] },
  '산업·중소기업·에너지': { base: '#10b981', gradient: ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'] },
  'R&D': { base: '#06b6d4', gradient: ['#0e7490', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'] },
  '공공질서·안전': { base: '#f43f5e', gradient: ['#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af'] },
  'SOC': { base: '#84cc16', gradient: ['#4d7c0f', '#65a30d', '#84cc16', '#a3e635', '#bef264', '#d9f99d'] },
  '농림·수산·식품': { base: '#14b8a6', gradient: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] },
  '환경': { base: '#22c55e', gradient: ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'] },
  '문화·체육·관광': { base: '#a855f7', gradient: ['#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe'] },
};

interface BudgetPageClientProps {
  fiscalData: FiscalYearly[];
  sectorDataByYear: Record<number, FiscalBySector[]>;
  sankeyData: any;
  latestYear?: FiscalYearly;
  latest2024?: FiscalYearly;
}

export default function BudgetPageClient({
  fiscalData,
  sectorDataByYear,
  sankeyData,
  latestYear,
  latest2024,
}: BudgetPageClientProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedSector, setSelectedSector] = useState('보건·복지·고용');
  const [selectedSubSector, setSelectedSubSector] = useState<string | null>(null);
  const availableYears = [2024, 2025, 2026];

  const currentSectors = sectorDataByYear[selectedYear] || sectorDataByYear[2026];

  // TreeMap 데이터
  const treemapData = currentSectors.map(s => ({
    name: s.sector,
    value: s.amount || 0,
    percentage: s.percentage,
    yoy_change: s.yoy_change,
  }));

  // 스택드 에리어용 데이터 (간략화: 총지출 트렌드)
  const spendingTrendData = fiscalData.map(f => ({
    year: f.year,
    '총지출': f.total_spending || 0,
  }));

  // 채무 차트 데이터
  const debtChartData = fiscalData.map(f => ({
    year: f.year,
    national_debt: f.national_debt || null,
    debt_to_gdp: f.debt_to_gdp || null,
    president_id: f.president_id,
  }));

  // 비교 테이블 데이터
  const comparisonData = currentSectors.map(s => ({
    sector: s.sector,
    amount: s.amount || 0,
    percentage: s.percentage || 0,
    yoyChange: s.yoy_change || 0,
  }));

  // 하위 분류 데이터
  const subSectorData = useMemo(
    () => getSubSectorData(selectedSector, selectedYear),
    [selectedSector, selectedYear]
  );

  // 선택된 분야의 총 예산
  const selectedSectorTotal = useMemo(() => {
    const found = currentSectors.find(s => s.sector === selectedSector);
    return found?.amount || 0;
  }, [currentSectors, selectedSector]);

  // 하위 분류 최대 금액 (바 차트 스케일링용)
  const maxSubAmount = useMemo(
    () => Math.max(...subSectorData.map(d => d.amount), 1),
    [subSectorData]
  );

  const totalSpending = latestYear?.total_spending || 728;
  const nationalDebt = latest2024?.national_debt || 1175;
  const taxRevenue = latest2024?.tax_revenue || 336.5;
  const debtToGdp = latest2024?.debt_to_gdp || 46.8;

  // 분야별 색상 가져오기
  const getSectorColor = (sector: string, index: number = 0): string => {
    const colors = SECTOR_COLORS[sector];
    if (!colors) return '#6b7280';
    return colors.gradient[Math.min(index, colors.gradient.length - 1)];
  };

  const getSectorBaseColor = (sector: string): string => {
    return SECTOR_COLORS[sector]?.base || '#6b7280';
  };

  // 분야 목록 (셀렉터용)
  const sectorList = currentSectors.map(s => s.sector);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h0M18 12h0"/></svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">예산 시각화</h1>
            <p className="text-sm text-gray-500">
              대한민국 정부 예산의 세입, 세출, 국가채무를 한눈에 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* KPI 히어로 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPI
          label={`총지출 (${selectedYear}년${selectedYear >= 2026 ? '안' : ''})`}
          value={`${totalSpending.toFixed(0)}조`}
          change={selectedYear >= 2026 ? '전년 대비 +7.5%' : undefined}
          trend="up"
          source="기획재정부"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
        />
        <KPI
          label="국가채무 (2024)"
          value={`${nationalDebt.toFixed(0)}조`}
          source="기획재정부"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg>}
        />
        <KPI
          label="세수 (2024)"
          value={`${taxRevenue.toFixed(1)}조`}
          change="예산 대비 △30.8조 부족"
          trend="down"
          source="기획재정부"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        />
        <KPI
          label="GDP 대비 채무"
          value={`${debtToGdp.toFixed(1)}%`}
          change="OECD 평균 112.3%"
          trend="neutral"
          source="기획재정부"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}
        />
      </div>

      {/* 연도 선택기 */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 font-medium">연도:</span>
        <div className="flex gap-1">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}년{year >= 2026 ? '(안)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 차트 그리드 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* TreeMap */}
        <div className="card">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="4" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/><rect x="14" y="17" width="7" height="4" rx="1"/></svg>
            {selectedYear}년 분야별 예산
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            크기 = 예산 규모 · 출처: 기획재정부
          </p>
          <TreeMapChart data={treemapData} height={380} />
        </div>

        {/* 세출 추이 */}
        <div className="card">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg>
            세출 추이 (1998-2026)
          </h2>
          <p className="text-xs text-gray-400 mb-4">본예산 기준, 조원 단위</p>
          <StackedArea
            data={spendingTrendData}
            sectors={['총지출']}
            height={380}
          />
        </div>
      </div>

      {/* 예산 상세 분류 (Sub-Sector Drill-Down) */}
      <div className="card mb-6">
        <h2 className="flex items-center gap-2 font-bold text-lg mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M3 15h18"/>
            <path d="M9 3v18"/>
          </svg>
          예산 상세 분류
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          분야를 선택하면 세부 항목별 예산 배분을 확인할 수 있습니다 (2026년 예산안 기준)
        </p>

        {/* 분야 셀렉터 (pills) */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {sectorList.map(sector => {
            const isActive = sector === selectedSector;
            const baseColor = getSectorBaseColor(sector);
            return (
              <button
                key={sector}
                onClick={() => { setSelectedSector(sector); setSelectedSubSector(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={isActive ? { backgroundColor: baseColor, borderColor: baseColor } : undefined}
              >
                {sector}
              </button>
            );
          })}
        </div>

        {/* 선택된 분야 요약 헤더 */}
        <div className="flex items-baseline gap-3 mb-5">
          <div
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: getSectorBaseColor(selectedSector) }}
          />
          <div>
            <span className="font-bold text-gray-900 text-base">{selectedSector}</span>
            <span className="text-gray-400 text-sm ml-2">
              {selectedSectorTotal.toFixed(1)}조원
            </span>
          </div>
        </div>

        {/* 하위 분류 바 차트 */}
        {subSectorData.length > 0 ? (
          <div>
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              각 항목을 클릭하면 상세 설명을 볼 수 있습니다
            </p>
            <div className="space-y-1">
              {subSectorData.map((item, idx) => {
                const barWidth = Math.max(2, (item.amount / maxSubAmount) * 100);
                const barColor = getSectorColor(selectedSector, idx);
                const isExpanded = selectedSubSector === item.sub_sector;
                const isEtc = item.sub_sector.startsWith('기타');
                const hasDescription = !!(item.description || isEtc);
                const totalBudget = 728;
                const percentOfTotal = ((item.amount / totalBudget) * 100);
                return (
                  <div key={item.sub_sector}>
                    <button
                      type="button"
                      onClick={() => setSelectedSubSector(isExpanded ? null : item.sub_sector)}
                      className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
                        isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* 항목명 */}
                        <span className="text-sm text-gray-700 w-36 sm:w-44 shrink-0 truncate" title={item.sub_sector}>
                          {item.sub_sector}
                        </span>

                        {/* 바 */}
                        <div className="flex-1 h-7 bg-gray-100 rounded relative overflow-hidden">
                          <div
                            className="h-full rounded transition-all duration-500 ease-out"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: barColor,
                              opacity: 0.85,
                            }}
                          />
                          {/* 바 내부 퍼센트 (바가 충분히 넓을 때) */}
                          {barWidth > 25 && (
                            <span className="absolute left-2 top-0 h-full flex items-center text-[11px] font-medium text-white/90">
                              {item.percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>

                        {/* 금액 */}
                        <div className="text-right shrink-0 w-20">
                          <span className="text-sm font-semibold text-gray-800">
                            {item.amount.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400 ml-0.5">조</span>
                        </div>

                        {/* 비중 (바 바깥, 좁은 바용) */}
                        {barWidth <= 25 && (
                          <span className="text-[11px] text-gray-400 w-12 text-right shrink-0">
                            {item.percentage.toFixed(1)}%
                          </span>
                        )}

                        {/* 셰브론 인디케이터 */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`shrink-0 text-gray-300 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </button>

                    {/* 확장 패널 */}
                    {isExpanded && (
                      <div className="mx-2 mt-1 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="mb-2">
                          <span className="text-lg font-bold text-gray-900">
                            {item.amount.toFixed(1)}조원
                          </span>
                          <span className="text-sm text-gray-500 ml-1.5">
                            (전체 예산의 {percentOfTotal.toFixed(1)}%)
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">
                            {item.description}
                          </p>
                        )}

                        {isEtc && (
                          <p className="text-xs text-gray-400 italic mb-2">
                            여러 소규모 사업을 합산한 항목입니다
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubSector(null);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mt-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                          접기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            {selectedYear !== 2026
              ? '하위 분류 데이터는 2026년 예산안에서만 제공됩니다.'
              : '해당 분야의 하위 분류 데이터가 없습니다.'}
          </div>
        )}

        <p className="text-[10px] text-gray-300 mt-4">
          출처: 기획재정부 나라살림 예산개요 · 2026년 예산안 기준
        </p>
      </div>

      {/* Sankey */}
      <div className="card mb-6">
        <h2 className="flex items-center gap-2 font-bold text-lg mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/></svg>
          세입 → 세출 흐름도
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          주요 수입원에서 지출 분야로의 자금 흐름 (2026년 예산안 기준) · 출처: 기획재정부
        </p>
        <SankeyChart data={sankeyData} height={480} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 국가채무 */}
        <div className="card">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg>
            국가채무 궤적
          </h2>
          <p className="text-xs text-gray-400 mb-4">채무 규모 및 GDP 대비 비율</p>
          <DebtChart data={debtChartData} height={350} />
        </div>

        {/* 국제 비교 */}
        <div className="card">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            GDP 대비 국가채무 국제 비교
          </h2>
          <p className="text-xs text-gray-400 mb-4">D1 기준 · 출처: IMF, OECD</p>
          <div className="space-y-3 mt-6">
            {[
              { country: '일본', value: 260, flag: '\u{1F1EF}\u{1F1F5}' },
              { country: '미국', value: 121, flag: '\u{1F1FA}\u{1F1F8}' },
              { country: 'OECD 평균', value: 112.3, flag: '\u{1F310}' },
              { country: '영국', value: 101, flag: '\u{1F1EC}\u{1F1E7}' },
              { country: '독일', value: 64, flag: '\u{1F1E9}\u{1F1EA}' },
              { country: '한국', value: 46.8, flag: '\u{1F1F0}\u{1F1F7}', highlight: true },
            ].map(item => (
              <div key={item.country} className="flex items-center gap-3">
                <span className="text-lg">{item.flag}</span>
                <span className={`text-sm w-24 ${item.highlight ? 'font-bold text-accent' : 'text-gray-600'}`}>
                  {item.country}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                  <div
                    className={`h-5 rounded-full ${item.highlight ? 'bg-accent' : 'bg-blue-400'}`}
                    style={{ width: `${Math.min(100, (item.value / 260) * 100)}%` }}
                  />
                  <span className="absolute right-2 top-0 h-5 flex items-center text-xs font-medium text-gray-700">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 비교 테이블 */}
      <div className="card">
        <h2 className="flex items-center gap-2 font-bold text-lg mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          {selectedYear}년 분야별 예산 상세
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-600">분야</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">예산 (조원)</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">비중</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">전년 대비</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={row.sector} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-2.5 px-2 font-medium text-gray-800">{row.sector}</td>
                  <td className="py-2.5 px-2 text-right text-gray-700">{row.amount.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-500">{row.percentage.toFixed(1)}%</td>
                  <td className={`py-2.5 px-2 text-right font-medium ${
                    row.yoyChange > 0 ? 'text-red-500' : row.yoyChange < 0 ? 'text-blue-500' : 'text-gray-500'
                  }`}>
                    {row.yoyChange > 0 ? '+' : ''}{row.yoyChange.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-300 mt-3">
          출처: 기획재정부 나라살림 예산개요 · {selectedYear}년 {selectedYear >= 2026 ? '예산안' : '본예산'} 기준
        </p>
      </div>
    </div>
  );
}
