'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface ScoredLegislator {
  MONA_CD: string;
  HG_NM: string;
  POLY_NM: string;
  ORIG_NM: string;
  CMIT_NM: string;
  REELE_GBN_NM: string;

  // Bill activity
  bills_total: number;
  bills_cosponsor: number;
  bills_passed: number;
  bills_partial: number;
  bills_effective: number;
  bills_passage_rate: number;
  bills_effective_rate: number;
  bills_week: number;
  bills_month: number;
  bills_quarter: number;
  bills_year: number;
  bills_passed_month: number;
  bills_passed_year: number;

  // Policy
  primary_area: string;
  policy_concentration: number;

  // Collaboration
  bipartisan_bills: number;
  bipartisan_rate: number;
  bipartisan_parties: string[];

  // Voting
  vote_participation_rate: number;

  // Spending
  spending_total: number;
  spending_self_promo_pct: number;
  spending_policy_pct: number;

  // Words vs actions
  words_vs_actions_score: number;
  consistency_items: Array<{
    topic: string;
    speech_stance: string;
    vote_stance: string;
    is_consistent: boolean;
    explanation?: string;
  }>;

  // Scores
  activity_score: number;
  bills_percentile: number;
  effective_percentile: number;
  bipartisan_percentile: number;
  grade: string;

  // Rankings
  rank_overall: number;
  rank_bills_total: number;
  rank_bills_week: number;
  rank_bills_month: number;
  rank_bills_quarter: number;
  rank_bills_year: number;
  rank_effective_rate: number;
  rank_bipartisan: number;
  rank_wva: number;
  rank_spending_total: number;
  rank_self_promo: number;
}

interface Props {
  legislators: ScoredLegislator[];
  summary?: { avg_bills_proposed: number; avg_passage_rate: number; avg_bipartisan_rate: number };
}

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';
type MetricKey = 'overall' | 'volume' | 'effective' | 'bipartisan' | 'wva' | 'spending';

const PERIODS: { key: Period; label: string; note: string }[] = [
  { key: 'week',    label: '이번 주',   note: '최근 7일 발의' },
  { key: 'month',   label: '이번 달',   note: '최근 30일 발의' },
  { key: 'quarter', label: '3개월',     note: '최근 90일 발의' },
  { key: 'year',    label: '올해',      note: '최근 365일 발의' },
  { key: 'all',     label: '전체 기간', note: '22대 국회 전체' },
];

interface MetricSpec {
  key: MetricKey;
  label: string;
  desc: string;
  unit: string;
  higherIsWorse: boolean;
  getValue: (leg: ScoredLegislator, period: Period) => number;
  formatVal?: (v: number) => string;
  getSub?: (leg: ScoredLegislator, period: Period) => string;
  periodAware: boolean;
}

const METRICS: MetricSpec[] = [
  {
    key: 'overall', label: '종합', desc: '발의량·효과성·협력·말행일치 종합', unit: '점',
    higherIsWorse: false, periodAware: false,
    getValue: (l) => l.activity_score,
    getSub: (l) => `${l.grade}등급 · ${l.primary_area || '기타'}`,
  },
  {
    key: 'volume', label: '발의 건수', desc: '기간 내 법안 발의 수', unit: '건',
    higherIsWorse: false, periodAware: true,
    getValue: (l, p) => p === 'all' ? l.bills_total : p === 'year' ? l.bills_year : p === 'quarter' ? l.bills_quarter : p === 'month' ? l.bills_month : l.bills_week,
    getSub: (l) => `통과 ${l.bills_passed}건 · ${l.primary_area || '기타'}`,
  },
  {
    key: 'effective', label: '법안 효과율', desc: '통과 + 대안반영 포함 실효 입법률', unit: '%',
    higherIsWorse: false, periodAware: false,
    getValue: (l) => l.bills_effective_rate,
    getSub: (l, p) => `통과 ${l.bills_passed}건 + 대안반영 ${l.bills_partial}건 (총 ${l.bills_total}건)`,
  },
  {
    key: 'bipartisan', label: '초당적 협력', desc: '여야 공동 발의 비율 (국민의힘 ↔ 민주당 계열)', unit: '%',
    higherIsWorse: false, periodAware: false,
    getValue: (l) => l.bipartisan_rate,
    getSub: (l) => l.bipartisan_parties.length > 0 ? `협력 정당: ${l.bipartisan_parties.slice(0,2).join(', ')}` : '타 정당 협력 없음',
  },
  {
    key: 'wva', label: '말행일치', desc: '경력·위원회 배정 vs. 실제 법안 일치도', unit: '점',
    higherIsWorse: false, periodAware: false,
    getValue: (l) => l.words_vs_actions_score,
    getSub: (l) => {
      const item = l.consistency_items?.[0];
      return item ? `${item.topic}: ${item.is_consistent ? '✓' : '✗'} ${item.is_consistent ? '일치' : '불일치'}` : '';
    },
  },
  {
    key: 'spending', label: '정치자금', desc: '2024 정치자금 자기홍보 비율 (낮을수록 정책 중심)', unit: '%',
    higherIsWorse: true, periodAware: false,
    getValue: (l) => l.spending_self_promo_pct,
    formatVal: (v) => v > 0 ? v.toFixed(1) : '-',
    getSub: (l) => l.spending_total > 0 ? `총 ${(l.spending_total / 1e6).toFixed(0)}백만원 지출` : '지출 데이터 없음',
  },
];

