'use client';
// 공약 카드 — 확장 가능한 상세 카드
import { useState } from 'react';
import type { CampaignPledge } from '@/lib/types';
import { getStatusColor, getStatusBgClass } from './StatusBreakdownBar';

interface PledgeCardProps {
  pledge: CampaignPledge;
}

export default function PledgeCard({ pledge }: PledgeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(pledge.fulfillment_status);
  const statusBg = getStatusBgClass(pledge.fulfillment_status);

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

        {/* 화살표 */}
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 mt-1 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 상세 내용 */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
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

          <div className="text-[10px] text-gray-400 pt-1">
            출처: {pledge.pledge_source}
          </div>
        </div>
      )}
    </div>
  );
}
