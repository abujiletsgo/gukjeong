'use client';
// AI 감사관 대시보드 — 클라이언트 컴포넌트
// Live mode: /data/audit-results.json (76 real findings from 나라장터)
// Demo mode: seed data passed as props
//
// v3: Production rebuild — full rich features in both modes
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Debug error boundary to show actual crash reason
class AuditErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="container-page py-16">
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Audit Page Crash</h2>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap text-gray-700">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useDataMode } from '@/lib/context/DataModeContext';
import {
  enrichAllFindings,
  getRiskColor,
  getRiskBgColor,
  type EnrichedFinding,
  type RiskLevel,
} from '@/lib/audit/context';
import type { AuditFlag, DepartmentScore } from '@/lib/types';
import KPI from '@/components/common/KPI';
import DepartmentHeatmap from '@/components/audit/DepartmentHeatmap';
import SuspicionCard from '@/components/audit/SuspicionCard';
import PatternBadge from '@/components/audit/PatternBadge';
import { getSeverityColor, getSeverityLabel, formatKRW, formatNumber, formatKeyLabel } from '@/lib/utils';
import RichText from '@/components/common/RichText';

// ── Real data types (from audit-results.json) ──────────────────────────
interface RealEvidenceContract {
  no: string;
  name: string;
  amount: number;
  vendor: string;
  date: string;
  method: string;
  reason?: string;
  url: string;
}

interface RealFinding {
  pattern_type: string;
  severity: string;
  suspicion_score: number;
  target_institution: string;
  summary: string;
  detail: Record<string, unknown>;
  evidence_contracts: RealEvidenceContract[];
  innocent_explanation: string;
  plain_explanation?: string;
  why_it_matters?: string;
  citizen_impact?: string;
  what_should_happen?: string;
  related_links?: { title: string; url: string; source: string }[];
  confidence?: number;
  confidence_label?: string;
  context_category?: string;
  context_reason?: string;
  verdict?: 'suspicious' | 'investigate' | 'legitimate';
  verdict_reason?: string;
  key_evidence?: string;
  priority_tier?: number;
}

interface InvestigationTarget {
  institution: string;
  priority_score: number;
  findings_count: number;
  pattern_types_count: number;
  pattern_types: string[];
  total_amount: number;
  critical_count: number;
  high_count: number;
  max_individual_score: number;
}

interface RealAuditData {
  timestamp: string;
  version?: string;
  contracts_analyzed: number;
  total_contracts_in_db?: number;
  findings_count: number;
  findings: RealFinding[];
  summary: {
    sole_source_ratio: number;
    unique_institutions: number;
    unique_vendors: number;
    total_amount_flagged?: number;
    estimated_waste?: number;
    severity_distribution?: Record<string, number>;
    confidence_distribution?: { very_high: number; high: number; medium: number; low: number };
  };
  pattern_counts?: Record<string, number>;
  investigation_priority?: InvestigationTarget[];
  methodology?: {
    patterns_count: number;
    pattern_types: string[];
    data_sources: Record<string, number>;
  };
}

// ── Props (seed/demo data) ─────────────────────────────────────────────
interface AuditPageClientProps {
  departmentScores: DepartmentScore[];
  auditFlags: AuditFlag[];
  kpis: {
    totalFlags: number;
    highSeverity: number;
    departmentsMonitored: number;
    avgScore: number;
  };
}

// ── Pattern category definitions ───────────────────────────────────────
type PatternCategory = string;