const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1A56DB', '국민의힘': '#E5243B',
  '조국혁신당': '#6B21A8', '진보당': '#E11D48',
  '개혁신당': '#F97316', '기본소득당': '#22C55E',
  '사회민주당': '#EC4899', '무소속': '#6B7280',
};
function partyColor(p?: string) { return PARTY_COLORS[p || ''] || '#6B7280'; }
function partyShort(p?: string) {
  return (p || '무소속').replace('더불어민주당','민주').replace('국민의힘','국힘').replace('조국혁신당','조혁').slice(0,4);
}

function Avatar({ mona, name, party, size }: { mona: string; name: string; party: string; size: 'lg'|'sm' }) {
  const [err, setErr] = useState(false);
  const cls = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-base';
  if (!err)
    return <img src={`/legislators-thumb/${mona}.jpg`} alt={name} onError={() => setErr(true)} className={`${cls} rounded-full object-cover object-top flex-shrink-0`} />;
  return (
    <div className={`${cls} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ backgroundColor: partyColor(party) }}>
      {name.charAt(0)}
    </div>
  );
}

function GradeChip({ grade }: { grade: string }) {
  const color = grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' : grade.startsWith('B') ? 'bg-blue-100 text-blue-700' : grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' : grade.startsWith('D') ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>{grade}</span>;
}

function WVABadge({ score }: { score: number }) {
  const pct = Math.round(score);
  const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : pct >= 30 ? '#F97316' : '#EF4444';
  const size = 32, r = 12, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`}/>
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="bold" fill={color}>{pct}</text>
      </svg>
      <span className="text-[9px] text-gray-400">말행일치</span>
    </div>
  );
}

function medal(r: number) { return r === 0 ? '🥇' : r === 1 ? '🥈' : r === 2 ? '🥉' : ''; }

function PodiumCard({ leg, rank, spec, period }: { leg: ScoredLegislator; rank: number; spec: MetricSpec; period: Period }) {
  const val = spec.getValue(leg, period);
  const displayVal = spec.formatVal ? spec.formatVal(val) : typeof val === 'number' ? val.toLocaleString() : String(val);
  const sub = spec.getSub?.(leg, period);
  const isFirst = rank === 0;
  const bad = spec.higherIsWorse;

  return (
    <Link href={`/legislators/${leg.MONA_CD}`} className="block">
      <div className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
        isFirst && !bad ? 'border-yellow-300 bg-yellow-50 shadow-sm' : isFirst && bad ? 'border-red-200 bg-red-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-white'
      }`}>
        <span className="text-2xl mb-2">{medal(rank)}</span>
        <Avatar mona={leg.MONA_CD} name={leg.HG_NM} party={leg.POLY_NM} size={isFirst ? 'lg' : 'sm'} />
        <p className={`mt-2 font-bold text-gray-900 ${isFirst ? 'text-base' : 'text-sm'}`}>{leg.HG_NM}</p>
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white mt-0.5" style={{ backgroundColor: partyColor(leg.POLY_NM) }}>
          {partyShort(leg.POLY_NM)}
        </span>
        <p className={`mt-2 font-extrabold ${isFirst ? 'text-2xl' : 'text-lg'} ${bad ? 'text-red-600' : 'text-gray-800'}`}>
          {displayVal}<span className="text-xs font-normal text-gray-400 ml-0.5">{spec.unit}</span>
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-full px-1">{sub}</p>}
        <div className="mt-1 flex items-center gap-1">
          <GradeChip grade={leg.grade} />
        </div>
      </div>
    </Link>
  );
}

function RankRow({ leg, rank, spec, period, showWVA }: { leg: ScoredLegislator; rank: number; spec: MetricSpec; period: Period; showWVA?: boolean }) {
  const val = spec.getValue(leg, period);
  const displayVal = spec.formatVal ? spec.formatVal(val) : typeof val === 'number' ? val.toLocaleString() : String(val);
  const sub = spec.getSub?.(leg, period);
  const bad = spec.higherIsWorse;

  return (
    <Link href={`/legislators/${leg.MONA_CD}`} className="block">
      <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${bad ? 'hover:bg-red-50' : 'hover:bg-gray-50'} cursor-pointer`}>
        <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">{rank}</span>
        <Avatar mona={leg.MONA_CD} name={leg.HG_NM} party={leg.POLY_NM} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900">{leg.HG_NM}</span>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: partyColor(leg.POLY_NM) }}>
              {partyShort(leg.POLY_NM)}
            </span>
            <GradeChip grade={leg.grade} />
          </div>
          {sub && <p className="text-xs text-gray-400 truncate mt-0.5">{sub}</p>}
        </div>
        {showWVA && <WVABadge score={leg.words_vs_actions_score} />}
        <span className={`text-sm font-bold flex-shrink-0 ${bad ? 'text-red-600' : 'text-gray-800'}`}>
          {displayVal}<span className="text-xs font-normal text-gray-500 ml-0.5">{spec.unit}</span>
        </span>
      </div>
    </Link>
  );
}

