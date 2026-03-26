'use client';
// 히트맵 — 부처별 의심 점수
import { getSeverityColor, getSeverityLabel } from '@/lib/utils';

interface HeatMapItem {
  label: string;
  value: number;
  secondary?: string;
}

interface HeatMapProps {
  data?: HeatMapItem[];
  height?: number;
  onItemClick?: (item: HeatMapItem) => void;
}

export default function HeatMap({ data, height = 400, onItemClick }: HeatMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">🔥</div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
      {data.map((item) => {
        const bgColor = getSeverityColor(item.value);
        const textColor = item.value > 60 ? '#ffffff' : item.value > 30 ? '#1f2937' : '#1f2937';
        const bgOpacity = Math.min(1, 0.15 + (item.value / 100) * 0.85);

        return (
          <button
            key={item.label}
            onClick={() => onItemClick?.(item)}
            className="rounded-xl p-3 sm:p-4 text-center transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer border"
            style={{
              backgroundColor: bgColor,
              opacity: bgOpacity,
              borderColor: bgColor,
            }}
          >
            <div className="font-semibold text-xs sm:text-sm truncate" style={{ color: textColor }}>
              {item.label}
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1" style={{ color: textColor }}>
              {item.value}
            </div>
            <div className="text-[10px] sm:text-xs mt-1" style={{ color: textColor, opacity: 0.8 }}>
              {getSeverityLabel(item.value)}
            </div>
            {item.secondary && (
              <div className="text-[10px] mt-0.5" style={{ color: textColor, opacity: 0.7 }}>
                {item.secondary}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
