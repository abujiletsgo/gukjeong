'use client';

import { useMemo, useState, useCallback } from 'react';
import type { Legislator, LegislatorBill } from '@/lib/types';
import Link from 'next/link';
import WordsVsActions from '@/components/legislators/WordsVsActions';

// ── 정당 색상 (배지 전용) ──
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

// ── Cross-linking: Bills in our DB ──
const KNOWN_BILLS: { id: string; title: string; status: string }[] = [
  { id: 'bill-001', title: '간호법', status: '가결' },
  { id: 'bill-002', title: '노란봉투법', status: '가결' },
  { id: 'bill-003', title: '양곡관리법 개정안', status: '폐기' },
  { id: 'bill-004', title: '플랫폼 종사자 보호법', status: '계류' },
  { id: 'bill-005', title: '탄소중립 기본법 개정안', status: '계류' },
  { id: 'bill-006', title: '디지털자산 기본법', status: '계류' },
  { id: 'bill-007', title: '반도체특별법', status: '가결' },
  { id: 'bill-008', title: '인공지능 기본법', status: '계류' },
  { id: 'bill-009', title: '방송법 개정안', status: '가결' },
  { id: 'bill-010', title: '전국민 돌봄법', status: '계류' },
  { id: 'bill-011', title: '부동산 실거래 투명화법', status: '계류' },
  { id: 'bill-012', title: '청년기본소득법', status: '계류' },
  { id: 'bill-013', title: '공직자 이해충돌방지법 개정안', status: '가결' },
  { id: 'bill-014', title: '채용절차공정화법 개정안', status: '계류' },
  { id: 'bill-015', title: '전기통신사업법 개정안', status: '계류' },
  { id: 'bill-016', title: '재난안전관리 기본법 개정안', status: '가결' },
];

// ── 시뮬레이션 데이터 생성 유틸 ──

/** Seeded PRNG for deterministic per-legislator data */
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return function () {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 0xffffffff;
  };
}

function generateDatesBackward(count: number, startDate: string = '2026-03-25'): string[] {
  const dates: string[] = [];
  const base = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - (i * 3 + Math.floor(i / 3)));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

interface SessionItem {
  type: '본회의' | '위원회';
  date: string;
  attended: boolean;
}

function generateAttendanceSessions(attendanceRate: number, seed: string): SessionItem[] {
  const rng = seededRandom(seed + '-attendance');
  const count = 20;
  const dates = generateDatesBackward(count);
  const attendedCount = Math.round((attendanceRate / 100) * count);
  const statuses = Array.from({ length: count }, (_, i) => i < attendedCount);
  // Shuffle with seeded RNG
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }
  return dates.map((date, i) => ({
    type: (rng() > 0.4 ? '본회의' : '위원회') as '본회의' | '위원회',
    date,
    attended: statuses[i],
  }));
}

interface BillItem {
  title: string;
  date: string;
  status: string;
  linkedBillId?: string;
  role: '대표발의' | '공동발의';
}

const SIMULATED_BILL_TITLES = [
  '청년기본소득법',
  '플랫폼노동자보호법',
  '공공임대주택 확대법',
  '소상공인 지원법 개정안',
  '아동학대처벌법 강화안',
  '디지털 개인정보 보호법',
  '최저임금법 개정안',
  '중소기업 기술보호법',
  '국민건강보험법 개정안',
  '재난지원금 지급법',
  '기후위기 대응법',
  '노인복지법 개정안',
  '장애인 차별금지법 강화안',
  '학교폭력예방법 개정안',
  '여성폭력방지법 개정안',
  '공직선거법 개정안',
  '지방재정법 개정안',
  '식품안전기본법 개정안',
  '주택임대차보호법 개정안',
  '교통안전법 개정안',
  '문화산업진흥법 개정안',
  '군인복지법 개정안',
  '소비자기본법 개정안',
  '중대재해처벌법 개정안',
  '전기사업법 개정안',
  '항공안전법 개정안',
  '관광진흥법 개정안',
  '도시재생법 개정안',
  '산업안전보건법 개정안',
  '농어업인 삶의 질 향상법',
];

