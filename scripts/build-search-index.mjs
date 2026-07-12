#!/usr/bin/env node
/**
 * 통합 검색 인덱스 생성기
 * 기존 데이터 파일에서 검색 가능한 엔티티(의원/법안/감사기관/대통령/지역)를 추출해
 * apps/web/public/data/search-index.json 으로 출력한다.
 *
 * usage: node scripts/build-search-index.mjs
 * 데이터 갱신(generate-audit.py, enrich-bills.py) 후 재실행할 것.
 *
 * 출력 2개 (용량 최소화를 위해 배열 형식 [t, n, s, u]):
 *   search-index.json       — 의원/기관/대통령/지역 (즉시 로드용, ~수백KB)
 *   search-index-bills.json — 법안 16,914건 (검색어 입력 시 지연 로드)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => path.join(root, 'apps/web/public/data', p);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const core = [];
const billsIdx = [];

// 1. 국회의원 (legislators-real.json)
try {
  const data = readJSON(pub('legislators-real.json'));
  for (const l of data.legislators ?? []) {
    core.push(['leg', l.HG_NM, [l.POLY_NM, l.ORIG_NM].filter(Boolean).join(' · '), `/legislators/${l.MONA_CD}`]);
  }
  console.log(`legislators: ${data.legislators?.length ?? 0}`);
} catch (e) { console.warn('legislators skip:', e.message); }

// 2. 법안 (bills-enriched.json) — 별도 청크로 분리 (지연 로드)
try {
  const data = readJSON(pub('bills-enriched.json'));
  for (const b of data.bills ?? []) {
    billsIdx.push(['bill', b.BILL_NAME, [b.proposer_party, b.status_label].filter(Boolean).join(' · '), `/bills/${b.BILL_ID}`]);
  }
  console.log(`bills: ${data.bills?.length ?? 0}`);
} catch (e) { console.warn('bills skip:', e.message); }

// 3. 감사 대상 기관 (audit-results.json에서 기관별 집계 — 대용량이므로 집계만 담는다)
try {
  const data = readJSON(pub('audit-results.json'));
  const byInst = new Map();
  for (const f of data.findings ?? []) {
    const inst = f.target_institution;
    if (!inst) continue;
    const cur = byInst.get(inst) ?? { count: 0, maxScore: 0, topId: null };
    cur.count += 1;
    if ((f.suspicion_score ?? 0) >= cur.maxScore) {
      cur.maxScore = f.suspicion_score ?? 0;
      cur.topId = f.id;
    }
    byInst.set(inst, cur);
  }
  // URL은 클라이언트에서 `/audit?q=${encodeURIComponent(name)}`로 파생 (인코딩 한글로 인한 용량 폭증 방지)
  for (const [inst, { count }] of byInst) {
    core.push(['inst', inst, `감사 플래그 ${count}건`, '']);
  }
  console.log(`institutions: ${byInst.size}`);
} catch (e) { console.warn('institutions skip:', e.message); }

// 4. 대통령 (data/seed/presidents.json)
try {
  const data = readJSON(path.join(root, 'data/seed/presidents.json'));
  for (const p of data.presidents ?? data ?? []) {
    core.push(['pres', p.name ?? p.name_ko ?? p.id,
      [p.term_start?.slice(0, 4), p.term_end?.slice(0, 4)].filter(Boolean).join('–') || '대통령',
      `/presidents/${p.id}`]);
  }
  console.log('presidents: done');
} catch (e) { console.warn('presidents skip:', e.message); }

// 5. 지역 (lib/data.ts의 LOCAL_GOVERNMENTS_DATA에서 id/name만 추출)
try {
  const src = fs.readFileSync(path.join(root, 'apps/web/lib/data.ts'), 'utf8');
  const m = src.match(/const LOCAL_GOVERNMENTS_DATA[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (m) {
    const ids = [...m[1].matchAll(/id:\s*'([^']+)'/g)].map((x) => x[1]);
    const names = [...m[1].matchAll(/name:\s*'([^']+)'/g)].map((x) => x[1]);
    ids.forEach((id, i) => {
      if (names[i]) core.push(['local', names[i], '지역 재정', `/local/${id}`]);
    });
    console.log(`local: ${ids.length}`);
  }
} catch (e) { console.warn('local skip:', e.message); }

const stamp = new Date().toISOString();
const outCore = pub('search-index.json');
fs.writeFileSync(outCore, JSON.stringify({ generated_at: stamp, total: core.length, items: core }));
const outBills = pub('search-index-bills.json');
fs.writeFileSync(outBills, JSON.stringify({ generated_at: stamp, total: billsIdx.length, items: billsIdx }));
console.log(`\nwrote ${outCore} — ${core.length} items, ${(fs.statSync(outCore).size / 1024).toFixed(0)}KB`);
console.log(`wrote ${outBills} — ${billsIdx.length} items, ${(fs.statSync(outBills).size / 1024).toFixed(0)}KB`);