const PATTERN_CATEGORIES: {
  key: PatternCategory;
  label: string;
  description: string;
}[] = [
  {
    key: 'all',
    label: '전체',
    description: '모든 패턴을 한눈에 보기',
  },
  {
    key: 'ghost_company',
    label: '유령업체',
    description: '종업원 0-1명 업체가 수억원 규모의 정부 계약을 수주한 건',
  },
  {
    key: 'zero_competition',
    label: '경쟁 부재',
    description: '경쟁 입찰에 1개 업체만 참여하여 사실상 무경쟁 낙찰된 건',
  },
  {
    key: 'bid_rate_anomaly',
    label: '예정가격 유출 의심',
    description: '낙찰률이 98-99%+로 예정가격에 비정상적으로 근접한 낙찰 (감사원 중점 점검 항목)',
  },
  {
    key: 'new_company_big_win',
    label: '신생업체 고액수주',
    description: '나라장터 등록 1-2년 이내의 신생 업체가 대형 계약을 수주한 건',
  },
  {
    key: 'high_value_sole_source',
    label: '고액 수의계약',
    description: '1억원 이상의 계약이 경쟁 입찰 없이 수의계약으로 체결된 건',
  },
  {
    key: 'vendor_concentration',
    label: '업체 집중',
    description: '특정 업체가 한 기관의 계약을 독점적으로 수주하는 패턴',
  },
  {
    key: 'repeated_sole_source',
    label: '반복 수의계약',
    description: '거의 모든 계약을 경쟁 입찰 없이 수의계약으로 처리하는 패턴',
  },
  {
    key: 'contract_splitting',
    label: '계약 분할 의심',
    description: '수의계약 한도(2천만원) 근처 금액으로 반복 계약하여 입찰을 회피하는 패턴',
  },
  {
    key: 'low_bid_competition',
    label: '과소 경쟁',
    description: '2-3개사만 참여하는 경쟁 입찰에서 동일 업체가 반복 낙찰되는 패턴 (담합 의심)',
  },
  {
    key: 'yearend_budget_dump',
    label: '연말 예산소진',
    description: '11-12월에 계약이 월평균 대비 2.5배 이상 집중되는 패턴',
  },
  {
    key: 'related_companies',
    label: '동일주소/대표 업체',
    description: '같은 주소 또는 대표자인 업체가 동일 기관에서 복수 계약을 수주한 패턴',
  },
  {
    key: 'same_winner_repeat',
    label: '동일업체 반복수주',
    description: '한 업체가 같은 기관의 서로 다른 입찰에서 5건 이상 연속 낙찰된 패턴',
  },
  {
    key: 'amount_spike',
    label: '계약금액 급증',
    description: '동일 기관-업체 간 계약 금액이 전년 대비 3배 이상 급증한 패턴',
  },
  {
    key: 'bid_rigging',
    label: '입찰담합',
    description: '동일 업체 조합이 반복적으로 같은 입찰에 참여하는 들러리 입찰 패턴',
  },
  {
    key: 'contract_inflation',
    label: '계약변경 증액',
    description: '계약 체결 후 30% 이상 금액이 증액된 계약 (저가 입찰 후 변경 증액 수법)',
  },
  {
    key: 'cross_pattern',
    label: '복합 의심',
    description: '동일 기관-업체 조합에서 2가지 이상의 의심 패턴이 동시에 감지된 건 (가장 신뢰도 높은 발견)',
  },
  {
    key: 'systemic_risk',
    label: '체계적 위험',
    description: '한 기관에서 4가지 이상의 서로 다른 의심 패턴이 감지된 건 (기관 차원의 내부 통제 실패)',
  },
  {
    key: 'sanctioned_vendor',
    label: '제재 업체 재수주',
    description: '과거 부정당제재를 받았던 업체가 정부 계약을 다시 수주한 건',
  },
  {
    key: 'price_clustering',
    label: '투찰가 군집',
    description: '여러 업체의 투찰가격이 2% 이내로 비정상적으로 근접한 입찰 (담합 통계 증거)',
  },
  {
    key: 'network_collusion',
    label: '업체 네트워크',
    description: '주소/대표자 공유로 연결된 업체 네트워크가 동일 기관에서 복수 계약 수주',
  },
];

const RISK_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'CONCERN', label: '점검 권고' },
  { value: 'WATCH', label: '관심 관찰' },
  { value: 'LOW_RISK', label: '낮은 위험' },
  { value: 'NORMAL', label: '정상' },
];

// ── Utility: method badge color ──────────────────────────────────────
function getMethodBadge(method: string): { bg: string; label: string } {
  if (method.includes('수의')) return { bg: 'bg-amber-100 text-amber-700', label: method };
  if (method.includes('경쟁') || method.includes('일반')) return { bg: 'bg-emerald-100 text-emerald-700', label: method };
  if (method.includes('제한')) return { bg: 'bg-gray-100 text-gray-600', label: method };
  return { bg: 'bg-gray-100 text-gray-600', label: method };
}

// ── Utility: extract key stat for collapsed view ─────────────────────
function getKeyStat(finding: RealFinding | EnrichedFinding): string {
  const d = finding.detail;
  if (finding.pattern_type === 'vendor_concentration') {
    return (d['집중도'] as string) || `${d['업체_계약건수']}/${d['기관_전체건수']}건`;
  }
  if (finding.pattern_type === 'repeated_sole_source') {
    const ratio = d['수의계약_비율'] as string;
    if (ratio) return `${ratio} 수의계약`;
    const count = d['수의계약_건수'];
    const total = d['전체_건수'];
    if (count && total) return `${count}/${total}건 수의계약`;
    return '반복 수의계약';
  }
  if (finding.pattern_type === 'contract_splitting') {
    const cnt = d['한도근처_계약수'];
    return cnt ? `한도 근처 ${cnt}건` : '분할 의심';
  }
  return '';
}