const BILL_STATUSES = ['계류 중', '소위 심사 중', '전체회의 상정', '본회의 상정', '가결', '폐기'];

function generateBillItems(count: number, seed: string): BillItem[] {
  const rng = seededRandom(seed + '-bills');
  const dates = generateDatesBackward(Math.max(count, 1), '2026-03-15');
  const items: BillItem[] = [];

  for (let i = 0; i < Math.min(count, 30); i++) {
    const titleIdx = Math.floor(rng() * SIMULATED_BILL_TITLES.length);
    const title = SIMULATED_BILL_TITLES[titleIdx];
    const statusIdx = Math.floor(rng() * BILL_STATUSES.length);

    // Check if this matches a known bill
    const knownMatch = KNOWN_BILLS.find(b => title.includes(b.title) || b.title.includes(title));

    items.push({
      title: `${title}`,
      date: dates[i % dates.length],
      status: knownMatch ? knownMatch.status : BILL_STATUSES[statusIdx],
      linkedBillId: knownMatch?.id,
      role: rng() > 0.3 ? '공동발의' : '대표발의',
    });
  }
  return items;
}

interface SpeechItem {
  type: string;
  topic: string;
  date: string;
}

const SPEECH_TYPES = ['대정부질문', '5분 자유발언', '의사진행발언', '교섭단체 대표연설', '긴급현안질문', '인사청문회 질의'];
const SPEECH_TOPICS = [
  '부동산 정책', '저출산 대책', '경제 활성화', '청년 고용', '교육 정책',
  '환경 문제', '복지 예산', '외교 안보', '디지털 전환', '의료 개혁',
  '기후 변화', '중소기업 지원', '노동 정책', '국방 예산', '통일 정책',
  '사법 개혁', '지방 분권', '과학기술 투자', '공정경제', '문화 정책',
];

function generateSpeechItems(count: number, seed: string, topics?: string[]): SpeechItem[] {
  const rng = seededRandom(seed + '-speech');
  const dates = generateDatesBackward(Math.max(count, 1), '2026-03-20');
  const availableTopics = topics && topics.length > 0 ? [...topics, ...SPEECH_TOPICS] : SPEECH_TOPICS;
  const items: SpeechItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      type: SPEECH_TYPES[Math.floor(rng() * SPEECH_TYPES.length)],
      topic: availableTopics[Math.floor(rng() * availableTopics.length)],
      date: dates[i % dates.length],
    });
  }
  return items;
}

interface VoteItem {
  billTitle: string;
  vote: '찬성' | '반대' | '기권';
  date: string;
  linkedBillId?: string;
}

function generateVoteItems(voteRate: number, seed: string): VoteItem[] {
  const rng = seededRandom(seed + '-vote');
  const count = 15;
  const dates = generateDatesBackward(count, '2026-03-22');
  const items: VoteItem[] = [];

  // Use some known bills + simulated ones
  const voteBills = [
    { title: '간호법', id: 'bill-001' },
    { title: '반도체특별법', id: 'bill-007' },
    { title: '방송법 개정안', id: 'bill-009' },
    { title: '노란봉투법', id: 'bill-002' },
    { title: '공직자 이해충돌방지법 개정안', id: 'bill-013' },
    { title: '재난안전관리 기본법 개정안', id: 'bill-016' },
    { title: '청년기본소득법', id: 'bill-012' },
    { title: '교육기본법 개정안', id: undefined },
    { title: '정보통신망법 개정안', id: undefined },
    { title: '국민연금법 개정안', id: undefined },
    { title: '도시재생법 개정안', id: undefined },
    { title: '산업안전보건법 개정안', id: undefined },
    { title: '형사소송법 개정안', id: undefined },
    { title: '주택법 개정안', id: undefined },
    { title: '식품위생법 개정안', id: undefined },
  ];

  const participatedCount = Math.round((voteRate / 100) * count);

  for (let i = 0; i < count; i++) {
    const bill = voteBills[i % voteBills.length];
    const participated = i < participatedCount;
    let vote: '찬성' | '반대' | '기권';
    if (!participated) {
      // Not really used since we only show participated votes
      vote = '기권';
    } else {
      const r = rng();
      vote = r > 0.25 ? '찬성' : r > 0.1 ? '반대' : '기권';
    }

    if (participated) {
      items.push({
        billTitle: bill.title,
        vote,
        date: dates[i],
        linkedBillId: bill.id,
      });
    }
  }
  return items;
}


