'use client';

import type { Legislator } from '@/lib/types';
import Link from 'next/link';
import WordsVsActions from '@/components/legislators/WordsVsActions';

// ── Party colors ──
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
  return `${count}선`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

// ── Props ──
interface LegislatorDetailClientProps {
  legislator: Legislator;
  allLegislators: Legislator[];
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

  // Grid lines at 20, 40, 60, 80, 100
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPaths = gridLevels.map((level) => {
    const ratio = level / 100;
    const points = Array.from({ length: n }, (_, i) => {
      const angle = startAngle + i * angleStep;
      return polarToCart(angle, r * ratio);
    });
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  });

  // Data polygon
  const dataPoints = axes.map((a, i) => {
    const angle = startAngle + i * angleStep;
    const ratio = Math.min(a.value, 100) / 100;
    return polarToCart(angle, r * ratio);
  });
  const dataPath = dataPoints.map(([x, y]) => `${x},${y}`).join(' ');

  // Axis lines and labels
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
      {/* Grid polygons */}
      {gridPaths.map((path, i) => (
        <polygon key={i} points={path} fill="none" stroke="#e5e7eb" strokeWidth="0.7" />
      ))}
      {/* Axis lines */}
      {axisEnds.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d1d5db" strokeWidth="0.5" />
      ))}
      {/* Data polygon */}
      <polygon points={dataPath} fill={partyColor} fillOpacity="0.2" stroke={partyColor} strokeWidth="2" />
      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={partyColor} />
      ))}
      {/* Axis labels */}
      {labelPositions.map(([x, y], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-600" fontSize="11" fontWeight="500">
          {axes[i].label}
        </text>
      ))}
      {/* Grid level labels (right side) */}
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

// ── Score Ring (SVG) ──
function ScoreRing({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="animate-gauge"
        style={{ '--gauge-circumference': circumference, '--gauge-offset': offset } as React.CSSProperties}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="bold" className="fill-gray-900">
        {score}
      </text>
    </svg>
  );
}

