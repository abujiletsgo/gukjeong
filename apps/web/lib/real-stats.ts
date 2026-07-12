// 홈 화면용 실데이터 통계 — 시드 데이터(감사 16건, 법안 16건)가 아니라
// 실제 파이프라인 산출물(audit-index.json, bills-enriched.json)에서 집계한다.
// 서버 컴포넌트 전용(fs). 파일이 없으면 null을 돌려 시드 폴백을 쓰게 한다.
import fs from 'fs';
import path from 'path';

export interface RealStats {
  audit_findings: number;
  audit_high: number;
  audit_institutions: number;
  bills_total: number;
  bills_passed: number;
  bills_pending: number;
  legislators_total: number;
}

let _cache: RealStats | null | undefined;

export function getRealStats(): RealStats | null {
  if (_cache !== undefined) return _cache;
  try {
    const pub = (p: string) => path.join(process.cwd(), 'public', 'data', p);

    const idx = JSON.parse(fs.readFileSync(pub('audit-index.json'), 'utf-8'));
    type Row = [string, string, string, number, number, string, ...unknown[]];
    const rows = (idx.findings ?? []) as Row[];
    const high = rows.filter((r) => r[5] === 'CONCERN').length;
    const insts = new Set(rows.map((r) => r[7])).size;

    let bills = 0, billsPassed = 0, billsPending = 0;
    try {
      const be = JSON.parse(fs.readFileSync(pub('bills-enriched.json'), 'utf-8'));
      bills = be.total ?? 0;
      billsPassed = be.stats?.passed ?? 0;
      billsPending = be.stats?.pending ?? 0;
    } catch { /* optional */ }

    let legislators = 0;
    try {
      legislators = JSON.parse(fs.readFileSync(pub('legislators-real.json'), 'utf-8')).legislators?.length ?? 0;
    } catch { /* optional */ }

    _cache = {
      audit_findings: idx.findings_count ?? rows.length,
      audit_high: high,
      audit_institutions: insts,
      bills_total: bills,
      bills_passed: billsPassed,
      bills_pending: billsPending,
      legislators_total: legislators,
    };
  } catch {
    _cache = null;
  }
  return _cache;
}
