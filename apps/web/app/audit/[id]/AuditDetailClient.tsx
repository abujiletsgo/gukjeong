'use client';
// 감사 플래그 상세 — 클라이언트 컴포넌트
import type { AuditFlag, AuditContract, AuditTimelineItem, AuditLink } from '@/lib/types';
import { getSeverityColor, getSeverityLabel, formatKRW } from '@/lib/utils';
import PatternBadge from '@/components/audit/PatternBadge';
import ScoreBar from '@/components/common/ScoreBar';

interface AuditDetailClientProps {
  flag: AuditFlag;
}

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

// 계약 방법 라벨 색상
function getMethodColor(method: string): string {
  if (method.includes('수의')) return 'bg-red-100 text-red-700';
  if (method.includes('일반')) return 'bg-green-100 text-green-700';
  if (method.includes('제한')) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
}

// 타임라인 도트 색상
function getTimelineDotColor(type: AuditTimelineItem['type']): string {
  switch (type) {
    case 'detection': return 'bg-red-500';
    case 'investigation': return 'bg-amber-500';
    case 'resolution': return 'bg-green-500';
    case 'info':
    default: return 'bg-gray-400';
  }
}

function getTimelineDotRing(type: AuditTimelineItem['type']): string {
  switch (type) {
    case 'detection': return 'ring-red-100';
    case 'investigation': return 'ring-amber-100';
    case 'resolution': return 'ring-green-100';
    case 'info':
    default: return 'ring-gray-100';
  }
}

// 출처 뱃지 색상
function getSourceColor(source: string): string {
  if (source.includes('나라장터') || source.includes('조달청')) return 'bg-blue-100 text-blue-700';
  if (source.includes('감사원')) return 'bg-red-100 text-red-700';
  if (source.includes('국회')) return 'bg-purple-100 text-purple-700';
  if (source.includes('기획재정부') || source.includes('재정')) return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-700';
}

