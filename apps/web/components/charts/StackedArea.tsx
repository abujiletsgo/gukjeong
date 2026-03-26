'use client';
// 스택드 에리어 차트 — 연도별 분야 지출 추이 (Recharts)
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface StackedAreaProps {
  data?: Array<Record<string, any>>;
  sectors?: string[];
  xKey?: string;
  height?: number;
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
  '#14b8a6',
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}년</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}</span>
          <span className="font-medium ml-auto">{entry.value?.toFixed(1)}조</span>
        </div>
      ))}
    </div>
  );
}

export default function StackedArea({
  data,
  sectors,
  xKey = 'year',
  height = 400,
}: StackedAreaProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const sectorKeys = sectors || Object.keys(data[0]).filter(k => k !== xKey && k !== 'total');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}조`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        {sectorKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={SECTOR_COLORS[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            fill={SECTOR_COLORS[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
