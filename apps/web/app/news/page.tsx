import type { Metadata } from 'next';
import { getNewsEvents, getMediaOutlets } from '@/lib/data';
import NewsPageClient from './NewsPageClient';

export const metadata: Metadata = {
  title: '뉴스 프레임 비교',
  description: '같은 사건을 진보와 보수 미디어가 어떻게 다르게 보도하는지 비교합니다.',
  openGraph: {
    title: '뉴스 프레임 비교 | 국정투명',
    description: '같은 사건에 대한 서로 다른 미디어의 보도 프레임을 비교합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function NewsPage() {
  const events = getNewsEvents();
  const outlets = getMediaOutlets();
  return <NewsPageClient events={events} outlets={outlets} />;
}
