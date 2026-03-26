'use client';
// 국회의원 랭킹 테이블 — 정렬, 점수 바, 메달, 정당 배지
import Link from 'next/link';
import type { Legislator } from '@/lib/types';

type SortKey = 'ai_activity_score' | 'attendance_rate' | 'bills_proposed_count' | 'consistency_score';

interface RankingTableProps {
  legislators: Legislator[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  getPartyColor: (party: string | undefined) => string;
}

// 메달 아이콘 (1, 2, 3위)
function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 font-bold text-sm" title="1위">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 font-bold text-sm" title="2위">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#9ca3af" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50 text-orange-500 font-bold text-sm" title="3위">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#c2410c" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      </span>
    );
  }
  return <span className="inline-flex items-center justify-center w-7 h-7 text-gray-400 font-semibold text-sm">{rank}</span>;
}

// 점수 바 (0-100)
function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

// 출석률 프로그레스 바
function AttendanceBar({ value }: { value: number }) {
  const pct = Math.min(100, value);
  const color = pct >= 90 ? '#16a34a' : pct >= 80 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-12 text-right tabular-nums">{value}%</span>
    </div>
  );
}

// 일치도 표시
function ConsistencyIndicator({ value }: { value: number }) {
  const color = value >= 80 ? '#16a34a' : value >= 60 ? '#f59e0b' : '#ef4444';
  const label = value >= 80 ? '높음' : value >= 60 ? '보통' : '낮음';
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium tabular-nums" style={{ color }}>{value}%</span>
      <span className="text-[10px] text-gray-400 hidden sm:inline">{label}</span>
    </div>
  );
}

// 정렬 헤더
function SortHeader({
  label,
  sortKeyValue,
  currentSortKey,
  sortAsc,
  onSort,
  className = '',
}: {
  label: string;
  sortKeyValue: SortKey;
  currentSortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentSortKey === sortKeyValue;
  return (
    <th
      className={`px-3 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors ${className}`}
      onClick={() => onSort(sortKeyValue)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform ${sortAsc ? 'rotate-180' : ''}`}
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        )}
      </span>
    </th>
  );
}

export default function RankingTable({
  legislators,
  sortKey,
  sortAsc,
  onSort,
  getPartyColor,
}: RankingTableProps) {
  if (!legislators || legislators.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 opacity-40">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <p>해당 조건의 의원이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-14">순위</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-600">이름</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-16">당선</th>
            <SortHeader
              label="활동 점수"
              sortKeyValue="ai_activity_score"
              currentSortKey={sortKey}
              sortAsc={sortAsc}
              onSort={onSort}
              className="text-left"
            />
            <SortHeader
              label="출석률"
              sortKeyValue="attendance_rate"
              currentSortKey={sortKey}
              sortAsc={sortAsc}
              onSort={onSort}
              className="text-left"
            />
            <SortHeader
              label="발의 법안"
              sortKeyValue="bills_proposed_count"
              currentSortKey={sortKey}
              sortAsc={sortAsc}
              onSort={onSort}
              className="text-right"
            />
            <SortHeader
              label="일치도"
              sortKeyValue="consistency_score"
              currentSortKey={sortKey}
              sortAsc={sortAsc}
              onSort={onSort}
              className="text-left"
            />
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {legislators.map((l, i) => {
            const rank = i + 1;
            const partyColor = getPartyColor(l.party);
            return (
              <tr
                key={l.id}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                {/* 순위 */}
                <td className="px-3 py-3">
                  <MedalIcon rank={rank} />
                </td>

                {/* 이름 + 정당 + 지역구 */}
                <td className="px-3 py-3">
                  <Link href={`/legislators/${l.id}`} className="block group-hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: partyColor }}
                      />
                      <span className="font-semibold text-gray-900 group-hover:text-accent transition-colors">
                        {l.name}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: partyColor + '15',
                          color: partyColor,
                        }}
                      >
                        {l.party || '무소속'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 pl-4">{l.district || '-'}</div>
                  </Link>
                </td>

                {/* 당선 횟수 */}
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {l.elected_count || 1}
                  </span>
                </td>

                {/* 활동 점수 */}
                <td className="px-3 py-3 min-w-[140px]">
                  <ScoreBar
                    value={l.ai_activity_score || 0}
                    color={partyColor}
                  />
                </td>

                {/* 출석률 */}
                <td className="px-3 py-3 min-w-[140px]">
                  <AttendanceBar value={l.attendance_rate || 0} />
                </td>

                {/* 발의 법안 */}
                <td className="px-3 py-3 text-right">
                  <span className="font-semibold text-gray-800">{l.bills_proposed_count || 0}</span>
                  {(l.bills_passed_count ?? 0) > 0 && (
                    <span className="text-xs text-green-600 ml-1">
                      ({l.bills_passed_count}건 통과)
                    </span>
                  )}
                </td>

                {/* 일치도 */}
                <td className="px-3 py-3">
                  <ConsistencyIndicator value={l.consistency_score || 0} />
                </td>

                {/* 상세 링크 */}
                <td className="px-3 py-3">
                  <Link
                    href={`/legislators/${l.id}`}
                    className="text-gray-300 group-hover:text-accent transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
