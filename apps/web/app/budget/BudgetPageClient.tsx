'use client';
// 예산 시각화 — 클라이언트 컴포넌트
import { useState } from 'react';
import type { FiscalYearly, FiscalBySector } from '@/lib/types';
import KPI from '@/components/common/KPI';
import StackedArea from '@/components/charts/StackedArea';
import DebtChart from '@/components/charts/DebtChart';
import TreeMapChart from '@/components/charts/TreeMap';
import SankeyChart from '@/components/charts/SankeyChart';
import { formatTrillions, formatPercent } from '@/lib/utils';

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
  const availableYears = [2024, 2025, 2026];

  const currentSectors = sectorDataByYear[selectedYear] || sectorDataByYear[2026];

  // TreeMap 데이터
  const treemapData = currentSectors.map(s => ({
    name: s.sector,
    value: s.amount,
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
    amount: s.amount,
    percentage: s.percentage || 0,
    yoyChange: s.yoy_change || 0,
  }));

  const totalSpending = latestYear?.total_spending || 728;
  const nationalDebt = latest2024?.national_debt || 1175;
  const taxRevenue = latest2024?.tax_revenue || 336.5;
  const debtToGdp = latest2024?.debt_to_gdp || 46.8;

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">예산 시각화</h1>
        <p className="text-sm text-gray-500 mt-2">
          대한민국 정부 예산의 세입, 세출, 국가채무를 한눈에 확인하세요.
        </p>
      </div>

      {/* KPI 히어로 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPI
          label={`총지출 (${selectedYear}년${selectedYear >= 2026 ? '안' : ''})`}
          value={`${totalSpending.toFixed(0)}조`}
          change={selectedYear >= 2026 ? '전년 대비 +7.5%' : undefined}
          trend="up"
          source="기획재정부"
        />
        <KPI
          label="국가채무 (2024)"
          value={`${nationalDebt.toFixed(0)}조`}
          source="기획재정부"
        />
        <KPI
          label="세수 (2024)"
          value={`${taxRevenue.toFixed(1)}조`}
          change="예산 대비 △30.8조 부족"
          trend="down"
          source="기획재정부"
        />
        <KPI
          label="GDP 대비 채무"
          value={`${debtToGdp.toFixed(1)}%`}
          change="OECD 평균 112.3%"
          trend="neutral"
          source="기획재정부"
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
          <h2 className="font-bold text-lg mb-1">{selectedYear}년 분야별 예산</h2>
          <p className="text-xs text-gray-400 mb-4">
            크기 = 예산 규모 · 출처: 기획재정부
          </p>
          <TreeMapChart data={treemapData} height={380} />
        </div>

        {/* 세출 추이 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-1">세출 추이 (1998-2026)</h2>
          <p className="text-xs text-gray-400 mb-4">본예산 기준, 조원 단위</p>
          <StackedArea
            data={spendingTrendData}
            sectors={['총지출']}
            height={380}
          />
        </div>
      </div>

      {/* Sankey */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">세입 → 세출 흐름도</h2>
        <p className="text-xs text-gray-400 mb-4">
          주요 수입원에서 지출 분야로의 자금 흐름 (2026년 예산안 기준) · 출처: 기획재정부
        </p>
        <SankeyChart data={sankeyData} height={480} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 국가채무 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-1">국가채무 궤적</h2>
          <p className="text-xs text-gray-400 mb-4">채무 규모 및 GDP 대비 비율</p>
          <DebtChart data={debtChartData} height={350} />
        </div>

        {/* 국제 비교 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-1">GDP 대비 국가채무 국제 비교</h2>
          <p className="text-xs text-gray-400 mb-4">D1 기준 · 출처: IMF, OECD</p>
          <div className="space-y-3 mt-6">
            {[
              { country: '일본', value: 260, flag: '🇯🇵' },
              { country: '미국', value: 121, flag: '🇺🇸' },
              { country: 'OECD 평균', value: 112.3, flag: '🌐' },
              { country: '영국', value: 101, flag: '🇬🇧' },
              { country: '독일', value: 64, flag: '🇩🇪' },
              { country: '한국', value: 46.8, flag: '🇰🇷', highlight: true },
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
        <h2 className="font-bold text-lg mb-4">{selectedYear}년 분야별 예산 상세</h2>
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
