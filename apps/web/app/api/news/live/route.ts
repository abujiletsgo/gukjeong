import { NextResponse } from 'next/server';
import { getLocalNews } from '@/lib/local-data';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const { items: articles, outlets, fetched_at } = getLocalNews();

    const outletCounts: Record<string, number> = {};
    for (const article of articles as any[]) {
      outletCounts[article.outlet_id] = (outletCounts[article.outlet_id] || 0) + 1;
    }

    return NextResponse.json({
      total: articles.length,
      outlets: outlets || Object.keys(outletCounts).length,
      outlet_counts: outletCounts,
      fetched_at,
      timestamp: new Date().toISOString(),
      articles: (articles as any[]).slice(0, 100),
    });
  } catch (error) {
    console.error('[API /news/live] Error:', error);
    return NextResponse.json(
      { total: 0, outlets: 0, outlet_counts: {}, timestamp: new Date().toISOString(), articles: [], error: '뉴스 데이터를 불러오는 데 실패했습니다.' },
      { status: 500 },
    );
  }
}
