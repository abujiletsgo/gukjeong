import type { Metadata } from 'next';
import { getLegislators } from '@/lib/data';
import LegislatorsPageClient from './LegislatorsPageClient';

export const metadata: Metadata = {
  title: '국회의원 성적표',
  description: '국회의원의 출석률, 법안 발의, 공약 이행, 말과 행동 일치도를 종합 평가합니다.',
  openGraph: {
    title: '국회의원 성적표 | 국정투명',
    description: '공개 데이터 기반으로 국회의원의 활동을 종합 평가합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function LegislatorsPage() {
  const legislators = getLegislators();
  return <LegislatorsPageClient legislators={legislators} />;
}