// ── Utility: plain Korean explanation per finding ────────────────────
function getPlainExplanation(finding: RealFinding | EnrichedFinding): string {
  // Use rich plain_explanation from generate-audit.py if available
  if (finding.plain_explanation) return finding.plain_explanation;

  const d = finding.detail;
  const inst = finding.target_institution;

  if (finding.pattern_type === 'vendor_concentration') {
    const vendor = (d['업체'] as string) || '';
    const pct = (d['집중도'] as string) || '';
    const cnt = d['업체_계약건수'] || '';
    const total = d['기관_전체건수'] || '';
    return `${inst}에서 ${vendor}라는 업체가 전체 ${total}건 중 ${cnt}건(${pct})의 계약을 가져갔습니다. 한 업체가 이렇게 많은 비중을 차지하면, 다른 업체가 공정하게 참여할 기회가 있었는지 점검이 필요합니다.`;
  }
  if (finding.pattern_type === 'repeated_sole_source') {
    const ratio = (d['수의계약_비율'] as string) || '';
    return `${inst}이(가) 체결한 계약의 ${ratio || '대부분'}이 수의계약입니다. 수의계약 자체가 불법은 아니지만, 비율이 지나치게 높으면 경쟁 입찰 절차를 의도적으로 회피하고 있는 것은 아닌지 살펴볼 필요가 있습니다.`;
  }
  if (finding.pattern_type === 'contract_splitting') {
    const vendor = (d['업체'] as string) || '';
    const cnt = d['한도근처_계약수'] || '';
    return `${inst}에서 ${vendor}에게 수의계약 한도(2천만원) 바로 아래 금액으로 ${cnt}건을 발주했습니다. 원래 한 건으로 발주해야 할 사업을 여러 건으로 쪼개서 입찰을 피하려는 것 아닌지 의심됩니다.`;
  }
  return finding.summary;
}

