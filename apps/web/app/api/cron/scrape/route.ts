import { NextResponse } from 'next/server';

// Cron scraping is disabled — app now reads from local data/ JSON files.
// Run `python3 scripts/fetch-data.py` to refresh data manually.

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: '크론 스크래핑이 비활성화되었습니다. 로컬 데이터 파일을 사용합니다.',
    hint: 'Run `python3 scripts/fetch-data.py` to refresh data.',
    timestamp: new Date().toISOString(),
  });
}
