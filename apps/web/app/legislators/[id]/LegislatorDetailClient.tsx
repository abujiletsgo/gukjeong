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

// ── Props ──
interface LegislatorDetailClientProps {
  legislator: Legislator;
  allLegislators: Legislator[];
}

// ── Radar Chart (Pure SVG) — 활동 프로필 ──
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

// ── SVG Icons ──
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

// ── 활동 현황 항목 ──
function MetricFact({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="shrink-0" style={{ color }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-right shrink-0">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-400 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}


export default function LegislatorDetailClient({ legislator }: LegislatorDetailClientProps) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);

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

      {/* ── KPI Row — 사실 기반 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
            <span className="text-sm font-normal text-gray-400">건 발의</span>
          </div>
          <div className="kpi-label">
            {(legislator.bills_passed_count ?? 0) > 0
              ? `${legislator.bills_passed_count}건 가결`
              : '법안 활동'
            }
          </div>
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

      {/* ── 활동 프로필 (Radar) + 활동 현황 ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">활동 프로필</h2>
          <RadarChart legislator={legislator} partyColor={partyColor} />
          <p className="text-xs text-gray-400 text-center mt-2">
            수치는 0~100 기준 정규화. 법안활동 80건=100%, 발언 30회=100% 기준.
          </p>
        </div>

        {/* 활동 현황 — 사실 나열 */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">활동 현황</h2>
          <MetricFact
            label="출석률"
            value={legislator.attendance_rate ?? '-'}
            unit="%"
            icon={<IconAttendance />}
            color="#2563eb"
          />
          <MetricFact
            label="투표 참여율"
            value={legislator.vote_participation_rate ?? '-'}
            unit="%"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            color="#7c3aed"
          />
          <MetricFact
            label="발의 법안"
            value={legislator.bills_proposed_count ?? 0}
            unit="건"
            icon={<IconBill />}
            color="#059669"
          />
          <MetricFact
            label="본회의 발언"
            value={legislator.speech_count ?? 0}
            unit="회"
            icon={<IconSpeech />}
            color="#8b5cf6"
          />
          <MetricFact
            label="말행일치도"
            value={legislator.consistency_score ?? '-'}
            unit="%"
            icon={<IconConsistency />}
            color="#0d9488"
          />
          <p className="text-xs text-gray-400 mt-3">22대 국회 활동 기준 공개 데이터입니다.</p>
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
        공개된 국회 데이터를 기반으로 정리한 활동 현황입니다.
      </div>
    </div>
  );
}
