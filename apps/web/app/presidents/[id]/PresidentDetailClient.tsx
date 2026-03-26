'use client';
// 대통령 상세 페이지 — 탭 기반 인포그래픽 레이아웃
import { useState, useMemo } from 'react';
import type { President, FiscalYearly, CampaignPledge, NationalAgenda, ReportCardMetric, KeyEvent } from '@/lib/types';
import type { BudgetComparison } from '@/lib/data';
import KPI from '@/components/common/KPI';
import DebtChart from '@/components/charts/DebtChart';
import StackedArea from '@/components/charts/StackedArea';
import PolicyTimeline from '@/components/timeline/PolicyTimeline';
import FulfillmentGauge from '@/components/presidents/FulfillmentGauge';
import StatusBreakdownBar, { getStatusColor, getStatusBgClass } from '@/components/presidents/StatusBreakdownBar';
import PledgeCard from '@/components/presidents/PledgeCard';
import AgendaProgress from '@/components/presidents/AgendaProgress';
import ReportCardRadar from '@/components/presidents/ReportCardRadar';
import MetricComparisonRow from '@/components/presidents/MetricComparisonRow';
import BeforeAfterCard from '@/components/presidents/BeforeAfterCard';
import BudgetWaterfall from '@/components/presidents/BudgetWaterfall';
import BudgetBarChart, { ExecutionRateRanking } from '@/components/presidents/BudgetBarChart';
import PresidentPortrait from '@/components/presidents/PresidentPortrait';
import { getPresidentColor, getPresidentBgColor, formatTrillions, getTermYears } from '@/lib/utils';

// ============================================================
// 탭 정의
// ============================================================

const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'pledges', label: '공약이행' },
  { id: 'agenda', label: '국정과제' },
  { id: 'budget', label: '예산비교' },
  { id: 'report', label: '성과분석' },
] as const;

type TabId = typeof TABS[number]['id'];

