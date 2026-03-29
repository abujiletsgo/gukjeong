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
}

interface RealAuditData {
  timestamp: string;
  contracts_analyzed: number;
  total_contracts_in_db?: number;
  findings_count: number;
  findings: RealFinding[];
  summary: {
    sole_source_ratio: number;
    unique_institutions: number;
    unique_vendors: number;
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
type PatternCategory = 'all' | 'high_value_sole_source' | 'vendor_concentration' | 'repeated_sole_source' | 'contract_splitting';

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
  const [expanded, setExpanded] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const riskColor = getRiskColor(finding.risk_level);
  const riskBg = getRiskBgColor(finding.risk_level);
  const keyStat = getKeyStat(finding);
  const uniqueContracts = finding.deduplicated_contracts;
  const hasMitigation = finding.mitigating_factors.length > 0;
  const hasAggravation = finding.aggravating_factors.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 sm:p-5"
      >
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
              <PatternBadge pattern={finding.pattern_type} size="sm" />
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

            <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
              {finding.target_institution}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {finding.contextual_analysis}
            </p>
          </div>

          {/* Right: adjusted score + chevron */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: riskColor }}>
                {finding.adjusted_score}
              </div>
              <div className="text-[10px] text-gray-400">{finding.risk_label}</div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 sm:px-5 pb-5 pt-4 space-y-4">

