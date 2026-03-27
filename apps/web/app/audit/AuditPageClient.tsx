'use client';
// AI 감사관 대시보드 — 클라이언트 컴포넌트
import { useState } from 'react';
import type { AuditFlag, DepartmentScore } from '@/lib/types';
import KPI from '@/components/common/KPI';
import DepartmentHeatmap from '@/components/audit/DepartmentHeatmap';
import SuspicionCard from '@/components/audit/SuspicionCard';
import PatternBadge from '@/components/audit/PatternBadge';

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
  { value: 'yearend_spike', label: '연말 급증' },
  { value: 'vendor_concentration', label: '업체 집중' },
  { value: 'contract_splitting', label: '계약 분할' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

export default function AuditPageClient({
  departmentScores,
  auditFlags,
  kpis,
}: AuditPageClientProps) {
  const [patternFilter, setPatternFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // 필터링
  const filteredFlags = auditFlags.filter(f => {
    if (patternFilter !== 'all' && f.pattern_type !== patternFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (departmentFilter !== 'all' && (f.target_id || '') !== departmentFilter) return false;
    return true;
  });

  const departments = Array.from(new Set(auditFlags.map(f => f.target_id || ''))).filter(Boolean);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
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

      {/* KPI 카드 */}
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

      {/* 부처별 히트맵 */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">부처별 의심 점수 히트맵</h2>
        <p className="text-xs text-gray-400 mb-4">
          색상이 진할수록 의심 점수가 높음 · 클릭하면 해당 부처의 플래그를 필터링합니다
        </p>
        <DepartmentHeatmap
          scores={departmentScores}
          onDepartmentClick={(dept) => setDepartmentFilter(dept === departmentFilter ? 'all' : dept)}
        />
        <div className="flex items-center gap-6 mt-4 text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>0-20 정상</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>21-40 관심</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>41-60 주의</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span>61-80 경고</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-800" />
            <span>81-100 심각</span>
          </div>
        </div>
      </div>

      {/* 필터 + 플래그 목록 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">최근 감지된 패턴</h2>
          <div className="flex flex-wrap gap-2">
            {/* 패턴 필터 */}
            <select
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              {PATTERN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* 심각도 필터 */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              {SEVERITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* 부처 필터 */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
            >
              <option value="all">전체 부처</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 활성 필터 표시 */}
        {(patternFilter !== 'all' || severityFilter !== 'all' || departmentFilter !== 'all') && (
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
            {departmentFilter !== 'all' && (
              <button
                onClick={() => setDepartmentFilter('all')}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
              >
                {departmentFilter} ✕
              </button>
            )}
            <button
              onClick={() => { setPatternFilter('all'); setSeverityFilter('all'); setDepartmentFilter('all'); }}
              className="text-xs text-accent hover:text-orange-700"
            >
              전체 초기화
            </button>
          </div>
        )}

        {/* 플래그 카드 목록 */}
        {filteredFlags.length > 0 ? (
          <div className="space-y-3">
            {filteredFlags.map(flag => (
              <SuspicionCard key={flag.id} flag={flag} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>필터 조건에 맞는 플래그가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 패턴 설명 */}
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
          의심 스케일: 0-20 정상 · 21-40 관심 · 41-60 주의 · 61-80 경고 · 81-100 심각
          · 출처: 나라장터(조달청) 공개 계약 데이터 · 감사원 지적 패턴 참조
        </p>
      </div>
    </div>
  );
}
