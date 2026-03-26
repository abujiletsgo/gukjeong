'use client';
// 점수 바 — 0-100 범위 시각화

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  label?: string;
  color?: string;
}

export default function ScoreBar({ score, maxScore = 100, label, color }: ScoreBarProps) {
  const percentage = Math.min(100, (score / maxScore) * 100);
  const barColor = color || (
    score <= 20 ? '#22c55e' :
    score <= 40 ? '#eab308' :
    score <= 60 ? '#f97316' :
    score <= 80 ? '#ef4444' : '#1f2937'
  );

  return (
    <div>
      {label && <div className="text-xs text-gray-600 mb-1">{label}</div>}
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="text-xs text-gray-500 text-right mt-0.5">{score}/{maxScore}</div>
    </div>
  );
}