          {/* Section 1: 쉽게 말하면 — plain explanation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              쉽게 말하면
            </h4>
            <p className="text-sm text-gray-800 leading-relaxed">
              {getPlainExplanation(finding)}
            </p>
          </div>

          {/* Contextual analysis (from enrichment engine) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">맥락 분석</h4>
            <p className="text-sm text-gray-800 leading-relaxed">
              {finding.contextual_analysis}
            </p>
          </div>

          {/* Data quality warnings */}
          {(finding.data_quality.duplicate_contracts > 0 || finding.data_quality.small_sample) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <div className="text-xs text-blue-700 leading-relaxed">
                {finding.data_quality.duplicate_contracts > 0 && (
                  <p>동일 계약번호 {finding.data_quality.duplicate_contracts}건이 중복 집계되어 보정했습니다. (실제 고유 계약: {finding.data_quality.unique_contracts}건)</p>
                )}
                {finding.data_quality.small_sample && (
                  <p className={finding.data_quality.duplicate_contracts > 0 ? 'mt-1' : ''}>
                    표본이 {finding.data_quality.unique_contracts}건으로 적어 통계적 신뢰도가 제한적입니다.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section 2: 비리가 아닐 수 있는 이유 — innocent explanation (green box) */}
          {finding.innocent_explanation && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                비리가 아닐 수 있는 이유
              </h4>
              <p className="text-sm text-emerald-700 leading-relaxed">
                {finding.innocent_explanation}
              </p>
            </div>
          )}

          {/* Mitigating Factors (정상 사유) */}
          {hasMitigation && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                정상적 사유 ({finding.mitigating_factors.length}건 확인)
              </h4>
              <div className="space-y-3">
                {finding.mitigating_factors.map((factor) => (
                  <div key={factor.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-emerald-800">{factor.label}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                        -{factor.score_reduction}점
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">{factor.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aggravating Factors (주의 요인) */}
          {hasAggravation && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mb-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                주의 요인 ({finding.aggravating_factors.length}건)
              </h4>
              <div className="space-y-3">
                {finding.aggravating_factors.map((factor) => (
                  <div key={factor.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-rose-800">{factor.label}</span>
                      <span className="text-[10px] text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                        +{factor.score_increase}점
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">{factor.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 확인 포인트 (What to watch for) */}
          {finding.what_to_watch_for && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                이것까지 확인하면 더 정확합니다
              </h4>
              <ul className="text-xs text-amber-800 space-y-1.5 leading-relaxed">
                {finding.what_to_watch_for.split('\n').filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 shrink-0 mt-0.5">&#x2022;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 3: 실제 계약 내역 (Collapsible) */}
          {uniqueContracts.length > 0 && (
            <div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setContractsOpen(!contractsOpen); }}
                className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                실제 계약 내역 ({uniqueContracts.length}건)
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${contractsOpen ? 'rotate-180' : ''}`} />
              </button>

              {contractsOpen && (
                <div className="mt-3">
                  <ContractList contracts={uniqueContracts} />
                </div>
              )}
            </div>
          )}

          {/* Section 4: 상세 데이터 (collapsible) */}
          {Object.keys(finding.detail).length > 0 && (
            <div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDetailOpen(!detailOpen); }}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${detailOpen ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                상세 데이터
              </button>

              {detailOpen && (
                <div className="mt-2">
                  <DetailTable detail={finding.detail} />
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center pt-1">
            AI 분석은 참고용입니다. 의심 패턴 &ne; 비리 확정. 모든 기관에 동일한 기준이 적용됩니다.
          </p>
        </div>
      )}
    </div>
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
  // DEMO MODE — existing seed data rendering
  // ══════════════════════════════════════════════════════════════════
  if (isDemo) {
    return (
      <div className="container-page py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI 감사관</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">데모</span>
              </div>
              <p className="text-sm text-gray-500">
                나라장터 공개 계약 데이터에서 AI가 의심 패턴을 자동으로 탐지합니다.
              </p>
            </div>
          </div>
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            <strong>의심 패턴 &#8800; 비리 확정.</strong> 모든 부처에 동일한 기준이 적용됩니다.
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
        <KPI label="분석 기관" value={`${liveKpis.departmentsMonitored}개`} source="조달청" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/></svg>} />
        <KPI label="평균 의심 점수" value={`${liveKpis.avgScore}`} source="0-100 (맥락 보정)" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
      </div>

      {/* ═══ 3. DEPARTMENT HEATMAP ═══ */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">기관별 의심 점수 히트맵</h2>
        <p className="text-xs text-gray-400 mb-4">
          색상이 진할수록 의심 점수가 높음 · 클릭하면 해당 기관의 플래그를 필터링합니다
        </p>
        <DepartmentHeatmap
          scores={departmentScoresForHeatmap}
          onDepartmentClick={(dept) => {
            setSearchQuery(dept === searchQuery ? '' : dept);
          }}
        />
        <div className="flex items-center gap-6 mt-4 text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>0-14 정상</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>15-34 낮은 위험</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>35-59 관심 관찰</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span>60+ 점검 권고</span>
          </div>
        </div>
      </div>

      {/* ═══ 4. FILTERS + FINDING LIST ═══ */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">감지된 패턴</h2>
          <div className="flex flex-wrap gap-2">
            {/* Pattern filter */}
            <select
              value={activeCategory}
              onChange={(e) => { setActiveCategory(e.target.value as PatternCategory); setSeverityFilter('all'); }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              {PATTERN_CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label} ({categoryCounts[cat.key] || 0})</option>
              ))}
            </select>

            {/* Risk level filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              {RISK_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="기관/업체 검색..."
                className="text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 bg-white text-gray-600 placeholder:text-gray-400 w-40 focus:outline-none focus:ring-1 focus:ring-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Active filter tags */}
        {(activeCategory !== 'all' || severityFilter !== 'all' || searchQuery.trim()) && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">필터:</span>
            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
              >
                {PATTERN_CATEGORIES.find(c => c.key === activeCategory)?.label} &times;
              </button>
            )}
            {severityFilter !== 'all' && (
              <button
                onClick={() => setSeverityFilter('all')}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
              >
                {RISK_FILTER_OPTIONS.find(o => o.value === severityFilter)?.label} &times;
              </button>
            )}
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
              >
                &quot;{searchQuery.trim()}&quot; &times;
              </button>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              전체 초기화
            </button>
          </div>
        )}

        {/* Finding cards */}
        {filteredFindings.length > 0 ? (
          <div className="space-y-3">
            {filteredFindings.map((finding, i) => (
              <FindingCard
                key={`${finding.pattern_type}-${finding.target_institution}-${i}`}
                finding={finding}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">필터 조건에 맞는 패턴이 없습니다.</p>
            <button
              onClick={resetFilters}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              전체 초기화
            </button>
          </div>
        )}
      </div>

      {/* ═══ 5. PATTERN EXPLANATION GRID ═══ */}
      <div className="card mt-6">
        <h2 className="font-bold text-lg mb-4">감사 패턴 설명</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { pattern: 'all', desc: '1억원 이상의 계약이 경쟁 입찰 없이 수의계약으로 체결', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
            { pattern: 'vendor_concentration', desc: '동일 업체 계약 30% 이상 점유 (맥락 보정 적용)', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg> },
            { pattern: 'repeated_sole_source', desc: '동일 업체+기관에 수의계약 3회 이상 반복', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
            { pattern: 'contract_splitting', desc: '수의계약 한도(2천만원) 직하 금액으로 반복 계약', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M14 14l7 7M3 8V3h5M10 10L3 3"/></svg> },
            { pattern: 'yearend_spike', desc: 'Q4 지출이 연간의 40% 초과 (연말 밀어내기)', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg> },
            { pattern: 'inflated_pricing', desc: '유사 계약 대비 30% 이상 고가 계약', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
          ].map(item => (
            <div key={item.pattern} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="shrink-0 mt-0.5">{item.icon}</div>
              <div className="flex-1">
                <PatternBadge pattern={item.pattern} size="sm" />
                <span className="text-xs text-gray-600 block mt-1">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 mt-4">
          위험도: 0-14 정상 · 15-34 낮은 위험 · 35-59 관심 관찰 · 60-100 점검 권고
          · 출처: 나라장터(조달청) 계약 데이터 · 맥락 분석(상품 특성, 경쟁 입찰, 법적 근거) 반영
        </p>
      </div>
    </div>
  );
}
