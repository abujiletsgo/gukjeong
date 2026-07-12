#!/usr/bin/env node
/**
 * 오늘의 O/X 카드 데이터 — 옥소폴리틱스식 데일리 인터랙션 루프 (백엔드 없음).
 * audit-results.json에서 시민이 판단해볼 만한 finding 60건을 큐레이션해
 * apps/web/public/data/daily-ox.json (수십 KB)으로 출력한다.
 * 클라이언트는 날짜 기반으로 하루 1건을 보여주고 선택을 localStorage에 기록한다.
 *
 * usage: NODE_OPTIONS=--max-old-space-size=6144 node scripts/build-daily-ox.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'apps/web/public/data/audit-results.json');
const OUT = path.join(root, 'apps/web/public/data/daily-ox.json');

const data = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
const findings = data.findings ?? [];

// 큐레이션 기준: 점수 높고, 시민 설명이 있고, 요약이 읽을 만한 것. 패턴 다양성 확보.
const candidates = findings
  .filter(f => f.id && (f.suspicion_score ?? 0) >= 70 && f.plain_explanation && f.summary && f.summary.length > 40)
  .sort((a, b) => (b.suspicion_score ?? 0) - (a.suspicion_score ?? 0));

const byPattern = new Map();
for (const f of candidates) {
  if (!byPattern.has(f.pattern_type)) byPattern.set(f.pattern_type, []);
  byPattern.get(f.pattern_type).push(f);
}

// 라운드로빈으로 패턴 다양성 있게 60건 선발
const picked = [];
let round = 0;
while (picked.length < 60) {
  let added = false;
  for (const list of byPattern.values()) {
    if (list[round]) { picked.push(list[round]); added = true; }
    if (picked.length >= 60) break;
  }
  if (!added) break;
  round++;
}

const trunc = (s, n) => { const t = String(s ?? ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

const entries = picked.map(f => ({
  id: f.id,
  institution: f.target_institution,
  pattern_type: f.pattern_type,
  score: f.suspicion_score,
  situation: trunc(f.plain_explanation, 180),
  counter: trunc(f.innocent_explanation, 140),
}));

fs.writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), total: entries.length, entries }));
console.log(`daily-ox → ${entries.length} entries, ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
