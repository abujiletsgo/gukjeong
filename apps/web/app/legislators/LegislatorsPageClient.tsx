'use client';
// 국회의원 활동 현황 — 인포그래픽 대시보드 + 의원 목록
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Legislator } from '@/lib/types';

// ── 정당 색상 ──
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

const PARTY_FILTERS = [
  { value: '전체', label: '전체' },
  { value: '더불어민주당', label: '더불어민주당' },
  { value: '국민의힘', label: '국민의힘' },
  { value: '조국혁신당', label: '조국혁신당' },
  { value: '기타', label: '기타' },
];

const MAJOR_PARTIES = ['더불어민주당', '국민의힘', '조국혁신당'];

// ── 비율 바 (neutral gray) ──
function NeutralBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gray-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
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
      {/* 바 */}
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
              {pct >= 6 ? seg.count : ''}
            </div>
          );
        })}
      </div>
      {/* 라벨 */}
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

// ── 활동 분포 바 ──
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

// ── 활동 카드 ──
function ActivityCard({ legislator }: { legislator: Legislator }) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);
  const attendance = legislator.attendance_rate ?? 0;
  const billsProposed = legislator.bills_proposed_count ?? 0;
  const billsPassed = legislator.bills_passed_count ?? 0;
  const speechCount = legislator.speech_count ?? 0;

  return (
    <Link href={`/legislators/${legislator.id}`} className="block group">
      <div className="card hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: partyColor }}
            />
            <h3 className="font-bold text-base text-gray-900 group-hover:text-gray-700 transition-colors">
              {legislator.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 leading-snug">
            {legislator.party || '무소속'}
            {legislator.district && <> &middot; {legislator.district}</>}
          </p>
          <p className="text-xs text-gray-400 leading-snug mt-0.5">
            {legislator.committee || '위원회 미배정'}
            {electedLabel && <> &middot; {electedLabel}</>}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-3 flex-1 space-y-2.5">
          {/* 출석 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">출석</span>
            <NeutralBar value={attendance} />
            <span className="text-xs font-semibold text-gray-700 w-10 text-right shrink-0">
              {attendance > 0 ? `${attendance}%` : '-'}
            </span>
          </div>

          {/* 발의 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">발의</span>
            <span className="text-sm text-gray-800">
              {billsProposed}건
              {billsPassed > 0 && (
                <span className="text-gray-400 text-xs ml-1">(통과 {billsPassed}건)</span>
              )}
            </span>
          </div>

          {/* 발언 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">발언</span>
            <span className="text-sm text-gray-800">{speechCount}회</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end">
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors flex items-center gap-1">
            활동 현황 보기
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── 메인 컴포넌트 ──
interface LegislatorsPageClientProps {
  legislators: Legislator[];
}

export default function LegislatorsPageClient({ legislators }: LegislatorsPageClientProps) {
  const [partyFilter, setPartyFilter] = useState('전체');
  const [committeeFilter, setCommitteeFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // ── 모든 통계는 useMemo로 계산 ──

  // 정당별 의석 분포
  const partyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of legislators) {
      const p = l.party || '무소속';
      counts[p] = (counts[p] || 0) + 1;
    }
    // 주요 정당 + 기타로 그룹핑
    const 더불어민주당 = counts['더불어민주당'] || 0;
    const 국민의힘 = counts['국민의힘'] || 0;
    const 조국혁신당 = counts['조국혁신당'] || 0;
    const 기타 = legislators.length - 더불어민주당 - 국민의힘 - 조국혁신당;

    return {
      segments: [
        { label: '더불어민주당', count: 더불어민주당, color: '#1A56DB' },
        { label: '국민의힘', count: 국민의힘, color: '#E5243B' },
        { label: '조국혁신당', count: 조국혁신당, color: '#6B21A8' },
        { label: '기타', count: 기타, color: '#9CA3AF' },
      ],
      total: legislators.length,
      details: counts,
    };
  }, [legislators]);

  // 핵심 지표
  const keyFacts = useMemo(() => {
    const total = legislators.length;
    if (total === 0) return { avgAttendance: 0, totalBills: 0, totalSpeeches: 0, avgVoteRate: 0 };

    const avgAttendance = legislators.reduce((s, l) => s + (l.attendance_rate || 0), 0) / total;
    const totalBills = legislators.reduce((s, l) => s + (l.bills_proposed_count || 0), 0);
    const totalSpeeches = legislators.reduce((s, l) => s + (l.speech_count || 0), 0);
    const avgVoteRate = legislators.reduce((s, l) => s + (l.vote_participation_rate || 0), 0) / total;

    return { avgAttendance, totalBills, totalSpeeches, avgVoteRate };
  }, [legislators]);

  // 출석률 분포
  const attendanceBrackets = useMemo(() => {
    const b = [
      { label: '90%+', count: 0 },
      { label: '80-90%', count: 0 },
      { label: '70-80%', count: 0 },
      { label: '70% 미만', count: 0 },
    ];
    for (const l of legislators) {
      const a = l.attendance_rate ?? 0;
      if (a >= 90) b[0].count++;
      else if (a >= 80) b[1].count++;
      else if (a >= 70) b[2].count++;
      else b[3].count++;
    }
    return b;
  }, [legislators]);

  // 발의 건수 분포
  const billsBrackets = useMemo(() => {
    const b = [
      { label: '0건', count: 0 },
      { label: '1-10건', count: 0 },
      { label: '11-30건', count: 0 },
      { label: '30건+', count: 0 },
    ];
    for (const l of legislators) {
      const c = l.bills_proposed_count ?? 0;
      if (c === 0) b[0].count++;
      else if (c <= 10) b[1].count++;
      else if (c <= 30) b[2].count++;
      else b[3].count++;
    }
    return b;
  }, [legislators]);

  // 위원회별 인원
  const committeeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of legislators) {
      const c = l.committee || '미배정';
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [legislators]);

  // 위원회 목록
  const committees = useMemo(() => {
    const set = new Set<string>();
    for (const l of legislators) {
      if (l.committee) set.add(l.committee);
    }
    return Array.from(set).sort();
  }, [legislators]);

  // 지역 목록
  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const l of legislators) {
      if (l.region) set.add(l.region);
    }
    return Array.from(set).sort();
  }, [legislators]);

  // 정당별 인원 수 (필터용)
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

  // 필터 적용
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
      list = list.filter(l => l.committee === committeeFilter);
    }

    if (regionFilter !== '전체') {
      list = list.filter(l => l.region === regionFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.district || '').toLowerCase().includes(q) ||
        (l.party || '').toLowerCase().includes(q) ||
        (l.committee || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [legislators, partyFilter, committeeFilter, regionFilter, searchQuery]);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Section 1: 인포그래픽 대시보드
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          국회의원 활동 현황
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1.5 leading-relaxed">
          22대 국회 {legislators.length}명의 의원이 실제로 무엇을 하고 있는지 공개 데이터로 확인합니다.
        </p>
      </div>

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

      {/* 핵심 지표 4-card 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">평균 출석률</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {keyFacts.avgAttendance.toFixed(1)}%
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(keyFacts.avgAttendance, 100)}%` }}
            />
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">총 발의 법안</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {keyFacts.totalBills.toLocaleString()}건
          </div>
          <div className="text-xs text-gray-400 mt-1">
            의원 평균 {legislators.length > 0 ? (keyFacts.totalBills / legislators.length).toFixed(1) : 0}건
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">총 본회의 발언</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {keyFacts.totalSpeeches.toLocaleString()}회
          </div>
          <div className="text-xs text-gray-400 mt-1">
            의원 평균 {legislators.length > 0 ? (keyFacts.totalSpeeches / legislators.length).toFixed(1) : 0}회
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">평균 투표참여율</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {keyFacts.avgVoteRate.toFixed(1)}%
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(keyFacts.avgVoteRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 활동 분포 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 mb-3">출석률 분포</h3>
          <DistributionBar
            brackets={attendanceBrackets}
            colorScale={['#374151', '#6B7280', '#9CA3AF', '#D1D5DB']}
          />
        </div>
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 mb-3">법안 발의 분포</h3>
          <DistributionBar
            brackets={billsBrackets}
            colorScale={['#D1D5DB', '#9CA3AF', '#6B7280', '#374151']}
          />
        </div>
      </div>

      {/* 위원회 분포 */}
      <div className="card mb-8">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3">위원회 현황</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {committeeData.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setCommitteeFilter(c.name === '미배정' ? '전체' : c.name);
                // 스크롤 to 목록
                document.getElementById('legislator-list')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-3 py-2.5 rounded-lg text-left transition-colors border ${
                committeeFilter === c.name
                  ? 'border-gray-400 bg-gray-100'
                  : 'border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-700 truncate">{c.name}</div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">{c.count}<span className="text-xs font-normal text-gray-400 ml-0.5">명</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Section 2: 의원 목록
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
              placeholder="이름, 지역구로 검색"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
            />
          </div>

          {/* 정당 필터 */}
          <div className="flex flex-wrap gap-2">
            {PARTY_FILTERS.map(pf => {
              const isActive = partyFilter === pf.value;
              const color = pf.value === '전체' ? '#6B7280'
                : pf.value === '기타' ? '#6B7280'
                : PARTY_COLORS[pf.value] || '#6B7280';
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

          {/* 위원회 + 지역 드롭다운 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
            >
              <option value="전체">위원회 전체</option>
              {committees.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
            >
              <option value="전체">지역 전체</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 결과 안내 */}
        {filtered.length !== legislators.length && (
          <div className="mb-4 text-sm text-gray-500">
            검색 결과: <span className="font-semibold text-gray-700">{filtered.length}명</span>
          </div>
        )}

        {/* 활동 카드 그리드 */}
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
              <ActivityCard key={l.id} legislator={l} />
            ))}
          </div>
        )}
      </div>

      {/* 출처 */}
      <p className="text-xs text-gray-400 mt-8 text-center leading-relaxed">
        이 페이지의 모든 수치는 열린국회정보 공개 데이터 기반입니다.<br />
        시범 운영 중이며, API 연동 후 실시간 업데이트됩니다.
      </p>
    </div>
  );
}
