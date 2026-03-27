import type { Metadata } from 'next';
import { getInternationalComparisons } from '@/lib/data';
import ComparePageClient from './ComparePageClient';

export const metadata: Metadata = {
  title: '국제 비교',
  description: 'OECD 국가와 비교한 대한민국의 재정·경제·사회 지표',
  openGraph: {
    title: '국제 비교 | 국정투명',
    description: 'OECD 국가와 비교한 대한민국의 위치를 데이터로 확인합니다',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function ComparePage() {
  const metrics = getInternationalComparisons();

  return <ComparePageClient metrics={metrics} />;
}
