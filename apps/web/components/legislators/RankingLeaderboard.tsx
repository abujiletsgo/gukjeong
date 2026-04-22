'use client';
// 국회의원 랭킹 리더보드 — 4개 카테고리별 포디움 + 순위 목록

import { useState, useMemo } from 'react';

interface RankedLegislator {
  MONA_CD: string;
  HG_NM: string;
  POLY_NM: string;
  bills_proposed: number;
  bills_passed: number;
  participation_rate: number;
  absent_rate: number;
  funding_total: number;        // 정치자금 총 지출액 (원)
  funding_top_category: string; // 가장 많이 쓴 항목
}

interface Props {
  legislators: RankedLegislator[];
}

type TabKey = 'bills_proposed' | 'bills_passed' | 'participation_rate' | 'absent_rate' | 'funding_total';

const TABS: { key: TabKey; label: string; unit: string; higherIsWorse: boolean; formatFn?: (v: number) => string }[] = [
  { key: 'bills_proposed',    label: '발의 법안',  unit: '건',   higherIsWorse: false },
  { key: 'bills_passed',      label: '통과 법안',  unit: '건',   higherIsWorse: false },
  { key: 'participation_rate', label: '투표 참여율', unit: '%',  higherIsWorse: false },
  { key: 'absent_rate',       label: '결석률',      unit: '%',   higherIsWorse: true  },
  { key: 'funding_total',     label: '💸 정치자금 지출', unit: '만원', higherIsWorse: true,
    formatFn: (v: number) => Math.round(v / 10000).toLocaleString() },
];

const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1A56DB',
  '국민의힘':    '#E5243B',
  '조국혁신당':  '#6B21A8',
  '진보당':      '#E11D48',
  '개혁신당':    '#F97316',
  '기본소득당':  '#22C55E',
  '사회민주당':  '#EC4899',
  '무소속':      '#6B7280',
};

function getPartyColor(party: string): string {
  return PARTY_COLORS[party] || '#6B7280';
}

// Medal emoji for top 3
function medal(rank: number): string {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return '';
}

