import type { Metadata } from 'next';
import { getSectorData, getSectorIdByName } from '@/lib/data';
import TaxSimulator from './TaxSimulator';

export const metadata: Metadata = {
  title: '내 세금 시뮬레이터',
  description: '연소득을 넣으면 내 세금이 2026년 예산 분야별로 어디에 얼마나 쓰이는지 보여줍니다.',
  openGraph: {
    title: '내 세금 시뮬레이터 | 국정투명',
    description: '내 세금은 복지에 얼마, 국방에 얼마? 연소득으로 바로 확인하세요.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function SimulatorPage() {
  const sectors = getSectorData(2026).map(s => ({
    sector: s.sector,
    percentage: s.percentage ?? 0,
    slug: getSectorIdByName(s.sector) ?? '',
  })).filter(s => s.slug && s.percentage > 0);

  return (
    <div className="container-page py-8">
      <h1 className="section-title">내 세금 시뮬레이터</h1>
      <p className="text-gray-600 mb-6 -mt-2 text-sm">
        연소득을 넣으면 추정 소득세가 2026년 예산 분야별로 어디에 얼마씩 쓰이는지 보여드립니다.
      </p>
      <TaxSimulator sectors={sectors} />
    </div>
  );
}
