'use client';
// 국회의원 랭킹 페이지 — 클라이언트 컴포넌트
import { useState, useMemo } from 'react';
import type { Legislator } from '@/lib/types';
import KPI from '@/components/common/KPI';
import RankingTable from '@/components/legislators/RankingTable';

// 정당 색상
function getPartyColor(party: string | undefined): string {
  if (!party) return '#6B7280';
  if (party.includes('더불어민주당') || party === '민주당') return '#1A56DB';
  if (party.includes('국민의힘')) return '#E5243B';
  if (party.includes('조국혁신당')) return '#6B21A8';
  if (party.includes('진보당')) return '#E11D48';
  if (party.includes('개혁신당')) return '#F97316';
  return '#6B7280'; // 무소속 / 기타
}

type SortKey = 'ai_activity_score' | 'attendance_rate' | 'bills_proposed_count' | 'consistency_score';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'ai_activity_score', label: '활동점수순' },
  { key: 'attendance_rate', label: '출석률순' },
  { key: 'bills_proposed_count', label: '법안발의순' },
  { key: 'consistency_score', label: '일치도순' },
];

const PARTY_FILTERS = [
  { value: '전체', label: '전체', color: '#6B7280' },
  { value: '더불어민주당', label: '더불어민주당', color: '#1A56DB' },
  { value: '국민의힘', label: '국민의힘', color: '#E5243B' },
  { value: '조국혁신당', label: '조국혁신당', color: '#6B21A8' },
  { value: '기타', label: '기타', color: '#6B7280' },
];

const MAJOR_PARTIES = ['더불어민주당', '국민의힘', '조국혁신당'];

interface LegislatorsPageClientProps {
  legislators: Legislator[];
}

export default function LegislatorsPageClient({ legislators }: LegislatorsPageClientProps) {
  const [partyFilter, setPartyFilter] = useState('전체');
  const [sortKey, setSortKey] = useState<SortKey>('ai_activity_score');
  const [sortAsc, setSortAsc] = useState(false);

  // 정당별 인원 수
  const partyCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': legislators.length };
    for (const l of legislators) {
      const p = l.party || '무소속';
      if (MAJOR_PARTIES.includes(p)) {
        counts[p] = (counts[p] || 0) + 1;
      } else {
        counts['기타'] = (counts['기타'] || 0) + 1;
      }
    }
    return counts;
  }, [legislators]);

  // 필터링 + 정렬
  const filtered = useMemo(() => {
    let list = [...legislators];

    // 정당 필터
    if (partyFilter !== '전체') {
      if (partyFilter === '기타') {
        list = list.filter(l => !MAJOR_PARTIES.includes(l.party || ''));
      } else {
        list = list.filter(l => l.party === partyFilter);
      }
    }

    // 정렬
    list.sort((a, b) => {
      const av = (a[sortKey] as number) ?? 0;
      const bv = (b[sortKey] as number) ?? 0;
      return sortAsc ? av - bv : bv - av;
    });

    return list;
  }, [legislators, partyFilter, sortKey, sortAsc]);

  // KPI 계산
  const totalCount = legislators.length;
  const avgAttendance = legislators.length
    ? (legislators.reduce((s, l) => s + (l.attendance_rate || 0), 0) / legislators.length).toFixed(1)
    : '0';
  const avgActivity = legislators.length
    ? (legislators.reduce((s, l) => s + (l.ai_activity_score || 0), 0) / legislators.length).toFixed(1)
    : '0';
  const avgConsistency = legislators.length
    ? (legislators.reduce((s, l) => s + (l.consistency_score || 0), 0) / legislators.length).toFixed(1)
    : '0';

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">국회의원 성적표</h1>
            <p className="text-sm text-gray-500">
              공개 데이터 기반으로 국회의원의 활동을 종합 평가합니다.
            </p>
          </div>
        </div>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          활동 점수는 공개된 국회 데이터를 기반으로 AI가 산출한 참고 지표입니다.
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPI
          label="국회의원 수"
          value={`${totalCount}명`}
          source="22대 국회"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <KPI
          label="평균 출석률"
          value={`${avgAttendance}%`}
          source="국회 본회의"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M9 16l2 2 4-4" />
            </svg>
          }
        />
        <KPI
          label="평균 활동 점수"
          value={avgActivity}
          source="AI 종합 산출"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <KPI
          label="평균 일치도"
          value={`${avgConsistency}%`}
          source="말과 행동 비교"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      {/* 정당 필터 + 정렬 */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* 정당 필터 */}
          <div className="flex flex-wrap gap-2">
            {PARTY_FILTERS.map(pf => {
              const isActive = partyFilter === pf.value;
              return (
                <button
                  key={pf.value}
                  onClick={() => setPartyFilter(pf.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isActive ? { backgroundColor: pf.color } : undefined}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? '#fff' : pf.color }}
                  />
                  {pf.label}
                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {partyCounts[pf.value] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-2">
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              title={sortAsc ? '오름차순' : '내림차순'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-gray-600 transition-transform ${sortAsc ? 'rotate-180' : ''}`}
              >
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 랭킹 테이블 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">
            의원 랭킹
            <span className="text-sm font-normal text-gray-400 ml-2">
              {filtered.length}명
            </span>
          </h2>
          <span className="ai-badge">AI 분석</span>
        </div>
        <RankingTable
          legislators={filtered}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={(key: SortKey) => {
            if (key === sortKey) {
              setSortAsc(!sortAsc);
            } else {
              setSortKey(key);
              setSortAsc(false);
            }
          }}
          getPartyColor={getPartyColor}
        />
      </div>

      {/* 출처 */}
      <p className="text-[10px] text-gray-300 mt-4 text-center">
        출처: 열린국회정보 · 국회의안정보시스템 · AI 종합 분석 | 데이터 기준: 22대 국회 (2024-현재)
      </p>
    </div>
  );
}
