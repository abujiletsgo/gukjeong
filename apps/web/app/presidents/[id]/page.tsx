import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPresidentById, getFiscalByPresident, getFiscalData, getPoliciesByPresident, getEventsByPresident, getPresidents } from '@/lib/data';
import PresidentDetailClient from './PresidentDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const president = getPresidentById(params.id);
  if (!president) {
    return { title: '대통령을 찾을 수 없습니다' };
  }
  return {
    title: `${president.name} (${president.era})`,
    description: `${president.name} 대통령의 재정, 정책, 주요 사건 분석 — ${president.era}`,
    openGraph: {
      title: `${president.name} — ${president.era} | 국정투명`,
      description: `${president.name} 대통령 임기 중 경제 지표와 주요 정책을 분석합니다.`,
    },
  };
}

export function generateStaticParams() {
  const presidents = getPresidents();
  return presidents.map(p => ({ id: p.id }));
}

export default function PresidentDetailPage({ params }: { params: { id: string } }) {
  const president = getPresidentById(params.id);
  if (!president) {
    notFound();
  }

  const fiscalData = getFiscalByPresident(params.id);
  const allFiscal = getFiscalData();
  const policies = getPoliciesByPresident(params.id);
  const events = getEventsByPresident(params.id);

  // 경제 KPI 계산
  const spending = fiscalData.map(f => f.total_spending || 0).filter(v => v > 0);
  const debt = fiscalData.map(f => f.national_debt || 0).filter(v => v > 0);

  const firstYearSpending = spending[0] || 0;
  const lastYearSpending = spending[spending.length - 1] || 0;
  const spendingChange = firstYearSpending > 0
    ? ((lastYearSpending - firstYearSpending) / firstYearSpending * 100).toFixed(1)
    : '-';

  const firstYearDebt = debt[0] || 0;
  const lastYearDebt = debt[debt.length - 1] || 0;
  const debtChange = firstYearDebt > 0
    ? ((lastYearDebt - firstYearDebt) / firstYearDebt * 100).toFixed(1)
    : '-';

  // 마지막 연도의 채무비율 찾기
  const lastFiscalWithRatio = [...fiscalData].reverse().find(f => f.debt_to_gdp);
  const debtToGdp = lastFiscalWithRatio?.debt_to_gdp?.toString() || '-';

  const gdpGrowth = (president.gdp_growth_avg || 0).toFixed(1);

  return (
    <PresidentDetailClient
      president={president}
      fiscalData={fiscalData}
      allFiscal={allFiscal}
      policies={policies}
      events={events}
      kpis={{
        gdpGrowth,
        spendingChange: spendingChange.toString(),
        debtChange: debtChange.toString(),
        debtToGdp,
        firstYearSpending,
        lastYearSpending,
        firstYearDebt,
        lastYearDebt,
      }}
    />
  );
}
