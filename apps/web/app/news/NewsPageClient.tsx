'use client';
// 뉴스 프레임 비교 — 클라이언트 컴포넌트
// Live mode: /api/news/live (real RSS articles)
// Demo mode: seed data passed as props

import { useState, useMemo, useEffect } from 'react';
import { useDataMode } from '@/lib/context/DataModeContext';
import type { NewsEvent, MediaOutlet } from '@/lib/types';
import KPI from '@/components/common/KPI';
import MediaSpectrum from '@/components/news/MediaSpectrum';
import FrameComparison from '@/components/news/FrameComparison';
import NewsCluster from '@/components/news/NewsCluster';

const CATEGORIES = ['전체', '경제', '정치', '사회', '과학기술', '복지'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'articles', label: '기사수 많은순' },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]['value'];

// ── Real RSS article type ──
interface RealRSSArticle {
  outlet_id: string;
  outlet_name: string;
  title: string;
  link?: string;
  pub_date?: string;
  description?: string;
  spectrum_score?: number;
  category?: string;
}

interface RealNewsData {
  total: number;
  outlets: number;
  outlet_counts: Record<string, number>;
  timestamp: string;
  articles: RealRSSArticle[];
  error?: string;
}

interface NewsPageClientProps {
  events: NewsEvent[];
  outlets: MediaOutlet[];
}

