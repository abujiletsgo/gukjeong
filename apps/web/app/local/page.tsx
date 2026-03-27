import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocalGovernments, getLocalGovernmentNationalAvgFiscalIndependence } from '@/lib/data';

export const metadata: Metadata = {
  title: '지방자치단체 | 국정투명',
  description: '17개 시·도 지방자치단체의 재정자립도, 예산, 채무 현황을 한눈에 비교합니다.',
  openGraph: {
    title: '지방자치단체 재정 현황 | 국정투명',
    description: '대한민국 17개 광역자치단체의 재정 건전성을 투명하게 공개합니다.',
  },
};

function getFiscalColor(fiscal: number): string {
  if (fiscal >= 60) return 'bg-emerald-500';
  if (fiscal >= 40) return 'bg-emerald-400';
  if (fiscal >= 30) return 'bg-yellow-400';
  if (fiscal >= 20) return 'bg-orange-400';
  return 'bg-red-500';
}

function getFiscalBorderColor(fiscal: number): string {
  if (fiscal >= 60) return 'border-emerald-500';
  if (fiscal >= 40) return 'border-emerald-400';
  if (fiscal >= 30) return 'border-yellow-400';
  if (fiscal >= 20) return 'border-orange-400';
  return 'border-red-500';
}

function getFiscalTextColor(fiscal: number): string {
  if (fiscal >= 60) return 'text-emerald-700';
  if (fiscal >= 40) return 'text-emerald-600';
  if (fiscal >= 30) return 'text-yellow-700';
  if (fiscal >= 20) return 'text-orange-600';
  return 'text-red-600';
}

function getPartyColor(party: string): string {
  if (party === '더불어민주당') return 'text-blue-600';
  if (party === '국민의힘') return 'text-red-600';
  return 'text-gray-600';
}

function getPartyDot(party: string): string {
  if (party === '더불어민주당') return 'bg-blue-500';
  if (party === '국민의힘') return 'bg-red-500';
  return 'bg-gray-500';
}

