'use client';

import { useState } from 'react';
import type { ConsistencyItem } from '@/lib/types';

interface WordsVsActionsProps {
  items?: ConsistencyItem[];
  partyColor?: string;
}

const OPEN_ASSEMBLY_URL = 'https://open.assembly.go.kr/portal/mainPage.do';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block ml-1"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function SpeechIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function voteResultStyle(result?: string): string {
  if (!result) return 'bg-gray-100 text-gray-600';
  if (result.includes('찬성')) return 'bg-blue-100 text-blue-700 border border-blue-200';
  if (result.includes('반대')) return 'bg-red-100 text-red-700 border border-red-200';
  if (result.includes('기권')) return 'bg-gray-100 text-gray-600 border border-gray-200';
  if (result.includes('불참')) return 'bg-gray-200 text-gray-700 border border-gray-300';
  return 'bg-gray-100 text-gray-600';
}

export default function WordsVsActions({ items, partyColor }: WordsVsActionsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  if (!items || items.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-400 text-center py-8">
          말과 행동 분석 데이터가 없습니다.
        </p>
      </div>
    );
  }

  const toggleItem = (idx: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const hasProof = (item: ConsistencyItem) =>
    item.speech_date ||
    item.speech_source ||
    item.speech_quote ||
    item.vote_date ||
    item.vote_bill ||
    item.vote_result ||
    item.vote_source;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const consistent = item.is_consistent;
        const isOpen = expandedItems.has(idx);
        const hasDetail = hasProof(item);

        return (
          <div
            key={idx}
            className={`rounded-xl border bg-white shadow-sm transition-shadow duration-200 ${
              isOpen ? 'shadow-md' : 'hover:shadow'
            }`}
          >
            {/* Collapsed view - always visible */}
            <button
              type="button"
              onClick={() => hasDetail && toggleItem(idx)}
              className={`w-full text-left px-4 py-3.5 flex items-center gap-3 ${
                hasDetail ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Consistency badge */}
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  consistent
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {consistent ? '일치' : '불일치'}
              </span>

              {/* Topic */}
              <span className="font-bold text-sm text-gray-900 shrink-0">
                {item.topic}
              </span>

              {/* Explanation as one-liner */}
              {item.explanation && (
                <span className="text-sm text-gray-500 truncate min-w-0">
                  {item.explanation}
                </span>
              )}

              {/* Expand chevron */}
              {hasDetail && (
                <span className="ml-auto shrink-0 text-gray-400">
                  <ChevronIcon open={isOpen} />
                </span>
              )}
            </button>

            {/* Expanded view */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                {/* Two columns on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-4 mt-3">
                  {/* Left: speech record */}
                  <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-4">
                    <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-sm mb-3">
                      <SpeechIcon />
                      발언 기록
                    </div>

                    {/* Speech date */}
                    {item.speech_date && (
                      <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                          {item.speech_date}
                        </span>
                      </div>
                    )}

                    {/* Speech source */}
                    {item.speech_source && (
                      <p className="text-xs text-gray-500 italic mb-2">
                        {item.speech_source}
                      </p>
                    )}

                    {/* Speech stance */}
                    <p className="text-sm text-gray-700 mb-2">{item.speech_stance}</p>

                    {/* Speech quote */}
                    {item.speech_quote && (
                      <blockquote className="relative bg-blue-100/60 border-l-4 border-blue-300 rounded-r-lg px-3 py-2.5 my-2">
                        <span className="absolute -top-1 left-1 text-blue-300 text-2xl leading-none select-none">
                          &#x300C;
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed pl-3 pr-1">
                          {item.speech_quote}
                        </p>
                        <span className="absolute -bottom-1 right-2 text-blue-300 text-2xl leading-none select-none">
                          &#x300D;
                        </span>
                      </blockquote>
                    )}

                    {/* Link */}
                    <div className="mt-3">
                      <a
                        href={OPEN_ASSEMBLY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        발언 원문 확인
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  </div>

                  {/* Center: visual connector (desktop only) */}
                  <div className="hidden md:flex flex-col items-center justify-center py-4 min-w-[48px]">
                    {consistent ? (
                      <>
                        <div className="w-0.5 flex-1 bg-green-300" />
                        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center my-1">
                          <span className="text-green-600 text-sm font-bold">&#10003;</span>
                        </div>
                        <div className="w-0.5 flex-1 bg-green-300" />
                      </>
                    ) : (
                      <>
                        <div className="w-0.5 flex-1 border-l-2 border-dashed border-red-300" />
                        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center my-1">
                          <span className="text-red-600 text-sm font-bold">&#10007;</span>
                        </div>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mt-1">
                          불일치
                        </span>
                        <div className="w-0.5 flex-1 border-l-2 border-dashed border-red-300" />
                      </>
                    )}
                  </div>

                  {/* Mobile connector */}
                  <div className="flex md:hidden items-center gap-2 my-2 px-2">
                    <div
                      className={`flex-1 h-0.5 ${
                        consistent
                          ? 'bg-green-300'
                          : 'border-t-2 border-dashed border-red-300'
                      }`}
                    />
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        consistent
                          ? 'bg-green-100 border-2 border-green-300 text-green-600'
                          : 'bg-red-100 border-2 border-red-300 text-red-600'
                      }`}
                    >
                      {consistent ? '\u2713' : '\u2717'}
                    </div>
                    {!consistent && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        불일치
                      </span>
                    )}
                    <div
                      className={`flex-1 h-0.5 ${
                        consistent
                          ? 'bg-green-300'
                          : 'border-t-2 border-dashed border-red-300'
                      }`}
                    />
                  </div>

                  {/* Right: vote record */}
                  <div
                    className={`rounded-lg border p-4 ${
                      consistent
                        ? 'bg-green-50/70 border-green-100'
                        : 'bg-red-50/40 border-red-100'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 font-semibold text-sm mb-3 ${
                        consistent ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      <VoteIcon />
                      투표 기록
                    </div>

                    {/* Vote date */}
                    {item.vote_date && (
                      <div className="mb-2">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                            consistent
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.vote_date}
                        </span>
                      </div>
                    )}

                    {/* Vote bill */}
                    {item.vote_bill && (
                      <div className="mb-2">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded border border-gray-200">
                          {item.vote_bill}
                        </span>
                      </div>
                    )}

                    {/* Vote stance */}
                    <p className="text-sm text-gray-700 mb-2">{item.vote_stance}</p>

                    {/* Vote result badge */}
                    {item.vote_result && (
                      <div className="mb-2">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${voteResultStyle(
                            item.vote_result
                          )}`}
                        >
                          {item.vote_result}
                        </span>
                      </div>
                    )}

                    {/* Vote source */}
                    {item.vote_source && (
                      <p className="text-xs text-gray-500 italic mb-2">
                        {item.vote_source}
                      </p>
                    )}

                    {/* Link */}
                    <div className="mt-3">
                      <a
                        href={OPEN_ASSEMBLY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center text-xs hover:underline font-medium ${
                          consistent
                            ? 'text-green-600 hover:text-green-800'
                            : 'text-red-600 hover:text-red-800'
                        }`}
                      >
                        투표 기록 확인
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Inconsistency callout */}
                {!consistent && item.explanation && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      발언과 투표가 일치하지 않습니다
                    </p>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
