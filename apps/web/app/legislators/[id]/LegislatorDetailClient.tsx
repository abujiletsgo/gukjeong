'use client';

import { useMemo } from 'react';
import type { Legislator } from '@/lib/types';
import Link from 'next/link';
import WordsVsActions from '@/components/legislators/WordsVsActions';

// ── 정당 색상 (배지 전용) ──
const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1A56DB',
  '국민의힘': '#E5243B',
  '조국혁신당': '#6B21A8',
  '진보당': '#E11D48',
  '개혁신당': '#F97316',
  '무소속': '#6B7280',
};

function getPartyColor(party?: string): string {
  if (!party) return '#6B7280';
  return PARTY_COLORS[party] || '#6B7280';
}

function getElectedLabel(count?: number): string {
  if (!count || count <= 0) return '';
  if (count === 1) return '초선';
  if (count === 2) return '재선';
  if (count === 3) return '3선';
  if (count === 4) return '4선';
  return `${count}선`;
}

// ── Props ──
interface LegislatorDetailClientProps {
  legislator: Legislator;
  allLegislators: Legislator[];
}

// ── 비율 바 (neutral gray) ──
function NeutralBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-800">
          {value > 0 ? `${value}%` : '-'}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Radar Chart (Pure SVG) — 활동 프로필 ──
function RadarChart({ legislator, partyColor }: { legislator: Legislator; partyColor: string }) {
  const cx = 150, cy = 150, r = 110;
  const axes = [
    { label: '출석', value: legislator.attendance_rate ?? 0 },
    { label: '법안활동', value: Math.min((legislator.bills_proposed_count ?? 0) / 80 * 100, 100) },
    { label: '발언', value: Math.min((legislator.speech_count ?? 0) / 30 * 100, 100) },
    { label: '투표참여', value: legislator.vote_participation_rate ?? 0 },
    { label: '일관성', value: legislator.consistency_score ?? 0 },
  ];
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function polarToCart(angle: number, radius: number): [number, number] {
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  const gridLevels = [20, 40, 60, 80, 100];
  const gridPaths = gridLevels.map((level) => {
    const ratio = level / 100;
    const points = Array.from({ length: n }, (_, i) => {
      const angle = startAngle + i * angleStep;
      return polarToCart(angle, r * ratio);
    });
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  });

  const dataPoints = axes.map((a, i) => {
    const angle = startAngle + i * angleStep;
    const ratio = Math.min(a.value, 100) / 100;
    return polarToCart(angle, r * ratio);
  });
  const dataPath = dataPoints.map(([x, y]) => `${x},${y}`).join(' ');

  const axisEnds = axes.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return polarToCart(angle, r);
  });
  const labelPositions = axes.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return polarToCart(angle, r + 22);
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[320px] mx-auto">
      {gridPaths.map((path, i) => (
        <polygon key={i} points={path} fill="none" stroke="#e5e7eb" strokeWidth="0.7" />
      ))}
      {axisEnds.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d1d5db" strokeWidth="0.5" />
      ))}
      <polygon points={dataPath} fill={partyColor} fillOpacity="0.15" stroke={partyColor} strokeWidth="2" />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={partyColor} />
      ))}
      {labelPositions.map(([x, y], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-600" fontSize="11" fontWeight="500">
          {axes[i].label}
        </text>
      ))}
      {gridLevels.map((level, i) => {
        const ratio = level / 100;
        const [lx, ly] = polarToCart(startAngle + 0.15, r * ratio);
        return (
          <text key={i} x={lx + 4} y={ly} fontSize="8" className="fill-gray-400" dominantBaseline="middle">
            {level}
          </text>
        );
      })}
    </svg>
  );
}

