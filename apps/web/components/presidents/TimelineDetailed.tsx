'use client';
// 대통령 상세 타임라인 — 주요 사건 인터랙티브 시각화
import { useState, useMemo } from 'react';
import type { KeyEvent } from '@/lib/types';

interface TimelineDetailedProps {
  events: KeyEvent[];
  onEventClick?: (id: string) => void;
}

const IMPACT_COLORS: Record<string, { dot: string; bg: string; border: string; label: string }> = {
  positive: { dot: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', label: '긍정' },
  negative: { dot: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', label: '부정' },
  neutral: { dot: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', label: '중립' },
};

const CATEGORIES = ['전체', '경제', '외교', '사회', '정치', '기타'] as const;

function getImpactType(event: KeyEvent): string {
  return event.impact_type || 'neutral';
}

function getDotSize(score: number | undefined | null): number {
  if (!score) return 12;
  if (score >= 8) return 20;
  if (score >= 5) return 16;
  return 12;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getYearFromDate(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

export default function TimelineDetailed({
  events,
  onEventClick,
}: TimelineDetailedProps) {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const sorted = [...events].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
    if (activeCategory === '전체') return sorted;
    // Simple keyword-based category matching
    return sorted.filter((e) => {
      const text = `${e.title} ${e.description || ''}`;
      switch (activeCategory) {
        case '경제': return /경제|GDP|성장|물가|금리|고용|실업|예산|세금|무역/.test(text);
        case '외교': return /외교|정상|회담|북한|미국|중국|일본|안보|국방|군사/.test(text);
        case '사회': return /사회|복지|교육|의료|보건|환경|문화|재난|안전/.test(text);
        case '정치': return /정치|선거|국회|법안|개헌|탄핵|사퇴|인사|장관/.test(text);
        default: return true;
      }
    });
  }, [events, activeCategory]);

  // Extract year markers
  const yearMarkers = useMemo(() => {
    if (filteredEvents.length === 0) return [];
    const years = new Set(filteredEvents.map((e) => getYearFromDate(e.event_date)));
    return Array.from(years).sort();
  }, [filteredEvents]);

  if (!events || events.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400 py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">타임라인 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    onEventClick?.(id);
  };

  return (
    <div className="animate-fade-in">
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center text-gray-400 py-8 text-sm">
          해당 카테고리의 사건이 없습니다
        </div>
      ) : (
        <div className="relative">
          {/* Vertical center line */}
          <div className="absolute left-1/2 md:left-6 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 md:translate-x-0" />

          <div className="space-y-0">
            {filteredEvents.map((event, i) => {
              const impact = IMPACT_COLORS[getImpactType(event)] || IMPACT_COLORS.neutral;
              const dotSize = getDotSize(event.significance_score);
              const isExpanded = expandedId === event.id;
              const isRight = i % 2 === 0;
              const currentYear = getYearFromDate(event.event_date);
              const showYearMarker = i === 0 || getYearFromDate(filteredEvents[i - 1].event_date) !== currentYear;

              return (
                <div key={event.id}>
                  {/* Year marker */}
                  {showYearMarker && (
                    <div className="relative flex items-center mb-4 mt-4 first:mt-0">
                      <div className="absolute left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 z-10">
                        <div className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {currentYear}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event card */}
                  <div className={`relative flex items-start gap-4 py-3 ${
                    isRight ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}>
                    {/* Dot on the line */}
                    <div className="absolute left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 z-10 flex items-center justify-center"
                      style={{ top: '1.25rem' }}
                    >
                      <div
                        className="rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                        style={{
                          width: dotSize,
                          height: dotSize,
                          backgroundColor: impact.dot,
                        }}
                      />
                    </div>

                    {/* Card */}
                    <div
                      className={`
                        ml-auto md:ml-16 w-full md:w-auto md:max-w-md
                        cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-200
                        hover:shadow-md
                        ${impact.bg} ${impact.border}
                        ${isExpanded ? 'shadow-md' : 'shadow-sm'}
                      `}
                      onClick={() => handleToggle(event.id)}
                    >
                      {/* Date & impact badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-500 font-medium tabular-nums">
                          {formatEventDate(event.event_date)}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            color: impact.dot,
                            backgroundColor: `${impact.dot}15`,
                          }}
                        >
                          {impact.label}
                        </span>
                        {event.significance_score != null && event.significance_score >= 7 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            중요
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {event.title}
                      </h4>

                      {/* Expanded content */}
                      {isExpanded && event.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200/60">
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                            {event.description}
                          </p>
                          {event.significance_score != null && (
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">중요도:</span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: 10 }).map((_, j) => (
                                  <div
                                    key={j}
                                    className="w-1.5 h-3 rounded-sm"
                                    style={{
                                      backgroundColor:
                                        j < (event.significance_score || 0)
                                          ? impact.dot
                                          : '#e5e7eb',
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-500 ml-1">
                                {event.significance_score}/10
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
