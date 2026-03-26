'use client';
// 감사 플래그 상세 — 클라이언트 컴포넌트
import { useState } from 'react';
import type { AuditFlag, AuditContract, AuditTimelineItem, AuditLink, SimilarCase, ContractBid } from '@/lib/types';
import { getSeverityColor, getSeverityLabel, formatKRW, formatNumber, formatKeyLabel } from '@/lib/utils';
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

// 유사 사례 outcome 심각도 색상 (left border)
function getOutcomeBorderColor(outcome: string): string {
  if (outcome.includes('징계') || outcome.includes('고발') || outcome.includes('수사') || outcome.includes('기소'))
    return 'border-l-red-500';
  if (outcome.includes('시정') || outcome.includes('주의') || outcome.includes('경고') || outcome.includes('개선'))
    return 'border-l-amber-500';
  if (outcome.includes('환수') || outcome.includes('반환'))
    return 'border-l-orange-500';
  return 'border-l-gray-400';
}

export default function AuditDetailClient({ flag }: AuditDetailClientProps) {
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
  const [expandedCase, setExpandedCase] = useState<number | null>(0); // first case expanded by default

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
  const innocentExplanation = flag.innocent_explanation || '';
  const citizenImpact = flag.citizen_impact || '';
  const whatShouldHappen = flag.what_should_happen || '';
  const realCaseExample = flag.real_case_example || '';
  const similarCases = flag.similar_cases || [];

  const contractTotal = contracts.reduce((sum, c) => sum + c.amount, 0);

  // 입찰 스프레드 분석: 모든 입찰가가 5% 이내면 의심
  function isBidSpreadSuspicious(competitors: ContractBid[]): boolean {
    if (competitors.length < 2) return false;
    const amounts = competitors.map(c => c.bid_amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (min === 0) return false;
    return ((max - min) / min) * 100 < 5;
  }

  return (
    <div className="container-page py-6 sm:py-8">
      {/* ── 뒤로가기 ── */}
      <a href="/audit" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
        <span aria-hidden="true">&larr;</span> 감사 대시보드
      </a>

      {/* ── 경고 배너 ── */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <path d="M12 9v4M12 17h.01"/>
          </svg>
          <div>
            <p className="text-sm text-yellow-800 font-semibold mb-1">이 분석에 대해</p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• 이 페이지는 AI가 공개 데이터에서 통계적 이상 패턴을 탐지한 결과입니다.</li>
              <li>• <strong>의심 패턴 ≠ 비리 확정</strong>. 합리적 설명이 있을 수 있습니다.</li>
              <li>• 아래 &quot;비리가 아닐 수 있는 이유&quot;를 반드시 함께 읽어주세요.</li>
              <li>• 모든 부처에 동일한 기준이 적용됩니다.</li>
              <li>• 원본 데이터는 정부 공식 사이트에서 직접 확인할 수 있습니다.</li>
            </ul>
          </div>
        </div>
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

            {/* 비리가 아닐 수 있는 이유 (다른 해석) */}
            {innocentExplanation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-800 mb-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  비리가 아닐 수 있는 이유
                </h3>
                <p className="text-sm text-green-700 leading-relaxed">{innocentExplanation}</p>
              </div>
            )}

            {/* 양쪽 관점 안내 */}
            {whyItMatters && innocentExplanation && (
              <p className="text-xs text-gray-400 text-center">
                양쪽 관점을 모두 고려하여 판단해 주세요.
              </p>
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
                  <span className="text-gray-500">{formatKeyLabel(key)}</span>
                  <span className="font-medium text-gray-800">
                    {typeof value === 'number' ? formatNumber(value, key) :
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
                      <span className="text-red-600">{formatKeyLabel(key)}</span>
                      <span className="font-medium text-red-800">
                        {typeof value === 'number' ? formatNumber(value, key) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ 관련 계약 (Expandable) ═══ */}
          {contracts.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">관련 계약</h2>
                <span className="text-xs text-gray-400">{contracts.length}건</span>
              </div>

              <div className="space-y-3">
                {contracts.map((c, i) => {
                  const isExpanded = expandedContract === i;
                  const isSuui = c.method.includes('수의');
                  const isCompetitive = c.method.includes('경쟁') || c.method.includes('제한');
                  const hasCompetitors = (c.competitors?.length ?? 0) > 0;

                  return (
                    <div key={i} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                      {/* Compact row (always visible, clickable) */}
                      <button
                        type="button"
                        onClick={() => setExpandedContract(isExpanded ? null : i)}
                        className="w-full text-left p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-gray-800 flex-1">{c.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getMethodColor(c.method)}`}>
                              {c.method}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
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
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-3">
                          {/* 기본 상세 */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            {c.approver && (
                              <div>
                                <span className="text-gray-400 block">승인</span>
                                <p className="text-gray-800 font-medium">{c.approver}</p>
                              </div>
                            )}
                            {c.budget_code && (
                              <div>
                                <span className="text-gray-400 block">예산 항목</span>
                                <p className="text-gray-800 font-mono text-[11px]">{c.budget_code}</p>
                              </div>
                            )}
                            {c.execution_period && (
                              <div>
                                <span className="text-gray-400 block">이행 기간</span>
                                <p className="text-gray-800">{c.execution_period}</p>
                              </div>
                            )}
                          </div>

                          {/* 수의계약 사유 */}
                          {isSuui && (
                            <div>
                              {c.justification && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <h5 className="text-xs font-bold text-amber-800 mb-1">수의계약 사유</h5>
                                  <p className="text-xs text-amber-700 leading-relaxed">{c.justification}</p>
                                </div>
                              )}
                              <p className="text-[10px] text-gray-400 mt-2">
                                수의계약은 경쟁 입찰 없이 특정 업체와 직접 계약하는 방식입니다
                              </p>
                            </div>
                          )}

                          {/* 경쟁입찰 / 제한경쟁 — 입찰 현황 */}
                          {isCompetitive && hasCompetitors && c.competitors && (
                            <div>
                              <h5 className="text-xs font-bold text-gray-700 mb-2">입찰 현황</h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-1.5 pr-3 text-gray-500 font-semibold">업체명</th>
                                      <th className="text-right py-1.5 pr-3 text-gray-500 font-semibold">입찰 금액</th>
                                      <th className="text-center py-1.5 pr-3 text-gray-500 font-semibold">결과</th>
                                      <th className="text-left py-1.5 text-gray-500 font-semibold">비고</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {c.competitors.map((bid, bi) => (
                                      <tr
                                        key={bi}
                                        className={`border-b border-gray-50 ${bid.selected ? 'bg-green-50' : ''}`}
                                      >
                                        <td className={`py-1.5 pr-3 ${bid.selected ? 'font-bold text-green-800' : 'text-gray-700'}`}>
                                          {bid.vendor}
                                          {bid.selected && (
                                            <span className="ml-1.5 inline-block text-[9px] px-1.5 py-0.5 rounded bg-green-200 text-green-800 font-semibold">낙찰</span>
                                          )}
                                        </td>
                                        <td className="text-right py-1.5 pr-3 text-gray-800 font-medium">
                                          {formatKRW(bid.bid_amount)}
                                        </td>
                                        <td className="text-center py-1.5 pr-3">
                                          {bid.selected ? (
                                            <span className="text-green-700 font-semibold">선정</span>
                                          ) : (
                                            <span className="text-gray-400">탈락</span>
                                          )}
                                        </td>
                                        <td className="py-1.5 text-gray-500">{bid.note || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* 가격 차이 분석 */}
                              {c.competitors.length >= 2 && (() => {
                                const amounts = c.competitors!.map(b => b.bid_amount);
                                const min = Math.min(...amounts);
                                const max = Math.max(...amounts);
                                const spread = min > 0 ? ((max - min) / min) * 100 : 0;
                                const suspicious = isBidSpreadSuspicious(c.competitors!);
                                return (
                                  <div className={`mt-2 text-[11px] px-3 py-2 rounded-lg ${suspicious ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                    <span className="text-gray-500">최저가-최고가 차이: </span>
                                    <span className={`font-bold ${suspicious ? 'text-red-700' : 'text-gray-700'}`}>
                                      {formatKRW(max - min)} ({spread.toFixed(1)}%)
                                    </span>
                                    {suspicious && (
                                      <p className="text-red-600 mt-1 font-medium">
                                        모든 입찰가가 5% 이내로 매우 유사합니다. 입찰 담합 가능성을 검토할 필요가 있습니다.
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* ═══ 원시 데이터 ═══ */}
      <div className="card mt-6">
        <h2 className="font-bold text-lg mb-2">원시 데이터</h2>
        <p className="text-xs text-gray-500 mb-4">
          이 분석의 근거가 된 원본 데이터입니다. 아래 정부 사이트에서 직접 확인할 수 있습니다.
        </p>

        {/* Detail data as key-value table */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-xs">
          <div className="text-gray-400 mb-2">// 탐지 데이터</div>
          {Object.entries(detail).map(([key, value]) => (
            <div key={key} className="flex gap-2 py-1">
              <span className="text-gray-500 w-32 shrink-0">{formatKeyLabel(key)}:</span>
              <span className="text-gray-800">
                {typeof value === 'number' ? formatNumber(value, key) :
                 typeof value === 'object' ? JSON.stringify(value) :
                 String(value)}
              </span>
            </div>
          ))}
          {Object.keys(detail).length === 0 && (
            <div className="text-gray-400 py-1">데이터 없음</div>
          )}
        </div>

        {/* Evidence as key-value */}
        {evidence && typeof evidence === 'object' && Object.keys(evidence).length > 0 && (
          <div className="bg-red-50 rounded-lg p-4 mb-4 font-mono text-xs">
            <div className="text-red-400 mb-2">// 기준 초과 증거</div>
            {Object.entries(evidence).map(([key, value]) => (
              <div key={key} className="flex gap-2 py-1">
                <span className="text-red-500 w-32 shrink-0">{formatKeyLabel(key)}:</span>
                <span className="text-red-800">
                  {typeof value === 'number' ? formatNumber(value, key) :
                   typeof value === 'object' ? JSON.stringify(value) :
                   String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Direct verification links */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-blue-800 mb-2">직접 확인하기</h3>
          <p className="text-xs text-blue-700 mb-3">
            아래 정부 공식 사이트에서 원본 데이터를 직접 조회할 수 있습니다.
            검색어 힌트를 참고하여 관련 계약을 찾아보세요.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 shrink-0">1.</span>
              <div>
                <a href="https://www.g2b.go.kr:8081/ep/tbid/tbidList.do" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-medium">
                  나라장터 계약 검색 ↗
                </a>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  검색어: &quot;{targetId}&quot; 입력 → 계약 현황 탭에서 해당 부처 계약 확인
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 shrink-0">2.</span>
              <div>
                <a href="https://www.bai.go.kr/bai/result/list" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-medium">
                  감사원 감사결과 검색 ↗
                </a>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  검색어: &quot;{targetId}&quot; 또는 &quot;{patternLabels[patternType]}&quot; 입력
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 shrink-0">3.</span>
              <div>
                <a href="https://www.openfiscaldata.go.kr/op/ko/sd/UOPKOSDA01" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-medium">
                  열린재정 세출 현황 ↗
                </a>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  부처명 &quot;{targetId}&quot; 선택 → 분기별 세출 확인
                </p>
              </div>
            </div>
          </div>
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

      {/* ═══ 7. 유사 감사 사례 (Similar Cases) ═══ */}
      {similarCases.length > 0 ? (
        <div className="card mt-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-lg">유사 감사 사례</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              {similarCases.length}건
            </span>
          </div>

          <div className="space-y-3">
            {similarCases.map((sc, i) => {
              const isCaseExpanded = expandedCase === i;
              return (
                <div
                  key={i}
                  className={`border-l-4 ${getOutcomeBorderColor(sc.outcome)} rounded-r-lg border border-gray-100 overflow-hidden bg-white`}
                >
                  {/* Collapsed header (always visible) */}
                  <button
                    type="button"
                    onClick={() => setExpandedCase(isCaseExpanded ? null : i)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                            {sc.year}
                          </span>
                          <h4 className="text-sm font-bold text-gray-800 truncate">{sc.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                            {sc.amount_involved}
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 mt-1 ${isCaseExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isCaseExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                      {/* Source + Department */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="italic text-gray-500">{sc.source}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">{sc.department}</span>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-gray-700 leading-relaxed">{sc.summary}</p>

                      {/* Amount chip */}
                      <div className="inline-block">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                          관련 금액: {sc.amount_involved}
                        </span>
                      </div>

                      {/* Outcome */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h5 className="text-xs font-bold text-gray-600 mb-1">조치 결과</h5>
                        <p className="text-sm text-gray-800 leading-relaxed">{sc.outcome}</p>
                      </div>

                      {/* Current status */}
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">현재 상태:</span> {sc.current_status}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-400 mt-3">
            실제 감사원에서 적발한 유사 패턴의 사례입니다. 본 건과 직접적 관련은 없으며, 패턴의 위험성을 이해하기 위한 참고 자료입니다.
          </p>
        </div>
      ) : realCaseExample ? (
        /* Fallback: 기존 real_case_example */
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
      ) : null}

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

      {/* ═══ 분석 방법론 ═══ */}
      <div className="card mt-6">
        <h2 className="font-bold text-lg mb-3">분석 방법론</h2>
        <div className="text-sm text-gray-600 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">데이터 수집</h3>
            <p>나라장터(조달청)에서 공개하는 정부 계약 데이터를 수집합니다. 모든 데이터는 정보공개법에 따라 누구나 접근 가능합니다.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">패턴 탐지</h3>
            <p>감사원이 실제 감사에서 사용하는 10가지 통계적 이상 패턴(연말급증, 업체집중, 계약분할 등)을 기준으로 자동 탐지합니다. 기준치는 감사원 감사매뉴얼을 참고했습니다.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">의심 점수</h3>
            <p>0-100 스케일로 패턴의 통계적 이상 정도를 수치화합니다. 점수가 높을수록 통계적으로 드문 패턴이며, 반드시 비리를 의미하지 않습니다.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">한계</h3>
            <p>이 시스템은 통계적 이상만 탐지하며, 비리 여부를 판단하지 않습니다. 실제 비리 확인은 감사원, 검찰 등 수사기관의 조사가 필요합니다. 현재 시범 운영 중이며, 개별 계약 데이터는 시뮬레이션입니다.</p>
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
