'use client';
// 버블 차트 — 국제 비교 시각화 (추후 구현)

interface BubbleChartProps {
  data?: any[];
  height?: number;
}

export default function BubbleChart({ data, height = 400 }: BubbleChartProps) {
  return (
    <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-400">버블 차트 준비 중</p>
    </div>
  );
}
