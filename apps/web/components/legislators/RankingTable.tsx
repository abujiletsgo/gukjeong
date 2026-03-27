'use client';
// 국회의원 카드 그리드 — 카테고리/목록용 (랭킹 없음)
import Link from 'next/link';
import type { Legislator } from '@/lib/types';

interface LegislatorGridProps {
  legislators: Legislator[];
  getPartyColor: (party: string | undefined) => string;
}

export default function LegislatorGrid({
  legislators,
  getPartyColor,
}: LegislatorGridProps) {
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {legislators.map((l) => {
        const partyColor = getPartyColor(l.party);
        return (
          <Link
            key={l.id}
            href={`/legislators/${l.id}`}
            className="block group"
          >
            <div
              className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 transition-all hover:shadow-md hover:border-gray-300"
              style={{ borderLeftWidth: '3px', borderLeftColor: partyColor }}
            >
              {/* 이름 + 정당 배지 */}
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: partyColor }}
                >
                  {l.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-gray-900 group-hover:text-accent transition-colors text-sm sm:text-base">
                    {l.name}
                  </span>
                  <span
                    className="ml-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium align-middle"
                    style={{
                      backgroundColor: partyColor + '15',
                      color: partyColor,
                    }}
                  >
                    {l.party || '무소속'}
                  </span>
                </div>
              </div>

              {/* 지역구 */}
              {l.district && (
                <p className="text-xs text-gray-500 truncate pl-10">{l.district}</p>
              )}

              {/* 소속 위원회 */}
              {l.committee && (
                <p className="text-[10px] text-gray-400 truncate mt-0.5 pl-10">{l.committee}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
