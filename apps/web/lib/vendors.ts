// 업체 프로필 서버 로더 — /vendors/[key] 전용.
// fs(빌드/로컬) → 자기 CDN fetch(Vercel 런타임). lib/audit/full.ts와 같은 패턴.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface VendorFlagRef {
  id: string;
  institution: string;
  pattern_type: string;
  severity: string;
  score: number;
  summary: string;
}

export interface VendorProfileFull {
  key: string;
  name: string;
  bizno: string | null;
  company: {
    corpNm: string; opbizDt: string | null; rgnNm: string | null;
    adrs: string | null; emplyeNum: string | number | null; hmpgAdrs: string | null;
    mnfctDivNm: string | null;
  } | null;
  sanctions: unknown[];
  max_score: number;
  flag_count: number;
  institution_count: number;
  institutions: string[];
  patterns: string[];
  contracts_count: number;
  contracts_total: number;
  contracts_sample: { name: string; amount: number; date: string; institution: string; method: string; url: string }[];
  flags: VendorFlagRef[];
}

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // VERCEL_URL(배포별 URL)은 SSO 보호에 걸려 서버 사이드 fetch가 302를 받는다.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

const _cache = new Map<string, Record<string, VendorProfileFull> | null>();

async function loadShard(sk: string): Promise<Record<string, VendorProfileFull> | null> {
  if (_cache.has(sk)) return _cache.get(sk)!;
  let shard: Record<string, VendorProfileFull> | null = null;
  try {
    shard = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'vendor-shards', `${sk}.json`), 'utf-8'));
  } catch { /* 런타임 서버리스 */ }
  if (!shard) {
    try {
      const res = await fetch(`${baseUrl()}/data/vendor-shards/${sk}.json`, { next: { revalidate: 3600 } });
      if (res.ok) shard = await res.json();
    } catch { /* 네트워크 실패 */ }
  }
  _cache.set(sk, shard);
  return shard;
}

export async function getVendorByKey(key: string): Promise<VendorProfileFull | undefined> {
  if (!/^v[0-9a-f]{10}$/.test(key)) return undefined;
  const sk = crypto.createHash('md5').update(key).digest('hex').slice(0, 2);
  const shard = await loadShard(sk);
  return shard?.[key];
}

/** 인덱스 상위 N개 업체 (프리렌더/목록용) — 빌드 시 fs */
export function getTopVendorsFromIndex(n: number): [string, string, number, number, number, number, string][] {
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'vendors-index.json'), 'utf-8'));
    return (idx.vendors ?? []).slice(0, n);
  } catch {
    return [];
  }
}
