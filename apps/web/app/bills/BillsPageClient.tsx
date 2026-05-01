'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Bill } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLOR: Record<string, string> = {
  '가결': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  '계류': 'bg-amber-100 text-amber-800 border-amber-200',
  '폐기': 'bg-rose-100 text-rose-800 border-rose-200',
};

const STATUS_DOT: Record<string, string> = {
  '가결': 'bg-emerald-500',
  '계류': 'bg-amber-500',
  '폐기': 'bg-rose-500',
};

const ISSUE_CATEGORIES = [
  { key: '보건의료', icon: 'health' },
  { key: '노동',     icon: 'labor' },
  { key: '농업',     icon: 'agriculture' },
  { key: '환경',     icon: 'environment' },
  { key: '금융',     icon: 'finance' },
  { key: '기술',     icon: 'tech' },
  { key: '산업',     icon: 'industry' },
  { key: '미디어',   icon: 'media' },
  { key: '복지',     icon: 'welfare' },
  { key: '부동산',   icon: 'housing' },
  { key: '반부패',   icon: 'anticorrupt' },
  { key: '안전',     icon: 'safety' },
] as const;

/* ------------------------------------------------------------------ */
/*  Category Icons                                                     */
/* ------------------------------------------------------------------ */

function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

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
/*  Controversy Meter (visual-only, no number)                         */
/* ------------------------------------------------------------------ */

function ControversyMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const segments = 5;
  const filledCount = Math.round((pct / 100) * segments);

  return (
    <div className="flex items-center gap-0.5" title={`논쟁도 ${pct}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-sm transition-colors ${
            i < filledCount
              ? pct >= 70
                ? 'bg-rose-500'
                : pct >= 40
                  ? 'bg-amber-400'
                  : 'bg-green-400'
              : 'bg-gray-200'
          }`}
        />
      ))}
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
/*  Status Pipeline                                                    */
/* ------------------------------------------------------------------ */

