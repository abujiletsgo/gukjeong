// 감사 finding 풀 데이터 서버 로더 — 상세 페이지 전용.
// 우선순위: Neon DB → 로컬 fs 샤드(빌드/로컬) → 자기 CDN 샤드 fetch(Vercel 런타임).
// public/data/** 는 서버리스 번들에서 제외되므로(next.config) 런타임에는 CDN fetch가 정답이다.
// (서버 컴포넌트에서만 import할 것 — fs/crypto를 쓰므로 클라이언트 번들에 넣으면 안 된다)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { AuditFlag } from '../types';
import { getAuditFlagByIdFromDB } from '../db/queries';

function shardKey(id: string): string {
  return crypto.createHash('md5').update(id).digest('hex').slice(0, 2);
}

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

// 샤드는 프로세스 수명 동안 캐시 (샤드당 ≤1MB, 아무리 많아도 256개)
const _shardCache = new Map<string, Record<string, AuditFlag> | null>();

async function loadShard(key: string): Promise<Record<string, AuditFlag> | null> {
  if (_shardCache.has(key)) return _shardCache.get(key)!;
  let shard: Record<string, AuditFlag> | null = null;

  // 1) 로컬/빌드 시 fs
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'audit-shards', `${key}.json`);
    shard = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { /* 서버리스 런타임 — fs에 없음 */ }

  // 2) 자기 CDN에서 fetch (정적 자산은 함수 번들 제외와 무관하게 서빙됨)
  if (!shard) {
    try {
      const res = await fetch(`${baseUrl()}/data/audit-shards/${key}.json`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) shard = await res.json();
    } catch { /* 네트워크 실패 */ }
  }

  _shardCache.set(key, shard);
  return shard;
}

/** finding 풀 데이터 조회: DB → 샤드. 없으면 undefined. */
export async function getAuditFindingFull(id: string): Promise<AuditFlag | undefined> {
  const fromDb = await getAuditFlagByIdFromDB(id);
  if (fromDb) return fromDb;
  const shard = await loadShard(shardKey(id));
  return shard?.[id];
}

/** 인덱스에서 상위 N개 finding id (프리렌더용) — 빌드 시 fs로만 읽는다 */
export function getTopFindingIdsFromIndex(n: number): string[] {
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'audit-index.json');
    const idx = JSON.parse(fs.readFileSync(p, 'utf-8'));
    // 인덱스는 adjusted_score 내림차순 정렬 상태로 생성됨 — 앞에서 N개
    return (idx.findings as [string, ...unknown[]][]).slice(0, n).map((r) => r[0]).filter(Boolean);
  } catch {
    return [];
  }
}
