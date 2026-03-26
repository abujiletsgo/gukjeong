// 국정투명 -- 나라장터 (G2B) 계약 데이터 스크래퍼
// data.go.kr 공공데이터포털 API 경유
//
// Endpoints used:
//   조달청 계약 현황: https://apis.data.go.kr/1230000/BidPublicInfoService04
//   - 입찰공고목록 조회: /getPublicBidList
//   - 계약현황 조회:    /getScsbidListSttusServc
//
// Response: XML (default) or JSON via dataType param

import type { ScrapeResult } from './types';
import { fetchWithRetry, logSyncResult, parseXmlRows } from './types';

const BASE_URL = 'https://apis.data.go.kr/1230000/BidPublicInfoService04';

// Audit pattern definitions for suspicious contract detection
const AUDIT_PATTERNS = {
  SPLIT_CONTRACT: {
    description: '계약 분할 의심 (수의계약 한도 직하 금액 반복)',
    threshold: 50_000_000, // 5천만원 수의계약 기준
    tolerance: 0.05,
  },
  SOLE_SOURCE_CLUSTER: {
    description: '특정 업체 수의계약 집중',
    minCount: 3, // 같은 업체 수의계약 3건 이상
  },
  HOLIDAY_CONTRACT: {
    description: '공휴일/심야 계약 체결',
  },
  BUDGET_YEAR_END_RUSH: {
    description: '회계연도 말 집중 계약 (예산 소진 의심)',
    rushMonths: [11, 12], // 11-12월
  },
} as const;

// ── 계약 현황 조회 ─────────────────────────────────────────────────
async function fetchContracts(
  apiKey: string,
  startDate: string, // YYYYMMDD
  endDate: string,
  page = 1,
  size = 100,
): Promise<{ fetched: number; data: Record<string, string>[] }> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: String(page),
    numOfRows: String(size),
    inqryDiv: '1', // 1=공고일 기준
    inqryBgnDt: startDate,
    inqryEndDt: endDate,
    type: 'json',
  });

  const url = `${BASE_URL}/getBidPblancListInfoServc01?${params.toString()}`;
  const response = await fetchWithRetry(url);

  let items: Record<string, string>[] = [];

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    const json = await response.json();
    const body = json?.response?.body;
    items = body?.items?.item ?? [];
    if (!Array.isArray(items)) items = items ? [items] : [];
  } else {
    // XML fallback
    const xmlText = await response.text();
    items = parseXmlRows(xmlText, 'item');
  }

  return { fetched: items.length, data: items };
}

// ── 감사 패턴 분석 ────────────────────────────────────────────────
interface AuditFlagCandidate {
  pattern_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suspicion_score: number;
  target_type: string;
  target_id: string;
  detail: Record<string, unknown>;
}

function detectSplitContracts(contracts: Record<string, string>[]): AuditFlagCandidate[] {
  const flags: AuditFlagCandidate[] = [];
  const threshold = AUDIT_PATTERNS.SPLIT_CONTRACT.threshold;
  const tolerance = AUDIT_PATTERNS.SPLIT_CONTRACT.tolerance;
  const lowerBound = threshold * (1 - tolerance);

  // Group by contracting department
  const byDept: Record<string, Record<string, string>[]> = {};
  for (const c of contracts) {
    const dept = c.dminsttNm || c.ntceInsttNm || 'unknown';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(c);
  }

  for (const [dept, deptContracts] of Object.entries(byDept)) {
    // Count contracts just below the threshold
    const nearThreshold = deptContracts.filter(c => {
      const amount = parseFloat(c.presmptPrce || c.asignBdgtAmt || '0');
      return amount >= lowerBound && amount < threshold;
    });

    if (nearThreshold.length >= 2) {
      flags.push({
        pattern_type: 'SPLIT_CONTRACT',
        severity: nearThreshold.length >= 4 ? 'high' : 'medium',
        suspicion_score: Math.min(0.9, 0.3 + nearThreshold.length * 0.15),
        target_type: 'department',
        target_id: dept,
        detail: {
          department: dept,
          count: nearThreshold.length,
          total_amount: nearThreshold.reduce((sum, c) => sum + parseFloat(c.presmptPrce || c.asignBdgtAmt || '0'), 0),
          description: AUDIT_PATTERNS.SPLIT_CONTRACT.description,
        },
      });
    }
  }

  return flags;
}

function detectSoleSourceClusters(contracts: Record<string, string>[]): AuditFlagCandidate[] {
  const flags: AuditFlagCandidate[] = [];

  // Filter to sole-source (수의계약) contracts
  const soleSource = contracts.filter(c => {
    const method = c.cntrctMthdNm || c.bidNtceNm || '';
    return method.includes('수의') || method.includes('제한');
  });

  // Group by vendor
  const byVendor: Record<string, Record<string, string>[]> = {};
  for (const c of soleSource) {
    const vendor = c.bidNtceNm || c.prtcptCnum || 'unknown';
    if (!byVendor[vendor]) byVendor[vendor] = [];
    byVendor[vendor].push(c);
  }

  for (const [vendor, vendorContracts] of Object.entries(byVendor)) {
    if (vendorContracts.length >= AUDIT_PATTERNS.SOLE_SOURCE_CLUSTER.minCount) {
      flags.push({
        pattern_type: 'SOLE_SOURCE_CLUSTER',
        severity: vendorContracts.length >= 5 ? 'high' : 'medium',
        suspicion_score: Math.min(0.85, 0.3 + vendorContracts.length * 0.1),
        target_type: 'vendor',
        target_id: vendor,
        detail: {
          vendor,
          count: vendorContracts.length,
          total_amount: vendorContracts.reduce((sum, c) => sum + parseFloat(c.presmptPrce || c.asignBdgtAmt || '0'), 0),
          description: AUDIT_PATTERNS.SOLE_SOURCE_CLUSTER.description,
        },
      });
    }
  }

  return flags;
}