// ── 동료 비교 미니 카드 ──
function ColleagueCard({ legislator }: { legislator: Legislator }) {
  const partyColor = getPartyColor(legislator.party);
  return (
    <Link href={`/legislators/${legislator.id}`} className="block group">
      <div className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: partyColor }}
          />
          <span className="font-semibold text-sm text-gray-900 group-hover:text-gray-700 transition-colors">
            {legislator.name}
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>출석</span>
            <span className="font-medium text-gray-800">
              {legislator.attendance_rate ? `${legislator.attendance_rate}%` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>발의</span>
            <span className="font-medium text-gray-800">{legislator.bills_proposed_count ?? 0}건</span>
          </div>
          <div className="flex justify-between">
            <span>발언</span>
            <span className="font-medium text-gray-800">{legislator.speech_count ?? 0}회</span>
          </div>
          <div className="flex justify-between">
            <span>투표참여</span>
            <span className="font-medium text-gray-800">
              {legislator.vote_participation_rate ? `${legislator.vote_participation_rate}%` : '-'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


export default function LegislatorDetailClient({ legislator, allLegislators }: LegislatorDetailClientProps) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);

  const attendance = legislator.attendance_rate ?? 0;
  const voteRate = legislator.vote_participation_rate ?? 0;
  const billsProposed = legislator.bills_proposed_count ?? 0;
  const billsPassed = legislator.bills_passed_count ?? 0;
  const speechCount = legislator.speech_count ?? 0;

  // 같은 위원회 동료
  const committeeColleagues = useMemo(() => {
    if (!legislator.committee) return [];
    return allLegislators
      .filter(l => l.committee === legislator.committee && l.id !== legislator.id)
      .slice(0, 8);
  }, [allLegislators, legislator]);

  // 말과 행동 주제들
  const topics = useMemo(() => {
    if (!legislator.consistency_details) return [];
    return legislator.consistency_details.map(d => d.topic);
  }, [legislator.consistency_details]);

  return (
    <div className="container-page py-6 sm:py-8 space-y-6">
      {/* ── 뒤로가기 + 헤더 ── */}
      <div>
        <Link href="/legislators" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          국회의원 목록
        </Link>

        <div className="card overflow-hidden">
          {/* 정당 색상 바 */}
          <div className="h-1.5 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4" style={{ backgroundColor: partyColor }} />

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{legislator.name}</h1>
                {legislator.name_en && (
                  <span className="text-sm text-gray-400">{legislator.name_en}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* 정당 배지 */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: partyColor }}
                >
                  {legislator.party || '무소속'}
                </span>

                {/* 당선 횟수 */}
                {electedLabel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {electedLabel}
                  </span>
                )}

                {/* 지역구 */}
                {legislator.district && (
                  <span className="text-sm text-gray-500">{legislator.district}</span>
                )}
              </div>

              {/* 위원회 */}
              {legislator.committee && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">소속 위원회:</span> {legislator.committee}
                </p>
              )}

              {/* 약력 */}
              {legislator.career_summary && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{legislator.career_summary}</p>
              )}

              {/* 나이 + 성별 */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {legislator.age && <span>{legislator.age}세</span>}
                {legislator.gender && <span>{legislator.gender}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: 출석 현황 ── */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">출석 현황</h2>
        <p className="text-sm text-gray-600 mb-3">
          전체 본회의 중 <span className="font-semibold text-gray-900">{attendance}%</span> 출석
        </p>
        <NeutralBar value={attendance} label="출석률" />
      </div>

      {/* ── Section 2: 법안 활동 ── */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">법안 활동</h2>
        <p className="text-sm text-gray-600 mb-1">
          발의 법안 <span className="font-semibold text-gray-900">{billsProposed}건</span>,
          이 중 <span className="font-semibold text-gray-900">{billsPassed}건</span> 통과
        </p>
        {billsProposed > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-600">법안 통과율</span>
              <span className="text-sm font-semibold text-gray-800">
                {((billsPassed / billsProposed) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full transition-all duration-500"
                style={{ width: `${(billsPassed / billsProposed) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: 본회의 발언 ── */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">본회의 발언</h2>
        <p className="text-sm text-gray-600">
          본회의 발언 <span className="font-semibold text-gray-900">{speechCount}회</span>
        </p>
        {topics.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">관련 주제</p>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t, i) => (
                <span key={i} className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: 투표 참여 ── */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">투표 참여</h2>
        <p className="text-sm text-gray-600 mb-3">
          투표 참여율 <span className="font-semibold text-gray-900">{voteRate > 0 ? `${voteRate}%` : '-'}</span>
        </p>
        <NeutralBar value={voteRate} label="투표 참여율" />
      </div>

      {/* ── Section 5: 말과 행동 ── */}
      {legislator.consistency_details && legislator.consistency_details.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4">말과 행동</h2>
          <p className="text-sm text-gray-500 mb-4">
            발언에서의 입장과 실제 투표 행동을 비교합니다. 일치/불일치는 사실 기록입니다.
          </p>
          <WordsVsActions items={legislator.consistency_details} partyColor={partyColor} />
        </div>
      )}

      {/* ── 활동 프로필 (Radar) ── */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">활동 프로필</h2>
        <RadarChart legislator={legislator} partyColor={partyColor} />
        <p className="text-xs text-gray-400 text-center mt-2">
          수치는 0~100 기준 정규화. 법안활동 80건=100%, 발언 30회=100% 기준.
        </p>
      </div>

      {/* ── Section 6: 같은 위원회 동료 비교 ── */}
      {committeeColleagues.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-2">같은 위원회 동료 비교</h2>
          <p className="text-sm text-gray-500 mb-4">
            {legislator.committee} 소속 의원들의 활동 현황입니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {committeeColleagues.map(c => (
              <ColleagueCard key={c.id} legislator={c} />
            ))}
          </div>
        </div>
      )}

      {/* ── 재산 신고 ── */}
      {legislator.asset_total != null && legislator.asset_total > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-3">재산 신고</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {legislator.asset_total.toFixed(1)}
            </span>
            <span className="text-gray-500 text-lg">억원</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">국회의원 재산신고 기준</p>
        </div>
      )}

      {/* ── 출처 면책 ── */}
      <div className="text-xs text-gray-400 text-center py-4 border-t border-gray-100 leading-relaxed">
        이 페이지의 모든 수치는 열린국회정보 공개 데이터 기반입니다.<br />
        시범 운영 중이며, API 연동 후 실시간 업데이트됩니다.
      </div>
    </div>
  );
}
