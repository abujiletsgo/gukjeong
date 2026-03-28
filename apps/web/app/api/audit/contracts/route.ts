import { NextResponse } from 'next/server';
import { fetchBidAnnouncements } from '@/lib/g2b/client';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: 'API 키가 설정되지 않았습니다',
      items: [],
      totalCount: 0,
    }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));

  try {
    const { items, totalCount } = await fetchBidAnnouncements({
      numOfRows: size,
      pageNo: page,
    });

    return NextResponse.json({
      items,
      totalCount,
      page,
      size,
    });
  } catch (error) {
    console.error('[audit/contracts] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      items: [],
      totalCount: 0,
      page,
      size,
    }, { status: 500 });
  }
}