export default function NewsPageClient({ events, outlets }: NewsPageClientProps) {
  const { isDemo } = useDataMode();

  // Real data state
  const [realNews, setRealNews] = useState<RealNewsData | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // Shared filter state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('전체');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Fetch real news in live mode
  useEffect(() => {
    if (isDemo) return;
    setLiveLoading(true);
    fetch('/api/news/live')
      .then(r => r.json())
      .then((data: RealNewsData) => {
        setRealNews(data);
        setLiveLoading(false);
      })
      .catch(() => setLiveLoading(false));
  }, [isDemo]);

  // ── LIVE MODE rendering ──
  if (!isDemo) {
    const articles = realNews?.articles ?? [];
    const totalArticles = articles.length;
    const outletCount = realNews?.outlets ?? 0;

    // Group articles by outlet
    const outletCounts = realNews?.outlet_counts ?? {};

    return (
      <div className="container-page py-8">
        <h1 className="section-title">뉴스 실시간 피드</h1>
        <p className="text-gray-600 mb-4">
          주요 언론사의 최신 기사를 실시간 RSS 피드로 수집합니다.
        </p>

        {/* Real data banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold text-emerald-800">실시간 RSS 피드</p>
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            {realNews?.timestamp ? new Date(realNews.timestamp).toLocaleString('ko-KR') : ''} 기준 | {outletCount}개 언론사 모니터링 중
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPI label="수집된 기사" value={totalArticles.toLocaleString()} />
          <KPI label="모니터링 매체" value={String(outletCount)} />
          <KPI label="최신 수집 시각" value={realNews?.timestamp ? new Date(realNews.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'} />
          <KPI label="매체별 평균" value={outletCount > 0 ? `${Math.round(totalArticles / outletCount)}건` : '-'} />
        </div>

        {/* Media Spectrum */}
        <div className="card mb-8">
          <h2 className="font-bold text-lg mb-4">미디어 스펙트럼</h2>
          <p className="text-sm text-gray-500 mb-4">
            각 매체의 정치적 성향을 학술 연구 기반으로 분류한 스펙트럼입니다.
          </p>
          <MediaSpectrum outlets={outlets} />
        </div>

        {/* Loading */}
        {liveLoading && (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full mx-auto mb-4" />
            <p>실시간 뉴스 피드를 불러오는 중...</p>
          </div>
        )}

        {/* Outlet breakdown */}
        {!liveLoading && Object.keys(outletCounts).length > 0 && (
          <div className="card mb-6">
            <h2 className="font-bold text-lg mb-3">언론사별 기사 수</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Object.entries(outletCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([outletId, count]) => (
                  <div key={outletId} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-700 truncate">{outletId}</div>
                    <div className="text-lg font-bold text-gray-900">{count}<span className="text-xs font-normal text-gray-400 ml-0.5">건</span></div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Article list */}
        {!liveLoading && articles.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-lg mb-4">최신 기사</h2>
            <div className="space-y-3">
              {articles.slice(0, 50).map((article, i) => (
                <div key={`${article.outlet_id}-${i}`} className="border-b border-gray-50 pb-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 shrink-0 mt-0.5">
                      {article.outlet_name || article.outlet_id}
                    </span>
                    <div className="flex-1 min-w-0">
                      {article.link ? (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors leading-snug"
                        >
                          {article.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-800 leading-snug">{article.title}</p>
                      )}
                      {article.pub_date && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(article.pub_date).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {articles.length > 50 && (
              <p className="text-xs text-gray-400 mt-4 text-center">
                총 {articles.length}건 중 최신 50건 표시
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!liveLoading && articles.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-400">실시간 뉴스 피드를 불러올 수 없습니다.</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8">
          * 미디어 분류는 학술 연구 기반 참고 분류입니다.
        </p>
      </div>
    );
  }

  // ── DEMO MODE (original code) ──
  const totalArticles = useMemo(
    () => events.reduce((sum, e) => sum + (e.article_count ?? 0), 0),
    [events],
  );

  const uniqueOutletCount = useMemo(() => outlets.length, [outlets]);

  const latestEvent = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      (b.event_date ?? '').localeCompare(a.event_date ?? ''),
    );
    return sorted[0];
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (categoryFilter !== '전체') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => (b.event_date ?? '').localeCompare(a.event_date ?? ''));
    } else {
      result.sort((a, b) => (b.article_count ?? 0) - (a.article_count ?? 0));
    }

    return result;
  }, [events, categoryFilter, sortBy]);

  const toggleExpand = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const truncate = (text: string, maxLen: number) =>
    text.length > maxLen ? text.slice(0, maxLen) + '...' : text;

  return (
    <div className="container-page py-8">
      {/* Page Header */}
      <h1 className="section-title">뉴스 프레임 비교</h1>
      <p className="text-gray-600 mb-8">
        같은 사건에 대한 서로 다른 미디어의 보도 프레임을 비교합니다.
      </p>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI label="분석된 이벤트" value={String(events.length)} />
        <KPI
          label="총 기사 수"
          value={totalArticles.toLocaleString()}
        />
        <KPI label="모니터링 매체 수" value={String(uniqueOutletCount)} />
        <KPI
          label="오늘의 주요 이슈"
          value={latestEvent ? truncate(latestEvent.title, 16) : '-'}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Global Media Spectrum Bar */}
      <div className="card mb-8">
        <h2 className="font-bold text-lg mb-4">미디어 스펙트럼</h2>
        <p className="text-sm text-gray-500 mb-4">
          각 매체의 정치적 성향을 학술 연구 기반으로 분류한 스펙트럼입니다.
        </p>
        <MediaSpectrum outlets={outlets} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-1">분야:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        {filteredEvents.length}건의 뉴스 이벤트
      </p>

      {/* News Event Cards */}
      <div className="space-y-8">
        {filteredEvents.map((event) => {
          const isExpanded = expandedEvents.has(event.id);
          return (
            <article key={event.id} className="card">
              {/* Header: date + category */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {event.event_date && (
                  <time className="text-sm text-gray-500">{event.event_date}</time>
                )}
                {event.category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {event.category}
                  </span>
                )}
                {event.article_count != null && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    기사 {event.article_count.toLocaleString()}건
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                {event.title}
              </h2>

              {/* AI Summary */}
              {event.ai_summary && (
                <div className="flex items-start gap-2 mb-4">
                  <span className="ai-badge shrink-0 mt-0.5">AI 요약</span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {event.ai_summary}
                  </p>
                </div>
              )}

              {/* Key Facts */}
              {event.key_facts && event.key_facts.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-5">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    핵심 사실
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {event.key_facts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Frame Comparison */}
              <FrameComparison event={event} />

              {/* Citizen Takeaway */}
              {event.citizen_takeaway && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-amber-800 mb-1">
                    시민이 알아야 할 것
                  </h3>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {event.citizen_takeaway}
                  </p>
                </div>
              )}

              {/* Expand/Collapse for Coverage */}
              {event.coverage && event.coverage.length > 0 && (
                <div className="mt-5">
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    매체별 보도 비교 ({event.coverage.length}개 매체)
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <MediaSpectrum outlets={outlets} coverage={event.coverage} />
                      <NewsCluster coverage={event.coverage} />
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400">해당 분야의 뉴스 이벤트가 없습니다.</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 mt-8">
        * 미디어 분류는 학술 연구 기반 참고 분류입니다.
      </p>
    </div>
  );
}