// ── Props ──
interface LegislatorDetailClientProps {
  legislator: Legislator;
  allLegislators: Legislator[];
}

// ── 비율 바 (neutral gray) ──
function NeutralBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-800">
          {value > 0 ? `${value}%` : '-'}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Info Box (context explanation) ──
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3 flex gap-2.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <div className="text-xs text-gray-500 leading-relaxed">{children}</div>
    </div>
  );
}

// ── External link ──
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 hover:underline"
    >
      {children}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

// ── Section Expand Header ──
function SectionHeader({
  title,
  summary,
  isOpen,
  onToggle,
}: {
  title: string;
  summary: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left flex items-start justify-between gap-3 group"
      aria-expanded={isOpen}
    >
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-lg text-gray-900 group-hover:text-gray-700 transition-colors">
          {title}
        </h2>
        <div className="text-sm text-gray-600 mt-1">{summary}</div>
      </div>
      <span className="shrink-0 mt-1.5 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
  );
}

// ── "더 보기" wrapper ──
function ExpandableList<T>({
  items,
  initialCount = 10,
  renderItem,
}: {
  items: T[];
  initialCount?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;

  return (
    <div>
      <div className="space-y-0">{visible.map((item, i) => renderItem(item, i))}</div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm text-accent hover:text-accent/80 hover:underline font-medium"
        >
          더 보기 ({items.length - initialCount}건 더)
        </button>
      )}
      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          접기
        </button>
      )}
    </div>
  );
}

