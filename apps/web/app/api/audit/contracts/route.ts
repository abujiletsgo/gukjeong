import { NextResponse } from 'next/server';
import { getLocalG2BBids } from '@/lib/local-data';

export const dynamic = 'force-static';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));

  try {
    const { items, totalCount, fetched_at } = getLocalG2BBids();
    const startIdx = (page - 1) * size;
    const pageItems = (items as any[]).slice(startIdx, startIdx + size);

    return NextResponse.json({
      items: pageItems,
      totalCount,
      page,
      size,
      fetched_at,
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