// ══════════════════════════════════════════════════════════════════════
// Chevron SVG (shared)
// ══════════════════════════════════════════════════════════════════════
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ExternalLinkIcon (shared)
// ══════════════════════════════════════════════════════════════════════
function ExternalLinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ContractList — shared contract evidence table
// ══════════════════════════════════════════════════════════════════════
function ContractList({ contracts }: { contracts: RealEvidenceContract[] }) {
  if (contracts.length === 0) return null;

  return (
    <div className="space-y-2">
      {contracts.map((contract, ci) => {
        const badge = getMethodBadge(contract.method);
        return (
          <div key={`${contract.no}-${ci}`} className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h5 className="text-sm font-semibold text-gray-800 flex-1 leading-snug">
                {contract.name}
              </h5>
              <a
                href={contract.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-800 whitespace-nowrap flex-shrink-0 flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                나라장터에서 확인
                <ExternalLinkIcon />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-gray-400 block">금액</span>
                <p className="font-bold text-gray-900">{formatKRW(contract.amount)}</p>
              </div>
              <div>
                <span className="text-gray-400 block">업체</span>
                <p className="text-gray-700 font-medium">{contract.vendor}</p>
              </div>
              <div>
                <span className="text-gray-400 block">계약일</span>
                <p className="text-gray-700">{contract.date}</p>
              </div>
              <div>
                <span className="text-gray-400 block">계약 방식</span>
                <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            {contract.reason && (
              <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded px-3 py-1.5">
                <span className="text-gray-400">법적 근거: </span>
                {contract.reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DetailTable — raw detail key-value pairs
// ══════════════════════════════════════════════════════════════════════
function DetailTable({ detail }: { detail: Record<string, unknown> }) {
  const entries = Object.entries(detail);
  if (entries.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4 py-1 border-b border-gray-100 last:border-0">
          <span className="text-gray-500">{formatKeyLabel(key)}</span>
          <span className="font-medium text-gray-800 text-right">
            {typeof value === 'number' ? formatNumber(value, key) :
             typeof value === 'object' ? JSON.stringify(value) :
             String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FindingCard — enriched expandable card with contextual analysis
// Full-feature card with all 4 sections
// ══════════════════════════════════════════════════════════════════════
function FindingCard({ finding }: { finding: EnrichedFinding }) {
  const riskColor = getRiskColor(finding.risk_level);
  const riskBg = getRiskBgColor(finding.risk_level);
  const keyStat = getKeyStat(finding);
  const uniqueContracts = finding.deduplicated_contracts;

  return (
    <a
      href={finding.id ? `/audit/${finding.id}` : undefined}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md group"
    >
      {/* ── Card header — clicks through to detail page ── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {/* Risk level badge */}
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: riskBg, color: riskColor }}
              >
                {finding.risk_label}
              </span>
              {keyStat && (
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {keyStat}
                </span>
              )}
              {/* Score change indicator */}
              {finding.adjusted_score < finding.raw_score - 10 && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {finding.raw_score} &rarr; {finding.adjusted_score} (맥락 보정)
                </span>
              )}
            </div>

            <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug group-hover:text-rose-700 transition-colors">
              {finding.target_institution}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {finding.contextual_analysis}
            </p>

            {/* Contract preview */}
            {uniqueContracts.length > 0 && (
              <div className="mt-2 text-[11px] text-gray-400">
                <span className="font-medium text-gray-500">{uniqueContracts[0].name}</span>
                {uniqueContracts.length > 1 && <span> 외 {uniqueContracts.length - 1}건</span>}
              </div>
            )}
          </div>

          {/* Right: adjusted score + arrow */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: riskColor }}>
                {finding.adjusted_score}
              </div>
              <div className="text-[10px] text-gray-400">{finding.risk_label}</div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SoleSourceExplainer — expandable 수의계약 설명 card
// ══════════════════════════════════════════════════════════════════════
function SoleSourceExplainer({ ratio }: { ratio: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card mb-8 p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 sm:px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-gray-900">수의계약이란?</h2>
            <p className="text-xs text-gray-500 mt-0.5">분석된 계약의 {ratio}%가 수의계약 -- 이것이 왜 중요한지 알아보세요</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 sm:px-6 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {/* Definition */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">수의계약이란?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>경쟁 입찰 없이</strong> 특정 업체와 직접 계약하는 방식입니다.
              일반적으로 정부 조달은 공개 경쟁 입찰을 원칙으로 하지만, 법에서 정한 예외 사유에 해당하면 수의계약이 가능합니다.
            </p>
          </div>

          {/* When it's legal */}
          <div className="bg-emerald-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-emerald-800 mb-2">수의계약이 합법인 경우</h3>
            <ul className="text-xs text-emerald-700 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 shrink-0 mt-0.5">&#x2022;</span>
                <span><strong>추정가격 2천만원 이하</strong> (지방계약법 제25조, 국가계약법 시행령 제26조)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 shrink-0 mt-0.5">&#x2022;</span>
                <span>특수한 설비, 기술이 필요한 경우 (특정 업체만 가능)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 shrink-0 mt-0.5">&#x2022;</span>
                <span>긴급한 재해 복구 등 시급한 상황</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 shrink-0 mt-0.5">&#x2022;</span>
                <span>입찰에 참여한 업체가 없거나 유찰된 경우</span>
              </li>
            </ul>
          </div>

          {/* Why the number matters */}
          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-amber-800 mb-1">{ratio}%는 높은 수치인가?</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              분석된 3,200건의 계약 중 약 {Math.round(3200 * ratio / 100).toLocaleString()}건이 수의계약입니다.
              소액 계약이 많은 지방자치단체/교육기관 특성상 수의계약 비율이 높을 수 있지만,
              개별 기관 단위로 100%에 가까운 수의계약 비율은 경쟁 원리가 작동하지 않을 가능성을 시사합니다.
            </p>
          </div>

          {/* What this analysis does */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">이 분석이 찾는 것</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              개별 수의계약의 적법성을 판단하는 것이 아니라, <strong>기관 단위의 패턴</strong>을 분석합니다.
              특정 업체에 대한 반복 발주, 한도 금액 근처 계약 반복, 업체 집중도 이상 등
              통계적으로 이상한 패턴을 탐지하여 검토가 필요한 사례를 선별합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MethodologyFooter — shared methodology section
// ══════════════════════════════════════════════════════════════════════
function MethodologyFooter({ timestamp }: { timestamp?: string }) {
  return (
    <div className="mt-10 border-t border-gray-100 pt-8 pb-4">
      <h2 className="font-bold text-sm text-gray-700 mb-4">분석 방법론</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            <h3 className="text-xs font-bold text-gray-700">데이터 출처</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            나라장터(조달청) 공공데이터 API에서 수집한 실제 계약 데이터.
            {timestamp && ` ${timestamp} 기준.`}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            <h3 className="text-xs font-bold text-gray-700">2단계 분석</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            1단계: 통계적 패턴 탐지 (업체 집중, 수의계약 반복, 금액 분포). 2단계: 맥락 분석 (상품 특성, 경쟁 입찰 여부, 법적 근거, 기관 특성, 금액 규모)으로 점수를 보정합니다.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="text-xs font-bold text-gray-700">한계 및 원칙</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            의심 수준을 제시하며 의도는 판단하지 않습니다.
            에너지/교과서/연구장비 등 구조적으로 공급업체가 한정된 분야는 자동 감점 처리합니다.
            경쟁입찰로 동일 업체가 수주한 경우도 별도 가중됩니다.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-gray-400">
        <a
          href="https://www.g2b.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors flex items-center gap-1"
        >
          나라장터 <ExternalLinkIcon size={10} />
        </a>
        <span>|</span>
        <a
          href="https://www.bai.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors flex items-center gap-1"
        >
          감사원 <ExternalLinkIcon size={10} />
        </a>
        <span>|</span>
        <span>AI 분석: 통계적 패턴 탐지 (의심 &#8800; 확정)</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Main page component
// ══════════════════════════════════════════════════════════════════════
export default function AuditPageClientWrapper(props: AuditPageClientProps) {
  return (
    <AuditErrorBoundary>
      <AuditPageClientInner {...props} />
    </AuditErrorBoundary>
  );
}

function AuditPageClientInner({
  departmentScores,
  auditFlags,
  kpis,
}: AuditPageClientProps) {
  const { isDemo } = useDataMode();

  // Real data state
  const [realData, setRealData] = useState<RealAuditData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeCategory, setActiveCategory] = useState<PatternCategory>('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'suspicious' | 'investigate'>('suspicious');
  const [tierFilter, setTierFilter] = useState<'all' | '1' | '2'>('all');

  // Fetch real data on mount (only in live mode)
  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/data/audit-results.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — ${r.url}`);
        return r.json();
      })
      .then((data: RealAuditData) => {
        setRealData(data);
        setLoading(false);
      })
      .catch(() => {
        // Fetch failed (deployed server may not serve static JSON)
        // Fall back to building data from the API route
        fetch('/api/audit/contracts')
          .then(r => r.ok ? r.json() : null)
          .then(apiData => {
            if (apiData?.items?.length > 0) {
              // Minimal live data from API
              setRealData({
                timestamp: new Date().toISOString(),
                contracts_analyzed: apiData.items.length,
                findings_count: 0,
                findings: [],
                summary: { sole_source_ratio: 0, unique_institutions: 0, unique_vendors: 0 },
              });
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [isDemo]);

  // ── Enriched data computations ──
  const enrichedFindings = useMemo(() => {
    const raw = realData?.findings ?? [];
    if (raw.length === 0) return [];
    try {
      return enrichAllFindings(raw);
    } catch (e) {
      console.error('[Audit] enrichAllFindings crashed:', e);
      return [];
    }
  }, [realData]);

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['all'] = enrichedFindings.length;
    for (const cat of PATTERN_CATEGORIES) {
      if (cat.key === 'all') continue;
      counts[cat.key] = enrichedFindings.filter(f => f.pattern_type === cat.key).length;
    }
    return counts;
  }, [enrichedFindings]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return enrichedFindings.filter(f => {
      if (activeCategory !== 'all' && f.pattern_type !== activeCategory) return false;
      if (severityFilter !== 'all' && f.risk_level !== severityFilter) return false;
      if (!(verdictFilter === 'all' || f.verdict === verdictFilter || (verdictFilter === 'suspicious' && !f.verdict))) return false;
      if (tierFilter !== 'all' && String((f as RealFinding).priority_tier ?? 3) !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesInst = f.target_institution.toLowerCase().includes(q);
        const matchesSummary = f.summary.toLowerCase().includes(q);
        const matchesContext = f.contextual_analysis.toLowerCase().includes(q);
        const matchesVendor = Object.values(f.detail).some(
          v => typeof v === 'string' && v.toLowerCase().includes(q)
        );
        if (!matchesInst && !matchesSummary && !matchesContext && !matchesVendor) return false;
      }
      return true;
    });
  }, [enrichedFindings, activeCategory, severityFilter, searchQuery]);

  // Risk level breakdown for active category
  const riskBreakdown = useMemo(() => {
    const inCategory = activeCategory === 'all'
      ? enrichedFindings
      : enrichedFindings.filter(f => f.pattern_type === activeCategory);
    return {
      total: inCategory.length,
      concern: inCategory.filter(f => f.risk_level === 'CONCERN').length,
      watch: inCategory.filter(f => f.risk_level === 'WATCH').length,
      low_risk: inCategory.filter(f => f.risk_level === 'LOW_RISK').length,
      normal: inCategory.filter(f => f.risk_level === 'NORMAL').length,
    };
  }, [enrichedFindings, activeCategory]);

  // Reset filters on mode change
  useEffect(() => {
    setActiveCategory('all');
    setSeverityFilter('all');
    setSearchQuery('');
  }, [isDemo]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSeverityFilter('all');
  }, []);

  // ── Computed: department scores for heatmap (must be before any early return) ──
  const departmentScoresForHeatmap = useMemo((): DepartmentScore[] => {
    const scoreMap: Record<string, { max: number; count: number }> = {};
    for (const f of enrichedFindings) {
      const inst = f.target_institution;
      if (!scoreMap[inst]) scoreMap[inst] = { max: 0, count: 0 };
      scoreMap[inst].max = Math.max(scoreMap[inst].max, f.adjusted_score);
      scoreMap[inst].count++;
    }
    return Object.entries(scoreMap)
      .map(([department, { max, count }]) => ({
        department,
        suspicion_score: max,
        flag_count: count,
      }))
      .sort((a, b) => b.suspicion_score - a.suspicion_score);
  }, [enrichedFindings]);

  const liveKpis = useMemo(() => {
    const concern = enrichedFindings.filter(f => f.risk_level === 'CONCERN').length;
    const avgScore = enrichedFindings.length > 0
      ? Math.round(enrichedFindings.reduce((s, f) => s + f.adjusted_score, 0) / enrichedFindings.length)
      : 0;
    return {
      totalFlags: enrichedFindings.length,
      highSeverity: concern,
      departmentsMonitored: new Set(enrichedFindings.map(f => f.target_institution)).size,
      avgScore,
    };
  }, [enrichedFindings]);

  const departments = useMemo(() => {
    return Array.from(new Set(enrichedFindings.map(f => f.target_institution))).sort();
  }, [enrichedFindings]);

  // ══════════════════════════════════════════════════════════════════
  // DEMO MODE — seed data fallback (only when no live data)
  // ══════════════════════════════════════════════════════════════════
  if (isDemo && !realData) {
    return (
      <div className="container-page py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI 감사관</h1>
              <p className="text-sm text-gray-500">
                나라장터 공개 계약 데이터에서 AI가 의심 패턴을 자동으로 탐지합니다.
              </p>
            </div>
          </div>
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            <strong>의심 패턴 &#8800; 비리 확정.</strong> 모든 기관에 동일한 기준이 적용됩니다.
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <KPI label="탐지된 플래그" value={`${kpis.totalFlags}건`} source="AI 자동 탐지" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>} />
          <KPI label="높은 심각도" value={`${kpis.highSeverity}건`} source="HIGH 등급" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>} />
          <KPI label="모니터링 부처" value={`${kpis.departmentsMonitored}개`} source="중앙행정기관" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/></svg>} />
          <KPI label="평균 의심 점수" value={`${kpis.avgScore}`} source="0-100 스케일" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
        </div>

        {/* Heatmap */}
        <div className="card mb-6">
          <h2 className="font-bold text-lg mb-1">부처별 의심 점수 히트맵</h2>
          <p className="text-xs text-gray-400 mb-4">색상이 진할수록 의심 점수가 높음</p>
          <DepartmentHeatmap scores={departmentScores} />
        </div>

        {/* Flags */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">최근 감지된 패턴</h2>
          <div className="space-y-3">
            {auditFlags.map(flag => (
              <SuspicionCard key={flag.id} flag={flag} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // LIVE MODE — real 나라장터 data
  // ══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="container-page py-6 sm:py-8">
        <div className="text-center py-24 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full mx-auto mb-4" />
          <p className="text-sm">실제 나라장터 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── Live mode rendering ──
  return (
    <div className="container-page py-6 sm:py-8">

      {/* ═══ 1. HEADER ═══ */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI 감사관</h1>
            <p className="text-sm text-gray-500">
              나라장터 공개 계약 데이터에서 AI가 의심 패턴을 자동으로 탐지합니다.
            </p>
          </div>
        </div>
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
          이 분석은 AI 기반 자동 탐지 결과이며, <strong>의심 패턴</strong>일 뿐 비리 확정이 아닙니다.
          모든 기관에 동일한 기준이 적용됩니다. 각 발견에는 <strong>맥락 분석</strong>(상품 특성, 경쟁 입찰 여부, 법적 근거)이 반영됩니다.
        </div>
      </div>

      {/* ═══ 2. KPI CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPI label="분석 계약" value={`${(realData?.contracts_analyzed ?? 0).toLocaleString()}건`} source="나라장터" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>} />
        <KPI label="점검 권고" value={`${liveKpis.highSeverity}건`} source="맥락 분석 반영" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>} />
        <KPI label="의심 금액" value={realData?.summary?.total_amount_flagged ? formatKRW(realData?.summary?.total_amount_flagged ?? 0) : `${liveKpis.departmentsMonitored}개 기관`} source={realData?.summary?.total_amount_flagged ? '관련 계약 총액' : '분석 대상 기관'} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
        <KPI label="탐지 패턴" value={`${Object.keys((realData ?? {} as Partial<RealAuditData>).pattern_counts ?? {}).length}종`} source={`${(realData ?? {} as Partial<RealAuditData>).methodology?.patterns_count ?? 20}개 알고리즘`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
      </div>

      {/* ═══ 2.5 INVESTIGATION PRIORITY (Top 5) ═══ */}
      {(realData?.investigation_priority ?? []).length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <h2 className="font-bold text-lg text-gray-900">수사 우선순위 TOP 5</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            AI가 복합 분석한 결과, 가장 우선적으로 점검이 필요한 기관 순위
          </p>
          <div className="space-y-2">
            {(realData?.investigation_priority ?? []).slice(0, 5).map((target, idx) => (
              <button
                key={target.institution}
                type="button"
                onClick={() => setSearchQuery(target.institution)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-rose-50 transition-colors text-left group"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  idx === 0 ? 'bg-rose-600 text-white' :
                  idx === 1 ? 'bg-rose-500 text-white' :
                  idx === 2 ? 'bg-rose-400 text-white' :
                  'bg-gray-300 text-white'
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-rose-700">
                      {target.institution}
                    </span>
                    {target.critical_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium shrink-0">
                        심각 {target.critical_count}건
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex gap-3">
                    <span>{target.pattern_types_count}개 패턴</span>
                    <span>{target.findings_count}건 발견</span>
                    <span>{formatKRW(target.total_amount)}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 tabular-nums shrink-0">
                  위험도 {target.priority_score.toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 3. DEPARTMENT HEATMAP ═══ */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">기관별 리스크 현황</h2>
        <p className="text-xs text-gray-400 mb-4">
          리스크 등급별 기관 분포 · 기관을 클릭하면 해당 플래그를 필터링합니다
        </p>
        <DepartmentHeatmap
          scores={departmentScoresForHeatmap}
          onDepartmentClick={(dept) => {
            setSearchQuery(dept === searchQuery ? '' : dept);
          }}
        />
      </div>

      {/* ═══ 4. SEARCH BAR ═══ */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="기관 또는 업체명 검색..."
            className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        {/* Risk level filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600"
        >
          {RISK_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {(searchQuery.trim() || severityFilter !== 'all') && (
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap">
            초기화
          </button>
        )}
      </div>

      {/* Verdict filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          { key: 'suspicious', label: '🔴 의심 확실', },
          { key: 'investigate', label: '🟡 조사 필요', },
          { key: 'all', label: '전체 보기', },
        ] as const).map(opt => (
          <button
            key={opt.key}
            onClick={() => setVerdictFilter(opt.key)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: verdictFilter === opt.key ? 'var(--apple-blue)' : 'rgba(60,60,67,0.18)',
              background: verdictFilter === opt.key ? 'rgba(0,122,255,0.08)' : 'transparent',
              color: verdictFilter === opt.key ? 'var(--apple-blue)' : 'var(--apple-gray-1)',
              fontSize: 13,
              fontWeight: verdictFilter === opt.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Priority tier filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--apple-gray-1)', fontWeight: 500 }}>우선순위:</span>
        {([
          { key: '1', label: '🔥 Tier 1 — 고위험', sub: '고액+의심확실' },
          { key: '2', label: '⚠️ Tier 2 — 의심', sub: '의심확실' },
          { key: 'all', label: '전체', sub: '' },
        ] as const).map(opt => (
          <button
            key={opt.key}
            onClick={() => setTierFilter(opt.key)}
            title={opt.sub}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: tierFilter === opt.key ? 'var(--apple-orange)' : 'rgba(60,60,67,0.18)',
              background: tierFilter === opt.key ? 'rgba(255,149,0,0.10)' : 'transparent',
              color: tierFilter === opt.key ? 'var(--apple-orange)' : 'var(--apple-gray-1)',
              fontSize: 13,
              fontWeight: tierFilter === opt.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ═══ 5. FINDINGS GROUPED BY PATTERN ═══ */}
      {(() => {
        // Group by INSTITUTION — each institution shows all its findings
        const byInst: Record<string, typeof filteredFindings> = {};
        for (const f of filteredFindings) {
          const inst = f.target_institution;
          if (!byInst[inst]) byInst[inst] = [];
          byInst[inst].push(f);
        }
        // Sort institutions by max score (most suspicious first)
        const sortedInsts = Object.entries(byInst)
          .sort((a, b) => {
            const maxA = Math.max(...a[1].map(f => f.adjusted_score));
            const maxB = Math.max(...b[1].map(f => f.adjusted_score));
            return maxB - maxA;
          });

        if (sortedInsts.length === 0) {
          return (
            <div className="card text-center py-12 text-gray-400">
              <p className="text-sm">필터 조건에 맞는 기관이 없습니다.</p>
              <button onClick={resetFilters} className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">
                전체 초기화
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {sortedInsts.map(([inst, instFindings]) => {
              const maxScore = Math.max(...instFindings.map(f => f.adjusted_score));
              const maxRisk = instFindings.reduce((best, f) =>
                f.adjusted_score > best.adjusted_score ? f : best, instFindings[0]);
              const riskColor = getRiskColor(maxRisk.risk_level);
              const patternTypes = Array.from(new Set(instFindings.map(f => f.pattern_type)));
              const totalAmt = instFindings.reduce((sum, f) =>
                sum + f.deduplicated_contracts.reduce((s, c) => s + (c.amount || 0), 0), 0);

              return (
                <div key={inst} className="card overflow-hidden border-l-4" style={{ borderLeftColor: riskColor }}>
                  {/* Institution header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900">{inst}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        {patternTypes.map(pt => (
                          <PatternBadge key={pt} pattern={pt} size="sm" />
                        ))}
                      </div>
                      {totalAmt > 0 && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          관련 계약 총액: {formatKRW(totalAmt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold" style={{ color: riskColor }}>
                        {maxScore}
                      </div>
                      <div className="text-[10px] text-gray-400">{maxRisk.risk_label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{instFindings.length}건 탐지</div>
                    </div>
                  </div>

                  {/* Each finding as a clickable card */}
                  <div className="space-y-2">
                    {instFindings
                      .sort((a, b) => b.adjusted_score - a.adjusted_score)
                      .map((finding, i) => (
                      <a
                        key={`${finding.pattern_type}-${i}`}
                        href={finding.id ? `/audit/${finding.id}` : undefined}
                        className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: getRiskBgColor(finding.risk_level), color: getRiskColor(finding.risk_level) }}
                              >
                                {finding.risk_label}
                              </span>
                              <PatternBadge pattern={finding.pattern_type} size="sm" />
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {finding.summary}
                            </p>
                            {finding.deduplicated_contracts.length > 0 && (
                              <p className="text-[10px] text-gray-400 mt-1 truncate">
                                {finding.deduplicated_contracts[0].name}
                                {finding.deduplicated_contracts.length > 1 && ` 외 ${finding.deduplicated_contracts.length - 1}건`}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-lg font-bold" style={{ color: getRiskColor(finding.risk_level) }}>
                              {finding.adjusted_score}
                            </span>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ═══ 6. FOOTER NOTE ═══ */}
      <p className="text-[10px] text-gray-300 mt-6 text-center">
        위험도: 0-14 정상 · 15-34 낮은 위험 · 35-59 관심 관찰 · 60-100 점검 권고
        · 출처: 나라장터(조달청) 계약 데이터 · 맥락 분석(상품 특성, 경쟁 입찰, 법적 근거) 반영
      </p>
    </div>
  );
}
