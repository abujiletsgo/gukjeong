'use client';
// 국가채무 궤적 차트 — 막대(채무) + 라인(GDP대비 비율)
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DebtChartProps {
  data?: Array<{
    year: number;
    national_debt?: number | null;
    debt_to_gdp?: number | null;
    president_id?: string;
  }>;
  height?: number;
}

const PRESIDENT_COLORS: Record<string, string> = {
  ysk: '#6b7280',
  kdj: '#3b82f6',
  nmh: '#10b981',
  lmb: '#ef4444',
  pgh: '#ec4899',
  mji: '#3b82f6',
  ysy: '#ef4444',
  ljm: '#3b82f6',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  const debt = payload.find((p: any) => p.dataKey === 'national_debt');
  const ratio = payload.find((p: any) => p.dataKey === 'debt_to_gdp');
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}년</p>
      {debt && (
        <p className="text-gray-600">국가채무: <span className="font-medium text-gray-900">{debt.value?.toFixed(0)}조원</span></p>
      )}
      {ratio && ratio.value && (
        <p className="text-gray-600">GDP 대비: <span className="font-medium text-gray-900">{ratio.value?.toFixed(1)}%</span></p>
      )}
    </div>
  );
}

export default function DebtChart({ data, height = 400 }: DebtChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 채무 비율이 없는 연도에 보간값 추가
  const interpolatedData = data.map((d, i) => {
    if (d.debt_to_gdp) return d;
    // 가장 가까운 이전/이후 값으로 선형 보간
    let prevIdx = -1, nextIdx = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (data[j].debt_to_gdp) { prevIdx = j; break; }
    }
    for (let j = i + 1; j < data.length; j++) {
      if (data[j].debt_to_gdp) { nextIdx = j; break; }
    }
    if (prevIdx >= 0 && nextIdx >= 0) {
      const t = (i - prevIdx) / (nextIdx - prevIdx);
      const interpolated = (data[prevIdx].debt_to_gdp! * (1 - t)) + (data[nextIdx].debt_to_gdp! * t);
      return { ...d, debt_to_gdp: Math.round(interpolated * 10) / 10 };
    }
    return d;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={interpolatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}조`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 60]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          yAxisId="left"
          dataKey="national_debt"
          name="국가채무 (조원)"
          fill="#3b82f6"
          fillOpacity={0.7}
          radius={[2, 2, 0, 0]}
          animationDuration={1000}
          animationEasing="ease-out"
        />
        <Line
          yAxisId="right"
          dataKey="debt_to_gdp"
          name="GDP 대비 (%)"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
