'use client';
// 국회의원 카테고리별 분류 페이지 — 클라이언트 컴포넌트
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Legislator } from '@/lib/types';
import KPI from '@/components/common/KPI';
import LegislatorGrid from '@/components/legislators/RankingTable';

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

const PARTY_FILTERS = [
  { value: '전체', label: '전체', color: '#6B7280' },
  { value: '더불어민주당', label: '더불어민주당', color: '#1A56DB' },
  { value: '국민의힘', label: '국민의힘', color: '#E5243B' },
  { value: '조국혁신당', label: '조국혁신당', color: '#6B21A8' },
  { value: '기타', label: '기타', color: '#6B7280' },
];

const MAJOR_PARTIES = ['더불어민주당', '국민의힘', '조국혁신당'];

type ViewMode = 'category' | 'list';

// ── 카테고리 정의 ──
interface CategoryDef {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  textColor: string;
  filter: (l: Legislator) => boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'consistent',
    title: '말과 행동이 일치하는 의원',
    description: '일치도 75% 이상',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
      </svg>
    ),
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    filter: (l) => (l.consistency_score ?? 0) >= 75,
  },
  {
    key: 'active',
    title: '활발하게 활동하는 의원',
    description: '활동 지표 75 이상',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    filter: (l) => (l.ai_activity_score ?? 0) >= 75,
  },
  {
    key: 'bills',
    title: '법안을 많이 발의하는 의원',
    description: '발의 법안 30건 이상',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    filter: (l) => (l.bills_proposed_count ?? 0) >= 30,
  },
  {
    key: 'attendance',
    title: '출석률이 높은 의원',
    description: '출석률 90% 이상',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    filter: (l) => (l.attendance_rate ?? 0) >= 90,
  },
  {
    key: 'needs-attention',
    title: '활동 데이터가 부족한 의원',
    description: '활동 지표 50 미만 또는 출석률 80% 미만',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    filter: (l) => (l.ai_activity_score ?? 0) < 50 || (l.attendance_rate ?? 0) < 80,
  },
];

// ── 의원 이니셜 버블 ──
function LegislatorBubble({
  legislator,
  getColor,
}: {
  legislator: Legislator;
  getColor: (party: string | undefined) => string;
}) {
  const partyColor = getColor(legislator.party);
  const initial = legislator.name.charAt(0);

  return (
    <Link
      href={`/legislators/${legislator.id}`}
      className="group relative flex flex-col items-center"
    >
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base transition-transform group-hover:scale-110 shadow-sm"
        style={{ backgroundColor: partyColor }}
      >
        {initial}
      </div>
      {/* 이름 + 정당 툴팁 (hover) */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
          <div className="font-semibold">{legislator.name}</div>
          <div className="text-gray-300 text-[10px]">{legislator.party || '무소속'}</div>
        </div>
        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
      </div>
    </Link>
  );
}

// ── 카테고리 카드 ──
function CategoryCard({
  category,
  legislators,
  getColor,
}: {
  category: CategoryDef;
  legislators: Legislator[];
  getColor: (party: string | undefined) => string;
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 24;
  const displayList = showAll ? legislators : legislators.slice(0, INITIAL_SHOW);
  const hasMore = legislators.length > INITIAL_SHOW;

  return (
    <div className={`rounded-xl border-2 ${category.borderColor} ${category.bgColor} p-4 sm:p-5`}>
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0">{category.icon}</div>
        <div className="min-w-0">
          <h3 className={`font-bold text-base sm:text-lg ${category.textColor}`}>
            {category.title}
          </h3>
          <p className="text-xs text-gray-500">{category.description}</p>
        </div>
        <div className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-sm font-bold ${category.textColor} bg-white/70`}>
          {legislators.length}명
        </div>
      </div>

      {/* 의원 버블 그리드 */}
      {legislators.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">해당 의원이 없습니다.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {displayList.map((l) => (
              <LegislatorBubble key={l.id} legislator={l} getColor={getColor} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showAll ? '접기' : `+${legislators.length - INITIAL_SHOW}명 더 보기`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ──
interface LegislatorsPageClientProps {
  legislators: Legislator[];
}

export default function LegislatorsPageClient({ legislators }: LegislatorsPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [partyFilter, setPartyFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

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

  // 정당 + 검색 필터
  const filteredByPartyAndSearch = useMemo(() => {
    let list = [...legislators];

    // 정당 필터
    if (partyFilter !== '전체') {
      if (partyFilter === '기타') {
        list = list.filter(l => !MAJOR_PARTIES.includes(l.party || ''));
      } else {
        list = list.filter(l => l.party === partyFilter);
      }
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.district || '').toLowerCase().includes(q) ||
        (l.party || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [legislators, partyFilter, searchQuery]);

  // 카테고리별 그룹핑 (필터 적용)
  const categorized = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      members: filteredByPartyAndSearch.filter(cat.filter),
    }));
  }, [filteredByPartyAndSearch]);

  // KPI 계산
  const totalCount = legislators.length;
  const avgAttendance = legislators.length
    ? (legislators.reduce((s, l) => s + (l.attendance_rate || 0), 0) / legislators.length).toFixed(1)
    : '0';
  const totalBills = legislators.reduce((s, l) => s + (l.bills_proposed_count || 0), 0);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">국회의원 활동 분류</h1>
            <p className="text-sm text-gray-500">
              공개 데이터 기반으로 국회의원의 활동 유형을 분류합니다.
            </p>
          </div>
        </div>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          각 의원은 활동 데이터에 따라 여러 카테고리에 동시에 포함될 수 있습니다.
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
          label="총 발의 법안"
          value={`${totalBills.toLocaleString()}건`}
          source="국회의안정보시스템"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <KPI
          label="평균 말행일치도"
          value={`${avgConsistency}%`}
          source="말과 행동 비교"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 4-4" />
            </svg>
          }
        />
      </div>

      {/* 뷰 토글 + 검색 + 정당 필터 */}
      <div className="card mb-6 space-y-4">
        {/* 상단: 뷰 토글 + 검색 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 뷰 토글 */}
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode('category')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'category'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                카테고리 보기
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                목록 보기
              </span>
            </button>
          </div>

          {/* 검색 */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 지역구 검색"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
        </div>

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
      </div>

      {/* ── 카테고리 보기 ── */}
      {viewMode === 'category' && (
        <div className="space-y-5">
          {categorized.map((cat) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              legislators={cat.members}
              getColor={getPartyColor}
            />
          ))}
        </div>
      )}

      {/* ── 목록 보기 ── */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              의원 목록
              <span className="text-sm font-normal text-gray-400 ml-2">
                {filteredByPartyAndSearch.length}명
              </span>
            </h2>
          </div>
          <LegislatorGrid
            legislators={filteredByPartyAndSearch}
            getPartyColor={getPartyColor}
          />
        </div>
      )}

      {/* 출처 */}
      <p className="text-[10px] text-gray-300 mt-4 text-center">
        출처: 열린국회정보 · 국회의안정보시스템 | 데이터 기준: 22대 국회 (2024-현재)
      </p>
    </div>
  );
}