// ── Bill detail modal ──
function BillDetailModal({ bill, onClose }: { bill: LegislatorBill; onClose: () => void }) {
  const statusCls = bill.passed
    ? 'bg-emerald-100 text-emerald-700'
    : bill.PROC_RESULT === '대안반영폐기' || bill.PROC_RESULT === '수정안반영폐기'
    ? 'bg-blue-100 text-blue-700'
    : bill.PROC_RESULT === '철회' || bill.PROC_RESULT === '폐기'
    ? 'bg-rose-100 text-rose-700'
    : 'bg-amber-100 text-amber-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-6 pt-3 sm:pt-5">
          {/* header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 leading-snug">
                {bill.law_name || bill.BILL_NAME}
              </h2>
              {bill.amendment_type && (
                <p className="text-xs text-gray-500 mt-0.5">{bill.amendment_type}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* metadata chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${statusCls}`}>
              {bill.status_label || bill.PROC_RESULT || '심의 중'}
            </span>
            {bill.area && (
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {bill.area}
              </span>
            )}
            {bill.PROPOSE_DT && (
              <span className="text-xs text-gray-400 self-center">{bill.PROPOSE_DT} 발의</span>
            )}
          </div>

          {/* plain title (AI) */}
          {bill.plain_title && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 mb-1">쉽게 말하면</p>
              <p className="text-sm text-gray-800">{bill.plain_title}</p>
            </div>
          )}

          {/* summary (AI) */}
          {bill.summary && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">법안 내용</p>
              <p className="text-sm text-gray-700 leading-relaxed">{bill.summary}</p>
            </div>
          )}

          {/* who_affected (AI) */}
          {bill.who_affected && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">영향 받는 대상</p>
              <p className="text-sm text-gray-700">{bill.who_affected}</p>
            </div>
          )}

          {/* co-sponsors */}
          {bill.co_proposer_names && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                공동발의 {bill.co_sponsor_count > 0 ? `(${bill.co_sponsor_count}명)` : ''}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">{bill.co_proposer_names}</p>
            </div>
          )}

          {/* original bill link */}
          {bill.DETAIL_LINK && (
            <a
              href={bill.DETAIL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              국회 의안정보시스템에서 원문 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status badge for bills ──
function BillStatusBadge({ status }: { status: string }) {
  let cls = 'bg-gray-100 text-gray-600';
  if (status === '가결') cls = 'bg-emerald-100 text-emerald-700';
  else if (status === '폐기') cls = 'bg-rose-100 text-rose-700';
  else if (status.includes('심사') || status.includes('계류') || status.includes('상정')) cls = 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ── Radar Chart (Pure SVG) ──
function RadarChart({ legislator, partyColor }: { legislator: Legislator; partyColor: string }) {
  const cx = 150, cy = 150, r = 110;
  const axes = [
    { label: '출석', value: legislator.attendance_rate ?? 0 },
    { label: '법안활동', value: Math.min((legislator.bills_proposed_count ?? 0) / 80 * 100, 100) },
    { label: '발언', value: Math.min((legislator.speech_count ?? 0) / 30 * 100, 100) },
    { label: '투표참여', value: legislator.vote_participation_rate ?? 0 },
    { label: '일관성', value: legislator.consistency_score ?? 0 },
  ];
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function polarToCart(angle: number, radius: number): [number, number] {
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  const gridLevels = [20, 40, 60, 80, 100];
  const gridPaths = gridLevels.map((level) => {
    const ratio = level / 100;
    const points = Array.from({ length: n }, (_, i) => {
      const angle = startAngle + i * angleStep;
      return polarToCart(angle, r * ratio);
    });
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  });

  const dataPoints = axes.map((a, i) => {
    const angle = startAngle + i * angleStep;
    const ratio = Math.min(a.value, 100) / 100;
    return polarToCart(angle, r * ratio);
  });
  const dataPath = dataPoints.map(([x, y]) => `${x},${y}`).join(' ');

  const axisEnds = axes.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return polarToCart(angle, r);
  });
  const labelPositions = axes.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return polarToCart(angle, r + 22);
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[320px] mx-auto">
      {gridPaths.map((path, i) => (
        <polygon key={i} points={path} fill="none" stroke="#e5e7eb" strokeWidth="0.7" />
      ))}
      {axisEnds.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d1d5db" strokeWidth="0.5" />
      ))}
      <polygon points={dataPath} fill={partyColor} fillOpacity="0.15" stroke={partyColor} strokeWidth="2" />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={partyColor} />
      ))}
      {labelPositions.map(([x, y], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-600" fontSize="11" fontWeight="500">
          {axes[i].label}
        </text>
      ))}
      {gridLevels.map((level, i) => {
        const ratio = level / 100;
        const [lx, ly] = polarToCart(startAngle + 0.15, r * ratio);
        return (
          <text key={i} x={lx + 4} y={ly} fontSize="8" className="fill-gray-400" dominantBaseline="middle">
            {level}
          </text>
        );
      })}
    </svg>
  );
}

