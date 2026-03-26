'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Bill } from '@/lib/types';
import KPI from '@/components/common/KPI';

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_COLOR: Record<string, string> = {
  '가결': 'bg-green-100 text-green-800 border-green-200',
  '계류': 'bg-amber-100 text-amber-800 border-amber-200',
  '폐기': 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_DOT: Record<string, string> = {
  '가결': 'bg-green-500',
  '계류': 'bg-amber-500',
  '폐기': 'bg-red-500',
};

/* ------------------------------------------------------------------ */
/*  Category icons (inline SVG)                                        */
/* ------------------------------------------------------------------ */

function CategoryIcon({ category }: { category: string }) {
  const size = 16;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (category) {
    case '보건의료':
      return <svg {...common}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
    case '노동':
      return <svg {...common}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    case '환경':
      return <svg {...common}><path d="M17 8C8 10 5.9 16.17 3.82 21.34M20.2 2.8c0 0-1 4.2-6.2 7.2s-10 3-10 3" /><path d="M2 21c0-8 6-14 14-14" /></svg>;
    case '금융':
      return <svg {...common}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case '산업':
      return <svg {...common}><path d="M2 20h20" /><path d="M5 20V8l5 4V8l5 4V4l5 4v12" /></svg>;
    case '기술':
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M15 2v2M15 20v2M2 15h2M20 15h2M9 2v2M9 20v2M2 9h2M20 9h2" /></svg>;
    case '미디어':
      return <svg {...common}><rect x="2" y="7" width="20" height="15" rx="2" /><polyline points="17 2 12 7 7 2" /></svg>;
    case '복지':
      return <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case '부동산':
      return <svg {...common}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case '반부패':
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case '농업':
      return <svg {...common}><path d="M12 22c0-8 4-12 8-14-4 0-8 2-8 2s-4-2-8-2c4 2 8 6 8 14z" /><path d="M12 10V2" /></svg>;
    case '안전':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
  }
}

/* ------------------------------------------------------------------ */
/*  Mini Vote Donut (for card)                                         */
/* ------------------------------------------------------------------ */

function MiniVoteDonut({ yes, no, abstain, absent }: { yes: number; no: number; abstain: number; absent: number }) {
  const total = yes + no + abstain + absent;
  if (total === 0) return null;

  const r = 18;
  const cx = 24;
  const cy = 24;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: yes, color: '#22c55e' },
    { value: no, color: '#ef4444' },
    { value: abstain, color: '#f59e0b' },
    { value: absent, color: '#94a3b8' },
  ];

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const dash = (seg.value / total) * circumference;
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width={48} height={48} viewBox="0 0 48 48">
      {arcs}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700" style={{ fontSize: '8px', fontWeight: 600 }}>
        {Math.round((yes / total) * 100)}%
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Controversy meter                                                  */
/* ------------------------------------------------------------------ */

function ControversyMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 70 ? 'from-red-500 to-red-600' :
    pct >= 40 ? 'from-amber-400 to-orange-500' :
    'from-green-400 to-green-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 tabular-nums w-8 text-right">{pct}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline stage helpers                                             */
/* ------------------------------------------------------------------ */

type PipelineStage = '접수' | '위원회' | '본회의' | '가결' | '폐기';

function billToStage(bill: Bill): PipelineStage {
  if (bill.status === '가결') return '가결';
  if (bill.status === '폐기') return '폐기';
  const detail = bill.status_detail ?? '';
  if (detail.includes('본회의') || detail.includes('전체회의')) return '본회의';
  if (detail.includes('위원회') || detail.includes('소위원회') || detail.includes('심사') || detail.includes('체계') || detail.includes('회부')) return '위원회';
  return '접수';
}

/* ------------------------------------------------------------------ */
/*  Status Pipeline Visualization                                      */
/* ------------------------------------------------------------------ */

