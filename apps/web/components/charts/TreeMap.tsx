'use client';
// TreeMap — 분야별 예산 비중 (Recharts Treemap)
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface TreeMapItem {
  name: string;
  value: number;
  percentage?: number;
  yoy_change?: number;
}

interface TreeMapProps {
  data?: TreeMapItem[];
  height?: number;
  onSectorClick?: (name: string) => void;
}

const SECTOR_COLORS: Record<string, string> = {
  '보건·복지·고용': '#3b82f6',
  '일반·지방행정': '#8b5cf6',
  '교육': '#06b6d4',
  '국방': '#ef4444',
  '산업·중소기업·에너지': '#f97316',
  'R&D': '#10b981',
  '공공질서·안전': '#6366f1',
  'SOC': '#d97706',
  '농림·수산·식품': '#84cc16',
  '환경': '#14b8a6',
  '문화·체육·관광': '#ec4899',
};

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#d97706', '#6366f1',
];

function CustomContent(props: any) {
  const { x, y, width, height, name, value, index, depth, onSectorClick } = props;
  // Skip root node (depth 0) to avoid the double-layer background box
  if (depth === 0) return null;
  if (width < 40 || height < 30) return null;

  const color = SECTOR_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const isClickable = !!onSectorClick;

  return (
    <g
      onClick={() => onSectorClick?.(name)}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
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
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={width > 100 ? 12 : 10}
            fontWeight="600"
            style={{ pointerEvents: 'none' }}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={width > 100 ? 13 : 11}
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {value.toFixed(1)}조
          </text>
        </>
      )}
    </g>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900">{item.name}</p>
      <p className="text-gray-600 mt-1">예산: <span className="font-medium">{item.value?.toFixed(1)}조원</span></p>
      {item.percentage != null && (
        <p className="text-gray-600">비중: <span className="font-medium">{item.percentage?.toFixed(1)}%</span></p>
      )}
      {item.yoy_change != null && (
        <p className={item.yoy_change >= 0 ? 'text-red-500' : 'text-blue-500'}>
          전년 대비: <span className="font-medium">{item.yoy_change >= 0 ? '+' : ''}{item.yoy_change?.toFixed(1)}%</span>
        </p>
      )}
    </div>
  );
}

export default function TreeMapChart({ data, height = 400, onSectorClick }: TreeMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const treemapData = data.map(d => ({
    name: d.name,
    value: d.value,
    percentage: d.percentage,
    yoy_change: d.yoy_change,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={treemapData}
        dataKey="value"
        aspectRatio={4 / 3}
        content={<CustomContent onSectorClick={onSectorClick} />}
        isAnimationActive={true}
        animationDuration={800}
        animationEasing="ease-out"
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
}
