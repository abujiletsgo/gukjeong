import type { Metadata } from 'next';
import { getFiscalData, getSectorData, getSankeyData } from '@/lib/data';

// ISR: 예산 데이터는 1일마다 재생성
export const revalidate = 86400;
import BudgetPageClient from './BudgetPageClient';

export const metadata: Metadata = {
  title: '예산 시각화',
  description: '대한민국 정부 예산의 세입, 세출, 국가채무를 인터랙티브 차트로 확인하세요.',
  openGraph: {
    title: '예산 시각화 | 국정투명',
    description: '1998년부터 현재까지 정부 예산을 Sankey, TreeMap, 스택드 에리어 차트로 확인하세요.',
    images: [{ url: '/og/budget.png', width: 1200, height: 630 }],
  },
};

export default function BudgetPage() {
  const fiscalData = getFiscalData();
  const sectorData2026 = getSectorData(2026);
  const sectorData2025 = getSectorData(2025);
  const sectorData2024 = getSectorData(2024);
  const sankeyData = getSankeyData(2026);

  // 최신 연도 데이터
  const latest = fiscalData[fiscalData.length - 1];
  const previous = fiscalData[fiscalData.length - 2];

  // 2024 기준 (가장 최신 확정 데이터)
  const latest2024 = fiscalData.find(f => f.year === 2024);

  return (
    <BudgetPageClient
      fiscalData={fiscalData}
      sectorDataByYear={{ 2024: sectorData2024, 2025: sectorData2025, 2026: sectorData2026 }}
      sankeyData={sankeyData}
      latestYear={latest}
      latest2024={latest2024}
    />
  );
}
