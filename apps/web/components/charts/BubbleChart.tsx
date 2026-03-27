'use client';
// 버블 차트 — 국제 비교 시각화 (Recharts ScatterChart 기반)
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, Cell,
} from 'recharts';

interface BubbleDataPoint {
  name: string;
  x: number;
  y: number;
  z: number; // 버블 크기
  color?: string;
}

interface BubbleChartProps {
  data?: BubbleDataPoint[];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#d97706', '#6366f1',
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
      <div className="space-y-0.5 text-xs text-gray-600">
        <p>X: <span className="font-medium">{item.x?.toLocaleString()}</span></p>
        <p>Y: <span className="font-medium">{item.y?.toLocaleString()}</span></p>
        <p>크기: <span className="font-medium">{item.z?.toLocaleString()}</span></p>
      </div>
    </div>
  );
}

export default function BubbleChart({
  data,
  xLabel = 'X축',
  yLabel = 'Y축',
  zLabel = '크기',
  height = 400,
}: BubbleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2" aria-hidden="true">🫧</div>
          <p>비교 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label={`버블 차트: ${xLabel} vs ${yLabel}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            label={{ value: xLabel, position: 'bottom', fontSize: 12, fill: '#9ca3af' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af' }}
          />
          <ZAxis
            type="number"
            dataKey="z"
            name={zLabel}
            range={[40, 400]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={data}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                fillOpacity={0.7}
                stroke={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
