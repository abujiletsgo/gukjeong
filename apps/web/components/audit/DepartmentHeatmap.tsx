'use client';
// 부처별 의심 점수 히트맵
import type { DepartmentScore } from '@/lib/types';
import { getSeverityColor } from '@/lib/utils';

export default function DepartmentHeatmap({ scores }: { scores?: DepartmentScore[] }) {
  if (!scores || scores.length === 0) {
    return <p className="text-gray-400 text-center py-8">데이터 준비 중</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {scores.map((s) => (
        <div
          key={s.department}
          className="rounded-lg p-4 text-center text-white"
          style={{ backgroundColor: getSeverityColor(s.suspicionScore) }}
        >
          <div className="font-semibold text-sm">{s.department}</div>
          <div className="text-2xl font-bold mt-1">{s.suspicionScore}</div>
          <div className="text-xs mt-1 opacity-80">플래그 {s.flagCount}건</div>
        </div>
      ))}
    </div>
  );
}
