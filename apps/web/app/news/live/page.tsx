import type { Metadata } from 'next';
import { fetchAllRSSFeeds, WORKING_FEEDS } from '@/lib/news/rss';
import LiveNewsClient from './LiveNewsClient';

export const metadata: Metadata = {
  title: '실시간 뉴스',
  description: '6개 한국 주요 언론사의 실시간 RSS 뉴스 피드를 한 곳에서 확인합니다.',
  openGraph: {
    title: '실시간 뉴스 | 국정투명',
    description: '한겨레, 경향, 동아, SBS, JTBC, 세계일보의 실시간 뉴스를 스펙트럼별로 비교합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export const revalidate = 300; // 5분마다 재생성

export default async function LiveNewsPage() {
  const articles = await fetchAllRSSFeeds();

  return (
    <LiveNewsClient
      initialArticles={articles.slice(0, 100)}
      totalCount={articles.length}
      feeds={WORKING_FEEDS}
    />
  );
}
