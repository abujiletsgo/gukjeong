import { NextResponse } from 'next/server';
import { fetchKeyEconomicStats, fetchHighlightStats } from '@/lib/ecos/client';

export const revalidate = 1800; // 30분 ISR

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // ?mode=highlights → 주요 지표만
    const stats = mode === 'highlights'
      ? await fetchHighlightStats()
      : await fetchKeyEconomicStats();

    return NextResponse.json({
      count: stats.length,
      timestamp: new Date().toISOString(),
      source: '한국은행 경제통계시스템(ECOS)',
      stats,
    });
  } catch (error) {
    console.error('[API /economy] Error:', error);
    return NextResponse.json(
      {
        count: 0,
        timestamp: new Date().toISOString(),
        source: '한국은행 경제통계시스템(ECOS)',
        stats: [],
        error: '경제 지표를 불러오는 데 실패했습니다.',
      },
      { status: 500 },
    );
  }
}
