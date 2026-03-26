import type { Metadata } from 'next';
import { getLegislators } from '@/lib/data';
import LegislatorsPageClient from './LegislatorsPageClient';

export const metadata: Metadata = {
  title: '국회의원 활동 분류',
  description: '국회의원의 출석률, 법안 발의, 말과 행동 일치도를 카테고리별로 분류합니다.',
  openGraph: {
    title: '국회의원 활동 분류 | 국정투명',
    description: '공개 데이터 기반으로 국회의원의 활동 유형을 분류합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function LegislatorsPage() {
  const legislators = getLegislators();
  return <LegislatorsPageClient legislators={legislators} />;
}
