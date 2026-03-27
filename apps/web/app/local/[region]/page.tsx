import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocalGovernmentById, getLocalGovernments, getLocalGovernmentNationalAvgFiscalIndependence } from '@/lib/data';

export async function generateStaticParams() {
  return getLocalGovernments().map(g => ({ region: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const gov = getLocalGovernmentById(region);
  if (!gov) return { title: '지역을 찾을 수 없습니다' };
  return {
    title: `${gov.name} | 지방자치단체 | 국정투명`,
    description: `${gov.name}의 재정자립도(${gov.fiscal_independence}%), 예산(${gov.budget}조원), 채무, 주요 현안을 확인하세요.`,
    openGraph: {
      title: `${gov.name} 재정 현황 | 국정투명`,
      description: `${gov.governor} ${gov.name}의 재정 건전성과 주요 현안 분석`,
    },
  };
}

function getFiscalColor(fiscal: number): string {
  if (fiscal >= 60) return 'bg-emerald-500';
  if (fiscal >= 40) return 'bg-emerald-400';
  if (fiscal >= 30) return 'bg-yellow-400';
  if (fiscal >= 20) return 'bg-orange-400';
  return 'bg-red-500';
}

function getFiscalTextColor(fiscal: number): string {
  if (fiscal >= 60) return 'text-emerald-700';
  if (fiscal >= 40) return 'text-emerald-600';
  if (fiscal >= 30) return 'text-yellow-700';
  if (fiscal >= 20) return 'text-orange-600';
  return 'text-red-600';
}

function getPartyBgColor(party: string): string {
  if (party === '더불어민주당') return 'bg-blue-600';
  if (party === '국민의힘') return 'bg-red-600';
  return 'bg-gray-600';
}

function getPartyTextColor(party: string): string {
  if (party === '더불어민주당') return 'text-blue-600';
  if (party === '국민의힘') return 'text-red-600';
  return 'text-gray-600';
}

function getPartyLightBg(party: string): string {
  if (party === '더불어민주당') return 'bg-blue-50';
  if (party === '국민의힘') return 'bg-red-50';
  return 'bg-gray-50';
}

function getExtinctionBadgeStyle(risk: string): string {
  switch (risk) {
    case '심각': return 'bg-red-100 text-red-800 border-red-200';
    case '위험': return 'bg-orange-100 text-orange-800 border-orange-200';
    case '주의': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case '관심': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export default async function LocalRegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const gov = getLocalGovernmentById(region);
  if (!gov) notFound();

  const allGovs = getLocalGovernments();
  const nationalAvg = getLocalGovernmentNationalAvgFiscalIndependence();
  const isAboveAvg = gov.fiscal_independence >= nationalAvg;
  const maxFiscal = Math.max(...allGovs.map(g => g.fiscal_independence));

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/local" className="hover:text-gray-700 transition-colors">지방자치단체</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{gov.name_short}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{gov.name}</h1>
          <div className="flex items-center gap-2">
            <span className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white
              ${getPartyBgColor(gov.governor_party)}
            `}>
              {gov.governor}
            </span>
            <span className={`text-sm ${getPartyTextColor(gov.governor_party)}`}>
              {gov.governor_party}
            </span>
          </div>
        </div>
        <p className="text-gray-500 text-sm">인구 {gov.population}만명 · {gov.sub_regions_count}개 시·군·구</p>
      </div>

      {/* KPI Cards (5) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {/* Budget */}
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">예산</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {gov.budget}<span className="text-sm font-normal text-gray-500 ml-0.5">조원</span>
          </p>
        </div>
        {/* Debt */}
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">채무</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {gov.debt}<span className="text-sm font-normal text-gray-500 ml-0.5">조원</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">채무비율 {gov.debt_ratio}%</p>
        </div>
        {/* Fiscal Independence -- THE key metric */}
        <div className={`card border-2 ${isAboveAvg ? 'border-emerald-400 bg-emerald-50/30' : 'border-orange-400 bg-orange-50/30'}`}>
          <p className="text-xs text-gray-500 mb-1">재정자립도</p>
          <p className={`text-xl sm:text-2xl font-bold ${getFiscalTextColor(gov.fiscal_independence)}`}>
            {gov.fiscal_independence}<span className="text-sm font-normal ml-0.5">%</span>
          </p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getFiscalColor(gov.fiscal_independence)}`}
              style={{ width: `${Math.min(gov.fiscal_independence, 100)}%` }}
            />
          </div>
        </div>
        {/* Fiscal Self-Reliance */}
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">재정자주도</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {gov.fiscal_self_reliance}<span className="text-sm font-normal text-gray-500 ml-0.5">%</span>
          </p>
        </div>
        {/* Sub-regions */}
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">시·군·구</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {gov.sub_regions_count}<span className="text-sm font-normal text-gray-500 ml-0.5">개</span>
          </p>
        </div>
      </div>

      {/* Fiscal Health Indicator */}
      <div className="card mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">재정 건전성 비교</h2>
        <div className="space-y-4">
          {/* This region */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-gray-900">{gov.name_short}</span>
              <span className={`font-bold ${getFiscalTextColor(gov.fiscal_independence)}`}>
                {gov.fiscal_independence}%
              </span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${getFiscalColor(gov.fiscal_independence)}`}
                style={{ width: `${(gov.fiscal_independence / maxFiscal) * 100}%` }}
              />
            </div>
          </div>
          {/* National average */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-500">전국 평균</span>
              <span className="font-medium text-gray-600">{nationalAvg}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${(nationalAvg / maxFiscal) * 100}%` }}
              />
            </div>
          </div>
          {/* Assessment */}
          <div className={`
            mt-3 px-4 py-3 rounded-lg text-sm
            ${isAboveAvg ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800'}
          `}>
            {isAboveAvg
              ? `${gov.name_short}의 재정자립도(${gov.fiscal_independence}%)는 전국 평균(${nationalAvg}%)보다 ${(gov.fiscal_independence - nationalAvg).toFixed(1)}%p 높습니다. 상대적으로 자체 재정 운영 능력이 양호합니다.`
              : `${gov.name_short}의 재정자립도(${gov.fiscal_independence}%)는 전국 평균(${nationalAvg}%)보다 ${(nationalAvg - gov.fiscal_independence).toFixed(1)}%p 낮습니다. 중앙정부 재정 이전에 대한 의존도가 높은 편입니다.`
            }
          </div>
        </div>
      </div>

      {/* Extinction Risk Warning */}
      {gov.extinction_risk && (
        <div className={`card mb-8 border ${getExtinctionBadgeStyle(gov.extinction_risk)}`}>
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
              {gov.extinction_risk === '심각' || gov.extinction_risk === '위험' ? '!' : '!'}
            </div>
            <div>
              <h2 className="font-semibold mb-1">
                인구 소멸위험 등급: <span className="font-bold">{gov.extinction_risk}</span>
              </h2>
              <p className="text-sm leading-relaxed">
                {gov.extinction_risk === '심각' &&
                  `${gov.name_short}는 인구 소멸위험이 심각한 단계입니다. 출생률 저하와 청년 인구 유출이 지속되고 있으며, 고령화율이 매우 높습니다. 지역 소멸을 방지하기 위한 적극적인 정책 개입이 시급합니다.`}
                {gov.extinction_risk === '위험' &&
                  `${gov.name_short}는 인구 소멸위험이 높은 지역입니다. 특히 농어촌 지역의 고령화가 심각하며, 젊은 세대의 수도권 유출이 계속되고 있습니다. 지역 일자리 창출과 정주 여건 개선이 필요합니다.`}
                {gov.extinction_risk === '주의' &&
                  `${gov.name_short}는 인구 소멸에 대한 주의가 필요한 지역입니다. 일부 지역에서 인구 감소 추세가 나타나고 있으며, 선제적인 대응이 요구됩니다.`}
                {gov.extinction_risk === '관심' &&
                  `${gov.name_short}는 인구 변동에 대한 관심이 필요한 지역입니다. 현재는 안정적이나, 장기적인 인구 추세를 주시할 필요가 있습니다.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="card mb-8">
        <h2 className="font-semibold text-gray-800 mb-3">지역 개요</h2>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{gov.description}</p>
      </div>

      {/* Key Issues */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">주요 현안</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gov.key_issues.map((issue, i) => (
            <div
              key={i}
              className={`card ${getPartyLightBg(gov.governor_party)} border-l-4 ${
                gov.governor_party === '더불어민주당' ? 'border-blue-400' :
                gov.governor_party === '국민의힘' ? 'border-red-400' : 'border-gray-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {i + 1}
                </span>
                <span className="text-sm sm:text-base text-gray-800 font-medium">{issue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">전국 재정자립도 비교</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs">
                <th className="py-2 px-2 text-left font-medium">시·도</th>
                <th className="py-2 px-2 text-right font-medium">재정자립도</th>
                <th className="py-2 px-2 text-left font-medium w-1/3 hidden sm:table-cell">비교</th>
              </tr>
            </thead>
            <tbody>
              {allGovs
                .slice()
                .sort((a, b) => b.fiscal_independence - a.fiscal_independence)
                .map(g => {
                  const isCurrent = g.id === gov.id;
                  return (
                    <tr
                      key={g.id}
                      className={`
                        border-b border-gray-50 transition-colors
                        ${isCurrent ? 'bg-blue-50/60 font-semibold' : 'hover:bg-gray-50'}
                      `}
                    >
                      <td className="py-2 px-2">
                        {isCurrent ? (
                          <span className="text-gray-900">{g.name_short}</span>
                        ) : (
                          <Link href={`/local/${g.id}`} className="text-gray-700 hover:text-blue-600 transition-colors">
                            {g.name_short}
                          </Link>
                        )}
                      </td>
                      <td className={`py-2 px-2 text-right tabular-nums ${getFiscalTextColor(g.fiscal_independence)} ${isCurrent ? 'font-bold' : ''}`}>
                        {g.fiscal_independence}%
                      </td>
                      <td className="py-2 px-2 hidden sm:table-cell">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full ${isCurrent ? getFiscalColor(g.fiscal_independence) : 'bg-gray-300'}`}
                            style={{ width: `${(g.fiscal_independence / maxFiscal) * 100}%` }}
                          />
                          {/* National average marker */}
                          <div
                            className="absolute top-0 h-full w-0.5 bg-gray-600"
                            style={{ left: `${(nationalAvg / maxFiscal) * 100}%` }}
                            title={`전국 평균: ${nationalAvg}%`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {/* Average row */}
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-2 text-gray-500 font-medium">전국 평균</td>
                <td className="py-2 px-2 text-right font-bold text-gray-600 tabular-nums">{nationalAvg}%</td>
                <td className="py-2 px-2 hidden sm:table-cell">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-500"
                      style={{ width: `${(nationalAvg / maxFiscal) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Back navigation */}
      <div className="text-center">
        <Link
          href="/local"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span aria-hidden="true">&larr;</span>
          전체 지방자치단체 보기
        </Link>
      </div>
    </div>
  );
}
