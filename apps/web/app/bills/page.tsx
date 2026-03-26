import type { Metadata } from 'next';
import { getBills } from '@/lib/data';
import BillsPageClient from './BillsPageClient';

export const metadata: Metadata = {
  title: '법안 추적',
  description: '국회 발의 법안의 현황, AI 요약, 시민 영향 분석을 확인하세요.',
  openGraph: {
    title: '법안 추적 | 국정투명',
    description: '국회 발의 법안을 AI가 요약하고, 시민에게 미치는 영향을 분석합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function BillsPage() {
  const bills = getBills();
  return <BillsPageClient bills={bills} />;
}
