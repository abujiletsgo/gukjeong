'use client';
// 기관별 의심 점수 히트맵 — 계층 구조, 접기/펼치기, 리스크 그룹핑
import { useState, useMemo } from 'react';
import type { DepartmentScore } from '@/lib/types';
import { getSeverityColor } from '@/lib/utils';

interface DepartmentHeatmapProps {
  scores?: DepartmentScore[];
  onDepartmentClick?: (department: string) => void;
}

// ── Risk tier config ──
const RISK_TIERS = [
  { key: 'critical', label: '점검 권고', min: 60, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', icon: '!' },
  { key: 'watch', label: '관심 관찰', min: 35, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', icon: '~' },
  { key: 'normal', label: '정상 범위', min: 0, color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', icon: '' },
] as const;

// ── Group institutions by parent org ──
function groupByParent(scores: DepartmentScore[]): Record<string, DepartmentScore[]> {
  const groups: Record<string, DepartmentScore[]> = {};
  for (const s of scores) {
    const name = s.department;
    // Extract parent: "조달청 서울지방조달청" → "조달청", "경기도교육청 용인교육지원청" → "경기도교육청"
    const parts = name.split(' ');
    const parent = parts.length > 1 ? parts[0] : '기타 기관';
    if (!groups[parent]) groups[parent] = [];
    groups[parent].push(s);
  }
  return groups;
}

// ── Score bar (mini inline bar) ──
function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: getSeverityColor(score) }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color: getSeverityColor(score) }}>
        {score}
      </span>
    </div>
  );
}

// ── Institution row ──
function InstitutionRow({
  score,
  onClick,
  compact,
}: {
  score: DepartmentScore;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left group"
    >
      <span className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-700 group-hover:text-gray-900 truncate flex-1`}>
        {score.department}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-gray-400">{score.flag_count}건</span>
        <ScoreBar score={score.suspicion_score} />
      </div>
    </button>
  );
}

// ── Collapsible parent group ──
function ParentGroup({
  parent,
  children,
  onDepartmentClick,
  defaultOpen,
}: {
  parent: string;
  children: DepartmentScore[];
  onDepartmentClick?: (dept: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const maxScore = Math.max(...children.map(c => c.suspicion_score));
  const totalFlags = children.reduce((s, c) => s + c.flag_count, 0);
  const sorted = [...children].sort((a, b) => b.suspicion_score - a.suspicion_score);

  // Single institution — no need for group
  if (children.length === 1) {
    return (
      <InstitutionRow
        score={children[0]}
        onClick={() => onDepartmentClick?.(children[0].department)}
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-semibold text-gray-800 truncate">{parent}</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{children.length}개 기관</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-gray-400">{totalFlags}건</span>
          <ScoreBar score={maxScore} />
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-50 bg-gray-50/30 pl-4 pr-1 py-1">
          {sorted.map(s => (
            <InstitutionRow
              key={s.department}
              score={s}
              onClick={() => onDepartmentClick?.(s.department)}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main heatmap component ──
export default function DepartmentHeatmap({ scores, onDepartmentClick }: DepartmentHeatmapProps) {
  const [expandedTier, setExpandedTier] = useState<string | null>('critical');

  // Group by risk tier, then by parent org
  const tieredData = useMemo(() => {
    if (!scores || scores.length === 0) return [];

    return RISK_TIERS.map(tier => {
      const tierScores = scores.filter(s =>
        s.suspicion_score >= tier.min &&
        (tier.min === 60 ? true : tier.min === 35 ? s.suspicion_score < 60 : s.suspicion_score < 35)
      );
      const groups = groupByParent(tierScores);
      // Sort groups by max score
      const sortedGroups = Object.entries(groups)
        .sort((a, b) => {
          const maxA = Math.max(...a[1].map(s => s.suspicion_score));
          const maxB = Math.max(...b[1].map(s => s.suspicion_score));
          return maxB - maxA;
        });

      return {
        ...tier,
        count: tierScores.length,
        totalFlags: tierScores.reduce((s, c) => s + c.flag_count, 0),
        groups: sortedGroups,
      };
    });
  }, [scores]);

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">&#x1F3DB;&#xFE0F;</div>
        <p>기관별 의심 점수 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Summary bar (always visible) ── */}
      <div className="flex gap-2">
        {tieredData.map(tier => (
          <button
            key={tier.key}
            onClick={() => setExpandedTier(expandedTier === tier.key ? null : tier.key)}
            className={`flex-1 rounded-xl p-3 text-center transition-all border-2 ${
              expandedTier === tier.key
                ? `${tier.bg} ${tier.border} shadow-sm`
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="text-2xl font-bold" style={{ color: tier.color }}>
              {tier.count}
            </div>
            <div className="text-[10px] font-medium text-gray-500 mt-0.5">{tier.label}</div>
            <div className="text-[10px] text-gray-400">{tier.totalFlags}건</div>
          </button>
        ))}
      </div>

      {/* ── Expanded tier detail ── */}
      {tieredData.map(tier => {
        if (expandedTier !== tier.key || tier.count === 0) return null;

        return (
          <div
            key={tier.key}
            className={`rounded-xl border ${tier.border} ${tier.bg} p-3 space-y-1.5`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-xs font-semibold text-gray-700">
                  {tier.label} ({tier.count}개 기관)
                </span>
              </div>
              <button
                onClick={() => setExpandedTier(null)}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                접기
              </button>
            </div>

            <div className="bg-white/60 rounded-lg divide-y divide-gray-50">
              {tier.groups.map(([parent, children]) => (
                <ParentGroup
                  key={parent}
                  parent={parent}
                  children={children}
                  onDepartmentClick={onDepartmentClick}
                  defaultOpen={tier.key === 'critical' && children.length <= 8}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
