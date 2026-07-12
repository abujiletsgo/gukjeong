import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { getLegislatorById, getLegislators } from '@/lib/data';
import { getLegislatorByIdFromDB } from '@/lib/db/queries';
import LegislatorDetailClient from './LegislatorDetailClient';
import Link from 'next/link';
import type { Legislator, ConsistencyItem, LegislatorBill } from '@/lib/types';

// Convert a scored legislator record to the Legislator interface
function scoreToLegislator(raw: Record<string, unknown>): Legislator {
  const termMap: Record<string, number> = { '초선': 1, '재선': 2, '3선': 3, '4선': 4, '5선': 5, '6선': 6 };
  const items = (raw.consistency_items as Array<Record<string, unknown>> | undefined) ?? [];
  const consistencyDetails: ConsistencyItem[] = items.map(it => ({
    topic: String(it.topic ?? ''),
    speech_stance: String(it.speech_stance ?? ''),
    vote_stance: String(it.vote_stance ?? ''),
    is_consistent: Boolean(it.is_consistent),
    explanation: it.explanation ? String(it.explanation) : undefined,
    vote_source: it.vote_source ? String(it.vote_source) : undefined,
  }));

  return {
    id: String(raw.MONA_CD),
    name: String(raw.HG_NM),
    party: String(raw.POLY_NM ?? ''),
    district: String(raw.ORIG_NM ?? ''),
    committee: String(raw.CMIT_NM ?? ''),
    elected_count: termMap[String(raw.REELE_GBN_NM ?? '')] ?? 1,
    gender: raw.SEX_GBN_NM === '여' ? '여' : '남',
    bills_proposed_count: Number(raw.bills_total ?? 0),
    bills_passed_count: Number(raw.bills_passed ?? 0),
    vote_participation_rate: Number(raw.vote_participation_rate ?? 0),
    ai_activity_score: Number(raw.activity_score ?? 0),
    consistency_score: Number(raw.words_vs_actions_score ?? 0),
    consistency_details: consistencyDetails.length > 0 ? consistencyDetails : undefined,
    career_summary: raw.primary_area ? `주요 입법 분야: ${raw.primary_area}` : undefined,
    recent_bills: (raw.recent_bills as LegislatorBill[] | undefined) ?? undefined,
  };
}

// legislator-scores.json (~8MB) is read + parsed on every detail-page view.
// Memoize parsed JSON per path for the lifetime of the server process.
const _jsonCache = new Map<string, unknown>();

function readJSON(relPath: string): unknown {
  if (_jsonCache.has(relPath)) return _jsonCache.get(relPath);
  const p = path.join(process.cwd(), relPath);
  if (!fs.existsSync(p)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
    _jsonCache.set(relPath, parsed);
    return parsed;
  } catch { return null; }
}

function loadScoredData(): Array<Record<string, unknown>> {
  const data = readJSON('public/data/legislator-scores.json') as { legislators?: Array<Record<string, unknown>> } | null;
  return data?.legislators ?? [];
}

function loadRawByMonaCode(monaCode: string): Legislator | undefined {
  // Last-resort fallback: raw legislators.json
  const data = readJSON('data/legislators.json') as { items?: Array<Record<string, unknown>> } | null;
  const found = (data?.items ?? []).find(l => l.MONA_CD === monaCode);
  if (!found) return undefined;
  return {
    id: String(found.MONA_CD),
    name: String(found.HG_NM),
    party: String(found.POLY_NM ?? ''),
    district: String(found.ORIG_NM ?? ''),
    committee: String(found.CMIT_NM ?? ''),
    gender: found.SEX_GBN_NM === '여' ? '여' : '남',
  };
}

function loadScoredLegislator(monaCode: string, scored: Array<Record<string, unknown>>): Legislator | undefined {
  const found = scored.find(l => l.MONA_CD === monaCode);
  return found ? scoreToLegislator(found) : undefined;
}

function mergeRecentBills(legislator: Legislator, name: string, scored: Array<Record<string, unknown>>): Legislator {
  if (legislator.recent_bills) return legislator;
  const match = scored.find(l => String(l.HG_NM) === name);
  if (!match?.recent_bills) return legislator;
  return { ...legislator, recent_bills: match.recent_bills as LegislatorBill[] };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const dbLegislator = await getLegislatorByIdFromDB(id);
  const legislator = dbLegislator ?? (() => {
    const scored = loadScoredData();
    return getLegislatorById(id) ?? loadScoredLegislator(id, scored) ?? loadRawByMonaCode(id);
  })();
  return {
    title: legislator ? `${legislator.name} 의원 활동 현황` : '국회의원 활동 현황',
    description: legislator ? `${legislator.name} 의원의 출석률, 법안 발의, 말행일치도 현황` : '국회의원 활동 현황',
  };
}

export default async function LegislatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try DB first
  const dbLegislator = await getLegislatorByIdFromDB(id);

  let legislator: Legislator | undefined;
  if (dbLegislator) {
    legislator = dbLegislator;
  } else {
    // Fallback: seed data (leg-001 IDs) → scored data (MONA_CD) → raw API data
    const scored = loadScoredData();
    const base = getLegislatorById(id) ?? loadScoredLegislator(id, scored) ?? loadRawByMonaCode(id);
    // Merge recent_bills from scored data (seed data doesn't have them)
    legislator = base ? mergeRecentBills(base, base.name, scored) : undefined;
  }

  const allLegislators = getLegislators();

  if (!legislator) {
    return (
      <div className="container-page py-8">
        <Link href="/legislators" className="text-accent hover:underline">&larr; 의원 목록</Link>
        <p className="mt-8 text-gray-400">의원 정보를 찾을 수 없습니다. (ID: {id})</p>
      </div>
    );
  }
  return <LegislatorDetailClient legislator={legislator} allLegislators={allLegislators} />;
}
