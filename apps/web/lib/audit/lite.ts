// 경량 감사 인덱스(audit-index.json) → EnrichedFinding 호환 객체 매퍼.
// 서버(build-audit-static.ts)에서 이미 점수 보정을 끝냈으므로 클라이언트 재계산이 없다.
import type { EnrichedFinding } from './context';

export interface AuditIndexData {
  generated_at: string;
  source_timestamp: string | null;
  pre_enriched: true;
  contracts_analyzed: number | null;
  total_contracts_in_db: number | null;
  findings_count: number;
  summary: Record<string, unknown> | null;
  pattern_counts: Record<string, number> | null;
  investigation_priority: unknown[] | null;
  methodology: Record<string, unknown> | null;
  fields: string[];
  findings: LiteRow[];
}

export type LiteRow = [
  string,  // id
  string,  // pattern_type
  string,  // severity
  number,  // adjusted_score
  number,  // raw_score
  string,  // risk_level
  string,  // risk_label
  string,  // target_institution
  string,  // verdict
  number,  // priority_tier
  string,  // context_category
  string,  // created_at
  string,  // key_stat
  string,  // summary_short
  number,  // contracts_count
  number,  // contracts_total_amount
  string,  // first_contract_name
];

// "외 N건" 표시와 금액 합산이 실데이터와 일치하도록 공유 스텁으로 배열 길이를 재현한다.
const EMPTY_CONTRACT = Object.freeze({ no: '', name: '', amount: 0, vendor: '', date: '', method: '', url: '' });
const SYNTH_CAP = 500; // 비정상적으로 큰 배열 생성 방지 (표시상 "외 499+건"이면 충분)

export function liteRowToFinding(r: LiteRow): EnrichedFinding {
  const [id, pattern_type, severity, adjusted_score, raw_score, risk_level, risk_label,
    target_institution, verdict, priority_tier, context_category, created_at,
    key_stat, summary_short, contracts_count, contracts_total_amount, first_contract_name] = r;

  const n = Math.min(contracts_count, SYNTH_CAP);
  const contracts = n > 0
    ? [{ ...EMPTY_CONTRACT, name: first_contract_name, amount: contracts_total_amount },
       ...(n > 1 ? new Array(n - 1).fill(EMPTY_CONTRACT) : [])]
    : [];

  return {
    id,
    pattern_type,
    severity,
    suspicion_score: raw_score,
    target_institution,
    summary: summary_short,
    detail: {},
    evidence_contracts: [],
    innocent_explanation: '',
    verdict: (verdict || undefined) as EnrichedFinding['verdict'],
    priority_tier: priority_tier || undefined,
    adjusted_score,
    raw_score,
    risk_level: risk_level as EnrichedFinding['risk_level'],
    risk_label,
    mitigating_factors: [],
    aggravating_factors: [],
    contextual_analysis: summary_short,
    what_to_watch_for: '',
    data_quality: { duplicate_contracts: 0, unique_contracts: contracts_count, single_day_snapshot: false, small_sample: false },
    deduplicated_contracts: contracts,
    amount_tier: '',
    amount_tier_label: '',
    // 인덱스 전용 필드 (getKeyStat이 우선 사용)
    key_stat,
    context_category,
    created_at,
  } as EnrichedFinding & { key_stat: string; context_category: string; created_at: string };
}
