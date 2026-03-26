'use client';
// 스파크라인 — 소형 인라인 트렌드 차트

interface SparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  label?: string;
}

export default function Sparkline({
  data,
  width = 120,
  height = 30,
  color = '#ff6b35',
  showArea = false,
  label,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="bg-gray-100 rounded animate-pulse" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / (data.length - 1);

  const points = data
    .map((v, i) => `${padding + i * stepX},${padding + chartHeight - ((v - min) / range) * chartHeight}`)
    .join(' ');

  // Area path for fill
  const areaPath = showArea
    ? `M${padding},${padding + chartHeight} ${data
        .map((v, i) => `L${padding + i * stepX},${padding + chartHeight - ((v - min) / range) * chartHeight}`)
        .join(' ')} L${padding + (data.length - 1) * stepX},${padding + chartHeight} Z`
    : '';

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width} height={height} className="inline-block">
        {showArea && (
          <path d={areaPath} fill={color} opacity={0.1} />
        )}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* 마지막 점 */}
        {data.length > 0 && (
          <circle
            cx={padding + (data.length - 1) * stepX}
            cy={padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight}
            r="2"
            fill={color}
          />
        )}
      </svg>
      {label && <span className="text-[10px] text-gray-400 mt-0.5">{label}</span>}
    </div>
  );
}
