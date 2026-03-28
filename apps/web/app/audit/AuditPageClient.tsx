'use client';
// AI 감사관 대시보드 — 클라이언트 컴포넌트
// Live mode: /data/audit-results.json (76 real findings from 나라장터)
// Demo mode: seed data passed as props
import { useState, useEffect, useMemo } from 'react';
import { useDataMode } from '@/lib/context/DataModeContext';
import type { AuditFlag, DepartmentScore } from '@/lib/types';
import KPI from '@/components/common/KPI';
import DepartmentHeatmap from '@/components/audit/DepartmentHeatmap';
import PatternBadge from '@/components/audit/PatternBadge';
import { getSeverityColor, getSeverityLabel, formatKRW } from '@/lib/utils';

// ── Real data types (from audit-results.json) ──
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

// ── Props for seed/demo data ──
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

const PATTERN_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'vendor_concentration', label: '업체 집중' },
  { value: 'repeat_sole_source', label: '반복 수의계약' },
  { value: 'contract_splitting', label: '계약 분할' },
  { value: 'yearend_spike', label: '연말 급증' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

const PATTERN_LABELS: Record<string, string> = {
  vendor_concentration: '업체 집중',
  repeat_sole_source: '반복 수의계약',
  contract_splitting: '계약 분할',
  yearend_spike: '연말 급증',
  inflated_pricing: '고가 계약',
  zombie_project: '좀비 사업',
  bid_rigging: '입찰 담합',
};

// ── Real Finding Card ──
function RealFindingCard({ finding, index }: { finding: RealFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severityColor = getSeverityColor(finding.suspicion_score);

  return (
    <div
      className="card border-l-4 transition-all duration-200"
      style={{ borderLeftColor: severityColor }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PatternBadge pattern={finding.pattern_type} score={finding.suspicion_score} />
            <span className="text-xs text-gray-400">
              {finding.severity === 'HIGH' ? '높음' : finding.severity === 'MEDIUM' ? '보통' : '낮음'}
            </span>
          </div>
          <div className="font-semibold text-sm text-gray-800 mt-1">
            {finding.target_institution}
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold" style={{ color: severityColor }}>
            {finding.suspicion_score}
          </div>
          <div className="text-[10px] text-gray-400">{getSeverityLabel(finding.suspicion_score)}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-600 leading-relaxed">{finding.summary}</p>
      </div>

      {/* Innocent explanation */}
      {finding.innocent_explanation && (
        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-green-600 bg-green-50 rounded px-2 py-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-0.5" />
          <span>{finding.innocent_explanation}</span>
        </div>
      )}

      {/* Evidence contracts (expandable) */}
      {finding.evidence_contracts && finding.evidence_contracts.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            증거 계약 ({finding.evidence_contracts.length}건)
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {/* Deduplicate by contract number */}
              {Array.from(new Map(finding.evidence_contracts.map(c => [c.no, c])).values()).map((contract, ci) => (
                <div key={`${contract.no}-${ci}`} className="bg-gray-50 rounded-lg p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{contract.name}</div>
                      <div className="text-gray-500 mt-1">
                        {contract.vendor} | {contract.method} | {contract.date}
                      </div>
                      <div className="font-semibold text-gray-700 mt-1">
                        {formatKRW(contract.amount)}
                      </div>
                      {contract.reason && (
                        <div className="text-gray-400 mt-1 text-[10px]">{contract.reason}</div>
                      )}
                    </div>
                    <a
                      href={contract.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      나라장터
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Seed data SuspicionCard (existing design, inline for demo mode) ──
function SeedSuspicionCard({ flag }: { flag: AuditFlag }) {
  const patternLabels: Record<string, string> = {
    yearend_spike: '연말 지출 급증',
    vendor_concentration: '업체 집중도',
    inflated_pricing: '고가 계약',
    contract_splitting: '계약 분할',
    zombie_project: '좀비 사업',
    revolving_door: '전관예우',
    paper_company: '페이퍼 컴퍼니',
    unnecessary_renovation: '불필요 개보수',
    poor_roi: '낮은 ROI',
    bid_rigging: '입찰 담합',
  };

  const score = flag.suspicion_score;
  const patternType = flag.pattern_type;
  const targetId = flag.target_id || '';
  const previewText = flag.plain_explanation || flag.ai_analysis || '';
  const severityColor = getSeverityColor(score);

  return (
    <a
      href={`/audit/${flag.id}`}
      className="block card border-l-4 hover:shadow-md transition-all duration-200 group"
      style={{ borderLeftColor: severityColor }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PatternBadge pattern={patternType} score={score} />
            <span className="text-xs text-gray-400">{flag.severity === 'HIGH' ? '높음' : flag.severity === 'MEDIUM' ? '보통' : '낮음'}</span>
          </div>
          <div className="font-semibold text-sm text-gray-800 group-hover:text-accent transition-colors mt-1">
            {patternLabels[patternType] || patternType}
          </div>
          <div className="text-xs text-gray-500 mt-1">{targetId}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold" style={{ color: severityColor }}>{score}</div>
          <div className="text-[10px] text-gray-400">{getSeverityLabel(score)}</div>
        </div>
      </div>
      {previewText && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-start gap-2">
            <span className="ai-badge flex-shrink-0 mt-0.5">{flag.plain_explanation ? '요약' : 'AI 분석'}</span>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{previewText}</p>
          </div>
        </div>
      )}
      {flag.innocent_explanation && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-600 bg-green-50 rounded px-2 py-1">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
          <span className="line-clamp-1">{flag.innocent_explanation}</span>
        </div>
      )}
      <div className="mt-3 text-right">
        <span className="text-xs text-accent group-hover:text-accent/80 font-medium transition-colors">
          자세히 보기 &rarr;
        </span>
      </div>
    </a>
  );
}

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
  const [patternFilter, setPatternFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [institutionFilter, setInstitutionFilter] = useState('all');

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

  const filteredRealFindings = useMemo(() => {
    return realFindings.filter(f => {
      if (patternFilter !== 'all' && f.pattern_type !== patternFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (institutionFilter !== 'all' && f.target_institution !== institutionFilter) return false;
      return true;
    });
  }, [realFindings, patternFilter, severityFilter, institutionFilter]);

  const realInstitutions = useMemo(() => {
    return Array.from(new Set(realFindings.map(f => f.target_institution))).sort();
  }, [realFindings]);

  // Build heatmap from real findings: aggregate by institution
  const realDepartmentScores: DepartmentScore[] = useMemo(() => {
    if (!realData) return [];
    const map: Record<string, { totalScore: number; count: number }> = {};
    for (const f of realFindings) {
      const inst = f.target_institution;
      if (!map[inst]) map[inst] = { totalScore: 0, count: 0 };
      map[inst].totalScore += f.suspicion_score;
      map[inst].count++;
    }
    return Object.entries(map)
      .map(([dept, { totalScore, count }]) => ({
        department: dept,
        suspicion_score: Math.round(totalScore / count),
        flag_count: count,
      }))
      .sort((a, b) => b.suspicion_score - a.suspicion_score)
      .slice(0, 20); // top 20
  }, [realData, realFindings]);

  const realKpis = useMemo(() => {
    if (!realData) return null;
    return {
      totalFindings: realData.findings_count,
      contractsAnalyzed: realData.contracts_analyzed,
      soleSourceRatio: realData.summary.sole_source_ratio,
      uniqueInstitutions: realData.summary.unique_institutions,
    };
  }, [realData]);

  // ── Demo data computations ──
  const filteredDemoFlags = useMemo(() => {
    return auditFlags.filter(f => {
      if (patternFilter !== 'all' && f.pattern_type !== patternFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (institutionFilter !== 'all' && (f.target_id || '') !== institutionFilter) return false;
      return true;
    });
  }, [auditFlags, patternFilter, severityFilter, institutionFilter]);

  const demoDepartments = useMemo(() => {
    return Array.from(new Set(auditFlags.map(f => f.target_id || ''))).filter(Boolean);
  }, [auditFlags]);

  // Reset filters on mode change
  useEffect(() => {
    setPatternFilter('all');
    setSeverityFilter('all');
    setInstitutionFilter('all');
  }, [isDemo]);

  // ── LIVE MODE ──
  if (!isDemo) {
    if (loading) {
      return (
        <div className="container-page py-6 sm:py-8">
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full mx-auto mb-4" />
            <p>실제 나라장터 데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container-page py-6 sm:py-8">
        {/* Page header */}
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
            모든 기관에 동일한 기준이 적용됩니다.
          </div>
        </div>

        {/* Real data banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold text-emerald-800">실제 나라장터 데이터 기반</p>
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            {realData?.timestamp} 기준 | {realData?.contracts_analyzed.toLocaleString()}건 계약 분석 완료 | 출처: 나라장터(조달청) 공개 데이터
          </p>
        </div>

        {/* KPI cards */}
        {realKpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KPI
              label="탐지된 의심 패턴"
              value={`${realKpis.totalFindings}건`}
              source="AI 자동 탐지"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>}
            />
            <KPI
              label="분석된 계약"
              value={`${realKpis.contractsAnalyzed.toLocaleString()}건`}
              source="나라장터"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
            />
            <KPI
              label="수의계약 비율"
              value={`${realKpis.soleSourceRatio}%`}
              source="나라장터"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>}
            />
            <KPI
              label="관련 기관"
              value={`${realKpis.uniqueInstitutions.toLocaleString()}개`}
              source="조달청"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/></svg>}
            />
          </div>
        )}

        {/* Department heatmap (real data) */}
        {realDepartmentScores.length > 0 && (
          <div className="card mb-6">
            <h2 className="font-bold text-lg mb-1">기관별 의심 점수 히트맵</h2>
            <p className="text-xs text-gray-400 mb-4">
              색상이 진할수록 의심 점수가 높음 | 클릭하면 해당 기관의 패턴을 필터링합니다
            </p>
            <DepartmentHeatmap
              scores={realDepartmentScores}
              onDepartmentClick={(dept) => setInstitutionFilter(dept === institutionFilter ? 'all' : dept)}
            />
            <div className="flex items-center gap-6 mt-4 text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span>0-20 정상</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500" /><span>21-40 관심</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500" /><span>41-60 주의</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500" /><span>61-80 경고</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-800" /><span>81-100 심각</span></div>
            </div>
          </div>
        )}

        {/* Filters + finding list */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="font-bold text-lg">탐지된 의심 패턴</h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
              >
                {PATTERN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
              >
                {SEVERITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
              >
                <option value="all">전체 기관</option>
                {realInstitutions.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter indicators */}
          {(patternFilter !== 'all' || severityFilter !== 'all' || institutionFilter !== 'all') && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-400">필터:</span>
              {patternFilter !== 'all' && (
                <button
                  onClick={() => setPatternFilter('all')}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                >
                  {PATTERN_OPTIONS.find(o => o.value === patternFilter)?.label} ✕
                </button>
              )}
              {severityFilter !== 'all' && (
                <button
                  onClick={() => setSeverityFilter('all')}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                >
                  {severityFilter} ✕
                </button>
              )}
              {institutionFilter !== 'all' && (
                <button
                  onClick={() => setInstitutionFilter('all')}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                >
                  {institutionFilter} ✕
                </button>
              )}
              <button
                onClick={() => { setPatternFilter('all'); setSeverityFilter('all'); setInstitutionFilter('all'); }}
                className="text-xs text-accent hover:text-orange-700"
              >
                전체 초기화
              </button>
            </div>
          )}

          {/* Results count */}
          <div className="text-xs text-gray-400 mb-3">
            {filteredRealFindings.length}건 / 총 {realFindings.length}건
          </div>

          {/* Finding cards */}
          {filteredRealFindings.length > 0 ? (
            <div className="space-y-3">
              {filteredRealFindings.map((finding, i) => (
                <RealFindingCard key={`${finding.target_institution}-${i}`} finding={finding} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>필터 조건에 맞는 패턴이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Pattern explanations */}
        <div className="card mt-6">
          <h2 className="font-bold text-lg mb-4">감사 패턴 설명</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { pattern: 'vendor_concentration', desc: '동일 업체 계약 30% 이상 또는 3년 연속', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg> },
              { pattern: 'repeat_sole_source', desc: '동일 업체에 반복적으로 수의계약 발주', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg> },
              { pattern: 'contract_splitting', desc: '수의계약 한도(2000만원) 직하 계약 3건 이상', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M14 14l7 7M3 8V3h5M10 10L3 3"/></svg> },
              { pattern: 'yearend_spike', desc: 'Q4 지출이 연간의 40% 초과', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
              { pattern: 'inflated_pricing', desc: '타 기관 대비 30% 이상 고가 계약', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
              { pattern: 'bid_rigging', desc: '동일 입찰 조합이 5회 이상 반복', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
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
            의심 스케일: 0-20 정상 | 21-40 관심 | 41-60 주의 | 61-80 경고 | 81-100 심각
            | 출처: 나라장터(조달청) 공개 계약 데이터 | 감사원 지적 패턴 참조
          </p>
        </div>
      </div>
    );
  }

  // ── DEMO MODE ──
  return (
    <div className="container-page py-6 sm:py-8">
      {/* Page header */}
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
          모든 부처에 동일한 기준이 적용됩니다.
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPI
          label="탐지된 플래그"
          value={`${kpis.totalFlags}건`}
          source="AI 자동 탐지"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>}
        />
        <KPI
          label="높은 심각도"
          value={`${kpis.highSeverity}건`}
          source="HIGH 등급"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>}
        />
        <KPI
          label="모니터링 부처"
          value={`${kpis.departmentsMonitored}개`}
          source="중앙행정기관"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/></svg>}
        />
        <KPI
          label="평균 의심 점수"
          value={`${kpis.avgScore}`}
          source="0-100 스케일"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
      </div>

      {/* Department heatmap */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">부처별 의심 점수 히트맵</h2>
        <p className="text-xs text-gray-400 mb-4">
          색상이 진할수록 의심 점수가 높음 | 클릭하면 해당 부처의 플래그를 필터링합니다
        </p>
        <DepartmentHeatmap
          scores={departmentScores}
          onDepartmentClick={(dept) => setInstitutionFilter(dept === institutionFilter ? 'all' : dept)}
        />
        <div className="flex items-center gap-6 mt-4 text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span>0-20 정상</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500" /><span>21-40 관심</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500" /><span>41-60 주의</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500" /><span>61-80 경고</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-800" /><span>81-100 심각</span></div>
        </div>
      </div>

      {/* Filters + demo flag list */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">최근 감지된 패턴</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              {[
                { value: 'all', label: '전체' },
                { value: 'yearend_spike', label: '연말 급증' },
                { value: 'vendor_concentration', label: '업체 집중' },
                { value: 'contract_splitting', label: '계약 분할' },
              ].map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              {SEVERITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              <option value="all">전체 부처</option>
              {demoDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {(patternFilter !== 'all' || severityFilter !== 'all' || institutionFilter !== 'all') && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">필터:</span>
            {patternFilter !== 'all' && (
              <button onClick={() => setPatternFilter('all')} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">
                {PATTERN_OPTIONS.find(o => o.value === patternFilter)?.label} ✕
              </button>
            )}
            {severityFilter !== 'all' && (
              <button onClick={() => setSeverityFilter('all')} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">
                {severityFilter} ✕
              </button>
            )}
            {institutionFilter !== 'all' && (
              <button onClick={() => setInstitutionFilter('all')} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">
                {institutionFilter} ✕
              </button>
            )}
            <button
              onClick={() => { setPatternFilter('all'); setSeverityFilter('all'); setInstitutionFilter('all'); }}
              className="text-xs text-accent hover:text-orange-700"
            >
              전체 초기화
            </button>
          </div>
        )}

        {filteredDemoFlags.length > 0 ? (
          <div className="space-y-3">
            {filteredDemoFlags.map(flag => (
              <SeedSuspicionCard key={flag.id} flag={flag} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>필터 조건에 맞는 플래그가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Pattern explanations */}
      <div className="card mt-6">
        <h2 className="font-bold text-lg mb-4">감사 패턴 설명</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { pattern: 'yearend_spike', desc: 'Q4 지출이 연간의 40% 초과', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg> },
            { pattern: 'vendor_concentration', desc: '동일 업체 계약 30% 이상 또는 3년 연속', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg> },
            { pattern: 'contract_splitting', desc: '수의계약 한도(2000만원) 직하 계약 3건 이상', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M14 14l7 7M3 8V3h5M10 10L3 3"/></svg> },
            { pattern: 'inflated_pricing', desc: '타 부처 대비 30% 이상 고가 계약', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
            { pattern: 'zombie_project', desc: '3년 이상 집행률 50% 미만 사업', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
            { pattern: 'bid_rigging', desc: '동일 입찰 조합이 5회 이상 반복', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
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
          의심 스케일: 0-20 정상 | 21-40 관심 | 41-60 주의 | 61-80 경고 | 81-100 심각
          | 출처: 나라장터(조달청) 공개 계약 데이터 | 감사원 지적 패턴 참조
        </p>
      </div>
    </div>
  );
}
