'use client';
// 국회의원 활동 현황 — 지역구 중심 대시보드 + 의원 그리드 + 상세 확장 패널
// Live mode: /data/legislators-real.json (295 real legislators from 열린국회정보)
//            /data/voting-records.json (participation data per MONA_CD)
// Demo mode: seed data passed as props (unchanged)
import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDataMode } from '@/lib/context/DataModeContext';
import type { Legislator } from '@/lib/types';

// ── Raw API legislator type (from 열린국회정보) ──
interface RecentBill {
  id: string;
  no: string;
  name: string;
  committee: string | null;
  date: string;
  result: string | null;
  link: string;
}

interface RawLegislator {
  HG_NM: string;
  HJ_NM?: string;
  ENG_NM?: string;
  BTH_DATE?: string;
  POLY_NM: string;
  ORIG_NM?: string;
  ELECT_GBN_NM?: string;
  CMIT_NM?: string;
  CMITS?: string;
  REELE_GBN_NM?: string;
  UNITS?: string;
  SEX_GBN_NM?: string;
  TEL_NO?: string;
  E_MAIL?: string;
  HOMEPAGE?: string;
  MONA_CD: string;
  MEM_TITLE?: string;
  ASSEM_ADDR?: string;
  JOB_RES_NM?: string;
  bills_proposed?: number;
  bills_passed?: number;
  recent_bills?: RecentBill[];
}

interface RealLegislatorData {
  timestamp: string;
  total: number;
  source: string;
  total_bills_22nd?: number;
  plenary_bills?: number;
  legislators: RawLegislator[];
}

// ── Voting record types ──
interface VoteRecord {
  bill_id: string;
  bill_name: string;
  vote: '찬성' | '반대' | '기권' | '불참';
}

interface MemberVotingData {
  total_votes: number;
  present: number;
  absent: number;
  participation_rate: number;
  yes: number;
  no: number;
  abstain: number;
  votes: VoteRecord[];
}

interface VotingRecordsData {
  timestamp?: string;
  bills_analyzed: number;
  members_with_data: number;
  participation: Record<string, MemberVotingData>;
}

// ── 정당 색상 (party dots/badges only) ──
const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1A56DB',
  '국민의힘': '#E5243B',
  '조국혁신당': '#6B21A8',
  '진보당': '#E11D48',
  '개혁신당': '#F97316',
  '기본소득당': '#22C55E',
  '사회민주당': '#EC4899',
  '무소속': '#6B7280',
};

function getPartyColor(party?: string): string {
  if (!party) return '#6B7280';
  return PARTY_COLORS[party] || '#6B7280';
}

// ── Term label ──
function parseTermCount(reele?: string): number {
  if (!reele) return 1;
  if (reele === '초선') return 1;
  if (reele === '재선') return 2;
  const match = reele.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function getTermLabel(reele?: string): string {
  return reele || '초선';
}

// ── Region extraction ──
const REGION_MAP: Record<string, string> = {
  '서울': '서울',
  '부산': '부산',
  '대구': '대구',
  '인천': '인천',
  '광주': '광주',
  '대전': '대전',
  '울산': '울산',
  '세종': '세종',
  '경기': '경기',
  '강원': '강원',
  '충북': '충북',
  '충남': '충남',
  '전북': '전북',
  '전남': '전남',
  '경북': '경북',
  '경남': '경남',
  '제주': '제주',
};

const REGION_ORDER = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '비례대표',
];

function extractRegion(origNm?: string): string {
  if (!origNm) return '';
  if (origNm === '비례대표') return '비례대표';
  // Try space-separated first: "서울 종로구"
  const spaceIdx = origNm.indexOf(' ');
  if (spaceIdx > 0) {
    const prefix = origNm.substring(0, spaceIdx);
    if (REGION_MAP[prefix]) return REGION_MAP[prefix];
  }
  // Handle "세종특별자치시갑" style (no space)
  for (const key of Object.keys(REGION_MAP)) {
    if (origNm.startsWith(key)) return REGION_MAP[key];
  }
  return origNm.split(' ')[0] || '';
}

// ── Parse career/education from MEM_TITLE ──
function parseMemTitle(memTitle?: string): { career: string[]; education: string[] } {
  if (!memTitle) return { career: [], education: [] };
  const lines = memTitle.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const career: string[] = [];
  const education: string[] = [];
  let section: 'career' | 'education' | 'none' = 'none';
  for (const line of lines) {
    if (line.includes('[경') || line.includes('경력') || line.includes('■ 주요 경력') || line.includes('■ 경력')) {
      section = 'career';
      continue;
    }
    if (line.includes('[학') || line.includes('학력') || line.includes('■ 학력')) {
      section = 'education';
      continue;
    }
    if (line.startsWith('[') || line.startsWith('■')) {
      section = 'none';
      continue;
    }
    const cleaned = line.replace(/^[-·•]\s*/, '').trim();
    if (!cleaned) continue;
    if (section === 'career') career.push(cleaned);
    else if (section === 'education') education.push(cleaned);
    else if (career.length === 0 && education.length === 0) {
      // Before any section header, guess based on content
      if (cleaned.includes('졸업') || cleaned.includes('대학') || cleaned.includes('석사') || cleaned.includes('박사') || cleaned.includes('고등학교')) {
        education.push(cleaned);
      } else {
        career.push(cleaned);
      }
    }
  }
  return { career, education };
}

// ── Constants ──
const PARTY_FILTERS = [
  { value: '전체', label: '전체' },
  { value: '더불어민주당', label: '더불어민주당' },
  { value: '국민의힘', label: '국민의힘' },
  { value: '조국혁신당', label: '조국혁신당' },
  { value: '기타', label: '기타' },
];

const MAJOR_PARTIES = ['더불어민주당', '국민의힘', '조국혁신당'];

type SortOption = 'bills_desc' | 'participation_desc' | 'absent_desc' | 'name_asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'bills_desc', label: '발의 많은순' },
  { value: 'participation_desc', label: '참여율 높은순' },
  { value: 'absent_desc', label: '불참 많은순' },
  { value: 'name_asc', label: '이름순' },
];

