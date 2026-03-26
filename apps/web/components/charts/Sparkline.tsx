'use client';
// 스파크라인 — 소형 인라인 트렌드 차트
export default function Sparkline({
  data,
  width = 120,
  height = 30,
  color = '#ff6b35',
}: {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="bg-gray-100 rounded" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}
