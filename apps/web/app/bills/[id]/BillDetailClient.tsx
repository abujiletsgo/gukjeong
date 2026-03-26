'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type {
  Bill,
  BillVoteResult,
  CitizenImpactDetail,
  ControversyDetail,
  BillPerspective,
  CoSponsor,
  BillTimelineItem,
} from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                 */
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

const STANCE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  '찬성': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '반대': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  '조건부 찬성': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

/* ------------------------------------------------------------------ */
/*  Expandable Section wrapper                                         */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  icon,
  expanded,
  onToggle,
  summary,
  children,
  badge,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
        aria-controls={`section-${id}`}
      >
        <span className="text-gray-400 shrink-0">{icon}</span>
        <span className="font-semibold text-gray-900 flex-1 text-base">{title}</span>
        {badge}
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {!expanded && summary && (
        <div className="px-5 pb-4 -mt-1 text-sm text-gray-500 line-clamp-2">{summary}</div>
      )}
      {expanded && (
        <div id={`section-${id}`} className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG Icon helpers                                                    */
/* ------------------------------------------------------------------ */

function CategoryIcon({ category }: { category: string }) {
  const size = 18;
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
/*  Vote Donut Chart                                                    */
/* ------------------------------------------------------------------ */

function VoteDonutChart({ vote }: { vote: BillVoteResult }) {
  const { yes, no, abstain, absent } = vote;
  const total = yes + no + abstain + absent;
  if (total === 0) return null;

  const r = 70;
  const cx = 100;
  const cy = 100;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * r;

  const segments: { label: string; value: number; color: string; tailwind: string }[] = [
    { label: '찬성', value: yes, color: '#22c55e', tailwind: 'bg-green-500' },
    { label: '반대', value: no, color: '#ef4444', tailwind: 'bg-red-500' },
    { label: '기권', value: abstain, color: '#f59e0b', tailwind: 'bg-amber-500' },
    { label: '불참', value: absent, color: '#94a3b8', tailwind: 'bg-gray-400' },
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
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={200} height={200} viewBox="0 0 200 200">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        {arcs}
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" className="fill-gray-900" style={{ fontSize: '24px', fontWeight: 700 }}>
          {Math.round((yes / total) * 100)}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle" className="fill-gray-400" style={{ fontSize: '11px' }}>
          찬성률
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${seg.tailwind}`} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="font-semibold text-gray-900 ml-auto tabular-nums">{seg.value}</span>
            <span className="text-gray-400 text-xs tabular-nums">({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">총 투표 수: {total}명</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Controversy Gauge                                                   */
/* ------------------------------------------------------------------ */

function ControversyGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const cx = 100;
  const cy = 100;
  const r = 80;
  const strokeWidth = 14;
  const halfCircumference = Math.PI * r;
  const dashFill = (pct / 100) * halfCircumference;

  const gaugeColor = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#22c55e';
  const label = pct >= 70 ? '높음' : pct >= 40 ? '보통' : '낮음';

  return (
    <div className="flex flex-col items-center">
      <svg width={200} height={120} viewBox="0 0 200 120">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashFill} ${halfCircumference}`}
        />
        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '32px', fontWeight: 700, fill: gaugeColor }}>
          {pct}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" className="fill-gray-400" style={{ fontSize: '12px' }}>
          / 100
        </text>
      </svg>
      <span
        className="text-sm font-semibold mt-1 px-3 py-1 rounded-full"
        style={{ color: gaugeColor, backgroundColor: `${gaugeColor}15` }}
      >
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bill Status Flow pipeline                                           */
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

function BillStatusFlow({ bill }: { bill: Bill }) {
  const currentStage = billToStage(bill);
  const isDiscarded = bill.status === '폐기';

  const stages: { label: string; key: PipelineStage }[] = [
    { label: '접수', key: '접수' },
    { label: '위원회', key: '위원회' },
    { label: '본회의', key: '본회의' },
    isDiscarded ? { label: '폐기', key: '폐기' } : { label: '가결', key: '가결' },
  ];

  const stageOrder: PipelineStage[] = ['접수', '위원회', '본회의', isDiscarded ? '폐기' : '가결'];
  const currentIdx = stageOrder.indexOf(currentStage);

  return (
    <div className="flex items-center">
      {stages.map((stage, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        const dotColor =
          isCurrent && stage.key === '폐기' ? 'bg-red-500 ring-red-100' :
          isCurrent && stage.key === '가결' ? 'bg-green-500 ring-green-100' :
          isCurrent ? 'bg-amber-500 ring-amber-100' :
          isPast ? 'bg-green-500' :
          'bg-gray-200';

        const lineColor = isPast ? 'bg-green-500' : 'bg-gray-200';

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full ${dotColor} ${isCurrent ? 'ring-4' : ''} flex items-center justify-center`}>
                {isPast && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-gray-900' : isFuture ? 'text-gray-300' : 'text-gray-500'}`}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 ${lineColor} mx-2`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Co-sponsor party distribution mini-bar                              */
/* ------------------------------------------------------------------ */

function PartyDistributionBar({ coSponsors }: { coSponsors: CoSponsor[] }) {
  const partyCount: Record<string, number> = {};
  coSponsors.forEach(cs => {
    const p = cs.party || '무소속';
    partyCount[p] = (partyCount[p] || 0) + 1;
  });
  const total = coSponsors.length;
  const sorted = Object.entries(partyCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3">
        {sorted.map(([party, count]) => (
          <div
            key={party}
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: getPartyColor(party),
            }}
            title={`${party} ${count}명`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {sorted.map(([party, count]) => (
          <span key={party} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getPartyColor(party) }} />
            {party} {count}명
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Impact labeled row                                                  */
/* ------------------------------------------------------------------ */

function ImpactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export default function BillDetailClient({ bill }: { bill: Bill }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    header: true,
    background: true,
    ai_summary: true,
    citizen_impact: true,
    controversy: false,
    perspectives: false,
    co_sponsors: false,
    vote: false,
    timeline: false,
    related: false,
  });

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const controversyScore = bill.controversy_detail?.score ?? bill.ai_controversy_score ?? 0;

  // Compute co-sponsor party counts for the collapsed summary
  const coSponsorCount = bill.co_sponsors?.length ?? bill.co_sponsors_count ?? 0;

  /* ---- inline SVG icon builders ---- */
  const ico = (d: string) => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  return (
    <div className="container-page py-8 space-y-5">
      {/* Back link */}
      <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        법안 목록
      </Link>

      {/* ============================================================ */}
      {/*  1. HEADER                                                     */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${STATUS_COLOR[bill.status ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[bill.status ?? ''] ?? 'bg-gray-400'}`} />
            {bill.status}
          </span>
          {bill.ai_category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-50 text-gray-600 border border-gray-100">
              <CategoryIcon category={bill.ai_category} />
              {bill.ai_category}
            </span>
          )}
          {bill.committee && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {bill.committee}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{bill.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          {bill.bill_no && <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">#{bill.bill_no}</span>}
          {bill.proposed_date && <span>{bill.proposed_date} 발의</span>}
          {bill.proposer_name && <span>{bill.proposer_name}</span>}
          {bill.proposer_type && <span className="text-gray-400">({bill.proposer_type})</span>}
        </div>
        {/* Status flow pipeline */}
        <div className="pt-2">
          <BillStatusFlow bill={bill} />
          {bill.status_detail && <p className="text-xs text-gray-400 mt-3">{bill.status_detail}</p>}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  2. BACKGROUND                                                 */}
      {/* ============================================================ */}
      {(bill.background || bill.problem_statement) && (
        <Section
          id="background"
          title="이 법안이 왜 나왔나"
          icon={ico('M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z')}
          expanded={expanded.background}
          onToggle={() => toggle('background')}
          summary={bill.background ? bill.background.slice(0, 100) + '...' : undefined}
        >
          {bill.background && (
            <p className="text-sm text-gray-700 leading-relaxed">{bill.background}</p>
          )}
          {bill.problem_statement && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-rose-600 mb-1.5 flex items-center gap-1.5">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                해결하려는 문제
              </p>
              <p className="text-sm text-rose-800 leading-relaxed">{bill.problem_statement}</p>
            </div>
          )}
        </Section>
      )}

      {/* ============================================================ */}
      {/*  3. AI SUMMARY                                                 */}
      {/* ============================================================ */}
      {bill.ai_summary && (
        <Section
          id="ai_summary"
          title="AI 요약"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2 4 4 0 0 1 4-4z" />
              <path d="M8 8v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8" />
              <path d="M2 12h4M18 12h4M6 16h2M16 16h2" />
            </svg>
          }
          badge={<span className="ai-badge text-xs">AI 분석</span>}
          expanded={expanded.ai_summary}
          onToggle={() => toggle('ai_summary')}
          summary={bill.ai_summary.slice(0, 120) + '...'}
        >
          <p className="text-sm text-gray-700 leading-relaxed">{bill.ai_summary}</p>
        </Section>
      )}

      {/* ============================================================ */}
      {/*  4. CITIZEN IMPACT DETAIL                                      */}
      {/* ============================================================ */}
      {(bill.citizen_impact_detail || bill.ai_citizen_impact) && (
        <Section
          id="citizen_impact"
          title="시민에게 미치는 영향"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
          expanded={expanded.citizen_impact}
          onToggle={() => toggle('citizen_impact')}
          summary={bill.ai_citizen_impact?.slice(0, 100) || bill.citizen_impact_detail?.daily_life_change?.slice(0, 100)}
        >
          {bill.ai_citizen_impact && !bill.citizen_impact_detail && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 leading-relaxed">{bill.ai_citizen_impact}</p>
            </div>
          )}
          {bill.citizen_impact_detail && (
            <div className="space-y-4">
              <ImpactRow
                icon={
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                }
                label="혜택을 받는 사람"
                value={bill.citizen_impact_detail.who_benefits}
              />
              <ImpactRow
                icon={
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
                label="영향을 받는 사람"
                value={bill.citizen_impact_detail.who_is_affected}
              />
              <ImpactRow
                icon={
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                }
                label="일상생활 변화"
                value={bill.citizen_impact_detail.daily_life_change}
              />
              <ImpactRow
                icon={
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                }
                label="예상 비용 (세금)"
                value={bill.citizen_impact_detail.estimated_cost}
              />
              <ImpactRow
                icon={
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                label="체감 시기"
                value={bill.citizen_impact_detail.timeline_to_effect}
              />
              {bill.citizen_impact_detail.real_example && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mt-2">
                  <p className="text-xs font-semibold text-sky-600 mb-1.5 flex items-center gap-1.5">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    구체적 사례
                  </p>
                  <p className="text-sm text-sky-800 leading-relaxed">{bill.citizen_impact_detail.real_example}</p>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ============================================================ */}
      {/*  5. CONTROVERSY DETAIL                                         */}
      {/* ============================================================ */}
      {(bill.controversy_detail || bill.ai_controversy_score != null) && (
        <Section
          id="controversy"
          title="논쟁도 상세"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          badge={
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              controversyScore >= 70 ? 'bg-red-100 text-red-700' :
              controversyScore >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {controversyScore}점
            </span>
          }
          expanded={expanded.controversy}
          onToggle={() => toggle('controversy')}
          summary={bill.controversy_detail?.why_controversial?.slice(0, 100)}
        >
          <ControversyGauge score={controversyScore} />

          {bill.controversy_detail?.why_controversial && (
            <p className="text-sm text-gray-700 leading-relaxed mt-3">{bill.controversy_detail.why_controversial}</p>
          )}

          {bill.controversy_detail?.key_disagreements && bill.controversy_detail.key_disagreements.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">핵심 쟁점</p>
              <ol className="list-decimal list-inside space-y-1.5">
                {bill.controversy_detail.key_disagreements.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed">{d}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Two-column: approval vs disapproval */}
          {(bill.controversy_detail?.approval_reasons?.length || bill.controversy_detail?.disapproval_reasons?.length) && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {/* 찬성 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-700 mb-2">찬성 이유</p>
                <ul className="space-y-1.5">
                  {(bill.controversy_detail?.approval_reasons ?? []).map((r, i) => (
                    <li key={i} className="text-sm text-blue-800 flex gap-2">
                      <span className="text-blue-400 shrink-0">+</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* 반대 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-700 mb-2">반대 이유</p>
                <ul className="space-y-1.5">
                  {(bill.controversy_detail?.disapproval_reasons ?? []).map((r, i) => (
                    <li key={i} className="text-sm text-red-800 flex gap-2">
                      <span className="text-red-400 shrink-0">-</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ============================================================ */}
      {/*  6. PERSPECTIVES                                               */}
      {/* ============================================================ */}
      {bill.perspectives && bill.perspectives.length > 0 && (
        <Section
          id="perspectives"
          title="다양한 시각"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
          badge={
            <span className="text-xs text-gray-400">{bill.perspectives.length}개 시각</span>
          }
          expanded={expanded.perspectives}
          onToggle={() => toggle('perspectives')}
          summary="이 법안에 대한 다양한 시각을 확인하세요."
        >
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            이 법안에 대한 다양한 시각을 확인하세요. 어떤 주장이 맞는지는 독자가 직접 판단해 주세요.
          </p>
          <div className="space-y-3">
            {bill.perspectives.map((p, i) => {
              const style = STANCE_STYLE[p.stance] ?? STANCE_STYLE['조건부 찬성'];
              return (
                <div key={i} className={`rounded-lg border p-4 ${style.border} bg-white`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
                      {p.stance}
                    </span>
                    <span className="font-semibold text-sm text-gray-900">{p.who}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.argument}</p>
                  {p.quote && (
                    <blockquote className="mt-3 pl-3 border-l-2 border-gray-300">
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        {'\u300C'}{p.quote}{'\u300D'}
                      </p>
                      {p.quote_source && (
                        <cite className="block text-xs text-gray-400 mt-1 not-italic">{p.quote_source}</cite>
                      )}
                    </blockquote>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============================================================ */}
      {/*  7. CO-SPONSORS                                                */}
      {/* ============================================================ */}
      {coSponsorCount > 0 && (
        <Section
          id="co_sponsors"
          title="공동발의자"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          badge={
            <span className="text-xs text-gray-400 font-medium">{coSponsorCount}명 공동발의</span>
          }
          expanded={expanded.co_sponsors}
          onToggle={() => toggle('co_sponsors')}
          summary={`${coSponsorCount}명이 공동 발의에 참여했습니다.`}
        >
          {bill.co_sponsors && bill.co_sponsors.length > 0 ? (
            <>
              <PartyDistributionBar coSponsors={bill.co_sponsors} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                {bill.co_sponsors.map((cs, i) => {
                  const card = (
                    <div
                      key={i}
                      className={`rounded-lg border border-gray-200 p-3 text-center${
                        cs.legislator_id ? ' hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group' : ''
                      }`}
                      style={{ borderTopWidth: '3px', borderTopColor: getPartyColor(cs.party) }}
                    >
                      <p className="font-semibold text-sm text-gray-900">{cs.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: getPartyColor(cs.party) }}>{cs.party}</p>
                      {cs.district && <p className="text-xs text-gray-400 mt-0.5">{cs.district}</p>}
                      {cs.role && (
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          cs.role === '대표발의'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {cs.role}
                        </span>
                      )}
                      {cs.legislator_id && (
                        <p className="text-xs text-blue-500 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          활동 현황 보기 →
                        </p>
                      )}
                    </div>
                  );
                  return cs.legislator_id ? (
                    <Link key={i} href={`/legislators/${cs.legislator_id}`}>
                      {card}
                    </Link>
                  ) : (
                    card
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">{coSponsorCount}명이 공동 발의에 참여했습니다.</p>
          )}
        </Section>
      )}

      {/* ============================================================ */}
      {/*  8. VOTE RESULT                                                */}
      {/* ============================================================ */}
      {bill.vote_result && (
        <Section
          id="vote"
          title="투표 결과"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          badge={
            bill.vote_result.yes + bill.vote_result.no > 0
              ? <span className="text-xs text-gray-400">
                  찬성 {bill.vote_result.yes} / 반대 {bill.vote_result.no}
                </span>
              : undefined
          }
          expanded={expanded.vote}
          onToggle={() => toggle('vote')}
          summary={`찬성 ${bill.vote_result.yes}명, 반대 ${bill.vote_result.no}명, 기권 ${bill.vote_result.abstain}명`}
        >
          <VoteDonutChart vote={bill.vote_result} />
        </Section>
      )}

      {/* ============================================================ */}
      {/*  9. BILL TIMELINE                                              */}
      {/* ============================================================ */}
      {bill.bill_timeline && bill.bill_timeline.length > 0 && (
        <Section
          id="timeline"
          title="법안 진행 타임라인"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          badge={
            <span className="text-xs text-gray-400">{bill.bill_timeline.length}단계</span>
          }
          expanded={expanded.timeline}
          onToggle={() => toggle('timeline')}
          summary={`${bill.bill_timeline[0].date} ~ ${bill.bill_timeline[bill.bill_timeline.length - 1].date}`}
        >
          <div className="relative pl-6">
            {/* vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {bill.bill_timeline.map((item, i) => {
              const isLast = i === bill.bill_timeline!.length - 1;
              const isFirst = i === 0;
              const dotColor = isLast
                ? bill.status === '가결' ? 'bg-green-500' : bill.status === '폐기' ? 'bg-red-500' : 'bg-amber-500'
                : isFirst ? 'bg-blue-500' : 'bg-gray-400';

              return (
                <div key={i} className="relative pb-5 last:pb-0">
                  <div className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-white ${dotColor} shadow-sm`} />
                  <div>
                    <p className="text-xs font-mono text-gray-400">{item.date}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.event}</p>
                    {item.detail && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============================================================ */}
      {/*  10. RELATED BILLS                                             */}
      {/* ============================================================ */}
      {bill.related_bills && bill.related_bills.length > 0 && (
        <Section
          id="related"
          title="관련 법안"
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          }
          badge={<span className="text-xs text-gray-400">{bill.related_bills.length}건</span>}
          expanded={expanded.related}
          onToggle={() => toggle('related')}
          summary={`관련 법안 ${bill.related_bills.length}건`}
        >
          <div className="flex flex-wrap gap-2">
            {bill.related_bills.map(rb => (
              <Link
                key={rb}
                href={`/bills/${rb}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent hover:underline font-medium bg-gray-50 rounded-md border border-gray-200 hover:border-accent/30 transition-colors"
              >
                {rb}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ============================================================ */}
      {/*  FOOTER                                                        */}
      {/* ============================================================ */}
      <div className="text-center py-6">
        <p className="text-xs text-gray-400 leading-relaxed max-w-lg mx-auto">
          이 페이지는 다양한 관점을 제공하여 시민이 스스로 판단할 수 있도록 돕습니다. 특정 입장을 대변하지 않습니다.
        </p>
      </div>
    </div>
  );
}
