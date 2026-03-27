'use client';

import { useState, useMemo } from 'react';
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

interface NewsPageClientProps {
  events: NewsEvent[];
  outlets: MediaOutlet[];
}

export default function NewsPageClient({ events, outlets }: NewsPageClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('전체');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

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
                      {/* Mini spectrum for this event */}
                      <MediaSpectrum outlets={outlets} coverage={event.coverage} />

                      {/* Clustered headlines */}
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
