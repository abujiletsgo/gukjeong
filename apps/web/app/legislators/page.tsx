import type { Metadata } from 'next';
import { getLegislators } from '@/lib/data';
import LegislatorsPageClient from './LegislatorsPageClient';

export const metadata: Metadata = {
  title: '국회의원 활동 현황',
  description: '22대 국회 의원들이 실제로 무엇을 하고 있는지 공개 데이터로 확인합니다.',
  openGraph: {
    title: '국회의원 활동 현황 | 국정투명',
    description: '22대 국회 의원들의 출석률, 법안 발의, 본회의 발언을 공개 데이터로 확인합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function LegislatorsPage() {
  const legislators = getLegislators();
  return <LegislatorsPageClient legislators={legislators} />;
}
