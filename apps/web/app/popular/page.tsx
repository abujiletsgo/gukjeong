import type { Metadata } from 'next';
import { getLocalPopularReport } from '@/lib/local-data';
import PopularPageClient from './PopularPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '화제의 감사',
  description:
    '지금 화제가 되는 뉴스를 실제 나라장터 조달 데이터와 교차 확인합니다. 산불·재해복구, 도로 보수, 복지 확대 사업에서 AI가 찾은 의심 정황.',
  openGraph: {
    title: '화제의 감사 | 국정투명',
    description:
      '오늘의 뉴스 → 실제 정부 조달 데이터에서 찾은 흔적. 의견이 아니라 숫자로.',
    images: [{ url: '/og/audit.png', width: 1200, height: 630 }],
  },
};

export default function PopularPage() {
  const report = getLocalPopularReport();
  return <PopularPageClient report={report} />;
}
