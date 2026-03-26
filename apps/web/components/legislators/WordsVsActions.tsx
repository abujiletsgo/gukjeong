'use client';

import type { ConsistencyItem } from '@/lib/types';

interface WordsVsActionsProps {
  items?: ConsistencyItem[];
  partyColor?: string;
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function WordsVsActions({ items, partyColor }: WordsVsActionsProps) {
  if (!items || items.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-400 text-center py-8">말과 행동 분석 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const consistent = item.is_consistent;
        return (
          <div key={idx} className="card">
            {/* Topic header with consistency badge */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-gray-900">{item.topic}</h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  consistent
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {consistent ? <CheckIcon /> : <XIcon />}
                {consistent ? '일치' : '불일치'}
              </span>
            </div>

            {/* Two-column: speech vs vote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Speech stance */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  발언 입장
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item.speech_stance}</p>
              </div>

              {/* Vote stance */}
              <div className={`rounded-lg border p-3 ${
                consistent
                  ? 'bg-green-50 border-green-100'
                  : 'bg-red-50 border-red-100'
              }`}>
                <div className={`text-xs font-semibold mb-1 flex items-center gap-1 ${
                  consistent ? 'text-green-600' : 'text-red-600'
                }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  투표 행동
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item.vote_stance}</p>
              </div>
            </div>

            {/* Visual connecting line */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className={`flex-1 h-0.5 ${consistent ? 'bg-green-300' : 'border-t-2 border-dashed border-red-300'}`} />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                consistent ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {consistent ? <CheckIcon /> : <XIcon />}
              </div>
              <div className={`flex-1 h-0.5 ${consistent ? 'bg-green-300' : 'border-t-2 border-dashed border-red-300'}`} />
            </div>

            {/* Explanation */}
            {item.explanation && (
              <p className="text-sm text-gray-500 leading-relaxed">{item.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
