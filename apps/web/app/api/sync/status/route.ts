import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Never cache sync status

interface SyncStatusEntry {
  source: string;
  display_name: string;
  status: 'success' | 'error' | 'skipped' | 'never_synced';
  last_sync_at: string | null;
  records_fetched: number;
  records_updated: number;
  duration_ms: number;
  error_message: string | null;
  next_scheduled: string;
}

// ── Data source definitions ─────────────────────────────────────────
const DATA_SOURCES: { source: string; display_name: string; schedule: string }[] = [
  { source: 'assembly', display_name: '열린국회정보 (의원/법안)', schedule: '매일 06:00 KST' },
  { source: 'g2b', display_name: '나라장터 (계약/감사)', schedule: '매일 06:00 KST' },
  { source: 'fiscal', display_name: 'ECOS + 열린재정 (경제/예산)', schedule: '매일 06:00 KST' },
  { source: 'news', display_name: '뉴스 RSS (언론사 15개)', schedule: '매일 06:00 KST' },
];

export async function GET() {
  try {
    // If DATABASE_URL is set, query data_sync_log for real status
    if (process.env.DATABASE_URL) {
      // TODO: Replace with actual DB query
      // SELECT DISTINCT ON (source)
      //   source, status, started_at, records_fetched, records_updated,
      //   duration_ms, error_message
      // FROM data_sync_log
      // ORDER BY source, started_at DESC
      //
      // For now, fall through to the default response
    }

    // Default response when DB is not available:
    // Show data source configuration without sync history
    const statuses: SyncStatusEntry[] = DATA_SOURCES.map((ds) => {
      // Check if the required API key is configured
      const keyMap: Record<string, string> = {
        assembly: 'ASSEMBLY_API_KEY',
        g2b: 'G2B_API_KEY',
        fiscal: 'ECOS_API_KEY',
        news: '', // News doesn't require an API key (RSS is public)
      };

      const requiredKey = keyMap[ds.source];
      const hasKey = requiredKey === '' || !!process.env[requiredKey];

      return {
        source: ds.source,
        display_name: ds.display_name,
        status: 'never_synced' as const,
        last_sync_at: null,
        records_fetched: 0,
        records_updated: 0,
        duration_ms: 0,
        error_message: hasKey ? null : `API key not configured: ${requiredKey}`,
        next_scheduled: ds.schedule,
      };
    });

    // Calculate overall health
    const configuredCount = statuses.filter(s => !s.error_message).length;
    const health = configuredCount === statuses.length
      ? 'healthy'
      : configuredCount > 0
        ? 'partial'
        : 'not_configured';

    return NextResponse.json({
      health,
      configured_sources: configuredCount,
      total_sources: statuses.length,
      cron_schedule: '0 21 * * * (9 PM UTC = 6 AM KST)',
      sources: statuses,
    });
  } catch (error) {
    console.error('[sync/status] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        health: 'error',
      },
      { status: 500 },
    );
  }
}
