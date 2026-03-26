'use client';

import { useState } from 'react';
import type { NewsEvent } from '@/lib/types';

function getToneBadge(tone: string | undefined): { label: string; className: string } {
  if (!tone) return { label: '분석 중', className: 'bg-gray-100 text-gray-600' };

  const lower = tone.toLowerCase();
  if (lower.includes('긍정') || lower.includes('환영')) {
    return { label: '긍정적', className: 'bg-green-100 text-green-700' };
  }
  if (lower.includes('비판') || lower.includes('부정')) {
    return { label: '비판적', className: 'bg-red-100 text-red-700' };
  }
  if (lower.includes('우려') || lower.includes('위기')) {
    return { label: '우려', className: 'bg-orange-100 text-orange-700' };
  }
  if (lower.includes('조건부')) {
    return { label: '조건부', className: 'bg-yellow-100 text-yellow-700' };
  }
  return { label: '중립', className: 'bg-gray-100 text-gray-600' };
}

interface FrameComparisonProps {
  event?: NewsEvent;
}

export default function FrameComparison({ event }: FrameComparisonProps) {
  const [showDetail, setShowDetail] = useState(false);

  if (!event) {
    return (
      <p className="text-gray-400 text-center py-8">뉴스 이벤트 데이터 준비 중</p>
    );
  }

  const progFrame = event.progressive_frame;
  const consFrame = event.conservative_frame;
  const progTone = getToneBadge(progFrame?.tone);
  const consTone = getToneBadge(consFrame?.tone);

  return (
    <div>
      {/* Frame Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progressive Frame */}
        <div className="rounded-lg p-4 bg-[#eff6ff] border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
            <h4 className="font-semibold text-sm text-blue-800">진보 프레임</h4>
            <span
              className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${progTone.className}`}
            >
              {progTone.label}
            </span>
          </div>

          {/* Emphasis */}
          <p className="text-sm text-gray-800 leading-relaxed mb-2">
            {progFrame?.emphasis || '분석 준비 중'}
          </p>

          {/* Tone detail */}
          {progFrame?.tone && (
            <p className="text-xs text-blue-600">{progFrame.tone}</p>
          )}

          {/* Representative headline (expand) */}
          {showDetail && progFrame?.headline && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-1">대표 헤드라인</p>
              <p className="text-sm text-gray-700 italic">
                &ldquo;{progFrame.headline}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Conservative Frame */}
        <div className="rounded-lg p-4 bg-[#fef2f2] border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-600 shrink-0" />
            <h4 className="font-semibold text-sm text-red-800">보수 프레임</h4>
            <span
              className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${consTone.className}`}
            >
              {consTone.label}
            </span>
          </div>

          {/* Emphasis */}
          <p className="text-sm text-gray-800 leading-relaxed mb-2">
            {consFrame?.emphasis || '분석 준비 중'}
          </p>

          {/* Tone detail */}
          {consFrame?.tone && (
            <p className="text-xs text-red-600">{consFrame.tone}</p>
          )}

          {/* Representative headline (expand) */}
          {showDetail && consFrame?.headline && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-red-700 mb-1">대표 헤드라인</p>
              <p className="text-sm text-gray-700 italic">
                &ldquo;{consFrame.headline}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      {(progFrame?.headline || consFrame?.headline) && (
        <button
          onClick={() => setShowDetail((prev) => !prev)}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showDetail ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {showDetail ? '대표 헤드라인 접기' : '대표 헤드라인 보기'}
        </button>
      )}
    </div>
  );
}
