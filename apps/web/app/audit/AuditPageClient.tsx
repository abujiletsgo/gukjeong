'use client';
// AI 감사관 대시보드 — 클라이언트 컴포넌트
// Live mode: /data/audit-results.json (76 real findings from 나라장터)
// Demo mode: seed data passed as props
import { useState, useEffect, useMemo } from 'react';
import { useDataMode } from '@/lib/context/DataModeContext';
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
type PatternCategory = 'vendor_concentration' | 'repeated_sole_source' | 'contract_splitting';

const PATTERN_CATEGORIES: {
  key: PatternCategory;
  label: string;
  description: string;
}[] = [
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

const SEVERITY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
];

// ── Utility: method color ──────────────────────────────────────────────
function getMethodColor(method: string): string {
  if (method.includes('수의')) return 'bg-rose-100 text-rose-700';
  if (method.includes('일반')) return 'bg-emerald-100 text-emerald-700';
  if (method.includes('제한')) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
}

// ── Utility: extract key stat for collapsed view ───────────────────────
function getKeyStat(finding: RealFinding): string {
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

// ── Utility: plain Korean explanation per finding ──────────────────────
function getPlainExplanation(finding: RealFinding): string {
  const d = finding.detail;
  const inst = finding.target_institution;

  if (finding.pattern_type === 'vendor_concentration') {
    const vendor = d['업체'] as string || '';
    const pct = d['집중도'] as string || '';
    const cnt = d['업체_계약건수'] || '';
    const total = d['기관_전체건수'] || '';
    return `${inst}에서 ${vendor}라는 업체가 전체 ${total}건 중 ${cnt}건(${pct})의 계약을 가져갔습니다. 한 업체가 이렇게 많은 비중을 차지하면, 다른 업체가 공정하게 참여할 기회가 있었는지 점검이 필요합니다.`;
  }
  if (finding.pattern_type === 'repeated_sole_source') {
    const ratio = d['수의계약_비율'] as string || '';
    return `${inst}이(가) 체결한 계약의 ${ratio || '대부분'}이 수의계약입니다. 수의계약 자체가 불법은 아니지만, 비율이 지나치게 높으면 경쟁 입찰 절차를 의도적으로 회피하고 있는 것은 아닌지 살펴볼 필요가 있습니다.`;
  }
  if (finding.pattern_type === 'contract_splitting') {
    const vendor = d['업체'] as string || '';
    const cnt = d['한도근처_계약수'] || '';
    return `${inst}에서 ${vendor}에게 수의계약 한도(2천만원) 바로 아래 금액으로 ${cnt}건을 발주했습니다. 원래 한 건으로 발주해야 할 사업을 여러 건으로 쪼개서 입찰을 피하려는 것 아닌지 의심됩니다.`;
  }
  return finding.summary;
}

// ══════════════════════════════════════════════════════════════════════
// FindingCard — expandable card for each real finding
// ══════════════════════════════════════════════════════════════════════
function FindingCard({ finding }: { finding: RealFinding }) {
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const severityColor = getSeverityColor(finding.suspicion_score);
  const keyStat = getKeyStat(finding);

  // Deduplicate evidence contracts by contract number
  const uniqueContracts = useMemo(() => {
    return Array.from(
      new Map(finding.evidence_contracts.map(c => [c.no, c])).values()
    );
  }, [finding.evidence_contracts]);

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      {/* ── Collapsed header (always visible) ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: badge + institution + summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {/* Severity badge */}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${severityColor}15`,
                  color: severityColor,
                }}
              >
                {finding.severity === 'HIGH' ? '높음' : '보통'}
              </span>
              <PatternBadge pattern={finding.pattern_type} size="sm" />
              {keyStat && (
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {keyStat}
                </span>
              )}
            </div>

            <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
              {finding.target_institution}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {finding.summary}
            </p>
          </div>

          {/* Right: score + chevron */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: severityColor }}>
                {finding.suspicion_score}
              </div>
              <div className="text-[10px] text-gray-400">{getSeverityLabel(finding.suspicion_score)}</div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 sm:px-5 pb-5 pt-4 space-y-5">

          {/* Section A: 쉽게 말하면 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">쉽게 말하면</h4>
            <p className="text-sm text-gray-800 leading-relaxed">
              {getPlainExplanation(finding)}
            </p>
          </div>

          {/* Section B: 비리가 아닐 수 있는 이유 */}
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

          <p className="text-[10px] text-gray-400 text-center">
            양쪽 관점을 모두 고려하여 판단해 주세요.
          </p>

          {/* Section C: 실제 계약 내역 */}
          {uniqueContracts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                실제 계약 내역
                <span className="text-gray-400 font-normal">({uniqueContracts.length}건)</span>
              </h4>

              <div className="space-y-2">
                {uniqueContracts.map((contract, ci) => (
                  <div key={`${contract.no}-${ci}`} className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4">
                    {/* Contract name + link */}
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>

                    {/* Contract details grid */}
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
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${getMethodColor(contract.method)}`}>
                          {contract.method}
                        </span>
                      </div>
                    </div>

                    {/* Legal reason */}
                    {contract.reason && (
                      <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded px-3 py-1.5">
                        <span className="text-gray-400">법적 근거: </span>
                        {contract.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section D: 상세 데이터 (collapsible) */}
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
                <div className="mt-2 bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-1">
                  {Object.entries(finding.detail).map(([key, value]) => (
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Main page component
// ══════════════════════════════════════════════════════════════════════
export default function AuditPageClient({
  departmentScores,
  auditFlags,
  kpis,
}: AuditPageClientProps) {
  const { isDemo } = useDataMode();

  // Real data state
  const [realData, setRealData] = useState<RealAuditData | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [activeCategory, setActiveCategory] = useState<PatternCategory>('vendor_concentration');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soleSourceInfoOpen, setSoleSourceInfoOpen] = useState(false);

  // Fetch real data on mount (only in live mode)
  useEffect(() => {
    if (isDemo) return;
    setLoading(true);
    fetch('/data/audit-results.json')
      .then(r => r.json())
      .then((data: RealAuditData) => {
        setRealData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isDemo]);

  // ── Real data computations ──
  const realFindings = realData?.findings ?? [];

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of PATTERN_CATEGORIES) {
      counts[cat.key] = realFindings.filter(f => f.pattern_type === cat.key).length;
    }
    return counts;
  }, [realFindings]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return realFindings.filter(f => {
      if (f.pattern_type !== activeCategory) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesInst = f.target_institution.toLowerCase().includes(q);
        const matchesSummary = f.summary.toLowerCase().includes(q);
        const matchesVendor = Object.values(f.detail).some(
          v => typeof v === 'string' && v.toLowerCase().includes(q)
        );
        if (!matchesInst && !matchesSummary && !matchesVendor) return false;
      }
      return true;
    });
  }, [realFindings, activeCategory, severityFilter, searchQuery]);

  // Severity breakdown for active category
  const severityBreakdown = useMemo(() => {
    const inCategory = realFindings.filter(f => f.pattern_type === activeCategory);
    return {
      total: inCategory.length,
      high: inCategory.filter(f => f.severity === 'HIGH').length,
      medium: inCategory.filter(f => f.severity === 'MEDIUM').length,
    };
  }, [realFindings, activeCategory]);

  // Reset filters on mode change
  useEffect(() => {
    setActiveCategory('vendor_concentration');
    setSeverityFilter('all');
    setSearchQuery('');
  }, [isDemo]);

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
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full mx-auto mb-4" />
          <p className="text-sm">실제 나라장터 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8">

      {/* ═══════════════════════════════════════════════════════════
           1. HEADER
         ═══════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI 감사관</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                실시간 데이터
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              실제 나라장터 계약 데이터를 분석하여 통계적 이상 패턴을 탐지합니다.
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <path d="M12 9v4M12 17h.01"/>
          </svg>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>의심 패턴 &#8800; 비리 확정.</strong> 이 분석은 공개 데이터의 통계적 이상을 탐지한 것이며, 모든 기관에 동일한 기준이 적용됩니다. 각 발견에는 &quot;비리가 아닐 수 있는 이유&quot;가 함께 표시됩니다.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           2. KPI CARDS
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <KPI
          label="분석 계약"
          value={`${(realData?.contracts_analyzed ?? 0).toLocaleString()}건`}
          source="나라장터"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
          }
        />
        <KPI
          label="탐지 패턴"
          value={`${realData?.findings_count ?? 0}건`}
          source="AI 자동 탐지"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <path d="M4 22v-7"/>
            </svg>
          }
        />
        <KPI
          label="수의계약 비율"
          value={`${realData?.summary.sole_source_ratio ?? 0}%`}
          source="나라장터"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
          }
        />
        <KPI
          label="분석 기관"
          value={`${(realData?.summary.unique_institutions ?? 0).toLocaleString()}개`}
          source="조달청"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
              <path d="M3 21V7l9-5 9 5v14"/>
              <path d="M9 21V12h6v9"/>
            </svg>
          }
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
           3. 수의계약 설명 (Context Card)
         ═══════════════════════════════════════════════════════════ */}
      <div className="card mb-8 p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setSoleSourceInfoOpen(!soleSourceInfoOpen)}
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
              <p className="text-xs text-gray-500 mt-0.5">분석된 계약의 79.9%가 수의계약 -- 이것이 왜 중요한지 알아보세요</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${soleSourceInfoOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {soleSourceInfoOpen && (
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
              <h3 className="text-sm font-bold text-amber-800 mb-1">79.9%는 높은 수치인가?</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                분석된 3,200건의 계약 중 약 2,557건이 수의계약입니다.
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

      {/* ═══════════════════════════════════════════════════════════
           4. PATTERN CATEGORY TABS
         ═══════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PATTERN_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            const count = categoryCounts[cat.key] || 0;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => { setActiveCategory(cat.key); setSeverityFilter('all'); setSearchQuery(''); }}
                className={`
                  flex-shrink-0 px-4 py-3 rounded-xl text-left transition-all duration-200 border
                  ${isActive
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                    {cat.label}
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </div>
                <p className={`text-[11px] mt-1 leading-snug ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           5. SEARCH + FILTER BAR
         ═══════════════════════════════════════════════════════════ */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="기관명 또는 업체명 검색..."
              className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
            />
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-2">
            {SEVERITY_OPTIONS.map(opt => {
              const isActive = severityFilter === opt.value;
              const count = opt.value === 'all'
                ? severityBreakdown.total
                : opt.value === 'HIGH'
                ? severityBreakdown.high
                : severityBreakdown.medium;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverityFilter(opt.value)}
                  className={`
                    text-xs font-medium px-3 py-1.5 rounded-lg transition-all border
                    ${isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {filteredFindings.length}건 표시
            {searchQuery.trim() && ` (검색: "${searchQuery.trim()}")`}
          </p>
          {(searchQuery.trim() || severityFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSeverityFilter('all'); }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           6. FINDING CARDS (main content)
         ═══════════════════════════════════════════════════════════ */}
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
        <div className="card text-center py-16">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-sm text-gray-400">조건에 맞는 패턴이 없습니다.</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSeverityFilter('all'); }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           7. METHODOLOGY FOOTER
         ═══════════════════════════════════════════════════════════ */}
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
              {realData?.timestamp && ` ${realData.timestamp} 기준.`}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
              <h3 className="text-xs font-bold text-gray-700">패턴 탐지</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              업체 집중도, 수의계약 비율, 계약 금액 분포 등에 대한 통계 분석.
              기관별로 동일한 기준 적용.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-xs font-bold text-gray-700">한계</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              패턴만 탐지하며 의도는 판단하지 않습니다.
              합법적 사유로 동일한 패턴이 나타날 수 있습니다.
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
            나라장터
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <span>|</span>
          <a
            href="https://www.bai.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            감사원
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <span>|</span>
          <span>AI 분석: 통계적 패턴 탐지 (의심 &#8800; 확정)</span>
        </div>
      </div>
    </div>
  );
}
