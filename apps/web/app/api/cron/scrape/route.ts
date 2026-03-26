import { NextResponse } from 'next/server';
import { scrapeAssembly } from '../../../../lib/scrapers/assembly';
import { scrapeG2B } from '../../../../lib/scrapers/g2b';
import { scrapeFiscal } from '../../../../lib/scrapers/fiscal';
import { scrapeNews } from '../../../../lib/scrapers/news';
import type { ScrapeResult } from '../../../../lib/scrapers/types';

// Vercel Cron: runs daily at 6 AM KST (9 PM UTC previous day)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this as Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, ScrapeResult> = {};
  const startTime = Date.now();

  try {
    // Run scrapers in sequence to avoid rate limits on shared IPs.
    // Each scraper handles its own errors internally and returns
    // a ScrapeResult with status 'error' rather than throwing.

    console.log('[cron] Starting daily scrape...');

    // 1. 열린국회정보 (legislators + bills)
    console.log('[cron] 1/4 Assembly...');
    results.assembly = await scrapeAssembly();

    // 2. 나라장터 (contracts + audit flags)
    console.log('[cron] 2/4 G2B...');
    results.g2b = await scrapeG2B();

    // 3. 한국은행 ECOS + 열린재정 (GDP, spending, debt)
    console.log('[cron] 3/4 Fiscal...');
    results.fiscal = await scrapeFiscal();

    // 4. News RSS (articles + topic clustering)
    console.log('[cron] 4/4 News...');
    results.news = await scrapeNews();

    const totalDuration = Date.now() - startTime;
    const totalFetched = Object.values(results).reduce((sum, r) => sum + (r.records_fetched || 0), 0);
    const totalUpdated = Object.values(results).reduce((sum, r) => sum + (r.records_updated || 0), 0);
    const anyErrors = Object.values(results).some(r => r.status === 'error');

    console.log(
      `[cron] Completed in ${totalDuration}ms: ${totalFetched} fetched, ${totalUpdated} updated` +
        (anyErrors ? ' (with errors)' : ''),
    );

    // Log to data_sync_log if DB is available
    if (process.env.DATABASE_URL) {
      // TODO: Insert aggregate sync log entry
    }

    return NextResponse.json({
      success: !anyErrors,
      timestamp: new Date().toISOString(),
      duration_ms: totalDuration,
      summary: {
        total_fetched: totalFetched,
        total_updated: totalUpdated,
      },
      results,
    });
  } catch (error) {
    console.error('[cron] Fatal scrape error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        results,
      },
      { status: 500 },
    );
  }
}
