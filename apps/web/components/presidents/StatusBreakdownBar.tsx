'use client';
// 공약 이행 현황 수평 스택 바

interface StatusCount {
  status: string;
  count: number;
  color: string;
}

interface StatusBreakdownBarProps {
  data: StatusCount[];
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  '이행완료': '#22c55e',
  '추진중': '#3b82f6',
  '일부이행': '#f59e0b',
  '미이행': '#ef4444',
  '폐기': '#6b7280',
  '보류': '#a855f7',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#9ca3af';
}

export function getStatusBgClass(status: string): string {
  switch (status) {
    case '이행완료': return 'bg-green-100 text-green-700';
    case '추진중': return 'bg-amber-100 text-amber-700';
    case '일부이행': return 'bg-yellow-100 text-yellow-700';
    case '미이행': return 'bg-rose-100 text-rose-700';
    case '폐기': return 'bg-gray-100 text-gray-600';
    case '보류': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function StatusBreakdownBar({ data, className = '' }: StatusBreakdownBarProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return null;

  return (
    <div className={className}>
      {/* 바 */}
      <div className="flex rounded-full overflow-hidden h-6 bg-gray-100">
        {data.filter(d => d.count > 0).map((d, i) => {
          const widthPct = (d.count / total) * 100;
          return (
            <div
              key={d.status}
              className="flex items-center justify-center text-[10px] font-medium text-white transition-all duration-500 min-w-[20px]"
              style={{
                width: `${widthPct}%`,
                backgroundColor: d.color,
              }}
              title={`${d.status}: ${d.count}건 (${widthPct.toFixed(1)}%)`}
            >
              {widthPct > 12 ? `${d.count}` : ''}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {data.filter(d => d.count > 0).map(d => (
          <div key={d.status} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span>{d.status}</span>
            <span className="font-medium text-gray-800">{d.count}건</span>
          </div>
        ))}
      </div>
    </div>
  );
}