// ── 동료 비교 미니 카드 ──
function ColleagueCard({ legislator }: { legislator: Legislator }) {
  const partyColor = getPartyColor(legislator.party);
  return (
    <Link href={`/legislators/${legislator.id}`} className="block group">
      <div className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: partyColor }}
          />
          <span className="font-semibold text-sm text-gray-900 group-hover:text-gray-700 transition-colors">
            {legislator.name}
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>출석</span>
            <span className="font-medium text-gray-800">
              {legislator.attendance_rate ? `${legislator.attendance_rate}%` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>발의</span>
            <span className="font-medium text-gray-800">{legislator.bills_proposed_count ?? 0}건</span>
          </div>
          <div className="flex justify-between">
            <span>발언</span>
            <span className="font-medium text-gray-800">{legislator.speech_count ?? 0}회</span>
          </div>
          <div className="flex justify-between">
            <span>투표참여</span>
            <span className="font-medium text-gray-800">
              {legislator.vote_participation_rate ? `${legislator.vote_participation_rate}%` : '-'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


export default function LegislatorDetailClient({ legislator, allLegislators }: LegislatorDetailClientProps) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);

  const attendance = legislator.attendance_rate ?? 0;
  const voteRate = legislator.vote_participation_rate ?? 0;
  const billsProposed = legislator.bills_proposed_count ?? 0;
  const billsPassed = legislator.bills_passed_count ?? 0;
  const speechCount = legislator.speech_count ?? 0;

  // Expandable sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggle = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Bill detail popup
  const [selectedBill, setSelectedBill] = useState<LegislatorBill | null>(null);

  // 같은 위원회 동료
  const committeeColleagues = useMemo(() => {
    if (!legislator.committee) return [];
    return allLegislators
      .filter(l => l.committee === legislator.committee && l.id !== legislator.id)
      .slice(0, 8);
  }, [allLegislators, legislator]);

  // 말과 행동 주제들
  const topics = useMemo(() => {
    if (!legislator.consistency_details) return [];
    return legislator.consistency_details.map(d => d.topic);
  }, [legislator.consistency_details]);

  // 시뮬레이션 세부 데이터 생성
  const attendanceSessions = useMemo(
    () => generateAttendanceSessions(attendance, legislator.id),
    [attendance, legislator.id],
  );

  const billItems = useMemo(() => {
    if (legislator.recent_bills && legislator.recent_bills.length > 0) {
      return legislator.recent_bills;
    }
    return null;
  }, [legislator.recent_bills]);

  const speechItems = useMemo(
    () => generateSpeechItems(speechCount, legislator.id, topics),
    [speechCount, legislator.id, topics],
  );

  const voteItems = useMemo(
    () => generateVoteItems(voteRate, legislator.id),
    [voteRate, legislator.id],
  );

  return (
    <div className="container-page py-6 sm:py-8 space-y-6">
      {/* ── Bill detail popup modal ── */}
      {selectedBill && (
        <BillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      {/* ── 뒤로가기 + 헤더 ── */}
      <div>
        <Link href="/legislators" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          국회의원 목록
        </Link>

        <div className="card overflow-hidden">
          {/* 정당 색상 바 */}
          <div className="h-1.5 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4" style={{ backgroundColor: partyColor }} />

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{legislator.name}</h1>
                {legislator.name_en && (
                  <span className="text-sm text-gray-400">{legislator.name_en}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* 정당 배지 */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: partyColor }}
                >
                  {legislator.party || '무소속'}
                </span>

                {/* 당선 횟수 */}
                {electedLabel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {electedLabel}
                  </span>
                )}

                {/* 지역구 */}
                {legislator.district && (
                  <span className="text-sm text-gray-500">{legislator.district}</span>
                )}
              </div>

              {/* 위원회 */}
              {legislator.committee && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">소속 위원회:</span> {legislator.committee}
                </p>
              )}

              {/* 약력 */}
              {legislator.career_summary && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{legislator.career_summary}</p>
              )}

              {/* 나이 + 성별 */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {legislator.age && <span>{legislator.age}세</span>}
                {legislator.gender && <span>{legislator.gender}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: 출석 현황 (expandable) ── */}
      <div className="card">
        <SectionHeader
          title="출석 현황"
          summary={
            <span>
              전체 본회의 중 <span className="font-semibold text-gray-900">{attendance}%</span> 출석
            </span>
          }
          isOpen={!!openSections['attendance']}
          onToggle={() => toggle('attendance')}
        />
        <div className="mt-3">
          <NeutralBar value={attendance} label="출석률" />
        </div>

        {openSections['attendance'] && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 회의 출석 내역</h3>
            <ExpandableList
              items={attendanceSessions}
              initialCount={10}
              renderItem={(session, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20 shrink-0 font-mono">{session.date}</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                      {session.type}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${session.attended ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {session.attended ? '\u2713 출석' : '\u2717 결석'}
                  </span>
                </div>
              )}
            />
            <InfoBox>
              본회의는 국회 전체 의원이 모여 법안을 심의/표결하는 회의입니다. 위원회는 소속 상임위원회에서 법안을 심사하는 회의입니다.
            </InfoBox>
          </div>
        )}
      </div>

      {/* ── Section 2: 법안 활동 (expandable) ── */}
      <div className="card">
        <SectionHeader
          title="법안 활동"
          summary={
            <span>
              발의 법안 <span className="font-semibold text-gray-900">{billsProposed}건</span>,
              이 중 <span className="font-semibold text-gray-900">{billsPassed}건</span> 통과
            </span>
          }
          isOpen={!!openSections['bills']}
          onToggle={() => toggle('bills')}
        />
        {billsProposed > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-600">법안 통과율</span>
              <span className="text-sm font-semibold text-gray-800">
                {((billsPassed / billsProposed) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full transition-all duration-500"
                style={{ width: `${(billsPassed / billsProposed) * 100}%` }}
              />
            </div>
          </div>
        )}

        {openSections['bills'] && billItems && billItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              발의 법안 목록
              <span className="text-xs font-normal text-gray-400 ml-2">법안을 클릭하면 상세 내용을 볼 수 있습니다</span>
            </h3>
            <ExpandableList
              items={billItems}
              initialCount={10}
              renderItem={(bill, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBill(bill)}
                  className="w-full flex items-start justify-between gap-2 py-2.5 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 group-hover:text-accent transition-colors truncate">
                        {bill.law_name || bill.BILL_NAME}
                      </span>
                      {bill.area && (
                        <span className="text-[11px] text-gray-400 shrink-0">{bill.area}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{bill.PROPOSE_DT}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <BillStatusBadge status={bill.status_label || bill.PROC_RESULT || '심의 중'} />
                    <svg className="text-gray-300 group-hover:text-gray-400 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              )}
            />
            <InfoBox>
              법안 발의는 국회의원의 핵심 업무입니다. 법안을 제출하려면 의원 10명 이상의 서명이 필요합니다.
            </InfoBox>
            <div className="mt-2">
              <ExternalLink href="https://open.assembly.go.kr/portal/assm/search/memberSchPage.do">
                열린국회정보에서 원문 확인
              </ExternalLink>
            </div>
          </div>
        )}
        {openSections['bills'] && !billItems && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            법안 데이터를 불러오는 중입니다.
          </div>
        )}
      </div>

      {/* ── Section 3: 본회의 발언 (expandable) ── */}
      <div className="card">
        <SectionHeader
          title="본회의 발언"
          summary={
            <span>
              본회의 발언 <span className="font-semibold text-gray-900">{speechCount}회</span>
            </span>
          }
          isOpen={!!openSections['speech']}
          onToggle={() => toggle('speech')}
        />
        {topics.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">관련 주제</p>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t, i) => (
                <span key={i} className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {openSections['speech'] && speechItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">발언 내역</h3>
            <ExpandableList
              items={speechItems}
              initialCount={10}
              renderItem={(speech, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{speech.type}</span>
                    <span className="text-sm text-gray-500">-- {speech.topic}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{speech.date}</span>
                </div>
              )}
            />
            <InfoBox>
              본회의 발언은 국회 회의록에 기록되며, 국회 회의록 시스템에서 원문을 확인할 수 있습니다.
            </InfoBox>
            <div className="mt-2">
              <ExternalLink href="https://likms.assembly.go.kr/record/index.jsp">
                국회 회의록 검색
              </ExternalLink>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: 투표 참여 (expandable) ── */}
      <div className="card">
        <SectionHeader
          title="투표 참여"
          summary={
            <span>
              투표 참여율 <span className="font-semibold text-gray-900">{voteRate > 0 ? `${voteRate}%` : '-'}</span>
            </span>
          }
          isOpen={!!openSections['vote']}
          onToggle={() => toggle('vote')}
        />
        <div className="mt-3">
          <NeutralBar value={voteRate} label="투표 참여율" />
        </div>

        {openSections['vote'] && voteItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 투표 기록</h3>
            <ExpandableList
              items={voteItems}
              initialCount={10}
              renderItem={(vote, i) => {
                let voteCls = 'text-emerald-600';
                if (vote.vote === '반대') voteCls = 'text-rose-600';
                else if (vote.vote === '기권') voteCls = 'text-gray-400';

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      {vote.linkedBillId ? (
                        <Link
                          href={`/bills/${vote.linkedBillId}`}
                          className="text-sm font-medium text-accent hover:text-accent/80 hover:underline"
                        >
                          {vote.billTitle}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">{vote.billTitle}</span>
                      )}
                      <span className="text-xs text-gray-400 font-mono">{vote.date}</span>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${voteCls}`}>{vote.vote}</span>
                  </div>
                );
              }}
            />
            <InfoBox>
              투표는 국회의원의 가장 기본적인 의무입니다. 본회의 표결에 참여하지 않으면 결석으로 기록됩니다.
            </InfoBox>
            <div className="mt-2">
              <ExternalLink href="https://open.assembly.go.kr/portal/assm/search/memberSchPage.do">
                열린국회정보에서 투표 기록 확인
              </ExternalLink>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 5: 말과 행동 ── */}
      {legislator.consistency_details && legislator.consistency_details.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4">말과 행동</h2>
          <p className="text-sm text-gray-500 mb-4">
            발언에서의 입장과 실제 투표 행동을 비교합니다. 일치/불일치는 사실 기록입니다.
          </p>
          <WordsVsActions items={legislator.consistency_details} partyColor={partyColor} />
        </div>
      )}

      {/* ── 활동 프로필 (Radar) ── */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">활동 프로필</h2>
        <RadarChart legislator={legislator} partyColor={partyColor} />
        <p className="text-xs text-gray-400 text-center mt-2">
          수치는 0~100 기준 정규화. 법안활동 80건=100%, 발언 30회=100% 기준.
        </p>
      </div>

      {/* ── Section 6: 같은 위원회 동료 비교 ── */}
      {committeeColleagues.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-2">같은 위원회 동료 비교</h2>
          <p className="text-sm text-gray-500 mb-4">
            {legislator.committee} 소속 의원들의 활동 현황입니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {committeeColleagues.map(c => (
              <ColleagueCard key={c.id} legislator={c} />
            ))}
          </div>
        </div>
      )}

      {/* ── 재산 신고 ── */}
      {legislator.asset_total != null && legislator.asset_total > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-3">재산 신고</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {legislator.asset_total.toFixed(1)}
            </span>
            <span className="text-gray-500 text-lg">억원</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">국회의원 재산신고 기준</p>
        </div>
      )}

      {/* ── 출처 면책 + 시범 데이터 안내 ── */}
      <div className="text-xs text-gray-400 text-center py-4 border-t border-gray-100 leading-relaxed space-y-1">
        <p>이 페이지의 모든 수치는 열린국회정보 공개 데이터 기반입니다.</p>
        <p>세부 내역은 시범 데이터입니다. API 연동 후 실제 국회 데이터로 대체됩니다.</p>
      </div>
    </div>
  );
}
