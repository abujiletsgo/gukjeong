import { NextResponse } from 'next/server';
import { getLocalEcosStats } from '@/lib/local-data';

export const dynamic = 'force-static';

// Formatting utils (copied from lib/ecos/client.ts)
function formatKoreanNumber(value: number, unit: string): string {
  if (unit === '%' || unit === '%p' || unit.includes('퍼센트') || unit.includes('%')) {
    return `${value.toFixed(1)}%`;
  }
  if (unit === '십억원' || unit.includes('십억')) {
    return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}조원` : `${value.toFixed(1)}십억원`;
  }
  if (unit === '억원' || unit.includes('억원')) {
    return Math.abs(value) >= 10000 ? `${(value / 10000).toFixed(1)}조원` : `${value.toLocaleString('ko-KR')}억원`;
  }
  if (unit.includes('달러') || unit.includes('USD') || unit === '원/달러') {
    return `${value.toLocaleString('ko-KR')}원`;
  }
  if (unit === '만명' || unit.includes('만명')) return `${value.toLocaleString('ko-KR')}만명`;
  if (unit === '천명' || unit.includes('천명')) {
    return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}만명` : `${value.toLocaleString('ko-KR')}천명`;
  }
  return Number.isInteger(value)
    ? `${value.toLocaleString('ko-KR')}${unit}`
    : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit}`;
}

function formatPeriod(time: string | undefined, cycle: string | undefined): string {
  if (!time) return '';
  if (time.length === 6) {
    const year = time.slice(0, 4);
    const mq = time.slice(4, 6);
    if (cycle === 'Q') {
      const qMap: Record<string, string> = { '01': '1/4', '02': '2/4', '03': '3/4', '04': '4/4' };
      return `${year} ${qMap[mq] || mq}`;
    }
    return `${year}.${mq}`;
  }
  return time.length === 4 ? `${time}년` : time;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const { items: rows, fetched_at } = getLocalEcosStats();

    const stats = (rows as any[])
      .filter((r) => r.DATA_VALUE && r.DATA_VALUE !== '-')
      .map((r) => {
        const rawValue = parseFloat(String(r.DATA_VALUE).replace(/,/g, ''));
        const unit = r.UNIT_NAME || '';
        const name = r.KEYSTAT_NAME || r.CLASS_NAME || '알 수 없음';
        return {
          name,
          value: isNaN(rawValue) ? 0 : rawValue,
          unit,
          formatted: isNaN(rawValue) ? '-' : formatKoreanNumber(rawValue, unit),
          period: formatPeriod(r.TIME, r.CYCLE),
          code: r.CLASS_NAME,
        };
      });

    let result = stats;
    if (mode === 'highlights') {
      const keywords = ['GDP', '경제성장률', '소비자물가', '실업률', '기준금리', '환율', '경상수지', '수출', '수입', '취업자'];
      const highlights = keywords
        .map((kw) => stats.find((s) => s.name.includes(kw)))
        .filter(Boolean);
      result = highlights.length >= 3 ? highlights as typeof stats : stats.slice(0, 10);
    }

    return NextResponse.json({
      count: result.length,
      timestamp: new Date().toISOString(),
      fetched_at,
      source: '로컬 데이터 (한국은행 ECOS 스냅샷)',
      stats: result,
    });
  } catch (error) {
    console.error('[API /economy] Error:', error);
    return NextResponse.json(
      { count: 0, timestamp: new Date().toISOString(), source: '로컬 데이터', stats: [], error: '경제 지표를 불러오는 데 실패했습니다.' },
      { status: 500 },
    );
  }
}
