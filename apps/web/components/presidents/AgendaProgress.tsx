'use client';
// 국정과제 진행 현황 — 카테고리별 프로그레스 (클릭 확장 상세)
import { useState } from 'react';
import type { NationalAgenda } from '@/lib/types';
import { getStatusColor, getStatusBgClass } from './StatusBreakdownBar';
import { formatTrillions } from '@/lib/utils';

interface AgendaProgressProps {
  agendas: NationalAgenda[];
}

function hasDeepDetail(agenda: NationalAgenda): boolean {
  return !!(
    agenda.plain_explanation ||
    agenda.why_it_matters ||
    agenda.citizen_impact ||
    agenda.success_or_failure ||
    agenda.real_example
  );
}

interface DetailSectionProps {
  icon: string;
  label: string;
  content: string;
}

function DetailSection({ icon, label, content }: DetailSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs">{icon}</span>
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  );
}

function AgendaItem({ agenda }: { agenda: NationalAgenda }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(agenda.implementation_status);
  const statusBg = getStatusBgClass(agenda.implementation_status);

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 sm:p-4"
      >
        <div className="flex items-start gap-3">
          {/* 과제 번호 */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
            #{agenda.agenda_number}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusBg}`}>
                {agenda.implementation_status}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 leading-snug">{agenda.title}</h4>

            {/* 진행률 바 */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${agenda.completion_rate}%`,
                    backgroundColor: statusColor,
                  }}
                />
              </div>
              <span className="text-xs font-bold min-w-[32px] text-right" style={{ color: statusColor }}>
                {agenda.completion_rate}%
              </span>
            </div>
          </div>

          {/* 화살표 + 토글 텍스트 */}
          <div className="flex flex-col items-center flex-shrink-0 mt-1 gap-0.5">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-[9px] text-gray-400">
              {expanded ? '접기' : '자세히 보기'}
            </span>
          </div>
        </div>
      </button>

      {/* 확장 상세 */}
      <div
        className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-gray-50 space-y-2.5 text-sm">
          {/* 기존 상세 정보 */}
          {agenda.description && (
            <p className="text-gray-600 text-xs leading-relaxed">{agenda.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {agenda.target_metric && (
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block text-[10px]">목표 지표</span>
                <span className="text-gray-800 font-medium">{agenda.target_metric}: {agenda.target_value}</span>
              </div>
            )}
            {agenda.actual_value && (
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block text-[10px]">실적</span>
                <span className="text-gray-800 font-medium">{agenda.actual_value}</span>
              </div>
            )}
            {agenda.budget_committed && (
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block text-[10px]">배정 예산</span>
                <span className="text-gray-800 font-medium">{formatTrillions(agenda.budget_committed / 10)}</span>
              </div>
            )}
            {agenda.budget_executed && (
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block text-[10px]">집행액</span>
                <span className="text-gray-800 font-medium">{formatTrillions(agenda.budget_executed / 10)}</span>
              </div>
            )}
          </div>

          {agenda.ai_assessment && (
            <div className="bg-purple-50 rounded-lg p-2.5 text-xs">
              <span className="text-purple-600 font-medium text-[10px]">AI 분석</span>
              <p className="text-purple-800 mt-1 leading-relaxed">{agenda.ai_assessment}</p>
            </div>
          )}

          {/* 심층 분석 섹션 */}
          {hasDeepDetail(agenda) && (
            <div
              className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3 border-l-2 mt-2"
              style={{ borderColor: statusColor }}
            >
              {agenda.plain_explanation && (
                <DetailSection icon="📝" label="쉽게 말하면" content={agenda.plain_explanation} />
              )}

              {agenda.why_it_matters && (
                <DetailSection icon="💡" label="왜 중요한가" content={agenda.why_it_matters} />
              )}

              {agenda.citizen_impact && (
                <DetailSection icon="👤" label="시민에게 미친 영향" content={agenda.citizen_impact} />
              )}

              {agenda.success_or_failure && (
                <DetailSection icon="📊" label="성공/실패 이유" content={agenda.success_or_failure} />
              )}

              {agenda.real_example && (
                <DetailSection icon="📌" label="실제 사례" content={agenda.real_example} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgendaProgress({ agendas }: AgendaProgressProps) {
  // 카테고리별 그룹화
  const categories = Array.from(new Set(agendas.map(a => a.goal_category)));
  const completed = agendas.filter(a => a.implementation_status === '이행완료').length;
  const avgCompletion = agendas.length > 0
    ? Math.round(agendas.reduce((sum, a) => sum + a.completion_rate, 0) / agendas.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{agendas.length}개</div>
          <div className="text-xs text-gray-500">총 과제</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completed}개</div>
          <div className="text-xs text-gray-500">완료</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{avgCompletion}%</div>
          <div className="text-xs text-gray-500">평균 이행률</div>
        </div>
      </div>

      {/* 카테고리별 */}
      {categories.map(cat => {
        const catAgendas = agendas.filter(a => a.goal_category === cat);
        const catAvg = Math.round(catAgendas.reduce((s, a) => s + a.completion_rate, 0) / catAgendas.length);

        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">{cat}</h3>
              <span className="text-xs text-gray-500">평균 {catAvg}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${catAvg}%`,
                  backgroundColor: catAvg >= 70 ? '#22c55e' : catAvg >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <div className="space-y-2">
              {catAgendas.map(agenda => (
                <AgendaItem key={agenda.id} agenda={agenda} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
