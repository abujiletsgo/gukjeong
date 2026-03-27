'use client';
// 레이더 차트 — 국회의원/대통령 종합 평가 (추후 Recharts 연동)

interface RadarChartProps {
  data?: any[];
  height?: number;
}

export default function RadarChart({ data, height = 300 }: RadarChartProps) {
  return (
    <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-400">레이더 차트 준비 중</p>
    </div>
  );
}
