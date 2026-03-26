'use client';
// 부처별 의심 점수 히트맵
import type { DepartmentScore } from '@/lib/types';
import { getSeverityColor, getSeverityLabel } from '@/lib/utils';

interface DepartmentHeatmapProps {
  scores?: DepartmentScore[];
  onDepartmentClick?: (department: string) => void;
}

export default function DepartmentHeatmap({ scores, onDepartmentClick }: DepartmentHeatmapProps) {
  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">🏛️</div>
        <p>부처별 의심 점수 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
      {scores.map((s) => {
        const score = s.suspicion_score;
        const flagCount = s.flag_count;
        const bgColor = getSeverityColor(score);
        const isHighRisk = score > 50;

        return (
          <button
            key={s.department}
            onClick={() => onDepartmentClick?.(s.department)}
            className="rounded-xl p-3 sm:p-4 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden"
            style={{
              backgroundColor: bgColor,
              opacity: Math.max(0.5, score / 100),
            }}
          >
            <div className={`font-semibold text-xs sm:text-sm truncate ${isHighRisk ? 'text-white' : 'text-gray-800'}`}>
              {s.department}
            </div>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${isHighRisk ? 'text-white' : 'text-gray-900'}`}>
              {score}
            </div>
            <div className={`text-[10px] sm:text-xs mt-1 ${isHighRisk ? 'text-white/80' : 'text-gray-600'}`}>
              {getSeverityLabel(score)} · 플래그 {flagCount}건
            </div>
          </button>
        );
      })}
    </div>
  );
}