export default function RankingLeaderboard({ legislators, summary }: Props) {
  const [period, setPeriod] = useState<Period>('all');
  const [metric, setMetric] = useState<MetricKey>('overall');
  const [partyFilter, setPartyFilter] = useState('전체');
  const [showAll, setShowAll] = useState(false);

  const parties = useMemo(() => {
    const seen = new Set<string>();
    legislators.forEach(l => { if (l.POLY_NM) seen.add(l.POLY_NM); });
    return ['전체', ...Array.from(seen).sort()];
  }, [legislators]);

  const spec = METRICS.find(m => m.key === metric)!;

  const sorted = useMemo(() => {
    const pool = partyFilter === '전체' ? legislators : legislators.filter(l => l.POLY_NM === partyFilter);
    const withVal = pool.map(l => ({ l, v: spec.getValue(l, period) }));
    const nonZero = withVal.filter(({ v }) => v > 0);
    nonZero.sort((a, b) => spec.higherIsWorse ? b.v - a.v : b.v - a.v);
    // For spending higherIsWorse, we actually want HIGHEST self-promo first (worst actors)
    return nonZero.map(({ l }) => l);
  }, [legislators, period, metric, partyFilter, spec]);

  const visible = showAll ? sorted : sorted.slice(0, 20);
  const top3 = sorted.slice(0, 3);
  const rest = visible.slice(3);

  const periodSpec = PERIODS.find(p => p.key === period)!;

  return (
    <div className="container-page py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">국회의원 랭킹</h1>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          22대 국회 {legislators.length}명 의원의 입법 활동, 초당적 협력, 말행일치, 정치자금 지출을 기간별로 비교합니다.
        </p>
        {summary && (
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-xs text-gray-400">평균 발의: <strong className="text-gray-700">{summary.avg_bills_proposed}건</strong></span>
            <span className="text-xs text-gray-400">평균 통과율: <strong className="text-gray-700">{summary.avg_passage_rate}%</strong></span>
            <span className="text-xs text-gray-400">평균 초당협력: <strong className="text-gray-700">{summary.avg_bipartisan_rate}%</strong></span>
          </div>
        )}
      </div>

      {/* Period selector */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">기간 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                period === p.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {!METRICS.find(m => m.key === metric)?.periodAware && period !== 'all' && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            현재 지표는 전체 기간 기준입니다. 기간 필터는 &apos;발의 건수&apos; 지표에서 적용됩니다.
          </p>
        )}
      </div>

      {/* Metric tabs */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">순위 기준</p>
        <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                metric === m.key
                  ? m.higherIsWorse ? 'border-red-500 text-red-700' : 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{spec.desc}</p>
        {metric === 'spending' && (
          <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 leading-relaxed">
            홍보·언론비 비율이 높은 순. 낮을수록 정책·공익 활동 중심. 전체 의원 평균 약 14.5%.
          </div>
        )}
        {metric === 'wva' && (
          <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-relaxed">
            경력 배경·소속 위원회와 실제 발의 법안 분야의 일치도. 공약한 분야에서 실제로 입법 활동을 하는지 측정합니다.
          </div>
        )}
        {metric === 'bipartisan' && (
          <div className="mt-2 p-2.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 leading-relaxed">
            여야(국민의힘 ↔ 민주당 계열) 경계를 넘어 공동 발의한 법안 비율입니다. 개혁신당 등 중도 정당은 구조적으로 높은 경향이 있습니다.
          </div>
        )}
      </div>

      {/* Party filter + count */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={partyFilter}
          onChange={e => setPartyFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          {parties.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-400">{sorted.length}명 · {periodSpec.note}</span>
      </div>

      {sorted.length === 0 && (
        <div className="card text-center py-16 text-gray-400">이 기간에는 해당 데이터가 없습니다.</div>
      )}

      {sorted.length > 0 && (
        <>
          {/* Podium */}
          <div className={`grid gap-4 mb-8 ${top3.length >= 3 ? 'grid-cols-3' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {top3.map((leg, i) => (
              <PodiumCard key={leg.MONA_CD} leg={leg} rank={i} spec={spec} period={period} />
            ))}
          </div>

          {/* Ranks 4+ */}
          {rest.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-700 mb-3">4위 ~ {Math.min(sorted.length, showAll ? sorted.length : 20)}위</h2>
              <div className="space-y-0.5 divide-y divide-gray-50">
                {rest.map((leg, i) => (
                  <RankRow key={leg.MONA_CD} leg={leg} rank={i + 4} spec={spec} period={period} showWVA={metric !== 'wva'} />
                ))}
              </div>
              {!showAll && sorted.length > 20 && (
                <button onClick={() => setShowAll(true)} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  전체 {sorted.length}명 보기
                </button>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-400 mt-8 text-center leading-relaxed">
        출처: 열린국회정보 공개 API · 중앙선거관리위원회 정치자금 공개 · 22대 국회 기준
      </p>
    </div>
  );
}
