'use client';
// 공약 카드 — 확장 가능한 상세 카드 (심층 분석 포함)
import { useState } from 'react';
import type { CampaignPledge } from '@/lib/types';
import { getStatusColor, getStatusBgClass } from './StatusBreakdownBar';

interface PledgeCardProps {
  pledge: CampaignPledge;
}

function hasDeepDetail(pledge: CampaignPledge): boolean {
  return !!(
    pledge.plain_explanation ||
    pledge.why_it_matters ||
    pledge.citizen_impact ||
    pledge.what_went_wrong ||
    pledge.real_example
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

export default function PledgeCard({ pledge }: PledgeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(pledge.fulfillment_status);
  const statusBg = getStatusBgClass(pledge.fulfillment_status);
  const showWhatWentWrong =
    pledge.what_went_wrong &&
    (pledge.fulfillment_status === '미이행' || pledge.fulfillment_status === '일부이행');

  return (
    <div
      className="border border-gray-100 rounded-xl bg-white overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBg}`}>
              {pledge.fulfillment_status}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {pledge.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">
            {pledge.pledge_text}
          </h3>

          {/* 프로그레스 바 */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pledge.fulfillment_pct}%`,
                  backgroundColor: statusColor,
                }}
              />
            </div>
            <span className="text-xs font-bold min-w-[36px] text-right" style={{ color: statusColor }}>
              {pledge.fulfillment_pct}%
            </span>
          </div>
        </div>

        {/* 화살표 + 토글 텍스트 */}
        <div className="flex flex-col items-center flex-shrink-0 mt-1 gap-0.5">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-[9px] text-gray-400">
            {expanded ? '접기' : '자세히 보기'}
          </span>
        </div>
      </button>

      {/* 상세 내용 */}
      <div
        className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
          {/* 기존 상세 정보 */}
          {pledge.outcome_summary && (
            <div>
              <span className="text-[11px] font-medium text-gray-400 block mb-1">결과 요약</span>
              <p className="text-sm text-gray-700 leading-relaxed">{pledge.outcome_summary}</p>
            </div>
          )}

          {pledge.budget_impact && pledge.budget_impact !== '-' && (
            <div>
              <span className="text-[11px] font-medium text-gray-400 block mb-1">예산 영향</span>
              <p className="text-sm text-gray-700">{pledge.budget_impact}</p>
            </div>
          )}

          {pledge.related_bills && pledge.related_bills.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-gray-400 block mb-1">관련 법안</span>
              <div className="flex flex-wrap gap-1.5">
                {pledge.related_bills.map((bill, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {bill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 심층 분석 섹션 */}
          {hasDeepDetail(pledge) && (
            <div
              className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3 border-l-2 mt-2"
              style={{ borderColor: statusColor }}
            >
              {pledge.plain_explanation && (
                <DetailSection icon="📝" label="쉽게 말하면" content={pledge.plain_explanation} />
              )}

              {pledge.why_it_matters && (
                <DetailSection icon="💡" label="왜 중요한가" content={pledge.why_it_matters} />
              )}

              {pledge.citizen_impact && (
                <DetailSection icon="👤" label="시민에게 미친 영향" content={pledge.citizen_impact} />
              )}

              {showWhatWentWrong && (
                <DetailSection icon="⚠️" label="왜 안 됐나" content={pledge.what_went_wrong!} />
              )}

              {pledge.real_example && (
                <DetailSection icon="📌" label="실제 사례" content={pledge.real_example} />
              )}
            </div>
          )}

          <div className="text-[10px] text-gray-400 pt-1">
            출처: {pledge.pledge_source}
          </div>
        </div>
      </div>
    </div>
  );
}
