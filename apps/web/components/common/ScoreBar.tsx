'use client';

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  label?: string;
  color?: string;
}

export default function ScoreBar({ score, maxScore = 100, label, color }: ScoreBarProps) {
  const percentage = Math.min(100, (score / maxScore) * 100);

  const barColor = color || (
    score <= 20 ? 'var(--apple-green)' :
    score <= 40 ? 'var(--apple-yellow)' :
    score <= 60 ? 'var(--apple-orange)' :
    score <= 80 ? 'var(--apple-red)' : '#1f2937'
  );

  return (
    <div>
      {label && (
        <div
          style={{ fontSize: 13, color: 'var(--color-label-secondary)', marginBottom: 6, fontWeight: 400 }}
        >
          {label}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxScore}
        aria-label={label ? `${label}: ${score}/${maxScore}` : `${score}/${maxScore}`}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 100,
          background: 'var(--apple-gray-6)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            borderRadius: 100,
            background: barColor,
            transition: 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      </div>
      <div
        style={{ fontSize: 11, color: 'var(--apple-gray-1)', textAlign: 'right', marginTop: 4 }}
        aria-hidden="true"
      >
        {score}/{maxScore}
      </div>
    </div>
  );
}