// Avatar with fallback
function Avatar({
  monaCode,
  name,
  partyColor,
  size,
}: {
  monaCode: string;
  name: string;
  partyColor: string;
  size: 'lg' | 'sm';
}) {
  const [error, setError] = useState(false);
  const dim = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-base';
  if (!error) {
    return (
      <img
        src={`/legislators-thumb/${monaCode}.jpg`}
        alt={name}
        onError={() => setError(true)}
        className={`${dim} rounded-full object-cover object-top flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: partyColor }}
    >
      {name.charAt(0)}
    </div>
  );
}

// Party badge
function PartyBadge({ party }: { party: string }) {
  const color = getPartyColor(party);
  const short = (party || '무소속')
    .replace('더불어민주당', '민주')
    .replace('국민의힘', '국힘')
    .replace('조국혁신당', '조혁')
    .slice(0, 4);
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white leading-tight flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {short}
    </span>
  );
}

// Podium card for top 3
function PodiumCard({
  leg,
  rank,
  metric,
  unit,
  higherIsWorse,
  formatFn,
  subLabel,
}: {
  leg: RankedLegislator;
  rank: number;
  metric: number;
  unit: string;
  higherIsWorse: boolean;
  formatFn?: (v: number) => string;
  subLabel?: string;
}) {
  const partyColor = getPartyColor(leg.POLY_NM);
  const isFirst = rank === 0;
  const displayVal = formatFn ? formatFn(metric) : metric.toLocaleString();
  return (
    <div
      className={`flex flex-col items-center text-center p-4 rounded-xl border transition-shadow hover:shadow-md ${
        isFirst && !higherIsWorse ? 'border-yellow-300 bg-yellow-50 shadow-sm'
        : isFirst && higherIsWorse ? 'border-red-200 bg-red-50 shadow-sm'
        : 'border-gray-100 bg-gray-50'
      }`}
    >
      <span className="text-2xl mb-2">{medal(rank)}</span>
      <Avatar monaCode={leg.MONA_CD} name={leg.HG_NM} partyColor={partyColor} size={isFirst ? 'lg' : 'sm'} />
      <p className={`mt-2 font-bold text-gray-900 ${isFirst ? 'text-base' : 'text-sm'}`}>{leg.HG_NM}</p>
      <PartyBadge party={leg.POLY_NM} />
      <p className={`mt-2 font-extrabold ${isFirst ? 'text-2xl' : 'text-lg'} ${higherIsWorse ? 'text-red-600' : 'text-gray-800'}`}>
        {displayVal}<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
      </p>
      {subLabel && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-full px-1">{subLabel}</p>}
      <p className="text-xs text-gray-400 mt-0.5">{rank + 1}위</p>
    </div>
  );
}

// Compact row for ranks 4-10
function RankRow({
  leg,
  rank,
  metric,
  unit,
  higherIsWorse,
  formatFn,
  subLabel,
}: {
  leg: RankedLegislator;
  rank: number;
  metric: number;
  unit: string;
  higherIsWorse: boolean;
  formatFn?: (v: number) => string;
  subLabel?: string;
}) {
  const partyColor = getPartyColor(leg.POLY_NM);
  const displayVal = formatFn ? formatFn(metric) : metric.toLocaleString();
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${higherIsWorse ? 'hover:bg-red-50' : 'hover:bg-gray-50'}`}>
      <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">{rank + 1}</span>
      <Avatar monaCode={leg.MONA_CD} name={leg.HG_NM} partyColor={partyColor} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{leg.HG_NM}</p>
        <div className="flex items-center gap-1.5">
          <PartyBadge party={leg.POLY_NM} />
          {subLabel && <span className="text-xs text-gray-400 truncate">{subLabel}</span>}
        </div>
      </div>
      <span className={`text-sm font-bold flex-shrink-0 ${higherIsWorse ? 'text-red-600' : 'text-gray-800'}`}>
        {displayVal}{unit}
      </span>
    </div>
  );
}

export default function RankingLeaderboard({ legislators }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('bills_proposed');
  const [partyFilter, setPartyFilter] = useState('전체');

  // Collect unique parties
  const parties = useMemo(() => {
    const seen = new Set<string>();
    legislators.forEach(l => { if (l.POLY_NM) seen.add(l.POLY_NM); });
    return ['전체', ...Array.from(seen).sort()];
  }, [legislators]);

  const tab = TABS.find(t => t.key === activeTab)!;

  const sorted = useMemo(() => {
    const pool = partyFilter === '전체'
      ? legislators
      : legislators.filter(l => l.POLY_NM === partyFilter);
    // funding_total and absent_rate: sort descending (most = worst)
    // others: sort descending (most = best)
    return [...pool]
      .filter(l => (l[activeTab] as number) > 0)
      .sort((a, b) => (b[activeTab] as number) - (a[activeTab] as number));
  }, [legislators, activeTab, partyFilter]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3, 10);

  const isFunding = activeTab === 'funding_total';

  return (
    <div className="container-page py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">국회의원 랭킹</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1.5 leading-relaxed">
          22대 국회 {legislators.length}명 의원의 발의·통과 법안, 투표 참여율, 결석률, 정치자금 지출을 순위로 확인합니다.
        </p>
        {isFunding && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 leading-relaxed">
            출처: OhmyNews/KA-money (정보공개 청구 데이터) · 중앙선거관리위원회 22대 국회의원 정치자금 지출 내역 · 높을수록 지출이 많음
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? t.higherIsWorse ? 'border-red-500 text-red-700' : 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Party filter */}
      <div className="mb-6">
        <select
          value={partyFilter}
          onChange={(e) => setPartyFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
        >
          {parties.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="ml-3 text-xs text-gray-400">{sorted.length}명</span>
      </div>

      {sorted.length === 0 && (
        <div className="card text-center py-16 text-gray-400">데이터가 없습니다.</div>
      )}

      {sorted.length > 0 && (
        <>
          {/* Podium — top 3 */}
          <div className={`grid gap-4 mb-8 ${top3.length === 3 ? 'grid-cols-3' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {top3.map((leg, i) => (
              <PodiumCard
                key={leg.MONA_CD}
                leg={leg}
                rank={i}
                metric={leg[activeTab] as number}
                unit={tab.unit}
                higherIsWorse={tab.higherIsWorse}
                formatFn={tab.formatFn}
                subLabel={isFunding ? leg.funding_top_category : undefined}
              />
            ))}
          </div>

          {/* Ranks 4–10 */}
          {rest.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-700 mb-3">4위 ~ {Math.min(sorted.length, 10)}위</h2>
              <div className="space-y-0.5">
                {rest.map((leg, i) => (
                  <RankRow
                    key={leg.MONA_CD}
                    leg={leg}
                    rank={i + 3}
                    metric={leg[activeTab] as number}
                    unit={tab.unit}
                    higherIsWorse={tab.higherIsWorse}
                    formatFn={tab.formatFn}
                    subLabel={isFunding ? leg.funding_top_category : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-400 mt-8 text-center leading-relaxed">
        출처: 열린국회정보 공개 API · OhmyNews/KA-money. 22대 국회 기준.
      </p>
    </div>
  );
}
