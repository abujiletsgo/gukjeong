// 국정투명 -- 스크래퍼 공용 타입 정의

export interface ScrapeResult {
  status: 'success' | 'error' | 'skipped';
  records_fetched?: number;
  records_updated?: number;
  reason?: string;
  error?: string;
  duration_ms?: number;
}

export interface ScraperConfig {
  name: string;
  endpoint: string;
  apiKey?: string;
  schedule: string; // cron expression
}

export interface DataSyncLogEntry {
  source: string;
  status: 'success' | 'error' | 'skipped';
  records_fetched: number;
  records_updated: number;
  error_message?: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
}

/**
 * Helper: wrap a scraper function with timing + error handling.
 * Returns a ScrapeResult that always includes duration_ms.
 */
export async function withTiming(
  scraperName: string,
  fn: () => Promise<ScrapeResult>,
): Promise<ScrapeResult> {
  const start = Date.now();
  try {
    const result = await fn();
    result.duration_ms = Date.now() - start;
    return result;
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - start,
    };
  }
}

/**
 * Retry a fetch up to `maxRetries` times with exponential backoff.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) return response;

      // Don't retry 4xx client errors (except 429 rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.name === 'AbortError') {
        lastError = new Error('Request timed out after 30s');
      }
    }

    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('fetchWithRetry: unknown error');
}

/**
 * Parse XML text to extract tag values (lightweight, no dependency).
 * Returns an array of objects with key-value pairs from repeated row elements.
 */
export function parseXmlRows(xml: string, rowTag: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const rowRegex = new RegExp(`<${rowTag}>([\\s\\S]*?)</${rowTag}>`, 'g');
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];
    const fields: Record<string, string> = {};
    const fieldRegex = /<(\w+)>([\\s\\S]*?)<\/\1>/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(rowContent)) !== null) {
      fields[fieldMatch[1]] = fieldMatch[2].trim();
    }

    if (Object.keys(fields).length > 0) {
      rows.push(fields);
    }
  }

  return rows;
}

/**
 * Log a sync result. When DATABASE_URL is set this would write to data_sync_log.
 * For now it logs to console and returns the entry.
 */
export function logSyncResult(entry: DataSyncLogEntry): DataSyncLogEntry {
  const emoji = entry.status === 'success' ? '[OK]' : entry.status === 'skipped' ? '[SKIP]' : '[ERR]';
  console.log(
    `${emoji} ${entry.source}: ${entry.records_fetched} fetched, ${entry.records_updated} updated (${entry.duration_ms}ms)`,
  );
  if (entry.error_message) {
    console.error(`  Error: ${entry.error_message}`);
  }
  return entry;
}
