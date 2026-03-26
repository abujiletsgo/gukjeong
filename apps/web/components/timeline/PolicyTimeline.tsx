'use client';
// 정책 타임라인 — 대통령별 주요 정책/사건 수직 타임라인 (클릭 확장 상세)
import { useState } from 'react';

interface PolicyEvent {
  date: string;
  title: string;
  type?: string;
  description?: string;
  // 확장 상세 필드
  why_it_matters?: string;
  citizen_impact?: string;
  background?: string;
  what_happened_after?: string;
  related_numbers?: string;
  significance_score?: number;
}

interface PolicyTimelineProps {
  events?: PolicyEvent[];
  title?: string;
}

function getEventColor(type: string | undefined): string {
  switch (type) {
    case 'positive': return '#22c55e';
    case 'negative': return '#ef4444';
    case 'neutral': return '#6b7280';
    default: return '#3b82f6';
  }
}

function getEventIcon(type: string | undefined): string {
  switch (type) {
    case 'positive': return '✓';
    case 'negative': return '!';
    case 'neutral': return '○';
    default: return '●';
  }
}

function hasExpandableContent(event: PolicyEvent): boolean {
  return !!(
    event.why_it_matters ||
    event.citizen_impact ||
    event.background ||
    event.what_happened_after ||
    event.related_numbers ||
    event.significance_score
  );
}

function SignificanceBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] text-gray-400 flex-shrink-0">중요도</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-gray-500">{score}</span>
    </div>
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

export default function PolicyTimeline({ events, title }: PolicyTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        등록된 사건이 없습니다.
      </div>
    );
  }

  const handleToggle = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <div>
      {title && <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>}
      <div className="relative">
        {/* 타임라인 수직선 */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {events.map((event, i) => {
            const color = getEventColor(event.type);
            const icon = getEventIcon(event.type);
            const isExpanded = expandedIndex === i;
            const expandable = hasExpandableContent(event);

            return (
              <div key={i} className="relative">
                <div
                  className={`flex items-start gap-4 relative ${expandable ? 'cursor-pointer' : ''}`}
                  onClick={() => expandable && handleToggle(i)}
                  role={expandable ? 'button' : undefined}
                  tabIndex={expandable ? 0 : undefined}
                  onKeyDown={expandable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(i); } : undefined}
                >
                  {/* 점 */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 z-10"
                    style={{ backgroundColor: color }}
                  >
                    {icon}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 pb-2">
                    <div className="text-xs text-gray-400 mb-0.5">
                      {event.date.replace(/-/g, '.')}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium text-gray-800 ${expandable ? 'hover:text-gray-600' : ''}`}>
                        {event.title}
                      </div>
                      {expandable && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {isExpanded ? '접기 ▲' : '자세히 보기 ▼'}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <div className="text-xs text-gray-500 mt-1">{event.description}</div>
                    )}
                  </div>
                </div>

                {/* 확장 상세 패널 */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div
                    className="ml-10 mt-1 mb-2 bg-gray-50 rounded-lg p-4 space-y-3 border-l-2"
                    style={{ borderColor: color }}
                  >
                    {event.significance_score != null && (
                      <SignificanceBar score={event.significance_score} color={color} />
                    )}

                    {event.why_it_matters && (
                      <DetailSection icon="💡" label="왜 중요한가" content={event.why_it_matters} />
                    )}

                    {event.citizen_impact && (
                      <DetailSection icon="👤" label="시민에게 미친 영향" content={event.citizen_impact} />
                    )}

                    {event.background && (
                      <DetailSection icon="📋" label="배경" content={event.background} />
                    )}

                    {event.what_happened_after && (
                      <DetailSection icon="➡️" label="이후 어떻게 됐나" content={event.what_happened_after} />
                    )}

                    {event.related_numbers && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">📊</span>
                          <span className="text-[11px] font-medium text-gray-400">관련 수치</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-md px-3 py-2">
                          <p className="text-sm font-medium text-gray-800">{event.related_numbers}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
