'use client';
// 공약 이행률 원형 게이지 — SVG 프로그레스 링
import { useEffect, useState } from 'react';

interface FulfillmentGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

function getGaugeColor(pct: number): string {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function getGaugeBgColor(pct: number): string {
  if (pct >= 70) return '#dcfce7';
  if (pct >= 40) return '#fef3c7';
  return '#fee2e2';
}

export default function FulfillmentGauge({
  percentage,
  size = 140,
  strokeWidth = 10,
  label,
  showLabel = true,
  className = '',
}: FulfillmentGaugeProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;
  const color = getGaugeColor(percentage);
  const bgColor = getGaugeBgColor(percentage);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          {/* 프로그레스 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold tracking-tight"
            style={{
              fontSize: size * 0.22,
              color,
            }}
          >
            {Math.round(percentage)}%
          </span>
          {showLabel && label && (
            <span
              className="text-gray-500 mt-0.5"
              style={{ fontSize: Math.max(10, size * 0.085) }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
