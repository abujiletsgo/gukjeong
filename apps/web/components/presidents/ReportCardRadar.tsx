'use client';
// 대통령 성과 레이더 차트 — 6축 분야별 평가 (Recharts)
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { ReportCardMetric } from '@/lib/types';

interface ScoreItem {
  category: string;
  score: number;
}

interface ReportCardRadarProps {
  scores?: ScoreItem[];
  metrics?: ReportCardMetric[];
  color?: string;
  label?: string;
  compareScores?: ScoreItem[];
  compareColor?: string;
  compareLabel?: string;
  height?: number;
}

function gradeToScore(grade: string | undefined): number {
  switch (grade) {
    case 'A': return 90;
    case 'B': return 75;
    case 'C': return 55;
    case 'D': return 35;
    case 'F': return 15;
    default: return 50;
  }
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{payload[0]?.payload?.category}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">{entry.value}점</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportCardRadar({
  scores,
  metrics,
  color = '#ff6b35',
  label = '성과',
  compareScores,
  compareColor = '#ef4444',
  compareLabel = '비교',
  height = 340,
}: ReportCardRadarProps) {
  // metrics가 제공되면 카테고리별 평균 점수 계산
  let effectiveScores = scores;
  if (!effectiveScores && metrics) {
    const categoryMap = new Map<string, { total: number; count: number }>();
    for (const m of metrics) {
      const cat = m.category;
      const score = gradeToScore(m.grade);
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.total += score;
        existing.count += 1;
      } else {
        categoryMap.set(cat, { total: score, count: 1 });
      }
    }
    effectiveScores = Array.from(categoryMap.entries()).map(([cat, data]) => ({
      category: cat,
      score: Math.round(data.total / data.count),
    }));
  }

  if (!effectiveScores || effectiveScores.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">성과 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  if (effectiveScores.length < 3) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        충분한 데이터가 없습니다 (최소 3개 카테고리 필요)
      </div>
    );
  }

  // Merge scores with comparison if provided
  const data = effectiveScores.map((item) => {
    const compareItem = compareScores?.find((c) => c.category === item.category);
    return {
      category: item.category,
      [label]: item.score,
      ...(compareItem ? { [compareLabel]: compareItem.score } : {}),
    };
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fontSize: 12,
              fill: '#374151',
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name={label}
            dataKey={label}
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
          />
          {compareScores && (
            <Radar
              name={compareLabel}
              dataKey={compareLabel}
              stroke={compareColor}
              fill={compareColor}
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: compareColor }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {compareScores && (
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
