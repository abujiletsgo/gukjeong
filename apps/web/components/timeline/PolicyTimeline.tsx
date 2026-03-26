'use client';
// 정책 타임라인 — 대통령별 주요 정책/사건 수직 타임라인

interface PolicyEvent {
  date: string;
  title: string;
  type?: string;
  description?: string;
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

export default function PolicyTimeline({ events, title }: PolicyTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        등록된 사건이 없습니다.
      </div>
    );
  }

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
            return (
              <div key={i} className="flex items-start gap-4 relative">
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
                  <div className="text-sm font-medium text-gray-800">
                    {event.title}
                  </div>
                  {event.description && (
                    <div className="text-xs text-gray-500 mt-1">{event.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
