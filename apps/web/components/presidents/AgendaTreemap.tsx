'use client';
// 국정과제 트리맵 — 예산 크기 + 완료율 색상 (Recharts)
import { useMemo, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { NationalAgenda } from '@/lib/types';
import { formatKRW } from '@/lib/utils';

interface AgendaTreemapProps {
  agendaItems: NationalAgenda[];
  height?: number;
}

function getCompletionColor(rate: number): string {
  if (rate >= 80) return '#22c55e';
  if (rate >= 60) return '#84cc16';
  if (rate >= 40) return '#f59e0b';
  if (rate >= 20) return '#f97316';
  return '#ef4444';
}

function getCompletionLabel(rate: number): string {
  if (rate >= 80) return '우수';
  if (rate >= 60) return '양호';
  if (rate >= 40) return '보통';
  if (rate >= 20) return '미흡';
  return '부진';
}

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  completion_rate?: number;
  agenda_number?: number;
  depth?: number;
  index?: number;
}

function CustomTreemapContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  completion_rate = 0,
  agenda_number,
  depth,
  index = 0,
}: CustomContentProps) {
  if (depth !== 1 || width < 4 || height < 4) return null;

  const color = getCompletionColor(completion_rate);
  const showLabel = width > 50 && height > 30;
  const showNumber = width > 30 && height > 20;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.85}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
        className="transition-opacity duration-200 hover:opacity-100 cursor-pointer"
      />
      {showNumber && (
        <text
          x={x + width / 2}
          y={y + (showLabel ? height / 2 - 6 : height / 2 + 4)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={showLabel ? 10 : 9}
          fontWeight="700"
          fill="#fff"
          fillOpacity={0.95}
        >
          {agenda_number ? `#${agenda_number}` : ''}
        </text>
      )}
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(10, width / 8)}
          fill="#fff"
          fillOpacity={0.85}
        >
          {name && name.length > Math.floor(width / 8)
            ? name.slice(0, Math.floor(width / 8)) + '...'
            : name}
        </text>
      )}
    </g>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: getCompletionColor(data.completion_rate || 0) }}
        />
        <p className="font-bold text-gray-900">
          {data.agenda_number ? `#${data.agenda_number} ` : ''}{data.name}
        </p>
      </div>
      {data.goal_category && (
        <p className="text-xs text-gray-500 mb-1">{data.goal_category}</p>
      )}
      <div className="space-y-1 mt-2">
        {data.budget_committed != null && (
          <div className="flex justify-between">
            <span className="text-gray-500">배정 예산</span>
            <span className="font-medium">{formatKRW(data.budget_committed)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">이행률</span>
          <span className="font-medium" style={{ color: getCompletionColor(data.completion_rate || 0) }}>
            {(data.completion_rate || 0).toFixed(0)}%
            <span className="text-gray-400 ml-1 text-xs">
              ({getCompletionLabel(data.completion_rate || 0)})
            </span>
          </span>
        </div>
        {data.implementation_status && (
          <div className="flex justify-between">
            <span className="text-gray-500">상태</span>
            <span className="font-medium">{data.implementation_status}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendaTreemap({ agendaItems, height = 400 }: AgendaTreemapProps) {
  if (!agendaItems || agendaItems.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">국정과제 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const treemapData = useMemo(() => {
    // Group by goal_category
    const groups: Record<string, any[]> = {};
    for (const item of agendaItems) {
      const cat = item.goal_category || '기타';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        name: item.title,
        size: Math.max(item.budget_committed || 1, 1),
        completion_rate: item.completion_rate,
        agenda_number: item.agenda_number,
        goal_category: cat,
        implementation_status: item.implementation_status,
        budget_committed: item.budget_committed,
      });
    }

    return Object.entries(groups).map(([category, children]) => ({
      name: category,
      children,
    }));
  }, [agendaItems]);

  return (
    <div className="animate-fade-in">
      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500">
        <span className="font-medium text-gray-700">이행률:</span>
        {[
          { label: '80%+', color: '#22c55e' },
          { label: '60-79%', color: '#84cc16' },
          { label: '40-59%', color: '#f59e0b' },
          { label: '20-39%', color: '#f97316' },
          { label: '0-19%', color: '#ef4444' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<CustomTreemapContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
