// 국정투명 -- 열린국회정보 API 스크래퍼
// https://open.assembly.go.kr
//
// Endpoints used:
//   국회의원 현황: /nwvrqwxyaytdsfvhu/getVHKNASMBRINFMST01V
//   의안 목록:    /nzmimeepazxkubdpn/getVHKSGNATPIVLLABJHW
//
// API returns XML by default; we request JSON via Type=json param.

import type { ScrapeResult } from './types';
import { fetchWithRetry, logSyncResult, parseXmlRows } from './types';

const BASE_URL = 'https://open.assembly.go.kr/portal/openapi';

// ── 국회의원 현황 (Legislator list) ───────────────────────────────
async function fetchLegislators(apiKey: string): Promise<{ fetched: number; data: Record<string, string>[] }> {
  const endpoint = `${BASE_URL}/nwvrqwxyaytdsfvhu`;
  const params = new URLSearchParams({
    Key: apiKey,
    Type: 'json',
    pIndex: '1',
    pSize: '400', // 22nd Assembly has ~300 members
    UNIT_CD: '100022', // 제22대
  });

  const url = `${endpoint}?${params.toString()}`;
  const response = await fetchWithRetry(url);
  const json = await response.json();

  // The API wraps results as: { nwvrqwxyaytdsfvhu: [{ head: [...] }, { row: [...] }] }
  const root = json?.nwvrqwxyaytdsfvhu;
  if (!root || !Array.isArray(root)) {
    // Fallback: try XML parse if JSON structure is unexpected
    const xmlResponse = await fetchWithRetry(
      `${endpoint}?${new URLSearchParams({ Key: apiKey, Type: 'xml', pIndex: '1', pSize: '400', UNIT_CD: '100022' }).toString()}`,
    );
    const xmlText = await xmlResponse.text();
    const rows = parseXmlRows(xmlText, 'row');
    return { fetched: rows.length, data: rows };
  }

  // Extract row array from the nested structure
  const rowBlock = root.find((block: any) => block.row);
  const rows: Record<string, string>[] = rowBlock?.row ?? [];

  return { fetched: rows.length, data: rows };
}

// ── 의안 목록 (Bill list) ──────────────────────────────────────────
async function fetchBills(apiKey: string, page = 1, size = 100): Promise<{ fetched: number; data: Record<string, string>[] }> {
  const endpoint = `${BASE_URL}/nzmimeepazxkubdpn`;
  const params = new URLSearchParams({
    Key: apiKey,
    Type: 'json',
    pIndex: String(page),
    pSize: String(size),
    AGE: '22', // 제22대
  });

  const url = `${endpoint}?${params.toString()}`;
  const response = await fetchWithRetry(url);
  const json = await response.json();

  const root = json?.nzmimeepazxkubdpn;
  if (!root || !Array.isArray(root)) {
    // Fallback to XML
    const xmlResponse = await fetchWithRetry(
      `${endpoint}?${new URLSearchParams({ Key: apiKey, Type: 'xml', pIndex: String(page), pSize: String(size), AGE: '22' }).toString()}`,
    );
    const xmlText = await xmlResponse.text();
    const rows = parseXmlRows(xmlText, 'row');
    return { fetched: rows.length, data: rows };
  }

  const rowBlock = root.find((block: any) => block.row);
  const rows: Record<string, string>[] = rowBlock?.row ?? [];

  return { fetched: rows.length, data: rows };
}

// ── DB upsert (guarded) ────────────────────────────────────────────
async function upsertLegislators(rows: Record<string, string>[]): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log(`[assembly] DATABASE_URL not set -- skipping DB upsert for ${rows.length} legislators`);
    return 0;
  }

  // Map API fields to our schema:
  //   HG_NM        -> name
  //   HG_NM_ENG    -> name_en
  //   POLY_NM      -> party
  //   ORIG_NM      -> district
  //   CMIT_NM      -> committee
  //   REELE_GBN_NM -> elected_count text
  //   E_MAIL       -> email
  //   MONA_CD      -> assembly member code (unique key)

  // TODO: Replace with actual DB client (e.g. Prisma / Drizzle / pg)
  // For now, we just return the count of rows that *would* be upserted
  let updated = 0;
  for (const row of rows) {
    const _legislator = {
      assembly_code: row.MONA_CD || row.NAAS_CD,
      name: row.HG_NM,
      name_en: row.HG_NM_ENG,
      party: row.POLY_NM,
      district: row.ORIG_NM,
      committee: row.CMIT_NM,
      elected_count_text: row.REELE_GBN_NM,
      photo_url: row.JPGLINK,
    };
    updated++;
  }

  console.log(`[assembly] Would upsert ${updated} legislators into DB`);
  return updated;
}

async function upsertBills(rows: Record<string, string>[]): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log(`[assembly] DATABASE_URL not set -- skipping DB upsert for ${rows.length} bills`);
    return 0;
  }

  // Map API fields:
  //   BILL_NO       -> bill_no
  //   BILL_NAME     -> title
  //   PROPOSER      -> proposer_name
  //   PROPOSE_DT    -> proposed_date
  //   PROC_RESULT   -> status
  //   COMMITTEE     -> committee
  //   LINK_URL      -> assembly page URL

  let updated = 0;
  for (const row of rows) {
    const _bill = {
      bill_no: row.BILL_NO,
      title: row.BILL_NAME,
      proposer_name: row.PROPOSER,
      proposed_date: row.PROPOSE_DT,
      status: row.PROC_RESULT,
      committee: row.COMMITTEE || row.CURR_COMMITTEE,
      detail_url: row.LINK_URL,
    };
    updated++;
  }

  console.log(`[assembly] Would upsert ${updated} bills into DB`);
  return updated;
}

// ── Main export ────────────────────────────────────────────────────
export async function scrapeAssembly(): Promise<ScrapeResult> {
  const API_KEY = process.env.ASSEMBLY_API_KEY;
  if (!API_KEY) {
    return { status: 'skipped', reason: 'ASSEMBLY_API_KEY not set' };
  }

  const startedAt = new Date().toISOString();
  const start = Date.now();

  try {
    // Fetch legislators
    const legislators = await fetchLegislators(API_KEY);
    console.log(`[assembly] Fetched ${legislators.fetched} legislators`);

    // Fetch recent bills (last 100)
    const bills = await fetchBills(API_KEY, 1, 100);
    console.log(`[assembly] Fetched ${bills.fetched} bills`);

    const totalFetched = legislators.fetched + bills.fetched;

    // Upsert into DB (no-op without DATABASE_URL)
    const legislatorsUpdated = await upsertLegislators(legislators.data);
    const billsUpdated = await upsertBills(bills.data);
    const totalUpdated = legislatorsUpdated + billsUpdated;

    const result: ScrapeResult = {
      status: 'success',
      records_fetched: totalFetched,
      records_updated: totalUpdated,
      duration_ms: Date.now() - start,
    };

    logSyncResult({
      source: 'assembly',
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
      source: 'assembly',
      status: 'error',
      records_fetched: 0,
      records_updated: 0,
      error_message: errorMessage,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return {
      status: 'error',
      error: errorMessage,
      records_fetched: 0,
      records_updated: 0,
      duration_ms: duration,
    };
  }
}
