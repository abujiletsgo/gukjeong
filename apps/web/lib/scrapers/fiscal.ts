// 국정투명 -- 재정 데이터 스크래퍼
//
// 1) 한국은행 ECOS (ecos.bok.or.kr/api)
//    - GDP 성장률, 경제 지표
//    - 통계코드: 200Y001 (주요지표/국민계정)
//
// 2) 열린재정 (www.openfiscaldata.go.kr)
//    - 세입/세출, 국가채무, 재정수지
//    - API: https://www.openfiscaldata.go.kr/open/api

import type { ScrapeResult } from './types';
import { fetchWithRetry, logSyncResult, parseXmlRows } from './types';

// ── ECOS (한국은행 경제통계시스템) ──────────────────────────────────
const ECOS_BASE = 'https://ecos.bok.or.kr/api';

interface EcosDataPoint {
  year: number;
  stat_code: string;
  stat_name: string;
  item_code: string;
  item_name: string;
  value: number;
  unit: string;
}

/**
 * Fetch a single stat series from ECOS.
 * URL pattern: /StatisticSearch/{apiKey}/{format}/{lang}/{startNo}/{endNo}/{statCode}/{period}/{startDate}/{endDate}/{itemCode1}
 */
async function fetchEcosStat(
  apiKey: string,
  statCode: string,
  itemCode: string,
  startYear: number,
  endYear: number,
): Promise<EcosDataPoint[]> {
  // ECOS API path: /StatisticSearch/{key}/json/kr/1/100/{statCode}/A/{startYear}/{endYear}/{itemCode}
  const url = `${ECOS_BASE}/StatisticSearch/${apiKey}/json/kr/1/100/${statCode}/A/${startYear}/${endYear}/${itemCode}`;

  const response = await fetchWithRetry(url);
  const json = await response.json();

  const rows = json?.StatisticSearch?.row;
  if (!Array.isArray(rows)) return [];

  return rows.map((row: any) => ({
    year: parseInt(row.TIME, 10),
    stat_code: row.STAT_CODE,
    stat_name: row.STAT_NAME,
    item_code: row.ITEM_CODE1,
    item_name: row.ITEM_NAME1,
    value: parseFloat(row.DATA_VALUE?.replace(/,/g, '') || '0'),
    unit: row.UNIT_NAME || '',
  }));
}

/**
 * Fetch core economic indicators from ECOS:
 *   - GDP (국내총생산): 200Y001 / 10101
 *   - GDP 성장률: 200Y001 / 10111
 *   - 소비자물가지수: 901Y009 / 0
 */
async function fetchEcosIndicators(apiKey: string): Promise<{
  gdp: EcosDataPoint[];
  gdpGrowth: EcosDataPoint[];
  cpi: EcosDataPoint[];
}> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;

  const [gdp, gdpGrowth, cpi] = await Promise.all([
    fetchEcosStat(apiKey, '200Y001', '10101', startYear, currentYear),
    fetchEcosStat(apiKey, '200Y001', '10111', startYear, currentYear),
    fetchEcosStat(apiKey, '901Y009', '0', startYear, currentYear),
  ]);

  return { gdp, gdpGrowth, cpi };
}

// ── 열린재정 (Open Fiscal Data) ────────────────────────────────────
const FISCAL_BASE = 'https://www.openfiscaldata.go.kr/open/api';

interface FiscalDataPoint {
  year: number;
  category: string;
  amount: number; // 조원
  detail?: string;
}

/**
 * Fetch fiscal data from 열린재정 portal.
 * Endpoints:
 *   - 세입현황: /revenueStatus
 *   - 세출현황: /expenditureStatus
 *   - 국가채무: /nationalDebt
 */
