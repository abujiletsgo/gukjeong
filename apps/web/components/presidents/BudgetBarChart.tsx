'use client';
// 예산 비교 차트 — 공약/확정/집행 비교 (Recharts BarChart)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { BudgetComparison } from '@/lib/data';

interface BudgetBarChartProps {
  data: BudgetComparison[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-gray-600">
          <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium">{p.value}조원</span>
        </p>
      ))}
      {payload[0]?.payload?.execution_rate !== undefined && (
        <p className="text-gray-500 text-xs mt-1 border-t pt-1">
          집행률: {payload[0].payload.execution_rate.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export default function BudgetBarChart({ data, height = 350 }: BudgetBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        예산 비교 데이터 없음
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="area"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v: number) => `${v}조`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="pledged" name="공약 예산" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={14} />
        <Bar dataKey="approved" name="확정 예산" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={14} />
        <Bar dataKey="executed" name="집행액" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 집행률 순위 바
export function ExecutionRateRanking({ data }: { data: BudgetComparison[] }) {
  const sorted = [...data].sort((a, b) => b.execution_rate - a.execution_rate);

  return (
    <div className="space-y-2.5">
      {sorted.map((item, i) => {
        const rate = item.execution_rate;
        const color = rate >= 90 ? '#22c55e' : rate >= 70 ? '#f59e0b' : '#ef4444';

        return (
          <div key={item.area} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
            <span className="text-sm text-gray-700 w-24 sm:w-28 truncate">{item.area}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs font-bold min-w-[42px] text-right" style={{ color }}>
              {rate.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