export default function AuditDetailClient({ flag }: AuditDetailClientProps) {
  const score = flag.suspicion_score;
  const patternType = flag.pattern_type;
  const targetId = flag.target_id || '';
  const targetType = flag.target_type || '';
  const aiAnalysis = flag.ai_analysis || '';
  const createdAt = flag.created_at || '';
  const severityColor = getSeverityColor(score);

  const detail = flag.detail || {};
  const evidence = flag.evidence || {};
  const contracts = flag.contracts || [];
  const timeline = flag.timeline || [];
  const relatedLinks = flag.related_links || [];
  const plainExplanation = flag.plain_explanation || '';
  const whyItMatters = flag.why_it_matters || '';
  const citizenImpact = flag.citizen_impact || '';
  const whatShouldHappen = flag.what_should_happen || '';
  const realCaseExample = flag.real_case_example || '';

  const contractTotal = contracts.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* ── 뒤로가기 ── */}
      <a href="/audit" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
        <span aria-hidden="true">&larr;</span> 감사 대시보드
      </a>

      {/* ── 경고 배너 ── */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
        <strong className="font-semibold">AI 자동 탐지 결과</strong> &mdash; 이 분석은 AI 기반 자동 탐지 결과이며, <strong>의심 패턴</strong>일 뿐 비리 확정이 아닙니다.
        모든 부처에 동일한 기준이 적용됩니다.
      </div>

      {/* ═══ 1. Header ═══ */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: severityColor }} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <PatternBadge pattern={patternType} size="md" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3">
                {patternLabels[patternType] || patternType}
              </h1>
              <p className="text-gray-500 mt-1">{targetId}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {createdAt && (
                  <span className="text-xs text-gray-400">
                    탐지일: {createdAt.replace(/-/g, '.')}
                  </span>
                )}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${severityColor}15`, color: severityColor }}>
                  {flag.severity}
                </span>
                <span className="text-xs text-gray-400">
                  {targetType === 'department' ? '정부 부처' : targetType}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-4xl font-bold" style={{ color: severityColor }}>
                {score}
              </div>
              <div className="text-sm text-gray-500">{getSeverityLabel(score)}</div>
            </div>
          </div>
          <div className="mt-4">
            <ScoreBar score={score} label="의심 점수" />
          </div>
        </div>
      </div>

      {/* ═══ 2. "쉽게 말하면" Section ═══ */}
      {(plainExplanation || whyItMatters || citizenImpact) && (
        <div className="card mb-6 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 sm:px-6 py-4">
            <h2 className="text-white font-bold text-lg">쉽게 말하면</h2>
            <p className="text-blue-100 text-xs mt-0.5">복잡한 감사 데이터를 알기 쉽게 설명합니다</p>
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            {/* 쉬운 설명 */}
            {plainExplanation && (
              <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-medium">
                {plainExplanation}
              </p>
            )}

            {/* 왜 의심스러운가 */}
            {whyItMatters && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                <h3 className="text-sm font-bold text-amber-800 mb-1">왜 의심스러운가?</h3>
                <p className="text-sm text-amber-700 leading-relaxed">{whyItMatters}</p>
              </div>
            )}

            {/* 내 세금은? */}
            {citizenImpact && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">
                    <span aria-hidden="true">&#x20A9;</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-800 mb-1">내 세금은?</h3>
                    <p className="text-sm text-red-700 leading-relaxed">{citizenImpact}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ═══ 3. AI 분석 (Left Column) ═══ */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-lg">AI 분석</h2>
              <span className="ai-badge">AI</span>
            </div>

            {aiAnalysis ? (
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 mb-4">
                <p className="text-sm">AI 분석 결과가 생성되면 여기에 표시됩니다.</p>
              </div>
            )}

            {/* 어떤 조치가 필요한가 */}
            {whatShouldHappen && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                  필요한 조치
                </h3>
                <p className="text-sm text-green-700 leading-relaxed">{whatShouldHappen}</p>
              </div>
            )}

            {/* 패턴 설명 */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">패턴 설명</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {patternDescriptions[patternType] || '패턴에 대한 상세 설명이 준비 중입니다.'}
              </p>
            </div>

            {/* 데이터 출처 */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-300">
                데이터 출처: 나라장터(조달청) 공개 계약 정보 &middot; AI 분석: Claude Sonnet 4
              </p>
            </div>
          </div>
        </div>

        {/* ═══ 4. 증거 & 계약 (Right Column) ═══ */}
        <div className="space-y-6">
          {/* 탐지 근거 */}
          <div className="card">
            <h2 className="font-bold text-lg mb-4">탐지 근거</h2>
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
              {Object.keys(detail).length === 0 && (
                <p className="text-sm text-gray-400 py-2">탐지 상세 데이터가 없습니다.</p>
              )}
            </div>

            {/* 기준 초과 */}
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

          {/* 관련 계약 */}
          {contracts.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">관련 계약</h2>
                <span className="text-xs text-gray-400">{contracts.length}건</span>
              </div>

              <div className="space-y-3">
                {contracts.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-semibold text-gray-800 flex-1">{c.title}</h4>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getMethodColor(c.method)}`}>
                        {c.method}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="text-gray-400">금액</span>
                        <p className="font-bold text-gray-900">{formatKRW(c.amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">업체</span>
                        <p className="text-gray-700 font-medium">{c.vendor}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">계약일</span>
                        <p className="text-gray-700">{c.date.replace(/-/g, '.')}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">원가</span>
                        <p className="text-gray-700">{c.amount.toLocaleString('ko-KR')}원</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 합계 */}
              <div className="mt-4 pt-3 border-t-2 border-gray-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">총 계약 금액</span>
                <span className="text-lg font-bold text-gray-900">{formatKRW(contractTotal)}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                ({contractTotal.toLocaleString('ko-KR')}원)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 5. 타임라인 ═══ */}
      {timeline.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-bold text-lg mb-6">타임라인</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] sm:left-[88px] top-2 bottom-2 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="relative flex items-start gap-4 sm:gap-0">
                  {/* Date (hidden on mobile, shown on sm+) */}
                  <div className="hidden sm:block w-[72px] flex-shrink-0 text-right pr-4">
                    <span className="text-xs text-gray-500 font-medium">
                      {item.date.replace(/-/g, '.')}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className={`w-[15px] h-[15px] rounded-full ${getTimelineDotColor(item.type)} ring-4 ${getTimelineDotRing(item.type)}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1 ml-2 sm:ml-4 -mt-0.5">
                    {/* Mobile date */}
                    <span className="sm:hidden text-[10px] text-gray-400 block mb-0.5">
                      {item.date.replace(/-/g, '.')}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 6. 관련 링크 ═══ */}
      {relatedLinks.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-bold text-lg mb-4">관련 자료</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 rounded-lg p-4 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${getSourceColor(link.source)}`}>
                    {link.source}
                  </span>
                  <p className="text-sm text-gray-800 font-medium leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                    {link.title}
                  </p>
                </div>
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" aria-hidden="true">
                  &#x2197;
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 7. 유사 사례 ═══ */}
      {realCaseExample && (
        <div className="card mt-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-lg">유사 사례</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">감사원 보고서</span>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{realCaseExample}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            실제 감사원에서 적발한 유사 패턴의 사례입니다. 본 건과 직접적 관련은 없으며, 패턴의 위험성을 이해하기 위한 참고 자료입니다.
          </p>
        </div>
      )}

      {/* ═══ 8. 관련 정보 (메타) ═══ */}
      <div className="card mt-6">
        <h2 className="font-bold text-lg mb-4">관련 정보</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">대상 유형</span>
            <span className="text-gray-800">{targetType === 'department' ? '정부 부처' : targetType}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">대상</span>
            <span className="text-gray-800">{targetId}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">심각도</span>
            <span className="font-medium" style={{ color: severityColor }}>{flag.severity}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-50">
            <span className="text-gray-500">상태</span>
            <span className="text-gray-800">{flag.status === 'detected' ? '탐지됨' : flag.status}</span>
          </div>
        </div>
      </div>

      {/* ═══ Disclaimer ═══ */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-300 leading-relaxed max-w-xl mx-auto">
          이 페이지의 모든 분석은 공개 데이터(나라장터, 감사원, 국회 등)를 기반으로 AI가 자동 생성한 것이며,
          어떤 개인이나 기관에 대한 비리를 확정하거나 명예를 훼손하려는 의도가 없습니다.
          의심 패턴은 추가 검증이 필요한 데이터 이상 신호입니다.
        </p>
      </div>
    </div>
  );
}
