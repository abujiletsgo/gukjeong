import { NextResponse } from 'next/server';
import { fetchAllRSSFeeds, WORKING_FEEDS } from '@/lib/news/rss';

export const revalidate = 300; // 5분 ISR

export async function GET() {
  try {
    const articles = await fetchAllRSSFeeds();

    // 언론사별 기사 수 집계
    const outletCounts: Record<string, number> = {};
    for (const article of articles) {
      outletCounts[article.outlet_id] = (outletCounts[article.outlet_id] || 0) + 1;
    }

    return NextResponse.json({
      total: articles.length,
      outlets: WORKING_FEEDS.length,
      outlet_counts: outletCounts,
      timestamp: new Date().toISOString(),
      articles: articles.slice(0, 100), // 최신 100건
    });
  } catch (error) {
    console.error('[API /news/live] Error:', error);
    return NextResponse.json(
      {
        total: 0,
        outlets: 0,
        outlet_counts: {},
        timestamp: new Date().toISOString(),
        articles: [],
        error: '뉴스 피드를 불러오는 데 실패했습니다.',
      },
      { status: 500 },
    );
  }
}