function detectYearEndRush(contracts: Record<string, string>[]): AuditFlagCandidate[] {
  const flags: AuditFlagCandidate[] = [];
  const rushMonths = AUDIT_PATTERNS.BUDGET_YEAR_END_RUSH.rushMonths;

  // Group by department
  const byDept: Record<string, { rush: number; total: number }> = {};

  for (const c of contracts) {
    const dept = c.dminsttNm || c.ntceInsttNm || 'unknown';
    if (!byDept[dept]) byDept[dept] = { rush: 0, total: 0 };
    byDept[dept].total++;

    const dateStr = c.bidNtceDt || c.rgstDt || '';
    const month = parseInt(dateStr.substring(4, 6), 10);
    if (month === 11 || month === 12) {
      byDept[dept].rush++;
    }
  }

  for (const [dept, counts] of Object.entries(byDept)) {
    if (counts.total >= 5 && counts.rush / counts.total > 0.5) {
      flags.push({
        pattern_type: 'BUDGET_YEAR_END_RUSH',
        severity: counts.rush / counts.total > 0.7 ? 'high' : 'medium',
        suspicion_score: Math.min(0.8, counts.rush / counts.total),
        target_type: 'department',
        target_id: dept,
        detail: {
          department: dept,
          rush_count: counts.rush,
          total_count: counts.total,
          rush_ratio: (counts.rush / counts.total).toFixed(2),
          description: AUDIT_PATTERNS.BUDGET_YEAR_END_RUSH.description,
        },
      });
    }
  }

  return flags;
}

// ── DB write (guarded) ─────────────────────────────────────────────
async function upsertContracts(rows: Record<string, string>[]): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log(`[g2b] DATABASE_URL not set -- skipping DB upsert for ${rows.length} contracts`);
    return 0;
  }

  // Map API fields to our schema:
  //   bidNtceNo      -> g2b_id
  //   bidNtceNm      -> title
  //   ntceInsttNm    -> department
  //   presmptPrce    -> amount
  //   cntrctMthdNm   -> contract_method
  //   bidNtceDt      -> contract_date

  let updated = 0;
  for (const row of rows) {
    const _contract = {
      g2b_id: row.bidNtceNo,
      title: row.bidNtceNm,
      department: row.ntceInsttNm || row.dminsttNm,
      amount: parseFloat(row.presmptPrce || row.asignBdgtAmt || '0'),
      contract_method: row.cntrctMthdNm,
      contract_date: row.bidNtceDt,
    };
    updated++;
  }

  console.log(`[g2b] Would upsert ${updated} contracts into DB`);
  return updated;
}

async function insertAuditFlags(flags: AuditFlagCandidate[]): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log(`[g2b] DATABASE_URL not set -- skipping ${flags.length} audit flags`);
    return 0;
  }

  // TODO: Replace with actual DB client
  console.log(`[g2b] Would insert ${flags.length} audit flags into DB`);
  return flags.length;
}

// ── Main export ────────────────────────────────────────────────────
export async function scrapeG2B(): Promise<ScrapeResult> {
  const API_KEY = process.env.G2B_API_KEY;
  if (!API_KEY) {
    return { status: 'skipped', reason: 'G2B_API_KEY not set' };
  }

  const startedAt = new Date().toISOString();
  const start = Date.now();

  try {
    // Fetch contracts from the last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endDate = formatDate(now);
    const startDate = formatDate(weekAgo);

    console.log(`[g2b] Fetching contracts from ${startDate} to ${endDate}`);

    // Fetch up to 3 pages (300 contracts)
    const allContracts: Record<string, string>[] = [];
    for (let page = 1; page <= 3; page++) {
      const result = await fetchContracts(API_KEY, startDate, endDate, page, 100);
      allContracts.push(...result.data);
      if (result.fetched < 100) break; // last page
    }

    console.log(`[g2b] Fetched ${allContracts.length} contracts total`);

    // Run audit pattern detection
    const auditFlags: AuditFlagCandidate[] = [
      ...detectSplitContracts(allContracts),
      ...detectSoleSourceClusters(allContracts),
      ...detectYearEndRush(allContracts),
    ];
    console.log(`[g2b] Detected ${auditFlags.length} audit flags`);

    // DB writes (no-op without DATABASE_URL)
    const contractsUpdated = await upsertContracts(allContracts);
    const flagsInserted = await insertAuditFlags(auditFlags);
    const totalUpdated = contractsUpdated + flagsInserted;

    const result: ScrapeResult = {
      status: 'success',
      records_fetched: allContracts.length,
      records_updated: totalUpdated,
      duration_ms: Date.now() - start,
    };

    logSyncResult({
      source: 'g2b',
      status: 'success',
      records_fetched: allContracts.length,
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
      source: 'g2b',
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

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
