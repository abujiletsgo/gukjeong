/**
 * 감사 정적 데이터 빌더 — 246MB audit-results.json을 웹 서빙 가능한 형태로 분해한다.
 *
 *   usage: npx tsx --max-old-space-size=6144 scripts/build-audit-static.mts
 *   (generate-audit.py 재실행 후 반드시 다시 돌릴 것 — npm run data:refresh에 포함)
 *
 * 출력:
 *   apps/web/public/data/audit-index.json      — 목록용 경량 인덱스 (전 findings, 배열 포맷)
 *   apps/web/public/data/audit-shards/{xx}.json — 상세용 풀 데이터 256개 샤드 (md5(id) 앞 2자리)
 *
 * 인덱스는 서버(lib/audit/context.ts enrichAllFindings)에서 미리 점수 보정을 끝낸 값을 담아
 * 클라이언트가 39,518건을 다시 계산하지 않게 한다.
 *
 * 행 포맷 (배열 — 키 오버헤드 제거):
 * [id, pattern_type, severity, adjusted_score, raw_score, risk_level, risk_label,
 *  target_institution, verdict, priority_tier, context_category, created_at,
 *  key_stat, summary_short, contracts_count, contracts_total_amount, first_contract_name]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { enrichAllFindings } from '../apps/web/lib/audit/context';
import type { RawFinding, EnrichedFinding } from '../apps/web/lib/audit/context';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'apps/web/public/data/audit-results.json');
const OUT_INDEX = path.join(root, 'apps/web/public/data/audit-index.json');
const OUT_SHARD_DIR = path.join(root, 'apps/web/public/data/audit-shards');

function trunc(s: unknown, n: number): string {
  const t = typeof s === 'string' ? s : '';
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

// AuditPageClient.getKeyStat과 동일한 로직 — 빌드 시 미리 계산
function keyStat(f: EnrichedFinding): string {
  const d = (f.detail ?? {}) as Record<string, unknown>;
  if (f.pattern_type === 'vendor_concentration') {
    return (d['집중도'] as string) || (d['업체_계약건수'] && d['기관_전체건수'] ? `${d['업체_계약건수']}/${d['기관_전체건수']}건` : '');
  }
  if (f.pattern_type === 'repeated_sole_source') {
    const ratio = d['수의계약_비율'] as string;
    if (ratio) return `${ratio} 수의계약`;
    if (d['수의계약_건수'] && d['전체_건수']) return `${d['수의계약_건수']}/${d['전체_건수']}건 수의계약`;
    return '반복 수의계약';
  }
  if (f.pattern_type === 'contract_splitting') {
    const cnt = d['한도근처_계약수'];
    return cnt ? `한도 근처 ${cnt}건` : '분할 의심';
  }
  return '';
}

console.log('reading', SRC);
const data = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
const findings: RawFinding[] = data.findings ?? [];
console.log(`findings: ${findings.length} — enriching (score adjustment)…`);

const enriched = enrichAllFindings(findings);
console.log(`enriched: ${enriched.length}`);

// ── 1. 경량 인덱스 ──
// enrichAllFindings가 합성하는 고액수의 항목(id 없음)은 원본 발견의 증거를
// 계약 단위로 재계상한 중복이며 상세 샤드도 없다 — 인덱스에서 제외.
const rows = enriched.filter((f) => f.id).map((f) => {
  const contracts = f.deduplicated_contracts ?? [];
  const total = contracts.reduce((s, c) => s + (c.amount || 0), 0);
  return [
    f.id ?? '',
    f.pattern_type,
    f.severity,
    f.adjusted_score,
    f.raw_score,
    f.risk_level,
    f.risk_label,
    f.target_institution,
    f.verdict ?? '',
    f.priority_tier ?? 0,
    (f as unknown as { context_category?: string }).context_category ?? '',
    (f as unknown as { created_at?: string }).created_at ?? '',
    keyStat(f),
    trunc(f.summary, 80),
    contracts.length,
    total,
    trunc(contracts[0]?.name, 40),
  ];
});

const index = {
  generated_at: new Date().toISOString(),
  source_timestamp: data.timestamp ?? null,
  pre_enriched: true,
  contracts_analyzed: data.contracts_analyzed ?? null,
  total_contracts_in_db: data.total_contracts_in_db ?? null,
  findings_count: rows.length,
  summary: data.summary ?? null,
  pattern_counts: data.pattern_counts ?? null,
  investigation_priority: data.investigation_priority ?? null,
  methodology: data.methodology ?? null,
  fields: ['id', 'pattern_type', 'severity', 'adjusted_score', 'raw_score', 'risk_level', 'risk_label', 'target_institution', 'verdict', 'priority_tier', 'context_category', 'created_at', 'key_stat', 'summary_short', 'contracts_count', 'contracts_total_amount', 'first_contract_name'],
  findings: rows,
};
fs.writeFileSync(OUT_INDEX, JSON.stringify(index));
console.log(`index → ${OUT_INDEX} (${(fs.statSync(OUT_INDEX).size / 1024 / 1024).toFixed(1)}MB)`);

// ── 2. 상세 샤드 (풀 데이터, md5(id) 앞 2자리로 256분할) ──
fs.mkdirSync(OUT_SHARD_DIR, { recursive: true });
const shards = new Map<string, Record<string, RawFinding>>();
for (const f of findings) {
  if (!f.id) continue;
  const key = crypto.createHash('md5').update(f.id).digest('hex').slice(0, 2);
  if (!shards.has(key)) shards.set(key, {});
  shards.get(key)![f.id] = f;
}
let maxShard = 0;
for (const [key, obj] of shards) {
  const p = path.join(OUT_SHARD_DIR, `${key}.json`);
  fs.writeFileSync(p, JSON.stringify(obj));
  maxShard = Math.max(maxShard, fs.statSync(p).size);
}
console.log(`shards → ${OUT_SHARD_DIR} (${shards.size} files, max ${(maxShard / 1024 / 1024).toFixed(1)}MB)`);
console.log('done');
