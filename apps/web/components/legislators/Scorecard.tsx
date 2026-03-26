'use client';

import type { Legislator } from '@/lib/types';
import Link from 'next/link';

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

export default function Scorecard({ legislator }: { legislator: Legislator }) {
  const partyColor = getPartyColor(legislator.party);
  const electedLabel = getElectedLabel(legislator.elected_count);
  const actScore = legislator.ai_activity_score ?? 0;
  const scoreColor = getScoreColor(actScore);

  // Mini ring for activity score
  const size = 48;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (actScore / 100) * circumference;

  return (
    <Link href={`/legislators/${legislator.id}`} className="block group">
      <div className="card hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Party color bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: partyColor }} />

        <div className="flex justify-between items-start pt-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-accent transition-colors">{legislator.name}</h3>
              {/* Party badge */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: partyColor }}
              >
                {legislator.party || '무소속'}
              </span>
              {/* Elected count badge */}
              {electedLabel && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                  {electedLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {legislator.district}
              {legislator.committee && <span className="text-gray-400"> | {legislator.committee}</span>}
            </p>
          </div>

          {/* Activity Score Ring */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <svg width={size} height={size} className="block">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={scoreColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
              <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="bold" className="fill-gray-900">
                {actScore || '-'}
              </text>
            </svg>
            <div className="text-[10px] text-gray-500 mt-0.5">활동 점수</div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-3 mt-4 text-center">
          <div>
            <div className="text-base font-bold text-gray-900">
              {legislator.attendance_rate ? `${legislator.attendance_rate}%` : '-'}
            </div>
            <div className="text-[10px] text-gray-500">출석률</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">{legislator.bills_proposed_count || 0}</div>
            <div className="text-[10px] text-gray-500">발의 법안</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">{legislator.speech_count || 0}</div>
            <div className="text-[10px] text-gray-500">발언</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">
              {legislator.consistency_score ? `${legislator.consistency_score}%` : '-'}
            </div>
            <div className="text-[10px] text-gray-500">말행일치</div>
          </div>
        </div>

        {/* Bottom link hint */}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-end">
          <span className="text-xs text-gray-400 group-hover:text-accent transition-colors flex items-center gap-1">
            상세 성적표
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
