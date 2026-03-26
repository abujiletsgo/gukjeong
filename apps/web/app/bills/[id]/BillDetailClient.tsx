'use client';

import Link from 'next/link';
import type { Bill, BillVoteResult } from '@/lib/types';

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
/*  Category icon                                                      */
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
/*  Vote Donut Chart (large, SVG)                                      */
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

      {/* Legend */}
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
/*  Bill Status Flow (timeline)                                        */
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
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">처리 단계</h2>
      <div className="flex items-center">
        {stages.map((stage, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          const dotColor =
            isCurrent && stage.key === '폐기' ? 'bg-red-500 ring-red-100' :
            isCurrent && stage.key === '가결' ? 'bg-green-500 ring-green-100' :
            isCurrent ? 'bg-accent ring-orange-100' :
            isPast ? 'bg-green-500' :
            'bg-gray-200';

          const lineColor = isPast ? 'bg-green-500' : 'bg-gray-200';

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              {/* Dot + label */}
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
              {/* Connector line */}
              {i < stages.length - 1 && (
                <div className={`flex-1 h-0.5 ${lineColor} mx-2`} />
              )}
            </div>
          );
        })}
      </div>
      {bill.status_detail && (
        <p className="text-xs text-gray-400 mt-4">{bill.status_detail}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Controversy Gauge (SVG arc)                                        */
/* ------------------------------------------------------------------ */

function ControversyGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));

  // Semi-circle gauge
  const cx = 100;
  const cy = 100;
  const r = 80;
  const strokeWidth = 14;
  const halfCircumference = Math.PI * r;
  const dashFill = (pct / 100) * halfCircumference;

  // Color based on score
  const gaugeColor =
    pct >= 70 ? '#ef4444' :
    pct >= 40 ? '#f59e0b' :
    '#22c55e';

  const label =
    pct >= 70 ? '높음' :
    pct >= 40 ? '보통' :
    '낮음';

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">논쟁도</h2>
      <div className="flex flex-col items-center">
        <svg width={200} height={120} viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dashFill} ${halfCircumference}`}
          />
          {/* Score text */}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BillDetailClient({ bill }: { bill: Bill }) {
  return (
    <div className="container-page py-8 space-y-6">
      {/* Back link */}
      <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        법안 목록
      </Link>

      {/* Header Section */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status badge (large) */}
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${STATUS_COLOR[bill.status ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[bill.status ?? ''] ?? 'bg-gray-400'}`} />
            {bill.status}
          </span>

          {/* Category badge */}
          {bill.ai_category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-50 text-gray-600 border border-gray-100">
              <CategoryIcon category={bill.ai_category} />
              {bill.ai_category}
            </span>
          )}

          {/* Committee badge */}
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

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{bill.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          {bill.bill_no && (
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">#{bill.bill_no}</span>
          )}
          {bill.proposed_date && <span>{bill.proposed_date} 발의</span>}
          {bill.proposer_name && <span>{bill.proposer_name}</span>}
          {bill.proposer_type && <span className="text-gray-400">({bill.proposer_type})</span>}
        </div>
      </div>

      {/* Main grid: AI Analysis + Vote Result */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Analysis (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary card */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <span className="ai-badge">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2 4 4 0 0 1 4-4z" />
                  <path d="M8 8v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8" />
                  <path d="M2 12h4M18 12h4M6 16h2M16 16h2" />
                </svg>
                AI 분석
              </span>
            </div>

            {bill.ai_summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">요약</h3>
                <p className="text-gray-600 leading-relaxed">{bill.ai_summary}</p>
              </div>
            )}

            {bill.ai_citizen_impact && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  시민 영향
                </h3>
                <p className="text-sm text-amber-900 leading-relaxed">{bill.ai_citizen_impact}</p>
              </div>
            )}
          </div>

          {/* Status Flow */}
          <BillStatusFlow bill={bill} />

          {/* Related info */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">관련 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">공동발의자</p>
                <p className="text-lg font-bold text-gray-900">
                  {bill.co_sponsors_count != null ? `${bill.co_sponsors_count}명` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">관련 법안</p>
                <p className="text-lg font-bold text-gray-900">
                  {bill.related_bills && bill.related_bills.length > 0 ? `${bill.related_bills.length}건` : '없음'}
                </p>
              </div>
            </div>
            {bill.related_bills && bill.related_bills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {bill.related_bills.map(rb => (
                  <Link key={rb} href={`/bills/${rb}`} className="text-xs text-accent hover:underline font-medium">
                    {rb}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Vote + Controversy */}
        <div className="space-y-6">
          {/* Vote Result */}
          {bill.vote_result && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">투표 결과</h2>
              <VoteDonutChart vote={bill.vote_result} />
            </div>
          )}

          {/* Controversy Gauge */}
          {bill.ai_controversy_score != null && (
            <ControversyGauge score={bill.ai_controversy_score} />
          )}
        </div>
      </div>
    </div>
  );
}
