import type { Metadata } from 'next';
import { getPresidents, getFiscalData, getPresidentComparisonMetrics } from '@/lib/data';

// ISR: 대통령 데이터는 1일마다 재생성
export const revalidate = 86400;
import PresidentTimeline from '@/components/timeline/PresidentTimeline';
import PresidentPortrait from '@/components/presidents/PresidentPortrait';
import PresidentCompareClient from './PresidentCompareClient';

export const metadata: Metadata = {
  title: '역대 대통령 비교',
  description: '김영삼부터 현재까지 역대 대통령의 재정, 정책, 거버넌스 지표를 동일 기준으로 비교합니다.',
  openGraph: {
    title: '역대 대통령 비교 | 국정투명',
    description: '김영삼부터 현재까지 역대 대통령의 재정, 정책 성과를 동일 기준으로 비교합니다.',
    images: [{ url: '/og/presidents.png', width: 1200, height: 630 }],
  },
};

export default function PresidentsPage() {
  const presidents = getPresidents();
  const fiscalData = getFiscalData();
  const comparisonMetrics = getPresidentComparisonMetrics();

  // 대통령별 통계 계산
  const presidentStats = presidents.map(p => {
    const fiscal = fiscalData.filter(f => f.president_id === p.id);
    const spending = fiscal.map(f => f.total_spending || 0).filter(v => v > 0);
    const debt = fiscal.map(f => f.national_debt || 0).filter(v => v > 0);

    const avgSpending = spending.length ? spending.reduce((a, b) => a + b, 0) / spending.length : 0;
    const spendingGrowth = spending.length >= 2
      ? ((spending[spending.length - 1] - spending[0]) / spending[0] * 100)
      : 0;
    const debtGrowth = debt.length >= 2
      ? ((debt[debt.length - 1] - debt[0]) / debt[0] * 100)
      : 0;

    return {
      ...p,
      avgSpending,
      spendingGrowth,
      debtGrowth,
      termYears: fiscal.length,
    };
  });

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/><circle cx="12" cy="4" r="1" fill="#6b7280"/></svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              역대 대통령 비교
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              김영삼 대통령(1993)부터 현재까지, 동일한 경제 지표로 비교합니다.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-13">
          출처: 기획재정부, 한국은행 ECOS · 모든 금액은 조원 단위 (본예산 기준)
        </p>
      </div>

      {/* 타임라인 */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          대통령 타임라인
        </h2>
        <PresidentTimeline presidents={presidents} fiscalData={fiscalData} />
      </section>

      {/* 비교 테이블 */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><path d="M2 20h20M6 20V4l4 4 4-4 4 4v12"/></svg>
          경제 성과 비교
        </h2>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-600">대통령</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">정부명</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">임기(년)</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">GDP 성장률</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">지출 증가율</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">채무 증가율</th>
              </tr>
            </thead>
            <tbody>
              {presidentStats.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-3 px-2">
                    <a href={`/presidents/${p.id}`} className="flex items-center gap-2 font-medium text-gray-900 hover:text-accent transition-colors">
                      <PresidentPortrait id={p.id} name={p.name} party={p.party} size={32} />
                      {p.name}
                    </a>
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{p.era}</td>
                  <td className="py-3 px-2 text-right text-gray-600">{p.termYears || '-'}</td>
                  <td className="py-3 px-2 text-right font-medium">
                    {p.gdp_growth_avg
                      ? <span className="text-green-600">{p.gdp_growth_avg.toFixed(1)}%</span>
                      : <span className="text-gray-400">-</span>
                    }
                  </td>
                  <td className="py-3 px-2 text-right">
                    {p.spendingGrowth
                      ? <span className={p.spendingGrowth > 50 ? 'text-rose-600' : 'text-gray-600'}>
                          +{p.spendingGrowth.toFixed(0)}%
                        </span>
                      : <span className="text-gray-400">-</span>
                    }
                  </td>
                  <td className="py-3 px-2 text-right">
                    {p.debtGrowth
                      ? <span className={p.debtGrowth > 50 ? 'text-rose-600' : 'text-gray-600'}>
                          +{p.debtGrowth.toFixed(0)}%
                        </span>
                      : <span className="text-gray-400">-</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-300 mt-3">
          * 지출/채무 증가율은 임기 시작연도 대비 마지막연도 기준 · 동일한 데이터 기준으로 모든 대통령에 적용
        </p>
      </section>

      {/* 심층 비교 */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          심층 비교
        </h2>
        <PresidentCompareClient metrics={comparisonMetrics} fiscalData={fiscalData} />
      </section>
    </div>
  );
}
