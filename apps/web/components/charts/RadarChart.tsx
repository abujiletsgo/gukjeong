'use client';
// 레이더 차트 — 국회의원/대통령 종합 평가
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

interface RadarDataPoint {
  category: string;
  value: number;
  fullMark?: number;
}

interface RadarChartProps {
  data?: RadarDataPoint[];
  compareData?: RadarDataPoint[];
  label?: string;
  compareLabel?: string;
  height?: number;
  color?: string;
  compareColor?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{payload[0]?.payload?.category}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}</span>
          <span className="font-medium ml-auto">{entry.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RadarChart({
  data,
  compareData,
  label = '평가',
  compareLabel = '비교',
  height = 320,
  color = '#3b82f6',
  compareColor = '#ef4444',
}: RadarChartProps) {
  if (!data || data.length < 3) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2" aria-hidden="true">📊</div>
          <p>평가 데이터가 부족합니다 (최소 3개 카테고리 필요)</p>
        </div>
      </div>
    );
  }

  // 비교 데이터가 있으면 병합
  const mergedData = data.map((d, i) => ({
    category: d.category,
    [label]: d.value,
    ...(compareData?.[i] ? { [compareLabel]: compareData[i].value } : {}),
    fullMark: d.fullMark || 100,
  }));

  return (
    <div role="region" aria-label={`레이더 차트: ${label}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart data={mergedData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={5}
          />
          <Radar
            name={label}
            dataKey={label}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          {compareData && (
            <Radar
              name={compareLabel}
              dataKey={compareLabel}
              stroke={compareColor}
              fill={compareColor}
              fillOpacity={0.15}
              strokeDasharray="4 4"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {compareData && (
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
