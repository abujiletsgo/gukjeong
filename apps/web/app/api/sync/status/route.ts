import { NextResponse } from 'next/server';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LocalDataStatus {
  source: string;
  display_name: string;
  filename: string;
  status: 'loaded' | 'missing';
  fetched_at: string | null;
  totalCount: number;
  file_size_kb: number;
}

const DATA_DIR = join(process.cwd(), 'data');

const DATA_FILES: { source: string; display_name: string; filename: string }[] = [
  { source: 'legislators', display_name: '열린국회정보 (의원)', filename: 'legislators.json' },
  { source: 'bills', display_name: '열린국회정보 (법안)', filename: 'bills.json' },
  { source: 'ecos', display_name: '한국은행 ECOS (경제지표)', filename: 'ecos-stats.json' },
  { source: 'g2b_bids', display_name: '나라장터 (입찰공고)', filename: 'g2b-contracts.json' },
  { source: 'g2b_contracts', display_name: '나라장터 (계약정보)', filename: 'g2b-actual-contracts.json' },
  { source: 'news', display_name: '뉴스 RSS', filename: 'news-rss.json' },
];

export async function GET() {
  const statuses: LocalDataStatus[] = DATA_FILES.map((df) => {
    const filepath = join(DATA_DIR, df.filename);
    if (!existsSync(filepath)) {
      return {
        source: df.source,
        display_name: df.display_name,
        filename: df.filename,
        status: 'missing' as const,
        fetched_at: null,
        totalCount: 0,
        file_size_kb: 0,
      };
    }

    const stat = statSync(filepath);
    let fetched_at: string | null = null;
    let totalCount = 0;
    try {
      const raw = readFileSync(filepath, 'utf-8');
      const data = JSON.parse(raw);
      fetched_at = data.fetched_at || null;
      totalCount = data.totalCount || data.items?.length || 0;
    } catch {
      // ignore parse errors
    }

    return {
      source: df.source,
      display_name: df.display_name,
      filename: df.filename,
      status: 'loaded' as const,
      fetched_at,
      totalCount,
      file_size_kb: Math.round(stat.size / 1024),
    };
  });

  const loadedCount = statuses.filter((s) => s.status === 'loaded').length;
  const health = loadedCount === statuses.length ? 'healthy' : loadedCount > 0 ? 'partial' : 'no_data';

  return NextResponse.json({
    mode: 'local',
    health,
    loaded_sources: loadedCount,
    total_sources: statuses.length,
    refresh_command: 'python3 scripts/fetch-data.py',
    sources: statuses,
  });
}
