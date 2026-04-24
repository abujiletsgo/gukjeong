/**
 * Local data loader — reads pre-fetched JSON files from data/ directory.
 *
 * Run `python3 scripts/fetch-data.py` to refresh the local data.
 * The app reads these files at build/request time instead of calling APIs.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import type { NewsTopicsResponse } from './types';

const DATA_DIR = join(process.cwd(), 'data');

interface LocalDataFile<T> {
  source: string;
  endpoint?: string;
  fetched_at: string;
  totalCount: number;
  items: T[];
  outlets?: number;
}

function loadJSON<T>(filename: string): LocalDataFile<T> {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

// Cache loaded data in memory (per-process, cleared on restart)
let _cache: Record<string, LocalDataFile<unknown>> = {};

function cached<T>(filename: string): LocalDataFile<T> {
  if (!_cache[filename]) {
    _cache[filename] = loadJSON(filename);
  }
  return _cache[filename] as LocalDataFile<T>;
}

/** Clear in-memory cache (useful after re-fetching data) */
export function clearCache() {
  _cache = {};
}

// ── Public accessors ──

export function getLocalLegislators() {
  return cached<Record<string, string>>('legislators.json');
}

export function getLocalBills() {
  return cached<Record<string, string>>('bills.json');
}

export function getLocalEcosStats() {
  return cached<Record<string, string>>('ecos-stats.json');
}

export function getLocalG2BBids() {
  return cached<Record<string, unknown>>('g2b-contracts.json');
}

export function getLocalG2BContracts() {
  return cached<Record<string, unknown>>('g2b-actual-contracts.json');
}

export function getLocalNews() {
  return cached<Record<string, string>>('news-rss.json');
}

export function getLocalG2BCompanies() {
  try {
    return cached<Record<string, unknown>>('g2b-companies.json');
  } catch {
    return { source: '', fetched_at: '', totalCount: 0, items: [] };
  }
}

/** Lookup a company by bizno (strips dashes) */
export function getCompanyByBizno(bizno: string): Record<string, unknown> | null {
  const clean = bizno.replace(/-/g, '');
  const { items } = getLocalG2BCompanies();
  return items.find((c) => String(c.bizno) === clean) as Record<string, unknown> | null ?? null;
}

export function getLocalWinningBids() {
  try {
    return cached<Record<string, unknown>>('g2b-winning-bids.json');
  } catch {
    return { source: '', fetched_at: '', totalCount: 0, items: [] };
  }
}

export function getLocalContractDetails() {
  try {
    return cached<Record<string, unknown>>('g2b-contract-details.json');
  } catch {
    return { source: '', fetched_at: '', totalCount: 0, items: [] };
  }
}

export function getLocalPrices() {
  try {
    return cached<Record<string, unknown>>('g2b-prices.json');
  } catch {
    return { source: '', fetched_at: '', totalCount: 0, items: [] };
  }
}

export function getLocalProcurementStats() {
  try {
    const raw = readFileSync(join(DATA_DIR, 'procurement-stats.json'), 'utf-8');
    return JSON.parse(raw) as { year: string; data: Record<string, unknown[]> };
  } catch {
    return { year: '', data: {} };
  }
}

export function getLocalOfficialAssets() {
  try {
    return cached<Record<string, unknown>>('official-assets.json');
  } catch {
    return { source: '', fetched_at: '', totalCount: 0, items: [] };
  }
}

const PUBLIC_DATA_DIR = join(process.cwd(), 'public', 'data');

export function getLocalNewsTopics(): NewsTopicsResponse {
  try {
    const raw = readFileSync(join(PUBLIC_DATA_DIR, 'news-topics.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { generated_at: '', source_file: '', source_fetched_at: '', total_topics: 0, topics: [] };
  }
}
