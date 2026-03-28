'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { Legislator } from '@/lib/types';

// ── 정당 색상 ──
const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1A56DB',
  '국민의힘': '#E5243B',
  '조국혁신당': '#6B21A8',
  '진보당': '#E11D48',
  '개혁신당': '#F97316',
  '기본소득당': '#22C55E',
  '사회민주당': '#EC4899',
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
  if (count === 5) return '5선';
  return `${count}선`;
}

// ── API 응답 타입 ──
interface RealLegislatorsResponse {
  total: number;
  source: string;
  timestamp: string;
  elapsed_ms: number;
  summary: {
    partyDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    electedDistribution: Record<string, number>;
  };
  legislators: Legislator[];
  error?: boolean;
  message?: string;
}

// ── 수평 비율 세그먼트 ──
function StackedBar({
  segments,
  total,
}: {
  segments: { label: string; count: number; color: string }[];
  total: number;
}) {
  return (
    <div>
      <div className="flex h-8 sm:h-10 rounded-lg overflow-hidden">
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className="flex items-center justify-center text-white text-xs sm:text-sm font-semibold transition-all duration-500 min-w-[2rem]"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.count}석 (${pct.toFixed(1)}%)`}
            >
              {pct >= 5 ? seg.count : ''}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span>{seg.label}</span>
            <span className="font-semibold text-gray-800">{seg.count}석</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 분포 바 ──
function DistributionBar({
  brackets,
  colorScale,
}: {
  brackets: { label: string; count: number }[];
  colorScale: string[];
}) {
  const total = brackets.reduce((s, b) => s + b.count, 0);
  return (
    <div>
      <div className="flex h-6 rounded-md overflow-hidden">
        {brackets.map((b, i) => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={b.label}
              className="flex items-center justify-center text-white text-[10px] sm:text-xs font-medium transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: colorScale[i] || '#9CA3AF' }}
              title={`${b.label}: ${b.count}명`}
            >
              {pct >= 8 ? b.count : ''}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {brackets.map((b, i) => (
          <div key={b.label} className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: colorScale[i] || '#9CA3AF' }}
            />
            <span>{b.label}</span>
            <span className="font-semibold text-gray-700">{b.count}명</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 의원 카드 ──
function MemberCard({ legislator }: { legislator: Legislator }) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);

  return (
    <div className="card hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: partyColor }}
          />
          <h3 className="font-bold text-base text-gray-900">
            {legislator.name}
          </h3>
          {legislator.name_en && (
            <span className="text-xs text-gray-400">{legislator.name_en}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-snug">
          {legislator.party || '무소속'}
          {legislator.district && <> &middot; {legislator.district}</>}
        </p>
        <p className="text-xs text-gray-400 leading-snug mt-0.5">
          {legislator.committee || '위원회 미배정'}
          {electedLabel && <> &middot; {electedLabel}</>}
          {legislator.age && <> &middot; {legislator.age}세</>}
          {legislator.gender && <> &middot; {legislator.gender}</>}
        </p>
      </div>

      {legislator.career_summary && (
        <div className="border-t border-gray-100 pt-3 flex-1">
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
            {legislator.career_summary}
          </p>
        </div>
      )}

      {legislator.bills_proposed_count !== undefined && (
        <div className="border-t border-gray-100 pt-2 mt-2">
          <span className="text-xs text-gray-500">
            발의 법안: <span className="font-semibold text-gray-700">{legislator.bills_proposed_count}건</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── 로딩 상태 ──
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-lg font-semibold text-gray-800 mb-1">데이터 수집 중...</p>
      <p className="text-sm text-gray-500">열린국회정보 API에서 22대 국회의원 데이터를 가져오고 있습니다</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        API 연결 중 (최대 30초 소요)
      </div>
    </div>
  );
}

// ── 메인 페이지 ──

const MAJOR_PARTIES = ['더불어민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당'];

type SortKey = 'name' | 'party' | 'elected' | 'age';

export default function RealLegislatorsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RealLegislatorsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [partyFilter, setPartyFilter] = useState('전체');
  const [committeeFilter, setCommitteeFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [genderFilter, setGenderFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/legislators/real');
      const json: RealLegislatorsResponse = await res.json();
      if (json.error) {
        setError(json.message || 'API 오류');
      } else {
        setData(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const legislators = data?.legislators || [];

  // ── 정당별 의석 분포 ──
  const partyDistribution = useMemo(() => {
    if (!data?.summary?.partyDistribution) return { segments: [], total: 0 };
    const dist = data.summary.partyDistribution;
    const segments = Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        color: getPartyColor(label),
      }));
    return { segments, total: legislators.length };
  }, [data, legislators.length]);

  // ── 성별 분포 ──
  const genderBrackets = useMemo(() => {
    if (!data?.summary?.genderDistribution) return [];
    const dist = data.summary.genderDistribution;
    return [
      { label: '남성', count: dist['남'] || 0 },
      { label: '여성', count: dist['여'] || 0 },
    ];
  }, [data]);

  // ── 당선횟수 분포 ──
  const electedBrackets = useMemo(() => {
    if (!data?.summary?.electedDistribution) return [];
    const dist = data.summary.electedDistribution;
    const order = ['초선', '재선', '3선', '4선', '5선'];
    const result = order
      .filter(k => dist[k])
      .map(k => ({ label: k, count: dist[k] }));
    // Add any remaining
    for (const [k, v] of Object.entries(dist)) {
      if (!order.includes(k)) {
        result.push({ label: k, count: v });
      }
    }
    return result;
  }, [data]);

  // ── 연령대 분포 ──
  const ageBrackets = useMemo(() => {
    const brackets = [
      { label: '30대', count: 0 },
      { label: '40대', count: 0 },
      { label: '50대', count: 0 },
      { label: '60대', count: 0 },
      { label: '70대+', count: 0 },
    ];
    for (const l of legislators) {
      const a = l.age ?? 0;
      if (a >= 70) brackets[4].count++;
      else if (a >= 60) brackets[3].count++;
      else if (a >= 50) brackets[2].count++;
      else if (a >= 40) brackets[1].count++;
      else if (a >= 30) brackets[0].count++;
    }
    return brackets;
  }, [legislators]);

  // ── 위원회 목록 ──
  const committees = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of legislators) {
      const c = l.committee || '미배정';
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [legislators]);

  // ── 지역 목록 ──
  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const l of legislators) {
      if (l.region && l.region !== '비례대표') set.add(l.region);
    }
    return ['비례대표', ...Array.from(set).sort()];
  }, [legislators]);

  // ── 정당별 인원수 (필터용) ──
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

  // ── 필터 + 정렬 ──
  const filtered = useMemo(() => {
    let list = [...legislators];

    if (partyFilter !== '전체') {
      if (partyFilter === '기타') {
        list = list.filter(l => !MAJOR_PARTIES.includes(l.party || ''));
      } else {
        list = list.filter(l => l.party === partyFilter);
      }
    }

    if (committeeFilter !== '전체') {
      list = list.filter(l => (l.committee || '미배정') === committeeFilter);
    }

    if (regionFilter !== '전체') {
      list = list.filter(l => l.region === regionFilter);
    }

    if (genderFilter !== '전체') {
      list = list.filter(l => l.gender === genderFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.name_en || '').toLowerCase().includes(q) ||
        (l.district || '').toLowerCase().includes(q) ||
        (l.party || '').toLowerCase().includes(q) ||
        (l.committee || '').toLowerCase().includes(q) ||
        (l.career_summary || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sortKey) {
        case 'party':
          return (a.party || '').localeCompare(b.party || '', 'ko');
        case 'elected':
          return (b.elected_count || 0) - (a.elected_count || 0);
        case 'age':
          return (a.age || 0) - (b.age || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'ko');
      }
    });

    return list;
  }, [legislators, partyFilter, committeeFilter, regionFilter, genderFilter, searchQuery, sortKey]);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              실제 국회의원 데이터
            </h1>
            <p className="text-sm text-gray-500">
              열린국회정보 API에서 가져온 22대 국회의원 {legislators.length}명
            </p>
          </div>
        </div>
      </div>

      {/* 실제 데이터 배너 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">
              실제 국회 데이터 (열린국회정보 API)
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              open.assembly.go.kr 열린국회정보 API를 통해 22대 국회의원 명부를 실시간으로 가져옵니다.
              이름, 정당, 지역구, 위원회, 당선횟수, 성별, 나이, 약력 등 공식 데이터입니다.
            </p>
            {data && (
              <p className="text-[10px] text-blue-500 mt-1">
                마지막 업데이트: {new Date(data.timestamp).toLocaleString('ko-KR')}
                {' '}&middot; 응답 시간: {data.elapsed_ms}ms
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 기존 데이터 링크 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/legislators"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          시드 데이터 (활동 지표 포함) 보기
        </Link>
      </div>

      {/* 메인 콘텐츠 */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">데이터 수집 실패</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : data ? (
        <>
          {/* ─── 인포그래픽 대시보드 ─── */}

          {/* 의석 분포 */}
          <div className="card mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">정당별 의석 분포</h2>
              <span className="text-sm text-gray-400">총 {partyDistribution.total}석</span>
            </div>
            <StackedBar
              segments={partyDistribution.segments}
              total={partyDistribution.total}
            />
          </div>

          {/* 핵심 지표 4-card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="card">
              <div className="text-xs text-gray-500 mb-1">총 의원 수</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {data.total}명
              </div>
              <div className="text-xs text-gray-400 mt-1">22대 국회</div>
            </div>
            <div className="card">
              <div className="text-xs text-gray-500 mb-1">정당 수</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {Object.keys(data.summary.partyDistribution).length}개
              </div>
              <div className="text-xs text-gray-400 mt-1">교섭단체 포함</div>
            </div>
            <div className="card">
              <div className="text-xs text-gray-500 mb-1">여성 의원</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {data.summary.genderDistribution['여'] || 0}명
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {data.total > 0
                  ? `${(((data.summary.genderDistribution['여'] || 0) / data.total) * 100).toFixed(1)}%`
                  : '-'}
              </div>
            </div>
            <div className="card">
              <div className="text-xs text-gray-500 mb-1">초선 의원</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {data.summary.electedDistribution['초선'] || 0}명
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {data.total > 0
                  ? `${(((data.summary.electedDistribution['초선'] || 0) / data.total) * 100).toFixed(1)}%`
                  : '-'}
              </div>
            </div>
          </div>

          {/* 분포 차트 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="card">
              <h3 className="text-sm font-bold text-gray-700 mb-3">성별 분포</h3>
              <DistributionBar
                brackets={genderBrackets}
                colorScale={['#3B82F6', '#EC4899']}
              />
            </div>
            <div className="card">
              <h3 className="text-sm font-bold text-gray-700 mb-3">당선횟수 분포</h3>
              <DistributionBar
                brackets={electedBrackets}
                colorScale={['#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151']}
              />
            </div>
            <div className="card">
              <h3 className="text-sm font-bold text-gray-700 mb-3">연령대 분포</h3>
              <DistributionBar
                brackets={ageBrackets}
                colorScale={['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8']}
              />
            </div>
          </div>

          {/* 위원회 분포 */}
          <div className="card mb-8">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3">위원회 현황</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {committees.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setCommitteeFilter(committeeFilter === c.name ? '전체' : c.name);
                    document.getElementById('legislator-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-2.5 rounded-lg text-left transition-colors border ${
                    committeeFilter === c.name
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-medium text-gray-700 truncate">{c.name}</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {c.count}<span className="text-xs font-normal text-gray-400 ml-0.5">명</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ─── 의원 목록 ─── */}
          <div id="legislator-list">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">의원 목록</h2>

            {/* 검색 + 필터 */}
            <div className="card mb-6 space-y-4">
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
                  placeholder="이름, 지역구, 정당, 위원회, 약력으로 검색"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
              </div>

              {/* 정당 필터 */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '전체', label: '전체' },
                  ...MAJOR_PARTIES.map(p => ({ value: p, label: p })),
                  { value: '기타', label: '기타' },
                ].map(pf => {
                  const isActive = partyFilter === pf.value;
                  const color = pf.value === '전체' || pf.value === '기타'
                    ? '#6B7280'
                    : getPartyColor(pf.value);
                  return (
                    <button
                      key={pf.value}
                      onClick={() => setPartyFilter(pf.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={isActive ? { backgroundColor: color } : undefined}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? '#fff' : color }}
                      />
                      {pf.label}
                      <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                        {partyCounts[pf.value] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 위원회 + 지역 + 성별 + 정렬 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <select
                  value={committeeFilter}
                  onChange={(e) => setCommitteeFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="전체">위원회 전체</option>
                  {committees.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
                  ))}
                </select>

                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="전체">지역 전체</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="전체">성별 전체</option>
                  <option value="남">남성</option>
                  <option value="여">여성</option>
                </select>

                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="name">이름순</option>
                  <option value="party">정당순</option>
                  <option value="elected">당선횟수순</option>
                  <option value="age">나이순</option>
                </select>
              </div>
            </div>

            {/* 결과 안내 */}
            {filtered.length !== legislators.length && (
              <div className="mb-4 text-sm text-gray-500">
                검색 결과: <span className="font-semibold text-gray-700">{filtered.length}명</span>
                {' '} / 전체 {legislators.length}명
              </div>
            )}

            {/* 의원 카드 그리드 */}
            {filtered.length === 0 ? (
              <div className="card text-center py-16">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-gray-300">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                <p className="text-gray-400">해당 조건의 의원이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(l => (
                  <MemberCard key={l.id} legislator={l} />
                ))}
              </div>
            )}
          </div>

          {/* 출처 */}
          <div className="mt-8 border-t border-gray-100 pt-4">
            <p className="text-[10px] text-gray-300 text-center leading-relaxed">
              데이터 출처: 열린국회정보(open.assembly.go.kr)
              &middot; 22대 국회 의원 명부 (UNIT_CD: 100022)
              &middot; 실시간 API 연동
              &middot; 활동 지표(출석, 발의, 투표)는 별도 API 연동 예정
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