// ── Stacked party bar ──
function StackedBar({
  segments,
  total,
}: {
  segments: { label: string; count: number; color: string }[];
  total: number;
}) {
  return (
    <div>
      <div className="flex h-8 sm:h-10 rounded-lg overflow-hidden">
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className="flex items-center justify-center text-white text-xs sm:text-sm font-semibold transition-all duration-500 min-w-[2rem]"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.count}석 (${pct.toFixed(1)}%)`}
            >
              {pct >= 6 ? seg.count : ''}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span>{seg.label}</span>
            <span className="font-semibold text-gray-800">{seg.count}석</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Vote badge ──
function VoteBadge({ vote }: { vote: string }) {
  const styles: Record<string, string> = {
    '찬성': 'bg-gray-200 text-gray-700',
    '반대': 'bg-gray-300 text-gray-800',
    '기권': 'bg-gray-100 text-gray-500',
    '불참': 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[vote] || 'bg-gray-200 text-gray-600'}`}>
      {vote}
    </span>
  );
}

// ── Neutral bar ──
function NeutralBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gray-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Member avatar with React state fallback ──
function MemberAvatar({ monaCode, name, partyColor }: { monaCode: string; name: string; partyColor: string }) {
  const [imgError, setImgError] = useState(false);
  if (!imgError) {
    return (
      <img
        src={`https://www.assembly.go.kr/photo/thumb/${monaCode}.jpg`}
        alt={name}
        onError={() => setImgError(true)}
        className="w-12 h-12 rounded-full object-cover object-top"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
         style={{ backgroundColor: partyColor }}>
      {name.charAt(0)}
    </div>
  );
}

// ── Expanded tab type ──
type DetailTab = 'profile' | 'bills' | 'votes' | 'participation';

// ── Real legislator card with expand/collapse tabs ──
function RealLegislatorCard({
  raw,
  maxBills,
  votingData,
  totalBillsAnalyzed,
}: {
  raw: RawLegislator;
  maxBills: number;
  votingData?: MemberVotingData;
  totalBillsAnalyzed: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('bills');

  const partyColor = getPartyColor(raw.POLY_NM);
  const termLabel = getTermLabel(raw.REELE_GBN_NM);
  const billsProposed = raw.bills_proposed ?? 0;
  const recentBills = raw.recent_bills ?? [];
  const billBarPct = maxBills > 0 ? Math.min((billsProposed / maxBills) * 100, 100) : 0;

  // Voting participation
  const totalVotes = votingData?.total_votes ?? totalBillsAnalyzed;
  const present = votingData?.present ?? 0;
  const absent = votingData?.absent ?? totalVotes;
  const participationRate = votingData?.participation_rate ?? 0;
  const isFullAbsent = totalVotes > 0 && absent === totalVotes;

  // Parse career/education
  const { career, education } = useMemo(() => parseMemTitle(raw.MEM_TITLE), [raw.MEM_TITLE]);

  // Vote position summary pills
  const voteSummary = useMemo(() => {
    if (!votingData?.votes?.length) return [];
    const cats: Record<string, { yes: number; no: number; abstain: number; absent: number }> = {};
    for (const v of votingData.votes) {
      // Categorize by bill name keywords
      let category = '기타';
      const bn = v.bill_name;
      if (bn.includes('근로') || bn.includes('노동') || bn.includes('고용') || bn.includes('퇴직')) category = '노동';
      else if (bn.includes('선거') || bn.includes('정치') || bn.includes('정당')) category = '정치/선거';
      else if (bn.includes('형법') || bn.includes('범죄') || bn.includes('처벌') || bn.includes('사법') || bn.includes('법원') || bn.includes('헌법') || bn.includes('공소')) category = '사법';
      else if (bn.includes('복지') || bn.includes('보험') || bn.includes('연금') || bn.includes('보건') || bn.includes('의료')) category = '복지';
      else if (bn.includes('환경') || bn.includes('기후') || bn.includes('에너지') || bn.includes('수자원')) category = '환경';
      else if (bn.includes('경제') || bn.includes('재정') || bn.includes('금융') || bn.includes('세금') || bn.includes('상법')) category = '경제';
      else if (bn.includes('교육') || bn.includes('학교')) category = '교육';
      else if (bn.includes('국방') || bn.includes('군사') || bn.includes('안보') || bn.includes('정보원')) category = '안보';

      if (!cats[category]) cats[category] = { yes: 0, no: 0, abstain: 0, absent: 0 };
      if (v.vote === '찬성') cats[category].yes++;
      else if (v.vote === '반대') cats[category].no++;
      else if (v.vote === '기권') cats[category].abstain++;
      else cats[category].absent++;
    }
    return Object.entries(cats)
      .filter(([cat]) => cat !== '기타')
      .map(([cat, c]) => ({
        category: cat,
        yes: c.yes,
        no: c.no,
        abstain: c.abstain,
        absent: c.absent,
        total: c.yes + c.no + c.abstain + c.absent,
      }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [votingData]);

  return (
    <div className="card hover:shadow-md transition-all flex flex-col">
      {/* Header: photo + name + party + district */}
      <div className="mb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="shrink-0 ring-2 ring-gray-200 rounded-full overflow-hidden">
            <MemberAvatar monaCode={raw.MONA_CD} name={raw.HG_NM} partyColor={partyColor} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: partyColor }}
              />
              <h3 className="font-bold text-base text-gray-900 truncate">{raw.HG_NM}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0 font-medium">
                {termLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-snug truncate">
              {raw.POLY_NM || '무소속'} &middot; {raw.ORIG_NM || '비례대표'}
            </p>
            <p className="text-xs text-gray-400 leading-snug mt-0.5 truncate">
              {raw.CMIT_NM || '위원회 미배정'}
            </p>
          </div>
        </div>
      </div>

      {/* Bills proposed */}
      <div className="border-t border-gray-100 pt-3 flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-600">법안 발의</span>
          <span className="text-lg font-bold text-gray-900">
            {billsProposed}<span className="text-sm font-normal text-gray-400 ml-0.5">건</span>
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gray-400"
            style={{ width: `${billBarPct}%`, opacity: billsProposed === 0 ? 0.2 : 0.6 }}
          />
        </div>

        {/* Recent bill preview (1-2 titles) */}
        {recentBills.length > 0 && (
          <div className="space-y-0.5 mb-2">
            {recentBills.slice(0, 2).map((bill) => (
              <a
                key={bill.id}
                href={bill.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-gray-500 hover:text-blue-600 transition-colors leading-snug truncate"
                title={bill.name}
              >
                <span className="text-gray-300 mr-1">&bull;</span>
                {bill.name}
              </a>
            ))}
            {recentBills.length > 2 && !expanded && (
              <span className="text-[10px] text-gray-400 ml-3">외 {recentBills.length - 2}건</span>
            )}
          </div>
        )}

        {/* Voting participation */}
        <div className="mt-2 pt-2 border-t border-gray-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600">본회의 참여</span>
            <span className="text-sm font-bold text-gray-900">
              {present}/{totalVotes}<span className="text-xs font-normal text-gray-400 ml-0.5">회</span>
              <span className="text-xs font-normal text-gray-400 ml-1">({participationRate.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gray-400"
              style={{ width: `${Math.min(participationRate, 100)}%`, opacity: participationRate === 0 ? 0.2 : 0.6 }}
            />
          </div>
          {isFullAbsent && (
            <p className="text-xs text-gray-500">
              최근 본회의 표결 {totalVotes}회 중 {totalVotes}회 불참
            </p>
          )}
        </div>
      </div>

      {/* Expand/collapse */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          {expanded ? '접기' : '상세 보기'}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expanded detail panel with tabs */}
      {expanded && (
        <div className="border-t border-gray-100 pt-3 mt-1 animate-in fade-in duration-200">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 mb-3 -mx-1">
            {([
              { key: 'profile' as DetailTab, label: '프로필' },
              { key: 'bills' as DetailTab, label: '법안 활동' },
              { key: 'votes' as DetailTab, label: '투표 기록' },
              { key: 'participation' as DetailTab, label: '참여 현황' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-xs py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-gray-700 text-gray-800'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[120px]">
            {/* ── Profile tab ── */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* Career */}
                {career.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2">주요 경력</h4>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                      {career.slice(0, 10).map((line, i) => (
                        <p key={i} className="text-[11px] text-gray-500 leading-relaxed">{line}</p>
                      ))}
                      {career.length > 10 && (
                        <p className="text-[10px] text-gray-400">외 {career.length - 10}건</p>
                      )}
                    </div>
                  </div>
                )}
                {/* Education */}
                {education.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2">학력</h4>
                    <div className="space-y-0.5">
                      {education.map((line, i) => (
                        <p key={i} className="text-[11px] text-gray-500 leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                {/* Contact */}
                <div className="pt-2 border-t border-gray-50">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">연락처</h4>
                  <div className="flex flex-col gap-1.5">
                    {raw.E_MAIL && (
                      <a
                        href={`mailto:${raw.E_MAIL}`}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <polyline points="22,7 12,13 2,7" />
                        </svg>
                        {raw.E_MAIL}
                      </a>
                    )}
                    {raw.TEL_NO && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {raw.TEL_NO}
                      </span>
                    )}
                    {!raw.E_MAIL && !raw.TEL_NO && (
                      <p className="text-xs text-gray-400">연락처 정보 없음</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Bills tab ── */}
            {activeTab === 'bills' && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-2">
                  발의 법안 목록 ({recentBills.length}건{recentBills.length < billsProposed ? ` / 전체 ${billsProposed}건` : ''})
                </h4>
                {recentBills.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">발의한 법안이 없습니다</p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {recentBills.map((bill) => (
                      <a
                        key={bill.id}
                        href={bill.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors group"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mt-0.5 text-gray-300 group-hover:text-blue-400">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-700 group-hover:text-blue-600 leading-snug line-clamp-2">{bill.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {bill.date}
                            {bill.committee && <> &middot; {bill.committee}</>}
                            {bill.result && <> &middot; <span className="font-semibold">{bill.result}</span></>}
                          </p>
                        </div>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-1 text-gray-200 group-hover:text-blue-400">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Votes tab ── */}
            {activeTab === 'votes' && (
              <div>
                {/* Position summary pills */}
                {voteSummary.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {voteSummary.map((s) => (
                      <span
                        key={s.category}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[10px] text-gray-600 border border-gray-100"
                      >
                        {s.category}
                        {s.yes > 0 && <span className="text-gray-500">찬성 {s.yes}회</span>}
                        {s.no > 0 && <span className="text-gray-500">반대 {s.no}회</span>}
                        {s.absent > 0 && <span className="text-gray-400">불참 {s.absent}회</span>}
                      </span>
                    ))}
                  </div>
                )}

                {(!votingData || votingData.votes.length === 0) ? (
                  <p className="text-xs text-gray-400 py-4 text-center">투표 기록 데이터가 없습니다</p>
                ) : (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2">
                      본회의 투표 기록 ({votingData.votes.length}건)
                    </h4>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {votingData.votes.map((v, i) => (
                        <a
                          key={`${v.bill_id}-${i}`}
                          href={`https://likms.assembly.go.kr/bill/billDetail.do?billId=${v.bill_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-700 group-hover:text-blue-600 leading-snug line-clamp-2">{v.bill_name}</p>
                          </div>
                          <VoteBadge vote={v.vote} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Participation tab ── */}
            {activeTab === 'participation' && (
              <div className="space-y-4">
                {/* Rate bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">본회의 참여율</span>
                    <span className="text-lg font-bold text-gray-900">{participationRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gray-500"
                      style={{ width: `${Math.min(participationRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{present}</div>
                    <div className="text-[10px] text-gray-500">참석</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{absent}</div>
                    <div className="text-[10px] text-gray-500">불참</div>
                  </div>
                </div>

                {/* Vote breakdown if available */}
                {votingData && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2">표결 내역</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800">{votingData.yes}</div>
                        <div className="text-[10px] text-gray-500">찬성</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800">{votingData.no}</div>
                        <div className="text-[10px] text-gray-500">반대</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800">{votingData.abstain}</div>
                        <div className="text-[10px] text-gray-500">기권</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800">{votingData.absent}</div>
                        <div className="text-[10px] text-gray-500">불참</div>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 text-center">
                  최근 본회의 표결 {totalVotes}건 기준
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Demo activity card (UNCHANGED from original) ──
function ActivityCard({ legislator }: { legislator: Legislator }) {
  const partyColor = getPartyColor(legislator.party);
  const attendance = legislator.attendance_rate ?? 0;
  const billsProposed = legislator.bills_proposed_count ?? 0;
  const billsPassed = legislator.bills_passed_count ?? 0;
  const speechCount = legislator.speech_count ?? 0;

  return (
    <Link href={`/legislators/${legislator.id}`} className="block group">
      <div className="card hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: partyColor }}
            />
            <h3 className="font-bold text-base text-gray-900 group-hover:text-gray-700 transition-colors">
              {legislator.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 leading-snug">
            {legislator.party || '무소속'}
            {legislator.district && <> &middot; {legislator.district}</>}
          </p>
          <p className="text-xs text-gray-400 leading-snug mt-0.5">
            {legislator.committee || '위원회 미배정'}
            {legislator.elected_count && legislator.elected_count > 0 && (
              <> &middot; {legislator.elected_count === 1 ? '초선' : legislator.elected_count === 2 ? '재선' : `${legislator.elected_count}선`}</>
            )}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-3 flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">출석</span>
            <NeutralBar value={attendance} />
            <span className="text-xs font-semibold text-gray-700 w-10 text-right shrink-0">
              {attendance > 0 ? `${attendance}%` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">발의</span>
            <span className="text-sm text-gray-800">
              {billsProposed}건
              {billsPassed > 0 && (
                <span className="text-gray-400 text-xs ml-1">(통과 {billsPassed}건)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">발언</span>
            <span className="text-sm text-gray-800">{speechCount}회</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end">
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors flex items-center gap-1">
            활동 현황 보기
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Ranking categories ──
type RankCategory = {
  key: string;
  label: string;
  sublabel: string;
  getValue: (leg: RawLegislator, voting: MemberVotingData | undefined) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
};

const RANK_CATEGORIES: RankCategory[] = [
  {
    key: 'bills_proposed',
    label: '법안 발의 건수',
    sublabel: '22대 국회 발의 법안 수',
    getValue: (leg) => leg.bills_proposed ?? 0,
    format: (v) => `${v}건`,
    higherIsBetter: true,
  },
  {
    key: 'bills_pass_rate',
    label: '법안 통과율',
    sublabel: '발의 대비 통과 비율',
    getValue: (leg) => {
      const proposed = leg.bills_proposed ?? 0;
      const passed = leg.bills_passed ?? 0;
      return proposed > 0 ? Math.round((passed / proposed) * 100) : 0;
    },
    format: (v) => `${v}%`,
    higherIsBetter: true,
  },
  {
    key: 'attendance',
    label: '국회 출석률',
    sublabel: '본회의 투표 참여율',
    getValue: (leg, voting) => voting ? Math.round(voting.participation_rate) : 0,
    format: (v) => `${v}%`,
    higherIsBetter: true,
  },
  {
    key: 'contrarian',
    label: '반대표 비율',
    sublabel: '전체 투표 중 반대 비율',
    getValue: (leg, voting) => {
      if (!voting) return 0;
      const total = voting.yes + voting.no + voting.abstain;
      return total > 0 ? Math.round((voting.no / total) * 100) : 0;
    },
    format: (v) => `${v}%`,
    higherIsBetter: true,
  },
  {
    key: 'absenteeism',
    label: '기권/불참 비율',
    sublabel: '전체 투표 중 불참 비율',
    getValue: (leg, voting) => {
      if (!voting) return 0;
      return Math.round(100 - (voting.participation_rate));
    },
    format: (v) => `${v}%`,
    higherIsBetter: false,
  },
  {
    key: 'composite',
    label: '종합 활동 점수',
    sublabel: '발의·통과율·출석률 종합',
    getValue: (leg, voting) => {
      const proposals = Math.min(100, (leg.bills_proposed ?? 0) * 2);
      const passRate = (() => {
        const proposed = leg.bills_proposed ?? 0;
        const passed = leg.bills_passed ?? 0;
        return proposed > 0 ? (passed / proposed) * 100 : 0;
      })();
      const attendance = voting ? voting.participation_rate : 50;
      return Math.round(proposals * 0.4 + passRate * 0.3 + attendance * 0.3);
    },
    format: (v) => `${v}점`,
    higherIsBetter: true,
  },
];

// ── 메인 컴포넌트 ──
interface LegislatorsPageClientProps {
  legislators: Legislator[];
}

export default function LegislatorsPageClient({ legislators }: LegislatorsPageClientProps) {
  const { isDemo } = useDataMode();

  // Real data state
  const [realData, setRealData] = useState<RealLegislatorData | null>(null);
  const [votingRecords, setVotingRecords] = useState<VotingRecordsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Page-level tab state
  const [pageLevelTab, setPageLevelTab] = useState<'overview' | 'ranking'>('overview');
  const [rankCategory, setRankCategory] = useState('composite');

  // Filter state
  const [partyFilter, setPartyFilter] = useState('전체');
  const [committeeFilter, setCommitteeFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('bills_desc');

  // Fetch real data + voting records
  useEffect(() => {
    if (isDemo) return;
    setLoading(true);
    Promise.all([
      fetch('/data/legislators-real.json').then(r => r.json()),
      fetch('/data/voting-records.json').then(r => r.json()).catch(() => null),
    ])
      .then(([legData, voteData]: [RealLegislatorData, VotingRecordsData | null]) => {
        setRealData(legData);
        if (voteData) setVotingRecords(voteData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isDemo]);

  // Reset filters on mode change
  useEffect(() => {
    setPartyFilter('전체');
    setCommitteeFilter('전체');
    setRegionFilter('전체');
    setSearchQuery('');
    setSortBy('bills_desc');
  }, [isDemo]);

  const rawLegislators = realData?.legislators ?? [];

  // ── Region data (for buttons) ──
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of rawLegislators) {
      const r = extractRegion(l.ORIG_NM);
      if (r) counts[r] = (counts[r] || 0) + 1;
    }
    return counts;
  }, [rawLegislators]);

  const activeRegions = useMemo(() => {
    return REGION_ORDER.filter(r => (regionCounts[r] || 0) > 0);
  }, [regionCounts]);

  // ── Party distribution ──
  const realPartyDistribution = useMemo(() => {
    if (!rawLegislators.length) return null;
    const counts: Record<string, number> = {};
    for (const l of rawLegislators) {
      const p = l.POLY_NM || '무소속';
      counts[p] = (counts[p] || 0) + 1;
    }
    const total = rawLegislators.length;
    const dem = counts['더불어민주당'] || 0;
    const ppp = counts['국민의힘'] || 0;
    const reb = counts['조국혁신당'] || 0;
    const etc = total - dem - ppp - reb;
    return {
      segments: [
        { label: '더불어민주당', count: dem, color: '#1A56DB' },
        { label: '국민의힘', count: ppp, color: '#E5243B' },
        { label: '조국혁신당', count: reb, color: '#6B21A8' },
        { label: '기타', count: etc, color: '#9CA3AF' },
      ],
      total,
      details: counts,
    };
  }, [rawLegislators]);

  // ── Gender ──
  const realGenderDistribution = useMemo(() => {
    let male = 0, female = 0;
    for (const l of rawLegislators) {
      if (l.SEX_GBN_NM === '남') male++;
      else if (l.SEX_GBN_NM === '여') female++;
    }
    return { male, female };
  }, [rawLegislators]);

  // ── Committees ──
  const realCommittees = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of rawLegislators) {
      const cmits = l.CMIT_NM || '미배정';
      for (const c of cmits.split(',').map(s => s.trim())) {
        if (c) map[c] = (map[c] || 0) + 1;
      }
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rawLegislators]);

  const realCommitteeNames = useMemo(() => {
    return realCommittees.map(c => c.name);
  }, [realCommittees]);

  // ── Party counts for filter pills ──
  const realPartyCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': rawLegislators.length };
    for (const l of rawLegislators) {
      const p = l.POLY_NM || '무소속';
      if (MAJOR_PARTIES.includes(p)) {
        counts[p] = (counts[p] || 0) + 1;
      } else {
        counts['기타'] = (counts['기타'] || 0) + 1;
      }
    }
    return counts;
  }, [rawLegislators]);

  // ── Bill stats ──
  const realBillStats = useMemo(() => {
    const totalProposed = rawLegislators.reduce((s, l) => s + (l.bills_proposed ?? 0), 0);
    const maxBills = rawLegislators.reduce((m, l) => Math.max(m, l.bills_proposed ?? 0), 0);
    return { totalProposed, maxBills };
  }, [rawLegislators]);

  // ── Voting participation stats ──
  const participation = votingRecords?.participation ?? {};
  const totalBillsAnalyzed = votingRecords?.bills_analyzed ?? 0;

  const realVotingStats = useMemo(() => {
    const entries = Object.values(participation);
    if (entries.length === 0) return { avgRate: 0 };
    const totalRate = entries.reduce((s, e) => s + e.participation_rate, 0);
    return { avgRate: totalRate / entries.length };
  }, [participation]);

  // ── Filtered + sorted legislators ──
  const filteredRealLegislators = useMemo(() => {
    let list = [...rawLegislators];

    if (partyFilter !== '전체') {
      if (partyFilter === '기타') {
        list = list.filter(l => !MAJOR_PARTIES.includes(l.POLY_NM || ''));
      } else {
        list = list.filter(l => l.POLY_NM === partyFilter);
      }
    }

    if (committeeFilter !== '전체') {
      list = list.filter(l => (l.CMIT_NM || '').includes(committeeFilter));
    }

    if (regionFilter !== '전체') {
      list = list.filter(l => extractRegion(l.ORIG_NM) === regionFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l =>
        l.HG_NM.toLowerCase().includes(q) ||
        (l.ORIG_NM || '').toLowerCase().includes(q) ||
        (l.POLY_NM || '').toLowerCase().includes(q) ||
        (l.CMIT_NM || '').toLowerCase().includes(q) ||
        (l.ENG_NM || '').toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'bills_desc':
        list.sort((a, b) => (b.bills_proposed ?? 0) - (a.bills_proposed ?? 0));
        break;
      case 'participation_desc':
        list.sort((a, b) => {
          const ra = participation[a.MONA_CD]?.participation_rate ?? -1;
          const rb = participation[b.MONA_CD]?.participation_rate ?? -1;
          return rb - ra;
        });
        break;
      case 'absent_desc':
        list.sort((a, b) => {
          const aa = participation[a.MONA_CD]?.absent ?? 0;
          const ab = participation[b.MONA_CD]?.absent ?? 0;
          return ab - aa;
        });
        break;
      case 'name_asc':
        list.sort((a, b) => a.HG_NM.localeCompare(b.HG_NM, 'ko'));
        break;
    }

    return list;
  }, [rawLegislators, partyFilter, committeeFilter, regionFilter, searchQuery, sortBy, participation]);

  // ── Scroll to grid helper ──
  const scrollToGrid = useCallback(() => {
    setTimeout(() => {
      document.getElementById('legislator-grid')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ── DEMO data computations (kept as-is) ──
  const partyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of legislators) {
      const p = l.party || '무소속';
      counts[p] = (counts[p] || 0) + 1;
    }
    const dem = counts['더불어민주당'] || 0;
    const ppp = counts['국민의힘'] || 0;
    const reb = counts['조국혁신당'] || 0;
    const etc = legislators.length - dem - ppp - reb;
    return {
      segments: [
        { label: '더불어민주당', count: dem, color: '#1A56DB' },
        { label: '국민의힘', count: ppp, color: '#E5243B' },
        { label: '조국혁신당', count: reb, color: '#6B21A8' },
        { label: '기타', count: etc, color: '#9CA3AF' },
      ],
      total: legislators.length,
      details: counts,
    };
  }, [legislators]);

  const keyFacts = useMemo(() => {
    const total = legislators.length;
    if (total === 0) return { avgAttendance: 0, totalBills: 0, totalSpeeches: 0, avgVoteRate: 0 };
    const avgAttendance = legislators.reduce((s, l) => s + (l.attendance_rate || 0), 0) / total;
    const totalBills = legislators.reduce((s, l) => s + (l.bills_proposed_count || 0), 0);
    const totalSpeeches = legislators.reduce((s, l) => s + (l.speech_count || 0), 0);
    const avgVoteRate = legislators.reduce((s, l) => s + (l.vote_participation_rate || 0), 0) / total;
    return { avgAttendance, totalBills, totalSpeeches, avgVoteRate };
  }, [legislators]);

  const attendanceBrackets = useMemo(() => {
    const b = [
      { label: '90%+', count: 0 },
      { label: '80-90%', count: 0 },
      { label: '70-80%', count: 0 },
      { label: '70% 미만', count: 0 },
    ];
    for (const l of legislators) {
      const a = l.attendance_rate ?? 0;
      if (a >= 90) b[0].count++;
      else if (a >= 80) b[1].count++;
      else if (a >= 70) b[2].count++;
      else b[3].count++;
    }
    return b;
  }, [legislators]);

  const billsBrackets = useMemo(() => {
    const b = [
      { label: '0건', count: 0 },
      { label: '1-10건', count: 0 },
      { label: '11-30건', count: 0 },
      { label: '30건+', count: 0 },
    ];
    for (const l of legislators) {
      const c = l.bills_proposed_count ?? 0;
      if (c === 0) b[0].count++;
      else if (c <= 10) b[1].count++;
      else if (c <= 30) b[2].count++;
      else b[3].count++;
    }
    return b;
  }, [legislators]);

  const committeeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of legislators) {
      const c = l.committee || '미배정';
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [legislators]);

  const committees = useMemo(() => {
    const set = new Set<string>();
    for (const l of legislators) {
      if (l.committee) set.add(l.committee);
    }
    return Array.from(set).sort();
  }, [legislators]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const l of legislators) {
      if (l.region) set.add(l.region);
    }
    return Array.from(set).sort();
  }, [legislators]);

  const partyCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': legislators.length };
    for (const l of legislators) {
      const p = l.party || '무소속';
      if (MAJOR_PARTIES.includes(p)) {
        counts[p] = (counts[p] || 0) + 1;
      } else {
        counts['기타'] = (counts['기타'] || 0) + 1;
      }
    }
    return counts;
  }, [legislators]);

  const filtered = useMemo(() => {
    let list = [...legislators];
    if (partyFilter !== '전체') {
      if (partyFilter === '기타') {
        list = list.filter(l => !MAJOR_PARTIES.includes(l.party || ''));
      } else {
        list = list.filter(l => l.party === partyFilter);
      }
    }
    if (committeeFilter !== '전체') {
      list = list.filter(l => l.committee === committeeFilter);
    }
    if (regionFilter !== '전체') {
      list = list.filter(l => l.region === regionFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.district || '').toLowerCase().includes(q) ||
        (l.party || '').toLowerCase().includes(q) ||
        (l.committee || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [legislators, partyFilter, committeeFilter, regionFilter, searchQuery]);

  // ═══════════════════════════════════════════
  // ── LIVE MODE ──
  // ═══════════════════════════════════════════
  if (!isDemo) {
    if (loading) {
      return (
        <div className="container-page py-6 sm:py-8">
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-4" />
            <p>실제 국회 데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container-page py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            국회의원 활동 현황
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5 leading-relaxed">
            22대 국회 {rawLegislators.length}명 의원의 법안 발의, 본회의 참여를 공개 데이터로 확인합니다.
          </p>
          <div className="mt-3">
            <Link
              href="/legislators/ranking"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              🏆 랭킹 보기
            </Link>
          </div>
        </div>

        {/* ═══ Layer 1: Overview Dashboard ═══ */}

        {/* Region selector: "내 지역구 의원 찾기" */}
        <div className="card mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3">내 지역구 의원 찾기</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setRegionFilter('전체'); scrollToGrid(); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                regionFilter === '전체'
                  ? 'border-gray-700 bg-gray-800 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              전체
              <span className={`ml-1 text-xs ${regionFilter === '전체' ? 'text-gray-300' : 'text-gray-400'}`}>
                {rawLegislators.length}
              </span>
            </button>
            {activeRegions.map(region => (
              <button
                key={region}
                onClick={() => { setRegionFilter(region === regionFilter ? '전체' : region); scrollToGrid(); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  regionFilter === region
                    ? 'border-gray-700 bg-gray-800 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {region}
                <span className={`ml-1 text-xs ${regionFilter === region ? 'text-gray-300' : 'text-gray-400'}`}>
                  {regionCounts[region] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{rawLegislators.length}<span className="text-base font-normal text-gray-400">명</span></div>
            <div className="text-xs text-gray-500 mt-1">의원</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{realBillStats.totalProposed.toLocaleString()}<span className="text-base font-normal text-gray-400">건</span></div>
            <div className="text-xs text-gray-500 mt-1">총 발의 법안</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{realVotingStats.avgRate.toFixed(1)}<span className="text-base font-normal text-gray-400">%</span></div>
            <div className="text-xs text-gray-500 mt-1">평균 참여율</div>
          </div>
        </div>

        {/* Party distribution bar */}
        {realPartyDistribution && (
          <div className="card mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800">정당별 의석 분포</h2>
              <span className="text-sm text-gray-400">총 {realPartyDistribution.total}석</span>
            </div>
            <StackedBar segments={realPartyDistribution.segments} total={realPartyDistribution.total} />
          </div>
        )}

        {/* Gender composition */}
        <div className="card mb-4">
          <h2 className="text-sm font-bold text-gray-800 mb-2">성별 구성</h2>
          <p className="text-lg text-gray-800">
            남 <span className="font-bold">{realGenderDistribution.male}</span>명 &middot; 여 <span className="font-bold">{realGenderDistribution.female}</span>명
          </p>
        </div>

        {/* Committee grid (clickable) */}
        <div className="card mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-3">위원회 현황</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {realCommittees.slice(0, 20).map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setCommitteeFilter(committeeFilter === c.name ? '전체' : (c.name === '미배정' ? '전체' : c.name));
                  scrollToGrid();
                }}
                className={`px-3 py-2.5 rounded-lg text-left transition-colors border ${
                  committeeFilter === c.name
                    ? 'border-gray-400 bg-gray-100'
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="text-xs font-medium text-gray-700 truncate">{c.name}</div>
                <div className="text-lg font-bold text-gray-900">{c.count}<span className="text-xs font-normal text-gray-400 ml-0.5">명</span></div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Layer 2: Legislator Grid ═══ */}
        <div id="legislator-grid">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">의원 활동 카드</h2>

          {/* Filters */}
          <div className="card mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 지역구, 위원회, 정당으로 검색"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
              />
            </div>

            {/* Party pills */}
            <div className="flex flex-wrap gap-2">
              {PARTY_FILTERS.map(pf => {
                const isActive = partyFilter === pf.value;
                const color = pf.value === '전체' ? '#6B7280'
                  : pf.value === '기타' ? '#6B7280'
                  : PARTY_COLORS[pf.value] || '#6B7280';
                return (
                  <button
                    key={pf.value}
                    onClick={() => setPartyFilter(pf.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isActive ? { backgroundColor: color } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isActive ? '#fff' : color }} />
                    {pf.label}
                    <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {realPartyCounts[pf.value] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Committee + region + sort dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={committeeFilter}
                onChange={(e) => setCommitteeFilter(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
              >
                <option value="전체">위원회 전체</option>
                {realCommitteeNames.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
              >
                <option value="전체">지역 전체</option>
                {activeRegions.map(r => (
                  <option key={r} value={r}>{r} ({regionCounts[r] || 0})</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Result count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredRealLegislators.length !== rawLegislators.length ? (
                <>검색 결과: <span className="font-semibold text-gray-700">{filteredRealLegislators.length}명</span></>
              ) : (
                <>전체 <span className="font-semibold text-gray-700">{rawLegislators.length}명</span></>
              )}
            </div>
            <div className="text-xs text-gray-400">
              정렬: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
            </div>
          </div>

          {/* Card grid */}
          {filteredRealLegislators.length === 0 ? (
            <div className="card text-center py-16">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-gray-300">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p className="text-gray-400">해당 조건의 의원이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRealLegislators.map(l => (
                <RealLegislatorCard
                  key={l.MONA_CD}
                  raw={l}
                  maxBills={realBillStats.maxBills}
                  votingData={participation[l.MONA_CD]}
                  totalBillsAnalyzed={totalBillsAnalyzed}
                />
              ))}
            </div>
          )}
        </div>

        {/* Source */}
        <p className="text-xs text-gray-400 mt-8 text-center leading-relaxed">
          이 페이지의 모든 데이터는 열린국회정보 공개 API 기반입니다.<br />
          {realData?.timestamp && <>({realData.timestamp} 기준) </>}
          법안 발의 현황은 22대 국회 기준이며, 본회의 표결 데이터는 최근 {totalBillsAnalyzed > 0 ? `${totalBillsAnalyzed}건` : ''} 기준입니다.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // ── DEMO MODE (original code, unchanged) ──
  // ═══════════════════════════════════════════
  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          국회의원 활동 현황
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1.5 leading-relaxed">
          22대 국회 {legislators.length}명의 의원이 실제로 무엇을 하고 있는지 공개 데이터로 확인합니다.
        </p>
      </div>

      {/* ── Page-level tabs ── */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { key: 'overview', label: '전체 현황' },
          { key: 'ranking',  label: '🏆 의원 랭킹' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPageLevelTab(tab.key as 'overview' | 'ranking')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              pageLevelTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 의원 랭킹 탭 ── */}
      {pageLevelTab === 'ranking' && (() => {
        const vp = votingRecords?.participation ?? {};
        const cat = RANK_CATEGORIES.find(c => c.key === rankCategory) ?? RANK_CATEGORIES[5];
        const allLegs = rawLegislators.length > 0 ? rawLegislators : [];

        // Filter: for pass_rate only show members who proposed ≥1 bill
        const pool = cat.key === 'bills_pass_rate'
          ? allLegs.filter(l => (l.bills_proposed ?? 0) > 0)
          : allLegs;

        const scored = pool
          .map(l => ({ leg: l, score: cat.getValue(l, vp[l.MONA_CD]) }))
          .sort((a, b) => b.score - a.score);

        const top10 = scored.slice(0, 10);
        const bottom10 = [...scored].sort((a, b) => a.score - b.score).slice(0, 10);

        const rankColor = (i: number) =>
          i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#9CA3AF';

        function RankRow({ entry, rank, warn }: { entry: typeof top10[0]; rank: number; warn?: boolean }) {
          const pColor = getPartyColor(entry.leg.POLY_NM);
          const partyShort = (entry.leg.POLY_NM || '무소속')
            .replace('더불어민주당', '민주')
            .replace('국민의힘', '국힘')
            .replace('조국혁신당', '조혁')
            .replace('무소속', '무소')
            .slice(0, 4);
          return (
            <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${warn ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
              <span className="text-lg font-extrabold w-7 text-right flex-shrink-0" style={{ color: rankColor(rank) }}>
                {rank + 1}
              </span>
              <div className="flex-shrink-0 rounded-full overflow-hidden ring-1 ring-gray-200 w-9 h-9">
                <MemberAvatar monaCode={entry.leg.MONA_CD} name={entry.leg.HG_NM} partyColor={pColor} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-gray-900 mr-1">{entry.leg.HG_NM}</span>
                <span
                  className="inline-block text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: pColor }}
                >
                  {partyShort}
                </span>
                {entry.leg.ORIG_NM && (
                  <div className="text-[11px] text-gray-400 truncate">{entry.leg.ORIG_NM}</div>
                )}
              </div>
              <span className={`text-base font-bold flex-shrink-0 ${warn ? 'text-red-500' : 'text-gray-800'}`}>
                {cat.format(entry.score)}
              </span>
            </div>
          );
        }

        return (
          <div>
            {/* Motivational banner */}
            <div className="card mb-6 text-center py-5 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
              <p className="text-base sm:text-lg font-bold tracking-wide">국민들은 당신의 모든 것을 보고 있다</p>
              <p className="text-xs text-gray-300 mt-1">22대 국회의원 활동 실적 공개 랭킹 — 데이터 기반 투명성</p>
            </div>

            {/* Category selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {RANK_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setRankCategory(c.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    rankCategory === c.key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-4">{cat.sublabel}</p>

            {/* Leaderboard: top vs bottom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top 10 */}
              <div className="card">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  🥇 상위 10명 <span className="text-xs font-normal text-gray-400 ml-1">{cat.higherIsBetter ? '높은 순' : '낮은 순'}</span>
                </h3>
                <div className="space-y-0.5">
                  {top10.map((entry, i) => (
                    <RankRow key={entry.leg.MONA_CD} entry={entry} rank={i} />
                  ))}
                  {top10.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">데이터 없음</p>}
                </div>
              </div>

              {/* Bottom 10 */}
              <div className="card border-red-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  ⚠️ 하위 10명 <span className="text-xs font-normal text-red-400 ml-1">주의</span>
                </h3>
                <div className="space-y-0.5">
                  {bottom10.map((entry, i) => (
                    <RankRow key={entry.leg.MONA_CD} entry={entry} rank={i} warn />
                  ))}
                  {bottom10.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">데이터 없음</p>}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
              출처: 열린국회정보 공개 API. 데이터 기준: 22대 국회 개원 이후.
            </p>
          </div>
        );
      })()}

      {/* ── 전체 현황 탭 ── */}
      {pageLevelTab === 'overview' && <>

      {/* 의석 분포 */}
      <div className="card mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">정당별 의석 분포</h2>
          <span className="text-sm text-gray-400">총 {partyDistribution.total}석</span>
        </div>
        <StackedBar segments={partyDistribution.segments} total={partyDistribution.total} />
      </div>

      {/* 핵심 지표 4-card 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">평균 출석률</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{keyFacts.avgAttendance.toFixed(1)}%</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gray-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(keyFacts.avgAttendance, 100)}%` }} />
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">총 발의 법안</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{keyFacts.totalBills.toLocaleString()}건</div>
          <div className="text-xs text-gray-400 mt-1">
            의원 평균 {legislators.length > 0 ? (keyFacts.totalBills / legislators.length).toFixed(1) : 0}건
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">총 본회의 발언</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{keyFacts.totalSpeeches.toLocaleString()}회</div>
          <div className="text-xs text-gray-400 mt-1">
            의원 평균 {legislators.length > 0 ? (keyFacts.totalSpeeches / legislators.length).toFixed(1) : 0}회
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">평균 투표참여율</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{keyFacts.avgVoteRate.toFixed(1)}%</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gray-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(keyFacts.avgVoteRate, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 활동 분포 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 mb-3">출석률 분포</h3>
          <div>
            <div className="flex h-6 rounded-md overflow-hidden">
              {attendanceBrackets.map((b, i) => {
                const total = legislators.length || 1;
                const pct = (b.count / total) * 100;
                const colors = ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];
                if (pct === 0) return null;
                return (
                  <div key={b.label} className="flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${pct}%`, backgroundColor: colors[i] }} title={`${b.label}: ${b.count}명`}>
                    {pct >= 8 ? b.count : ''}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {attendanceBrackets.map((b, i) => {
                const colors = ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];
                return (
                  <div key={b.label} className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} />
                    <span>{b.label}</span>
                    <span className="font-semibold text-gray-700">{b.count}명</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 mb-3">법안 발의 분포</h3>
          <div>
            <div className="flex h-6 rounded-md overflow-hidden">
              {billsBrackets.map((b, i) => {
                const total = legislators.length || 1;
                const pct = (b.count / total) * 100;
                const colors = ['#D1D5DB', '#9CA3AF', '#6B7280', '#374151'];
                if (pct === 0) return null;
                return (
                  <div key={b.label} className="flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${pct}%`, backgroundColor: colors[i] }} title={`${b.label}: ${b.count}명`}>
                    {pct >= 8 ? b.count : ''}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {billsBrackets.map((b, i) => {
                const colors = ['#D1D5DB', '#9CA3AF', '#6B7280', '#374151'];
                return (
                  <div key={b.label} className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} />
                    <span>{b.label}</span>
                    <span className="font-semibold text-gray-700">{b.count}명</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 위원회 분포 */}
      <div className="card mb-8">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3">위원회 현황</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {committeeData.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setCommitteeFilter(c.name === '미배정' ? '전체' : c.name);
                document.getElementById('legislator-list')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-3 py-2.5 rounded-lg text-left transition-colors border ${
                committeeFilter === c.name
                  ? 'border-gray-400 bg-gray-100'
                  : 'border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-700 truncate">{c.name}</div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">{c.count}<span className="text-xs font-normal text-gray-400 ml-0.5">명</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* 의원 목록 */}
      <div id="legislator-list">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">의원 목록</h2>

        <div className="card mb-6 space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 지역구로 검색"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PARTY_FILTERS.map(pf => {
              const isActive = partyFilter === pf.value;
              const color = pf.value === '전체' ? '#6B7280'
                : pf.value === '기타' ? '#6B7280'
                : PARTY_COLORS[pf.value] || '#6B7280';
              return (
                <button
                  key={pf.value}
                  onClick={() => setPartyFilter(pf.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isActive ? { backgroundColor: color } : undefined}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isActive ? '#fff' : color }} />
                  {pf.label}
                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {partyCounts[pf.value] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
            >
              <option value="전체">위원회 전체</option>
              {committees.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
            >
              <option value="전체">지역 전체</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length !== legislators.length && (
          <div className="mb-4 text-sm text-gray-500">
            검색 결과: <span className="font-semibold text-gray-700">{filtered.length}명</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-gray-300">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <p className="text-gray-400">해당 조건의 의원이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(l => (
              <ActivityCard key={l.id} legislator={l} />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center leading-relaxed">
        이 페이지의 모든 수치는 열린국회정보 공개 데이터 기반입니다.<br />
        시범 운영 중이며, API 연동 후 실시간 업데이트됩니다.
      </p>

      </>}
    </div>
  );
}