async function fetchFiscalEndpoint(
  apiKey: string,
  endpoint: string,
  startYear: number,
  endYear: number,
): Promise<{ fetched: number; data: Record<string, string>[] }> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    type: 'json',
    fscl_yy_from: String(startYear),
    fscl_yy_to: String(endYear),
    pageNo: '1',
    numOfRows: '100',
  });

  const url = `${FISCAL_BASE}/${endpoint}?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('json')) {
      const json = await response.json();
      const items = json?.response?.body?.items?.item ?? json?.data ?? [];
      const arr = Array.isArray(items) ? items : items ? [items] : [];
      return { fetched: arr.length, data: arr };
    } else {
      // XML fallback
      const xmlText = await response.text();
      const rows = parseXmlRows(xmlText, 'item');
      return { fetched: rows.length, data: rows };
    }
  } catch (err) {
    console.warn(`[fiscal] Failed to fetch ${endpoint}: ${err instanceof Error ? err.message : err}`);
    return { fetched: 0, data: [] };
  }
}

/**
 * Alternative: fetch from data.go.kr fiscal API
 * (backup when openfiscaldata.go.kr is unavailable)
 */
async function fetchFiscalFromDataGoKr(
  apiKey: string,
): Promise<FiscalDataPoint[]> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;

  // data.go.kr national account statistics
  const params = new URLSearchParams({
    serviceKey: apiKey,
    type: 'json',
    numOfRows: '100',
    pageNo: '1',
    fscl_yy: String(currentYear),
  });

  const url = `https://apis.data.go.kr/1613000/NatlFinanceInfoService/getNatlFinanceInfo?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url);
    const json = await response.json();
    const items = json?.response?.body?.items?.item ?? [];
    const arr = Array.isArray(items) ? items : items ? [items] : [];

    return arr.map((item: any) => ({
      year: parseInt(item.fscl_yy || item.year || String(currentYear), 10),
      category: item.acntSe_nm || item.category || 'unknown',
      amount: parseFloat(item.y_amt || item.amount || '0') / 1_000_000_000_000, // 원 -> 조원
      detail: item.acntSe_nm,
    }));
  } catch (err) {
    console.warn(`[fiscal] data.go.kr fallback failed: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

// ── DB write (guarded) ─────────────────────────────────────────────
async function upsertFiscalData(
  ecosData: { gdp: EcosDataPoint[]; gdpGrowth: EcosDataPoint[]; cpi: EcosDataPoint[] },
  fiscalRevenue: Record<string, string>[],
  fiscalExpenditure: Record<string, string>[],
  fiscalDebt: Record<string, string>[],
): Promise<number> {
  if (!process.env.DATABASE_URL) {
    const totalRecords =
      ecosData.gdp.length + ecosData.gdpGrowth.length + ecosData.cpi.length +
      fiscalRevenue.length + fiscalExpenditure.length + fiscalDebt.length;
    console.log(`[fiscal] DATABASE_URL not set -- skipping DB upsert for ${totalRecords} records`);
    return 0;
  }

  // TODO: Replace with actual DB client
  // Merge ECOS GDP data + fiscal revenue/expenditure/debt into fiscal_yearly table
  // Key: (year) -- upsert on conflict

  let updated = 0;

  // GDP data
  for (const dp of ecosData.gdp) {
    const _fiscal = {
      year: dp.year,
      gdp: dp.value, // in 조원 or 십억원 depending on ECOS item
    };
    updated++;
  }

  // Revenue
  for (const row of fiscalRevenue) {
    const _fiscal = {
      year: parseInt(row.fscl_yy || row.FSCL_YY || '0', 10),
      total_revenue: parseFloat(row.y_amt || row.Y_AMT || '0'),
    };
    updated++;
  }

  // Expenditure
  for (const row of fiscalExpenditure) {
    const _fiscal = {
      year: parseInt(row.fscl_yy || row.FSCL_YY || '0', 10),
      total_spending: parseFloat(row.y_amt || row.Y_AMT || '0'),
    };
    updated++;
  }

  // Debt
  for (const row of fiscalDebt) {
    const _fiscal = {
      year: parseInt(row.fscl_yy || row.FSCL_YY || '0', 10),
      national_debt: parseFloat(row.y_amt || row.Y_AMT || '0'),
    };
    updated++;
  }

  console.log(`[fiscal] Would upsert ${updated} fiscal records into DB`);
  return updated;
}

// ── Main export ────────────────────────────────────────────────────
export async function scrapeFiscal(): Promise<ScrapeResult> {
  const ECOS_KEY = process.env.ECOS_API_KEY;
  const FISCAL_KEY = process.env.FISCAL_API_KEY;

  if (!ECOS_KEY && !FISCAL_KEY) {
    return { status: 'skipped', reason: 'Neither ECOS_API_KEY nor FISCAL_API_KEY is set' };
  }

  const startedAt = new Date().toISOString();
  const start = Date.now();
  let totalFetched = 0;

  try {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;

    // 1) ECOS economic indicators
    let ecosData: { gdp: EcosDataPoint[]; gdpGrowth: EcosDataPoint[]; cpi: EcosDataPoint[] } = {
      gdp: [],
      gdpGrowth: [],
      cpi: [],
    };

    if (ECOS_KEY) {
      console.log(`[fiscal] Fetching ECOS indicators (${startYear}-${currentYear})`);
      ecosData = await fetchEcosIndicators(ECOS_KEY);
      totalFetched += ecosData.gdp.length + ecosData.gdpGrowth.length + ecosData.cpi.length;
      console.log(`[fiscal] ECOS: ${ecosData.gdp.length} GDP, ${ecosData.gdpGrowth.length} growth, ${ecosData.cpi.length} CPI`);
    }

    // 2) 열린재정 or data.go.kr fiscal data
    let fiscalRevenue: Record<string, string>[] = [];
    let fiscalExpenditure: Record<string, string>[] = [];
    let fiscalDebt: Record<string, string>[] = [];

    if (FISCAL_KEY) {
      console.log(`[fiscal] Fetching 열린재정 data (${startYear}-${currentYear})`);

      const [revenue, expenditure, debt] = await Promise.all([
        fetchFiscalEndpoint(FISCAL_KEY, 'revenueStatus', startYear, currentYear),
        fetchFiscalEndpoint(FISCAL_KEY, 'expenditureStatus', startYear, currentYear),
        fetchFiscalEndpoint(FISCAL_KEY, 'nationalDebt', startYear, currentYear),
      ]);

      fiscalRevenue = revenue.data;
      fiscalExpenditure = expenditure.data;
      fiscalDebt = debt.data;
      totalFetched += revenue.fetched + expenditure.fetched + debt.fetched;

      console.log(
        `[fiscal] 열린재정: ${revenue.fetched} revenue, ${expenditure.fetched} expenditure, ${debt.fetched} debt`,
      );
    }

    // 3) DB write (no-op without DATABASE_URL)
    const totalUpdated = await upsertFiscalData(ecosData, fiscalRevenue, fiscalExpenditure, fiscalDebt);

    const result: ScrapeResult = {
      status: 'success',
      records_fetched: totalFetched,
      records_updated: totalUpdated,
      duration_ms: Date.now() - start,
    };

    logSyncResult({
      source: 'fiscal',
      status: 'success',
      records_fetched: totalFetched,
      records_updated: totalUpdated,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: result.duration_ms!,
    });

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;

    logSyncResult({
      source: 'fiscal',
      status: 'error',
      records_fetched: totalFetched,
      records_updated: 0,
      error_message: errorMessage,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return {
      status: 'error',
      error: errorMessage,
      records_fetched: totalFetched,
      records_updated: 0,
      duration_ms: duration,
    };
  }
}
