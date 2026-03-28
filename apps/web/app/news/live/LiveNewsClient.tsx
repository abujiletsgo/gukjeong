'use client';

import { useState, useMemo } from 'react';
import type { RealNewsArticle, RSSFeedSource } from '@/lib/news/rss';

// ---------------------------------------------------------------------------
// Spectrum colors for outlet badges
// ---------------------------------------------------------------------------

const SPECTRUM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  progressive: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  center:      { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  conservative:{ bg: 'bg-red-50',  text: 'text-red-700',  border: 'border-red-200' },
};

const SPECTRUM_DOT: Record<string, string> = {
  progressive: 'bg-blue-500',
  center:      'bg-gray-500',
  conservative:'bg-red-500',
};

type SpectrumFilter = 'all' | 'progressive' | 'center' | 'conservative';

const SPECTRUM_LABELS: { value: SpectrumFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'progressive', label: '진보' },
  { value: 'center', label: '중도' },
  { value: 'conservative', label: '보수' },
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (isNaN(then)) return '';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return new Date(isoDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LiveNewsClientProps {
  initialArticles: RealNewsArticle[];
  totalCount: number;
  feeds: RSSFeedSource[];
}

export default function LiveNewsClient({ initialArticles, totalCount, feeds }: LiveNewsClientProps) {
  const [outletFilter, setOutletFilter] = useState<string>('all');
  const [spectrumFilter, setSpectrumFilter] = useState<SpectrumFilter>('all');
  const [visibleCount, setVisibleCount] = useState(30);

  const filteredArticles = useMemo(() => {
    let result = initialArticles;

    if (outletFilter !== 'all') {
      result = result.filter((a) => a.outlet_id === outletFilter);
    }

    if (spectrumFilter !== 'all') {
      result = result.filter((a) => a.category === spectrumFilter);
    }

    return result;
  }, [initialArticles, outletFilter, spectrumFilter]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);

  // 언론사별 기사 수
  const outletCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of initialArticles) {
      counts[a.outlet_id] = (counts[a.outlet_id] || 0) + 1;
    }
    return counts;
  }, [initialArticles]);

  const now = new Date().toISOString();

  return (
    <div className="bg-body min-h-screen">
      {/* ━━━ HEADER ━━━ */}
      <section className="bg-header text-white">
        <div className="container-page py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-green-400 text-sm font-semibold uppercase tracking-widest">Live RSS Feed</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">실시간 뉴스</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {feeds.length}개 주요 언론사 RSS 피드에서 실시간으로 가져온 <strong className="text-white">{totalCount}개</strong> 기사
          </p>
          <p className="text-gray-500 text-xs mt-1">
            마지막 업데이트: {formatTimestamp(now)}
          </p>
        </div>
      </section>

      {/* ━━━ LIVE DATA BANNER ━━━ */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="container-page flex items-center justify-center gap-2 py-2 text-xs text-green-800">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span><strong>실제 RSS 데이터</strong> -- 이 페이지의 모든 기사는 각 언론사의 공개 RSS 피드에서 실시간으로 수집됩니다.</span>
        </div>
      </div>

      <div className="container-page py-6 sm:py-8">
        {/* ━━━ FILTERS ━━━ */}
        <div className="space-y-4 mb-8">
          {/* Spectrum filter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">성향</h3>
            <div className="flex flex-wrap gap-2">
              {SPECTRUM_LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setSpectrumFilter(value); setVisibleCount(30); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    spectrumFilter === value
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Outlet filter pills */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">언론사</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setOutletFilter('all'); setVisibleCount(30); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  outletFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                전체 ({totalCount})
              </button>
              {feeds.map((feed) => {
                const count = outletCounts[feed.id] || 0;
                const colors = SPECTRUM_COLORS[feed.category];
                const isActive = outletFilter === feed.id;

                return (
                  <button
                    key={feed.id}
                    onClick={() => { setOutletFilter(feed.id); setVisibleCount(30); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-sm'
                        : `${colors.bg} ${colors.text} border ${colors.border} hover:shadow-sm`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : SPECTRUM_DOT[feed.category]}`} />
                    {feed.name}
                    <span className={`text-xs ${isActive ? 'text-gray-300' : 'opacity-60'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ━━━ RESULTS COUNT ━━━ */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredArticles.length}건의 기사
            {(outletFilter !== 'all' || spectrumFilter !== 'all') && (
              <button
                onClick={() => { setOutletFilter('all'); setSpectrumFilter('all'); }}
                className="ml-2 text-accent hover:underline text-xs"
              >
                필터 초기화
              </button>
            )}
          </p>
          <a
            href="/news"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            뉴스 프레임 비교 &rarr;
          </a>
        </div>

        {/* ━━━ ARTICLE LIST ━━━ */}
        {filteredArticles.length === 0 ? (
          <div className="card text-center py-16">
            <svg className="mx-auto mb-4 text-gray-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
            </svg>
            <p className="text-gray-500 text-sm">해당 조건의 기사가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleArticles.map((article, idx) => {
              const colors = SPECTRUM_COLORS[article.category] || SPECTRUM_COLORS.center;

              return (
                <article
                  key={`${article.outlet_id}-${idx}`}
                  className="card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Outlet badge */}
                    <div className="flex-shrink-0 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${SPECTRUM_DOT[article.category]}`} />
                        {article.outlet_name}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h2 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-accent transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h2>
                      </a>

                      {article.description && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {article.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <time className="text-xs text-gray-400" dateTime={article.pubDate}>
                          {timeAgo(article.pubDate)}
                        </time>
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-accent transition-colors flex items-center gap-1"
                        >
                          원문 보기
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {/* Time (desktop) */}
                    <div className="hidden lg:block flex-shrink-0 text-right">
                      <time className="text-xs text-gray-400 whitespace-nowrap" dateTime={article.pubDate}>
                        {new Date(article.pubDate).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ━━━ LOAD MORE ━━━ */}
        {visibleCount < filteredArticles.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisibleCount((c) => c + 30)}
              className="btn-secondary"
            >
              더 보기 ({filteredArticles.length - visibleCount}건 남음)
            </button>
          </div>
        )}

        {/* ━━━ FOOTER NOTE ━━━ */}
        <div className="mt-12 text-center text-xs text-gray-400 space-y-1">
          <p>
            데이터 출처: 각 언론사 공개 RSS 피드 |
            스펙트럼 분류는 학술 연구 기반 참고 분류이며 절대적 판단이 아닙니다.
          </p>
          <p>
            기사 내용에 대한 책임은 각 언론사에 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
