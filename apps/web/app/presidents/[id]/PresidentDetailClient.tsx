'use client';
// 대통령 상세 페이지 — 클라이언트 컴포넌트 (차트 포함)
import type { President, FiscalYearly } from '@/lib/types';
import KPI from '@/components/common/KPI';
import DebtChart from '@/components/charts/DebtChart';
import StackedArea from '@/components/charts/StackedArea';
import PolicyTimeline from '@/components/timeline/PolicyTimeline';
import { getPresidentColor, getPresidentBgColor, formatTrillions, getTermYears } from '@/lib/utils';

interface PresidentDetailClientProps {
  president: President;
  fiscalData: FiscalYearly[];
  allFiscal: FiscalYearly[];
  policies: any[];
  events: any[];
  kpis: {
    gdpGrowth: string;
    spendingChange: string;
    debtChange: string;
    debtToGdp: string;
    firstYearSpending: number;
    lastYearSpending: number;
    firstYearDebt: number;
    lastYearDebt: number;
  };
}

export default function PresidentDetailClient({
  president,
  fiscalData,
  allFiscal,
  policies,
  events,
  kpis,
}: PresidentDetailClientProps) {
  const partyColor = getPresidentColor(president.party);
  const bgColor = getPresidentBgColor(president.party);
  const termStart = president.termStart || president.term_start || '';
  const termEnd = president.termEnd || president.term_end || '';
  const isCurrentPresident = !termEnd;

  // 지출 추이 데이터 (간단한 라인용)
  const spendingChartData = fiscalData.map(f => ({
    year: f.year,
    '정부 지출': f.total_spending || 0,
  }));

  // 채무 차트 데이터
  const debtChartData = fiscalData.map(f => ({
    year: f.year,
    national_debt: f.national_debt || null,
    debt_to_gdp: f.debt_to_gdp || null,
    president_id: f.president_id,
  }));

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 뒤로가기 */}
      <a href="/presidents" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
        ← 대통령 목록
      </a>

      {/* 헤더 */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: partyColor }} />
        <div className="p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* 이니셜 아바타 */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold flex-shrink-0"
              style={{ backgroundColor: bgColor, color: partyColor }}
            >
              {president.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {president.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {president.nameEn || president.name_en}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-600">
                <span className="font-medium" style={{ color: partyColor }}>
                  {president.era}
                </span>
                <span>{president.party}</span>
                <span>
                  {termStart.substring(0, 10)} ~ {isCurrentPresident ? '현재' : termEnd.substring(0, 10)}
                  {' '}({getTermYears(termStart, termEnd || null)})
                </span>
              </div>
              {president.note && (
                <div className="mt-2 text-xs text-red-400 bg-red-50 px-2 py-1 rounded inline-block">
                  {president.note}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPI
          label="평균 GDP 성장률"
          value={`${kpis.gdpGrowth}%`}
          source="한국은행 ECOS"
        />
        <KPI
          label="지출 변화"
          value={kpis.spendingChange === '-' ? '-' : `${kpis.spendingChange}%`}
          change={kpis.firstYearSpending > 0
            ? `${formatTrillions(kpis.firstYearSpending)} → ${formatTrillions(kpis.lastYearSpending)}`
            : undefined}
          trend={Number(kpis.spendingChange) > 0 ? 'up' : 'neutral'}
          source="기획재정부"
        />
        <KPI
          label="채무 변화"
          value={kpis.debtChange === '-' ? '-' : `${kpis.debtChange}%`}
          change={kpis.firstYearDebt > 0
            ? `${formatTrillions(kpis.firstYearDebt)} → ${formatTrillions(kpis.lastYearDebt)}`
            : undefined}
          trend={Number(kpis.debtChange) > 30 ? 'up' : 'neutral'}
          source="기획재정부"
        />
        <KPI
          label="GDP 대비 채무비율"
          value={kpis.debtToGdp === '-' ? '-' : `${kpis.debtToGdp}%`}
          source="기획재정부"
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 정부 지출 추이 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-1">정부 지출 추이</h2>
          <p className="text-xs text-gray-400 mb-4">임기 중 연도별 총지출 (조원)</p>
          {spendingChartData.length > 0 ? (
            <StackedArea
              data={spendingChartData}
              sectors={['정부 지출']}
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              해당 기간 데이터 없음
            </div>
          )}
        </div>

        {/* 국가채무 궤적 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-1">국가채무 궤적</h2>
          <p className="text-xs text-gray-400 mb-4">임기 중 국가채무 및 GDP 대비 비율</p>
          <DebtChart data={debtChartData} height={280} />
        </div>
      </div>

      {/* 정책 + 사건 타임라인 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 주요 정책 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">주요 정책</h2>
          {policies.length > 0 ? (
            <div className="space-y-3">
              {policies.map((policy, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      policy.status === '완료' ? 'bg-green-500' :
                      policy.status === '진행중' || policy.status === '추진중' ? 'bg-blue-500' :
                      policy.status === '중단' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800">{policy.title}</span>
                      <span className="text-[10px] text-gray-400">{policy.year}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                        {policy.category}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        policy.status === '완료' ? 'bg-green-100 text-green-700' :
                        policy.status === '진행중' || policy.status === '추진중' ? 'bg-blue-100 text-blue-700' :
                        policy.status === '중단' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {policy.status}
                      </span>
                      {policy.impact_score && (
                        <span className="text-[10px] text-gray-400">
                          영향력 {policy.impact_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">정책 데이터 준비 중</p>
          )}
        </div>

        {/* 주요 사건 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">주요 사건</h2>
          <PolicyTimeline
            events={events.map(e => ({
              date: e.date,
              title: e.title,
              type: e.type,
            }))}
          />
        </div>
      </div>

      {/* 출처 */}
      <div className="mt-6 text-xs text-gray-300 text-center">
        출처: 기획재정부 나라살림, 한국은행 ECOS, 대통령기록관 · 모든 대통령에 동일한 기준 적용
      </div>
    </div>
  );
}