// ============================================================
// Props
// ============================================================

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
  // New data
  pledges: CampaignPledge[];
  agendas: NationalAgenda[];
  reportCard: ReportCardMetric[];
  keyEvents: KeyEvent[];
  budgetComparison: BudgetComparison[];
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function PresidentDetailClient({
  president,
  fiscalData,
  allFiscal,
  policies,
  events,
  kpis,
  pledges,
  agendas,
  reportCard,
  keyEvents,
  budgetComparison,
}: PresidentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [pledgeFilter, setPledgeFilter] = useState<string>('all');
  const [pledgeCategoryFilter, setPledgeCategoryFilter] = useState<string>('all');
  const [pledgeSort, setPledgeSort] = useState<'pct' | 'status'>('pct');

  const partyColor = getPresidentColor(president.party);
  const bgColor = getPresidentBgColor(president.party);
  const termStart = president.term_start;
  const termEnd = president.term_end || '';
  const isCurrentPresident = !termEnd;

  // 차트 데이터
  const spendingChartData = fiscalData.map(f => ({
    year: f.year,
    '정부 지출': f.total_spending || 0,
  }));

  const debtChartData = fiscalData.map(f => ({
    year: f.year,
    national_debt: f.national_debt || null,
    debt_to_gdp: f.debt_to_gdp || null,
    president_id: f.president_id,
  }));

  // 공약 통계
  const pledgeStats = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const categories = new Set<string>();
    let totalPct = 0;

    for (const p of pledges) {
      statusCounts[p.fulfillment_status] = (statusCounts[p.fulfillment_status] || 0) + 1;
      categories.add(p.category);
      totalPct += p.fulfillment_pct;
    }

    const avgPct = pledges.length > 0 ? Math.round(totalPct / pledges.length) : 0;

    const statusData = [
      { status: '이행완료', count: statusCounts['이행완료'] || 0, color: getStatusColor('이행완료') },
      { status: '추진중', count: statusCounts['추진중'] || 0, color: getStatusColor('추진중') },
      { status: '일부이행', count: statusCounts['일부이행'] || 0, color: getStatusColor('일부이행') },
      { status: '미이행', count: statusCounts['미이행'] || 0, color: getStatusColor('미이행') },
      { status: '폐기', count: statusCounts['폐기'] || 0, color: getStatusColor('폐기') },
      { status: '보류', count: statusCounts['보류'] || 0, color: getStatusColor('보류') },
    ];

    return { statusData, avgPct, categories: Array.from(categories) };
  }, [pledges]);

  // 필터된 공약
  const filteredPledges = useMemo(() => {
    let result = [...pledges];
    if (pledgeFilter !== 'all') {
      result = result.filter(p => p.fulfillment_status === pledgeFilter);
    }
    if (pledgeCategoryFilter !== 'all') {
      result = result.filter(p => p.category === pledgeCategoryFilter);
    }
    if (pledgeSort === 'pct') {
      result.sort((a, b) => b.fulfillment_pct - a.fulfillment_pct);
    } else {
      const order = ['이행완료', '추진중', '일부이행', '미이행', '폐기'];
      result.sort((a, b) => order.indexOf(a.fulfillment_status) - order.indexOf(b.fulfillment_status));
    }
    return result;
  }, [pledges, pledgeFilter, pledgeCategoryFilter, pledgeSort]);

  // 예산 워터폴 합산
  const budgetTotals = useMemo(() => {
    return budgetComparison.reduce(
      (acc, b) => ({
        pledged: acc.pledged + b.pledged,
        approved: acc.approved + b.approved,
        executed: acc.executed + b.executed,
      }),
      { pledged: 0, approved: 0, executed: 0 }
    );
  }, [budgetComparison]);

  // 미니 게이지 데이터
  const agendaCompletionRate = agendas.length > 0
    ? Math.round(agendas.reduce((s, a) => s + a.completion_rate, 0) / agendas.length)
    : 0;
  const budgetExecutionRate = budgetTotals.approved > 0
    ? Math.round((budgetTotals.executed / budgetTotals.approved) * 100)
    : 0;

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 뒤로가기 */}
      <a href="/presidents" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block transition-colors">
        ← 대통령 목록
      </a>

      {/* ===== 히어로 헤더 ===== */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: partyColor }} />
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <PresidentPortrait id={president.id} name={president.name} party={president.party} size={80} className="hidden sm:block" />
            <PresidentPortrait id={president.id} name={president.name} party={president.party} size={64} className="sm:hidden" />

            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {president.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{president.name_en}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600">
                <span className="font-semibold" style={{ color: partyColor }}>
                  {president.era}
                </span>
                <span className="text-xs text-gray-400">{president.party}</span>
                <span className="text-xs text-gray-500">
                  {termStart.substring(0, 10)} ~ {isCurrentPresident ? '현재' : termEnd.substring(0, 10)}
                  {' '}({getTermYears(termStart, termEnd || null)})
                </span>
              </div>
              {president.note && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded inline-block font-medium">
                  {president.note}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 탭 바 ===== */}
      <div className="sticky top-16 z-40 bg-body -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-none -mb-px gap-1" aria-label="탭">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ===== 탭 1: 개요 ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <KPI
              label="평균 GDP 성장률"
              value={`${kpis.gdpGrowth}%`}
              source="한국은행 ECOS"
            />
            <KPI
              label="국가채무 증감"
              value={kpis.debtChange === '-' ? '-' : `${kpis.debtChange}%`}
              change={kpis.firstYearDebt > 0
                ? `${formatTrillions(kpis.firstYearDebt)} → ${formatTrillions(kpis.lastYearDebt)}`
                : undefined}
              trend={Number(kpis.debtChange) > 30 ? 'up' : 'neutral'}
              source="기획재정부"
            />
            <KPI
              label="공약 이행률"
              value={pledgeStats.avgPct > 0 ? `${pledgeStats.avgPct}%` : '-'}
              source="공약 분석"
            />
            <KPI
              label="GDP 대비 채무비율"
              value={kpis.debtToGdp === '-' ? '-' : `${kpis.debtToGdp}%`}
              source="기획재정부"
            />
          </div>

          {/* 미니 인포그래픽 스트립 — 3개 원형 게이지 */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">주요 이행 현황</h2>
            <div className="flex justify-around items-center flex-wrap gap-4">
              <FulfillmentGauge
                percentage={pledgeStats.avgPct}
                size={110}
                label="공약이행률"
              />
              <FulfillmentGauge
                percentage={agendaCompletionRate}
                size={110}
                label="국정과제 완료율"
              />
              <FulfillmentGauge
                percentage={budgetExecutionRate}
                size={110}
                label="예산집행률"
              />
            </div>
          </div>

          {/* 주요 사건 타임라인 */}
          {keyEvents.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-lg mb-4">주요 사건 타임라인</h2>
              <PolicyTimeline
                events={keyEvents.map(e => ({
                  date: e.event_date,
                  title: e.title,
                  type: e.impact_type,
                  description: e.description,
                  why_it_matters: e.why_it_matters,
                  citizen_impact: e.citizen_impact,
                  background: e.background,
                  what_happened_after: e.what_happened_after,
                  related_numbers: e.related_numbers,
                  significance_score: e.significance_score,
                }))}
              />
            </div>
          )}

          {/* 핵심 정책 요약 */}
          {policies.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-lg mb-4">핵심 정책</h2>
              <div className="space-y-3">
                {policies.slice(0, 5).map((policy, i) => (
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                          <span className="text-[10px] text-gray-400">영향력 {policy.impact_score}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 차트 그리드 */}
          <div className="grid md:grid-cols-2 gap-6">
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

            <div className="card">
              <h2 className="font-bold text-lg mb-1">국가채무 궤적</h2>
              <p className="text-xs text-gray-400 mb-4">임기 중 국가채무 및 GDP 대비 비율</p>
              <DebtChart data={debtChartData} height={280} />
            </div>
          </div>
        </div>
      )}

      {/* ===== 탭 2: 공약이행 ===== */}
      {activeTab === 'pledges' && (
        <div className="space-y-6">
          {/* 전체 이행률 + 상태 바 */}
          <div className="card">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <FulfillmentGauge
                percentage={pledgeStats.avgPct}
                size={160}
                strokeWidth={12}
                label="평균 이행률"
              />
              <div className="flex-1 w-full">
                <h2 className="text-sm font-semibold text-gray-600 mb-3">이행 현황 분포</h2>
                <StatusBreakdownBar data={pledgeStats.statusData} />
                <p className="text-xs text-gray-400 mt-3">
                  총 {pledges.length}개 공약 분석
                </p>
              </div>
            </div>
          </div>

          {/* 필터 + 정렬 */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">상태:</span>
            <button
              onClick={() => setPledgeFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${pledgeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              전체
            </button>
            {pledgeStats.statusData.filter(s => s.count > 0).map(s => (
              <button
                key={s.status}
                onClick={() => setPledgeFilter(s.status)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${pledgeFilter === s.status ? 'text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                style={pledgeFilter === s.status ? { backgroundColor: s.color } : { backgroundColor: '#f3f4f6' }}
              >
                {s.status} ({s.count})
              </button>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

            <span className="text-xs text-gray-500 font-medium mr-1">분야:</span>
            <select
              value={pledgeCategoryFilter}
              onChange={e => setPledgeCategoryFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600"
            >
              <option value="all">전체</option>
              {pledgeStats.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

            <span className="text-xs text-gray-500 font-medium mr-1">정렬:</span>
            <button
              onClick={() => setPledgeSort('pct')}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${pledgeSort === 'pct' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              이행률순
            </button>
            <button
              onClick={() => setPledgeSort('status')}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${pledgeSort === 'status' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              상태순
            </button>
          </div>

          {/* 공약 카드 목록 */}
          <div className="space-y-3">
            {filteredPledges.length > 0 ? (
              filteredPledges.map(pledge => (
                <PledgeCard key={pledge.id} pledge={pledge} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                해당 조건의 공약이 없습니다
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 탭 3: 국정과제 ===== */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-bold text-lg mb-4">국정과제 이행 현황</h2>
            {agendas.length > 0 ? (
              <AgendaProgress agendas={agendas} />
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                국정과제 데이터 준비 중
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 탭 4: 예산비교 ===== */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* 워터폴 차트 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-1">예산 흐름 (총합)</h2>
            <p className="text-xs text-gray-400 mb-4">공약 예산 → 국회 확정 → 실제 집행</p>
            <BudgetWaterfall
              promised={budgetTotals.pledged}
              approved={budgetTotals.approved}
              executed={budgetTotals.executed}
            />
          </div>

          {/* 분야별 비교 바 차트 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-1">분야별 예산 비교</h2>
            <p className="text-xs text-gray-400 mb-4">정책 분야별 공약/확정/집행 (조원)</p>
            <BudgetBarChart data={budgetComparison} height={350} />
          </div>

          {/* 집행률 순위 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-4">집행률 순위</h2>
            <ExecutionRateRanking data={budgetComparison} />
          </div>

          {/* 지출 추이 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-1">임기 중 총지출 추이</h2>
            <p className="text-xs text-gray-400 mb-4">연도별 총지출 (조원)</p>
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

          <div className="text-xs text-gray-300 text-center">
            출처: 기획재정부, 나라장터
          </div>
        </div>
      )}

      {/* ===== 탭 5: 성과분석 ===== */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* 레이더 차트 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-1">분야별 성과 레이더</h2>
            <p className="text-xs text-gray-400 mb-2">카테고리별 평가 점수 (등급 기반 100점 환산)</p>
            <ReportCardRadar metrics={reportCard} height={340} />
          </div>

          {/* 지표 비교 테이블 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-4">주요 지표 비교</h2>
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              {reportCard.length > 0 ? (
                <div>
                  {reportCard.map(metric => (
                    <MetricComparisonRow key={metric.id} metric={metric} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  성과 데이터 준비 중
                </div>
              )}
            </div>
          </div>

          {/* Before/After 비교 카드 */}
          {reportCard.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4">취임 시 vs 최종 비교</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {reportCard.map(metric => (
                  <BeforeAfterCard key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
          )}

          {/* AI 종합 평가 */}
          <div className="card bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="ai-badge">AI 분석</span>
              <h2 className="font-bold text-lg text-purple-900">종합 평가</h2>
            </div>
            <p className="text-sm text-purple-800 leading-relaxed">
              {president.name} 대통령의 임기({termStart.substring(0, 4)}~{isCurrentPresident ? '현재' : termEnd.substring(0, 4)})를 종합적으로 분석하면,{' '}
              {reportCard.filter(m => m.trend === 'improved').length}개 지표에서 개선,{' '}
              {reportCard.filter(m => m.trend === 'worsened').length}개 지표에서 악화,{' '}
              {reportCard.filter(m => m.trend === 'stable').length}개 지표에서 정체를 보였습니다.
              {pledges.length > 0 && (
                <> 전체 {pledges.length}개 공약 중 평균 이행률은 {pledgeStats.avgPct}%이며, {
                  pledgeStats.statusData.find(s => s.status === '이행완료')?.count || 0
                }개가 완료되었습니다.</>
              )}
              {agendas.length > 0 && (
                <> {agendas.length}개 국정과제의 평균 이행률은 {agendaCompletionRate}%입니다.</>
              )}
            </p>
            <p className="text-[10px] text-purple-400 mt-3">
              * 이 분석은 AI가 공개 데이터를 기반으로 생성한 것으로, 정치적 견해를 반영하지 않습니다.
            </p>
          </div>
        </div>
      )}

      {/* 출처 */}
      <div className="mt-8 text-xs text-gray-300 text-center">
        출처: 기획재정부 나라살림, 한국은행 ECOS, 대통령기록관 · 모든 대통령에 동일한 기준 적용
      </div>
    </div>
  );
}
