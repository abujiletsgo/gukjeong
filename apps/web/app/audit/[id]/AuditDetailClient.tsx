'use client';
// 감사 플래그 상세 — 클라이언트 컴포넌트
import type { AuditFlag } from '@/lib/types';
import { getSeverityColor, getSeverityLabel, formatKRW } from '@/lib/utils';
import PatternBadge from '@/components/audit/PatternBadge';
import ScoreBar from '@/components/common/ScoreBar';

interface AuditDetailClientProps {
  flag: AuditFlag;
}

export default function AuditDetailClient({ flag }: AuditDetailClientProps) {
  const score = flag.suspicionScore || flag.suspicion_score || 0;
  const patternType = flag.patternType || flag.pattern_type || '';
  const targetId = flag.targetId || flag.target_id || '';
  const targetType = flag.targetType || flag.target_type || '';
  const aiAnalysis = flag.aiAnalysis || flag.ai_analysis || '';
  const createdAt = flag.createdAt || flag.created_at || '';
  const severityColor = getSeverityColor(score);

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

  const patternDescriptions: Record<string, string> = {
    yearend_spike: '연말(Q4)에 연간 예산의 40% 이상을 집중 집행하는 패턴입니다. 예산 소진 압력에 의한 불필요한 지출이 발생할 수 있습니다.',
    vendor_concentration: '특정 업체에 해당 부처 계약의 30% 이상이 집중되는 패턴입니다. 공정한 경쟁 입찰이 이루어지지 않을 가능성이 있습니다.',
    contract_splitting: '수의계약 한도(2,000만원) 직하 금액으로 같은 업체에 반복 발주하는 패턴입니다. 입찰 절차를 회피하려는 의도가 의심됩니다.',
    inflated_pricing: '타 부처의 유사 물품/용역 대비 30% 이상 높은 가격으로 계약하는 패턴입니다.',
    zombie_project: '3년 이상 집행률이 50% 미만인 사업입니다. 사업의 실효성에 대한 재검토가 필요합니다.',
    bid_rigging: '동일한 입찰 참여 업체 조합이 5회 이상 반복되는 패턴입니다. 입찰 담합 가능성이 있습니다.',
  };

  // 증거 상세 표시
  const detail = flag.detail || {};
  const evidence = flag.evidence || {};

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 뒤로가기 */}
      <a href="/audit" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
        ← 감사 대시보드
      </a>

      {/* 경고 배너 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
        이 분석은 AI 기반 자동 탐지 결과이며, <strong>의심 패턴</strong>일 뿐 비리 확정이 아닙니다.
        모든 부처에 동일한 기준이 적용됩니다.
      </div>

      {/* 헤더 */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: severityColor }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <PatternBadge pattern={patternType} size="md" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3">
                {patternLabels[patternType] || patternType}
              </h1>
              <p className="text-gray-500 mt-1">{targetId}</p>
              {createdAt && (
                <p className="text-xs text-gray-400 mt-2">탐지일: {createdAt.replace(/-/g, '.')}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold" style={{ color: severityColor }}>
                {score}
              </div>
              <div className="text-sm text-gray-500">{getSeverityLabel(score)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 패턴 분석 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">탐지된 패턴</h2>

          {/* 의심 점수 바 */}
          <div className="mb-6">
            <ScoreBar score={score} label="의심 점수" />
          </div>

          {/* 패턴 설명 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">패턴 설명</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {patternDescriptions[patternType] || '패턴에 대한 상세 설명이 준비 중입니다.'}
            </p>
          </div>

          {/* 증거 상세 */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">탐지 근거</h3>
            <div className="space-y-2">
              {Object.entries(detail).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">{key}</span>
                  <span className="font-medium text-gray-800">
                    {typeof value === 'number' ? value.toLocaleString('ko-KR') :
                     typeof value === 'object' ? JSON.stringify(value) :
                     String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 기준/실제 비교 */}
          {evidence && typeof evidence === 'object' && Object.keys(evidence).length > 0 && (
            <div className="mt-4 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-red-700 mb-2">기준 초과</h3>
              <div className="space-y-1">
                {Object.entries(evidence).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-red-600">{key}</span>
                    <span className="font-medium text-red-800">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI 분석 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">AI 분석</h2>
          <div className="ai-badge mb-4">AI 분석</div>

          {aiAnalysis ? (
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {aiAnalysis}
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">🤖</div>
              <p className="text-sm">AI 분석 결과가 생성되면 여기에 표시됩니다.</p>
            </div>
          )}

          {/* 관련 정보 */}
          <div className="mt-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">관련 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">대상 유형</span>
                <span className="text-gray-800">{targetType === 'department' ? '정부 부처' : targetType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">대상</span>
                <span className="text-gray-800">{targetId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">심각도</span>
                <span className="font-medium" style={{ color: severityColor }}>{flag.severity}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">상태</span>
                <span className="text-gray-800">{flag.status === 'detected' ? '탐지됨' : flag.status}</span>
              </div>
            </div>
          </div>

          {/* 데이터 출처 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-300">
              데이터 출처: 나라장터(조달청) 공개 계약 정보 · AI 분석: Claude Sonnet 4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