// ── Horizontal Bar Metric ──
function MetricBar({ label, value, avg, max, color }: { label: string; value: number; avg: number; max: number; color: string }) {
  const pctValue = Math.min((value / max) * 100, 100);
  const pctAvg = Math.min((avg / max) * 100, 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">{typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : '-'}</span>
      </div>
      <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pctValue}%`, backgroundColor: color, opacity: 0.85 }} />
        {/* Average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-400"
          style={{ left: `${pctAvg}%` }}
          title={`평균: ${avg.toFixed(1)}`}
        />
      </div>
      <div className="text-xs text-gray-400 mt-0.5 text-right">평균 {avg.toFixed(1)}</div>
    </div>
  );
}

// ── SVG Icons ──
function IconActivity() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconAttendance() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function IconBill() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconSpeech() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconConsistency() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l2 2 4-4" />
    </svg>
  );
}


export default function LegislatorDetailClient({ legislator, allLegislators }: LegislatorDetailClientProps) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);

  // Averages
  const avg = (field: keyof Legislator) => {
    const vals = allLegislators.map(l => l[field]).filter((v): v is number => typeof v === 'number' && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const avgAttendance = avg('attendance_rate');
  const avgVoteParticipation = avg('vote_participation_rate');
  const avgBillsProposed = avg('bills_proposed_count');
  const avgSpeechCount = avg('speech_count');
  const avgConsistency = avg('consistency_score');

  return (
    <div className="container-page py-6 sm:py-8 space-y-6">
      {/* ── Hero Header ── */}
      <div>
        <Link href="/legislators" className="inline-flex items-center gap-1 text-sm text-accent hover:underline mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          국회의원 목록
        </Link>

        <div className="card overflow-hidden">
          {/* Party color bar */}
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
                {/* Party badge */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: partyColor }}
                >
                  {legislator.party || '무소속'}
                </span>

                {/* Elected count badge */}
                {electedLabel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {electedLabel}
                  </span>
                )}

                {/* District */}
                {legislator.district && (
                  <span className="text-sm text-gray-500">{legislator.district}</span>
                )}
                {legislator.region && legislator.region !== legislator.district && (
                  <span className="text-xs text-gray-400">({legislator.region})</span>
                )}
              </div>

              {/* Committee */}
              {legislator.committee && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">소속 위원회:</span> {legislator.committee}
                </p>
              )}

              {/* Career summary */}
              {legislator.career_summary && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{legislator.career_summary}</p>
              )}

              {/* Age + Gender */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {legislator.age && <span>{legislator.age}세</span>}
                {legislator.gender && <span>{legislator.gender}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Activity Score */}
        <div className="card flex flex-col items-center text-center">
          <div className="text-accent mb-1"><IconActivity /></div>
          <ScoreRing score={legislator.ai_activity_score ?? 0} color={getScoreColor(legislator.ai_activity_score ?? 0)} />
          <div className="kpi-label mt-1">활동 점수</div>
        </div>

        {/* Attendance */}
        <div className="card flex flex-col items-center text-center">
          <div className="text-blue-500 mb-1"><IconAttendance /></div>
          <div className="kpi-value">{legislator.attendance_rate ?? '-'}<span className="text-base font-normal text-gray-400">%</span></div>
          <div className="kpi-label">출석률</div>
        </div>

        {/* Bills */}
        <div className="card flex flex-col items-center text-center">
          <div className="text-emerald-500 mb-1"><IconBill /></div>
          <div className="kpi-value">
            {legislator.bills_proposed_count ?? 0}
            <span className="text-sm font-normal text-gray-400"> / {legislator.bills_passed_count ?? 0}건 가결</span>
          </div>
          <div className="kpi-label">발의 법안</div>
        </div>

        {/* Speech */}
        <div className="card flex flex-col items-center text-center">
          <div className="text-purple-500 mb-1"><IconSpeech /></div>
          <div className="kpi-value">{legislator.speech_count ?? 0}<span className="text-base font-normal text-gray-400">회</span></div>
          <div className="kpi-label">본회의 발언</div>
        </div>

        {/* Consistency */}
        <div className="card flex flex-col items-center text-center col-span-2 sm:col-span-1">
          <div className="text-teal-500 mb-1"><IconConsistency /></div>
          <div className="kpi-value">{legislator.consistency_score ?? '-'}<span className="text-base font-normal text-gray-400">%</span></div>
          <div className="kpi-label">말행일치도</div>
        </div>
      </div>

      {/* ── Radar + Score Breakdown ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">종합 역량 분석</h2>
          <RadarChart legislator={legislator} partyColor={partyColor} />
          <p className="text-xs text-gray-400 text-center mt-2">
            수치는 0~100 기준 정규화. 법안활동 80건=100%, 발언 30회=100% 기준.
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">전체 평균 비교</h2>
          <MetricBar label="출석률" value={legislator.attendance_rate ?? 0} avg={avgAttendance} max={100} color={partyColor} />
          <MetricBar label="투표 참여율" value={legislator.vote_participation_rate ?? 0} avg={avgVoteParticipation} max={100} color={partyColor} />
          <MetricBar label="발의 법안" value={legislator.bills_proposed_count ?? 0} avg={avgBillsProposed} max={100} color={partyColor} />
          <MetricBar label="본회의 발언" value={legislator.speech_count ?? 0} avg={avgSpeechCount} max={100} color={partyColor} />
          <MetricBar label="말행일치도" value={legislator.consistency_score ?? 0} avg={avgConsistency} max={100} color={partyColor} />
          <p className="text-xs text-gray-400 mt-2">점선은 전체 국회의원 평균입니다.</p>
        </div>
      </div>

      {/* ── Words vs Actions ── */}
      {legislator.consistency_details && legislator.consistency_details.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4">말과 행동 (Words vs Actions)</h2>
          <WordsVsActions items={legislator.consistency_details} partyColor={partyColor} />
        </div>
      )}

      {/* ── Asset Declaration ── */}
      {legislator.asset_total != null && legislator.asset_total > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-3">재산 신고</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: partyColor }}>
              {legislator.asset_total.toFixed(1)}
            </span>
            <span className="text-gray-500 text-lg">억원</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">국회의원 재산신고 기준</p>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="text-xs text-gray-400 text-center py-4 border-t border-gray-100">
        활동 점수는 공개된 국회 데이터를 기반으로 AI가 산출한 참고 지표입니다.
      </div>
    </div>
  );
}