export default function LocalGovernmentsPage() {
  const governments = getLocalGovernments();
  const nationalAvg = getLocalGovernmentNationalAvgFiscalIndependence();
  const totalPopulation = governments.reduce((s, g) => s + g.population, 0);
  const totalBudget = governments.reduce((s, g) => s + g.budget, 0);

  // Geographic grid layout -- approximate Korea map shape
  // Row 0: 강원
  // Row 1: 경기, 서울, 인천, 강원(cont)
  // Row 2: 충북, 충남, 세종, 대전
  // Row 3: 전북, 경북, 대구
  // Row 4: 전남, 광주, 경남, 부산, 울산
  // Row 5: 제주

  const geoRows: string[][] = [
    ['gyeonggi', 'seoul', 'incheon', 'gangwon'],
    ['sejong', 'chungnam', 'chungbuk', 'daejeon'],
    ['jeonbuk', 'daegu', 'gyeongbuk'],
    ['gwangju', 'jeonnam', 'gyeongnam', 'busan', 'ulsan'],
    ['jeju'],
  ];

  const govMap = Object.fromEntries(governments.map(g => [g.id, g]));

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">지방자치단체</h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          대한민국 17개 광역자치단체의 재정 건전성을 한눈에 비교합니다.
          <span className="block mt-1 text-gray-500">
            재정자립도는 자체 세입이 전체 세입에서 차지하는 비중입니다. 높을수록 중앙정부에 의존하지 않고 자체 운영이 가능합니다.
          </span>
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">광역자치단체</p>
          <p className="text-2xl font-bold text-gray-900">17<span className="text-sm font-normal text-gray-500">개</span></p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">총 인구</p>
          <p className="text-2xl font-bold text-gray-900">{(totalPopulation / 100).toFixed(0)}<span className="text-sm font-normal text-gray-500">백만명</span></p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">총 예산</p>
          <p className="text-2xl font-bold text-gray-900">{totalBudget.toFixed(1)}<span className="text-sm font-normal text-gray-500">조원</span></p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">평균 재정자립도</p>
          <p className="text-2xl font-bold text-gray-900">{nationalAvg}<span className="text-sm font-normal text-gray-500">%</span></p>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 text-xs text-gray-600">
        <span className="font-medium">재정자립도:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" />60%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400" />40~60%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400" />30~40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400" />20~30%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" />20% 미만</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />국민의힘</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />더불어민주당</span>
        </span>
      </div>

      {/* Geographic map grid */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">지역별 재정 현황</h2>
        <div className="space-y-2 sm:space-y-3">
          {geoRows.map((row, ri) => (
            <div
              key={ri}
              className="flex justify-center gap-2 sm:gap-3"
            >
              {row.map((id) => {
                const g = govMap[id];
                if (!g) return null;
                return (
                  <Link
                    key={g.id}
                    href={`/local/${g.id}`}
                    className={`
                      card group relative flex-1 max-w-[180px] p-3 sm:p-4
                      border-l-4 ${getFiscalBorderColor(g.fiscal_independence)}
                      hover:shadow-md transition-shadow cursor-pointer
                    `}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPartyDot(g.governor_party)}`} />
                      <span className="font-bold text-sm sm:text-base text-gray-900 truncate">{g.name_short}</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>인구</span>
                        <span className="font-medium text-gray-700">{g.population}만</span>
                      </div>
                      <div className="flex justify-between">
                        <span>예산</span>
                        <span className="font-medium text-gray-700">{g.budget}조</span>
                      </div>
                      <div className="flex justify-between">
                        <span>자립도</span>
                        <span className={`font-bold ${getFiscalTextColor(g.fiscal_independence)}`}>{g.fiscal_independence}%</span>
                      </div>
                    </div>
                    {/* Fiscal bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getFiscalColor(g.fiscal_independence)}`}
                        style={{ width: `${Math.min(g.fiscal_independence, 100)}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Full list -- sortable table on larger screens, cards on mobile */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">전체 시·도 현황</h2>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs">
                <th className="py-3 px-2 text-left font-medium">시·도</th>
                <th className="py-3 px-2 text-left font-medium">단체장</th>
                <th className="py-3 px-2 text-right font-medium">인구 (만명)</th>
                <th className="py-3 px-2 text-right font-medium">예산 (조원)</th>
                <th className="py-3 px-2 text-right font-medium">채무 (조원)</th>
                <th className="py-3 px-2 text-right font-medium">재정자립도</th>
                <th className="py-3 px-2 text-center font-medium">시군구</th>
                <th className="py-3 px-2 text-center font-medium">소멸위험</th>
              </tr>
            </thead>
            <tbody>
              {governments.map(g => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2">
                    <Link href={`/local/${g.id}`} className="font-medium text-gray-900 hover:text-accent transition-colors">
                      {g.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPartyDot(g.governor_party)}`} />
                      <span className={getPartyColor(g.governor_party)}>{g.governor}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700 tabular-nums">{g.population.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-gray-700 tabular-nums">{g.budget}</td>
                  <td className="py-3 px-2 text-right text-gray-700 tabular-nums">{g.debt}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <span className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden lg:block">
                        <span
                          className={`block h-full rounded-full ${getFiscalColor(g.fiscal_independence)}`}
                          style={{ width: `${Math.min(g.fiscal_independence, 100)}%` }}
                        />
                      </span>
                      <span className={`font-bold tabular-nums ${getFiscalTextColor(g.fiscal_independence)}`}>
                        {g.fiscal_independence}%
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-600 tabular-nums">{g.sub_regions_count}</td>
                  <td className="py-3 px-2 text-center">
                    {g.extinction_risk ? (
                      <span className={`
                        inline-block px-2 py-0.5 rounded-full text-xs font-medium
                        ${g.extinction_risk === '심각' ? 'bg-rose-100 text-rose-700' :
                          g.extinction_risk === '위험' ? 'bg-orange-100 text-orange-700' :
                          g.extinction_risk === '주의' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'}
                      `}>
                        {g.extinction_risk}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {governments.map(g => (
            <Link
              key={g.id}
              href={`/local/${g.id}`}
              className={`card block border-l-4 ${getFiscalBorderColor(g.fiscal_independence)} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getPartyDot(g.governor_party)}`} />
                  <span className="font-bold text-gray-900">{g.name_short}</span>
                </div>
                {g.extinction_risk && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${g.extinction_risk === '심각' ? 'bg-rose-100 text-rose-700' :
                      g.extinction_risk === '위험' ? 'bg-orange-100 text-orange-700' :
                      g.extinction_risk === '주의' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'}
                  `}>
                    소멸{g.extinction_risk}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">인구</span>
                  <p className="font-medium text-gray-800">{g.population}만</p>
                </div>
                <div>
                  <span className="text-gray-500">예산</span>
                  <p className="font-medium text-gray-800">{g.budget}조</p>
                </div>
                <div>
                  <span className="text-gray-500">자립도</span>
                  <p className={`font-bold ${getFiscalTextColor(g.fiscal_independence)}`}>{g.fiscal_independence}%</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getFiscalColor(g.fiscal_independence)}`}
                  style={{ width: `${Math.min(g.fiscal_independence, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <span className={getPartyColor(g.governor_party)}>{g.governor}</span>
                <span>({g.governor_party})</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Fiscal independence explanation */}
      <div className="card bg-gray-50 border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">재정자립도란?</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          재정자립도는 지방자치단체의 전체 세입 중 자체 수입(지방세 + 세외수입)이 차지하는 비율입니다.
          이 수치가 높을수록 중앙정부의 교부금·보조금에 의존하지 않고 자체적으로 재정을 운영할 수 있음을 의미합니다.
          전국 평균은 <strong>{nationalAvg}%</strong>이며, 서울(76.5%)과 전남(15.8%) 사이에 약 5배의 격차가 존재합니다.
          이러한 재정 격차 해소는 균형 발전의 핵심 과제입니다.
        </p>
      </div>
    </div>
  );
}