function StatusPipeline({ bills }: { bills: Bill[] }) {
  const stages: { label: string; key: PipelineStage; color: string; bgColor: string }[] = [
    { label: '접수',   key: '접수',   color: 'bg-gray-400',    bgColor: 'bg-gray-50 text-gray-700 border-gray-200' },
    { label: '위원회', key: '위원회', color: 'bg-indigo-500',  bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: '본회의', key: '본회의', color: 'bg-purple-500',  bgColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: '가결',   key: '가결',   color: 'bg-emerald-500', bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: '폐기',   key: '폐기',   color: 'bg-rose-500',    bgColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  const counts: Record<PipelineStage, number> = { '접수': 0, '위원회': 0, '본회의': 0, '가결': 0, '폐기': 0 };
  bills.forEach(b => { counts[billToStage(b)] += 1; });

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">법안 처리 현황</h2>
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
/*  Issue Category Cards                                               */
/* ------------------------------------------------------------------ */

function IssueCategoryGrid({
  bills,
  selected,
  onSelect,
}: {
  bills: Bill[];
  selected: string;
  onSelect: (cat: string) => void;
}) {
  const countMap = useMemo(() => {
    const m: Record<string, number> = {};
    bills.forEach(b => {
      const cat = b.ai_category;
      if (cat) m[cat] = (m[cat] ?? 0) + 1;
    });
    return m;
  }, [bills]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {ISSUE_CATEGORIES.map(({ key }) => {
        const count = countMap[key] ?? 0;
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(isActive ? '전체' : key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 transition-all text-center ${
              isActive
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : count > 0
                  ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm'
                  : 'bg-gray-50 text-gray-400 border-gray-100 cursor-default'
            }`}
            disabled={count === 0}
          >
            <span className={isActive ? 'text-white' : count > 0 ? 'text-gray-600' : 'text-gray-300'}>
              <CategoryIcon category={key} size={24} />
            </span>
            <span className="text-sm font-semibold leading-tight">{key}</span>
            <span className={`text-xs font-medium ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
              {count}건
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort                                                               */
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
/*  1-line summary helper                                              */
/* ------------------------------------------------------------------ */

function oneSentence(text?: string): string {
  if (!text) return '';
  // Take first sentence (ends with . or 다 or 음 or 임), or truncate
  const match = text.match(/^[^.]*[.다음임]/);
  if (match && match[0].length <= 120) return match[0];
  // Fallback: first 80 chars
  if (text.length <= 80) return text;
  return text.slice(0, 80) + '...';
}

/* ------------------------------------------------------------------ */
/*  Bill Card                                                          */
/* ------------------------------------------------------------------ */

function BillCard({ bill }: { bill: Bill }) {
  return (
    <Link
      href={`/bills/${bill.id}`}
      className="group block rounded-xl border border-gray-200 bg-white px-5 py-4 hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Row 1: status badge + category badge + controversy */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[bill.status ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[bill.status ?? ''] ?? 'bg-gray-400'}`} />
          {bill.status}
        </span>
        {bill.ai_category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
            {bill.ai_category}
          </span>
        )}
        <span className="ml-auto">
          <ControversyMeter score={bill.ai_controversy_score ?? 0} />
        </span>
      </div>

      {/* Row 2: title */}
      <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-accent transition-colors leading-snug mb-1">
        {bill.title}
      </h3>

      {/* Row 3: date + proposer */}
      <p className="text-xs text-gray-400 mb-1.5">
        {bill.proposed_date && <span>{bill.proposed_date}</span>}
        {bill.proposer_name && <span> · {bill.proposer_name}</span>}
      </p>

      {/* Row 4: 1-line summary */}
      {bill.ai_summary && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-1">
          {oneSentence(bill.ai_summary)}
        </p>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BillsPageClient({ bills, totalCount }: { bills: Bill[]; totalCount?: number }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [statusFilter, setStatusFilter] = useState<string>('전체');
  const [sortKey, setSortKey] = useState<SortKey>('latest');

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    let list = bills;
    if (categoryFilter !== '전체') list = list.filter(b => b.ai_category === categoryFilter);
    if (statusFilter !== '전체') list = list.filter(b => b.status === statusFilter);
    return sortBills(list, sortKey);
  }, [bills, categoryFilter, statusFilter, sortKey]);

  return (
    <div className="container-page py-8 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="section-title">법안</h1>
        <p className="text-gray-500 -mt-4 text-sm">
          22대 국회 주요 법안을 이슈별로 살펴보세요. 각 법안의 배경, 시민 영향, 찬반 논쟁을 확인할 수 있습니다.
        </p>
      </div>

      {/* ── Data note ── */}
      {totalCount && totalCount > bills.length && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-blue-800 leading-relaxed">
            22대 국회 전체 <strong>{totalCount.toLocaleString()}건</strong> 중 최근 발의 <strong>{bills.length}건</strong>을 표시합니다.
            열린국회정보 API 실시간 연동 데이터입니다.
          </p>
        </div>
      )}

      {/* ── Issue Category Cards ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">이슈별 보기</h2>
        <IssueCategoryGrid bills={bills} selected={categoryFilter} onSelect={setCategoryFilter} />
      </section>

      {/* ── Status Pipeline ── */}
      <StatusPipeline bills={bills} />

      {/* ── Filter / Sort Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status pills */}
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

        {/* Category pill (if selected) */}
        {categoryFilter !== '전체' && (
          <button
            onClick={() => setCategoryFilter('전체')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white"
          >
            {categoryFilter}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Sort */}
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="ml-auto px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="latest">최신순</option>
          <option value="controversy">논쟁도순</option>
        </select>
      </div>

      {/* ── Result count ── */}
      <p className="text-sm text-gray-400 -mb-4">{filtered.length}건의 법안</p>

      {/* ── Bill List ── */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">조건에 맞는 법안이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  );
}
