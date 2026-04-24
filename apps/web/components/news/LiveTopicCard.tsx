'use client';

import { useState } from 'react';
import type { NewsTopic } from '@/lib/types';
import SpectrumColumn from '@/components/news/SpectrumColumn';

interface LiveTopicCardProps {
  cluster: NewsTopic;
}

function getToneBadge(tone: string | null): { label: string; className: string } {
  if (!tone) return { label: '분석 중', className: 'bg-gray-100 text-gray-600' };
  const lower = tone.toLowerCase();
  if (lower.includes('긍정') || lower.includes('환영')) return { label: '긍정적', className: 'bg-green-100 text-green-700' };
  if (lower.includes('비판') || lower.includes('부정')) return { label: '비판적', className: 'bg-red-100 text-red-700' };
  if (lower.includes('우려') || lower.includes('위기')) return { label: '우려', className: 'bg-orange-100 text-orange-700' };
  if (lower.includes('조건부')) return { label: '조건부', className: 'bg-yellow-100 text-yellow-700' };
  return { label: '중립', className: 'bg-gray-100 text-gray-600' };
}

export default function LiveTopicCard({ cluster }: LiveTopicCardProps) {
  const [showArticles, setShowArticles] = useState(false);
  const [showHeadlines, setShowHeadlines] = useState(false);

  const progressiveArticles = cluster.articles.filter(a => a.category === 'progressive');
  const centerArticles = cluster.articles.filter(a => a.category === 'center');
  const conservativeArticles = cluster.articles.filter(a => a.category === 'conservative');

  const pf = cluster.progressive_frame;
  const mf = cluster.moderate_frame;
  const cf = cluster.conservative_frame;
  const progTone = getToneBadge(pf?.tone ?? null);
  const modTone = getToneBadge(mf?.tone ?? null);
  const consTone = getToneBadge(cf?.tone ?? null);

  const hasHeadlines = pf?.headline || mf?.headline || cf?.headline;
  const hasFrames = pf?.emphasis || mf?.emphasis || cf?.emphasis;

  return (
    <article className="card">
      {/* Header: date + category + article count + perspective badge */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {cluster.event_date && (
          <time className="text-sm text-gray-500">{cluster.event_date}</time>
        )}
        {cluster.category && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {cluster.category}
          </span>
        )}
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          기사 {cluster.article_count}건
        </span>
        {cluster.has_multiple_perspectives && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-900 text-white">
            다양한 시각
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{cluster.title}</h2>

      {/* AI Summary */}
      {cluster.ai_summary && (
        <div className="flex items-start gap-2 mb-4">
          <span className="ai-badge shrink-0 mt-0.5">AI 요약</span>
          <p className="text-sm text-gray-700 leading-relaxed">{cluster.ai_summary}</p>
        </div>
      )}

      {/* Key Facts */}
      {cluster.key_facts && cluster.key_facts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-5">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">핵심 사실</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {cluster.key_facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Frame Comparison: 진보 / 중도 / 보수 */}
      {hasFrames && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Progressive */}
          <div className="rounded-lg p-4 bg-[#eff6ff] border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
              <h4 className="font-semibold text-sm text-blue-800">진보 프레임</h4>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${progTone.className}`}>
                {progTone.label}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed mb-2">
              {pf?.emphasis || '보도 없음'}
            </p>
            {pf?.tone && <p className="text-xs text-blue-600">{pf.tone}</p>}
            {showHeadlines && pf?.headline && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-1">대표 헤드라인</p>
                <p className="text-sm text-gray-700 italic">&ldquo;{pf.headline}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Moderate */}
          <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-500 shrink-0" />
              <h4 className="font-semibold text-sm text-gray-700">중도 프레임</h4>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${modTone.className}`}>
                {modTone.label}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed mb-2">
              {mf?.emphasis || '보도 없음'}
            </p>
            {mf?.tone && <p className="text-xs text-gray-500">{mf.tone}</p>}
            {showHeadlines && mf?.headline && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-xs font-medium text-gray-600 mb-1">대표 헤드라인</p>
                <p className="text-sm text-gray-700 italic">&ldquo;{mf.headline}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Conservative */}
          <div className="rounded-lg p-4 bg-[#fef2f2] border border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-600 shrink-0" />
              <h4 className="font-semibold text-sm text-red-800">보수 프레임</h4>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${consTone.className}`}>
                {consTone.label}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed mb-2">
              {cf?.emphasis || '보도 없음'}
            </p>
            {cf?.tone && <p className="text-xs text-red-600">{cf.tone}</p>}
            {showHeadlines && cf?.headline && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs font-medium text-red-700 mb-1">대표 헤드라인</p>
                <p className="text-sm text-gray-700 italic">&ldquo;{cf.headline}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Headline toggle */}
      {hasHeadlines && (
        <button
          onClick={() => setShowHeadlines(prev => !prev)}
          className="mb-4 text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showHeadlines ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {showHeadlines ? '대표 헤드라인 접기' : '대표 헤드라인 보기'}
        </button>
      )}

      {/* Citizen Takeaway */}
      {cluster.citizen_takeaway && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-amber-800 mb-1">시민이 알아야 할 것</h3>
          <p className="text-sm text-amber-900 leading-relaxed">{cluster.citizen_takeaway}</p>
        </div>
      )}

      {/* Article list (collapsible) */}
      {cluster.articles.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setShowArticles(prev => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showArticles ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            매체별 보도 비교 ({cluster.articles.length}건)
          </button>
          {showArticles && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SpectrumColumn
                title="진보 언론"
                articles={progressiveArticles}
                colorClass="bg-blue-50 border-blue-200"
                emptyLabel="해당 매체 보도 없음"
              />
              <SpectrumColumn
                title="중도 언론"
                articles={centerArticles}
                colorClass="bg-gray-50 border-gray-200"
                emptyLabel="해당 매체 보도 없음"
              />
              <SpectrumColumn
                title="보수 언론"
                articles={conservativeArticles}
                colorClass="bg-rose-50 border-rose-200"
                emptyLabel="해당 매체 보도 없음"
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