function StatusPipeline({ bills }: { bills: Bill[] }) {
  const stages: { label: string; key: PipelineStage; color: string; bgColor: string }[] = [
    { label: '접수', key: '접수', color: 'bg-blue-500', bgColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: '위원회', key: '위원회', color: 'bg-indigo-500', bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: '본회의', key: '본회의', color: 'bg-purple-500', bgColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: '가결', key: '가결', color: 'bg-green-500', bgColor: 'bg-green-50 text-green-700 border-green-200' },
    { label: '폐기', key: '폐기', color: 'bg-red-500', bgColor: 'bg-red-50 text-red-700 border-red-200' },
  ];

  const counts: Record<PipelineStage, number> = { '접수': 0, '위원회': 0, '본회의': 0, '가결': 0, '폐기': 0 };
  bills.forEach(b => { counts[billToStage(b)] += 1; });

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">법안 처리 파이프라인</h2>
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center">
            <div className={`flex flex-col items-center justify-center rounded-lg border px-3 py-3 sm:px-5 sm:py-4 min-w-[72px] ${stage.bgColor}`}>
              <div className={`w-3 h-3 rounded-full ${stage.color} mb-1.5`} />
              <span className="text-xs font-medium">{stage.label}</span>
              <span className="text-lg font-bold mt-0.5">{counts[stage.key]}</span>
            </div>
            {i < stages.length - 1 && (
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-300 mx-0.5 flex-shrink-0">
                <path d="M6 4l8 6-8 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort options                                                       */
/* ------------------------------------------------------------------ */

type SortKey = 'latest' | 'controversy';

function sortBills(bills: Bill[], key: SortKey): Bill[] {
  const sorted = [...bills];
  if (key === 'controversy') {
    sorted.sort((a, b) => (b.ai_controversy_score ?? 0) - (a.ai_controversy_score ?? 0));
  } else {
    sorted.sort((a, b) => (b.proposed_date ?? '').localeCompare(a.proposed_date ?? ''));
  }
  return sorted;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BillsPageClient({ bills }: { bills: Bill[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('전체');
  const [committeeFilter, setCommitteeFilter] = useState<string>('전체');
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [sortKey, setSortKey] = useState<SortKey>('latest');

  /* Derived lists for dropdowns */
  const committees = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => { if (b.committee) set.add(b.committee); });
    return Array.from(set).sort();
  }, [bills]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => { if (b.ai_category) set.add(b.ai_category); });
    return Array.from(set).sort();
  }, [bills]);

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    let list = bills;
    if (statusFilter !== '전체') list = list.filter(b => b.status === statusFilter);
    if (committeeFilter !== '전체') list = list.filter(b => b.committee === committeeFilter);
    if (categoryFilter !== '전체') list = list.filter(b => b.ai_category === categoryFilter);
    return sortBills(list, sortKey);
  }, [bills, statusFilter, committeeFilter, categoryFilter, sortKey]);

  /* KPI numbers */
  const totalCount = bills.length;
  const passedCount = bills.filter(b => b.status === '가결').length;
  const pendingCount = bills.filter(b => b.status === '계류').length;
  const avgControversy = bills.length > 0
    ? Math.round(bills.reduce((sum, b) => sum + (b.ai_controversy_score ?? 0), 0) / bills.length)
    : 0;

  return (
    <div className="container-page py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title">법안 추적</h1>
        <p className="text-gray-600 -mt-4 mb-2">국회에서 발의된 법안을 AI가 요약하고, 시민에게 미치는 영향을 분석합니다.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="총 법안 수"
          value={String(totalCount)}
          icon={
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <KPI
          label="가결"
          value={String(passedCount)}
          icon={
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <KPI
          label="계류 중"
          value={String(pendingCount)}
          icon={
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KPI
          label="평균 논쟁도"
          value={String(avgControversy)}
          icon={
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-5.5 1.38 0 2.5.5 3 1 1.07 2.14 0 5.5-3 5.5a2.5 2.5 0 0 0 0 5H16" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          }
        />
      </div>

      {/* Status Pipeline */}
      <StatusPipeline bills={bills} />

      {/* Data disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6">
        현재 표시된 법안은 22대 국회의 <strong>주요 법안 {bills.length}건</strong>입니다.
        실제 22대 국회에서는 약 25,000건 이상의 법안이 발의되었으며,
        열린국회정보 API 연동이 완료되면 전체 법안을 실시간으로 제공할 예정입니다.
        <a href="/about#data" className="underline font-semibold ml-1">데이터 출처 →</a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {['전체', '가결', '계류', '폐기'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Committee dropdown */}
        <select
          value={committeeFilter}
          onChange={e => setCommitteeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="전체">위원회 전체</option>
          {committees.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="전체">분야 전체</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30 ml-auto"
        >
          <option value="latest">최신순</option>
          <option value="controversy">논쟁도 높은순</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">{filtered.length}건의 법안</p>

      {/* Bill Cards Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">조건에 맞는 법안이 없습니다.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(bill => (
            <Link key={bill.id} href={`/bills/${bill.id}`} className="card hover:shadow-md transition-shadow group block">
              {/* Top row: status + category */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[bill.status ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[bill.status ?? ''] ?? 'bg-gray-400'}`} />
                  {bill.status}
                </span>
                {bill.ai_category && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600">
                    <CategoryIcon category={bill.ai_category} />
                    {bill.ai_category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 group-hover:text-accent transition-colors mb-1 leading-snug">
                {bill.title}
              </h3>

              {/* Meta */}
              <p className="text-xs text-gray-400 mb-2">
                {bill.proposed_date && <span>{bill.proposed_date}</span>}
                {bill.proposer_name && <span> &middot; {bill.proposer_name}</span>}
              </p>

              {/* AI Summary */}
              {bill.ai_summary && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{bill.ai_summary}</p>
              )}

              {/* Bottom row: controversy + optional vote donut */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-medium">논쟁도</p>
                  <ControversyMeter score={bill.ai_controversy_score ?? 0} />
                </div>
                {bill.vote_result && (
                  <div className="flex-shrink-0">
                    <MiniVoteDonut
                      yes={bill.vote_result.yes}
                      no={bill.vote_result.no}
                      abstain={bill.vote_result.abstain}
                      absent={bill.vote_result.absent}
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
