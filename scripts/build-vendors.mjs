#!/usr/bin/env node
/**
 * 업체(vendor) 프로필 데이터 빌더 — OpenTheBooks 패턴의 엔티티 연결 레이어.
 * 감사 findings의 업체별 플래그 + g2b-companies 기업정보를 조인해
 *   apps/web/public/data/vendors-index.json      — 목록/검색용 (배열 포맷)
 *   apps/web/public/data/vendor-shards/{xx}.json — 프로필 풀 데이터 (md5(key) 앞 2자리)
 * 를 생성한다.
 *
 * usage: NODE_OPTIONS=--max-old-space-size=6144 node scripts/build-vendors.mjs
 * (generate-audit.py / fetch-data.py 재실행 후 다시 돌릴 것)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_AUDIT = path.join(root, 'apps/web/public/data/audit-results.json');
const SRC_COMPANIES = path.join(root, 'apps/web/data/g2b-companies.json');
const SRC_SANCTIONS = path.join(root, 'apps/web/data/g2b-sanctions.json');
const OUT_INDEX = path.join(root, 'apps/web/public/data/vendors-index.json');
const OUT_SHARD_DIR = path.join(root, 'apps/web/public/data/vendor-shards');

const norm = (s) => String(s ?? '')
  .replace(/주식회사|\(주\)|㈜|유한회사|\(유\)|합자회사|재단법인|사단법인/g, '')
  .replace(/\s+/g, '')
  .toLowerCase();

const keyOf = (name) => 'v' + crypto.createHash('md5').update(norm(name)).digest('hex').slice(0, 10);
const shardOf = (key) => crypto.createHash('md5').update(key).digest('hex').slice(0, 2);
const trunc = (s, n) => { const t = String(s ?? ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// ── 1. 기업정보 인덱스 (정규화 이름 → 회사) ──
const companies = JSON.parse(fs.readFileSync(SRC_COMPANIES, 'utf-8')).items ?? [];
const compByName = new Map();
for (const c of companies) {
  const k = norm(c.corpNm);
  if (k && !compByName.has(k)) compByName.set(k, c);
}
console.log(`companies: ${companies.length} (${compByName.size} unique names)`);

// ── 2. 제재 이력 (현재 비어 있음 — 채워지면 자동 반영) ──
let sanctions = [];
try { sanctions = JSON.parse(fs.readFileSync(SRC_SANCTIONS, 'utf-8')).items ?? []; } catch { /* optional */ }
const sancByName = new Map();
for (const s of sanctions) {
  const k = norm(s.corpNm ?? s.prcbdgNm ?? '');
  if (!k) continue;
  if (!sancByName.has(k)) sancByName.set(k, []);
  sancByName.get(k).push(s);
}
console.log(`sanctions: ${sanctions.length}`);

// ── 3. 감사 findings에서 업체별 집계 ──
console.log('reading audit findings…');
const audit = JSON.parse(fs.readFileSync(SRC_AUDIT, 'utf-8'));
const vendors = new Map(); // normName → profile

// 낙찰 전 플레이스홀더 등 업체가 아닌 값 제외
const JUNK = /낙찰\s*전|입찰\s*중|해당\s*없|^미정$|^없음$|^-+$|^\d+$/;

function touch(name) {
  const k = norm(name);
  if (!k || k.length < 2) return null;
  if (JUNK.test(String(name))) return null;
  if (!vendors.has(k)) {
    vendors.set(k, {
      key: keyOf(name),
      name: String(name).trim(),
      flags: [],
      institutions: new Set(),
      contracts_count: 0,
      contracts_total: 0,
      max_score: 0,
      patterns: new Set(),
      contracts_sample: [],
    });
  }
  return vendors.get(k);
}

for (const f of audit.findings ?? []) {
  const names = new Set();
  const dv = f.detail?.['업체'];
  if (typeof dv === 'string' && dv.trim()) names.add(dv.trim());
  for (const c of f.evidence_contracts ?? []) {
    if (c.vendor && String(c.vendor).trim()) names.add(String(c.vendor).trim());
  }
  for (const name of names) {
    const v = touch(name);
    if (!v) continue;
    v.flags.push({
      id: f.id ?? '',
      institution: f.target_institution ?? '',
      pattern_type: f.pattern_type,
      severity: f.severity,
      score: f.suspicion_score ?? 0,
      summary: trunc(f.summary, 90),
    });
    v.institutions.add(f.target_institution ?? '');
    v.max_score = Math.max(v.max_score, f.suspicion_score ?? 0);
    v.patterns.add(f.pattern_type);
    for (const c of f.evidence_contracts ?? []) {
      if (norm(c.vendor) !== norm(name)) continue;
      v.contracts_count += 1;
      v.contracts_total += c.amount || 0;
      if (v.contracts_sample.length < 20) {
        v.contracts_sample.push({ name: trunc(c.name, 70), amount: c.amount || 0, date: c.date || '', institution: f.target_institution ?? '', method: c.method || '', url: c.url || '' });
      }
    }
  }
}
console.log(`vendors with flags: ${vendors.size}`);

// ── 4. 조인 + 출력 ──
fs.mkdirSync(OUT_SHARD_DIR, { recursive: true });
const shards = new Map();
const indexRows = [];

for (const [k, v] of vendors) {
  const comp = compByName.get(k);
  const sanc = sancByName.get(k) ?? [];
  const profile = {
    key: v.key,
    name: v.name,
    bizno: comp?.bizno ?? null,
    company: comp ? {
      corpNm: comp.corpNm, opbizDt: comp.opbizDt ?? null, rgnNm: comp.rgnNm ?? null,
      adrs: comp.adrs ?? null, emplyeNum: comp.emplyeNum ?? null, hmpgAdrs: comp.hmpgAdrs ?? null,
      mnfctDivNm: comp.mnfctDivNm ?? null,
    } : null,
    sanctions: sanc,
    max_score: v.max_score,
    flag_count: v.flags.length,
    institution_count: v.institutions.size,
    institutions: [...v.institutions].slice(0, 30),
    patterns: [...v.patterns],
    contracts_count: v.contracts_count,
    contracts_total: v.contracts_total,
    contracts_sample: v.contracts_sample,
    flags: v.flags.sort((a, b) => b.score - a.score).slice(0, 100),
  };
  const sk = shardOf(v.key);
  if (!shards.has(sk)) shards.set(sk, {});
  shards.get(sk)[v.key] = profile;

  indexRows.push([v.key, v.name, v.flags.length, v.max_score, v.contracts_total, v.institutions.size, comp?.bizno ?? '']);
}

// 인덱스는 플래그 수 → 점수 순 정렬
indexRows.sort((a, b) => (b[2] - a[2]) || (b[3] - a[3]));

fs.writeFileSync(OUT_INDEX, JSON.stringify({
  generated_at: new Date().toISOString(),
  total: indexRows.length,
  fields: ['key', 'name', 'flag_count', 'max_score', 'contracts_total', 'institution_count', 'bizno'],
  vendors: indexRows,
}));
for (const [sk, obj] of shards) {
  fs.writeFileSync(path.join(OUT_SHARD_DIR, `${sk}.json`), JSON.stringify(obj));
}
const idxMB = (fs.statSync(OUT_INDEX).size / 1024 / 1024).toFixed(1);
let maxShard = 0;
for (const f of fs.readdirSync(OUT_SHARD_DIR)) maxShard = Math.max(maxShard, fs.statSync(path.join(OUT_SHARD_DIR, f)).size);
console.log(`index → ${idxMB}MB (${indexRows.length} vendors) | shards: ${shards.size} files, max ${(maxShard / 1024 / 1024).toFixed(1)}MB`);
