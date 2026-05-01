import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { getLegislatorById, getLegislators } from '@/lib/data';
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

function loadScoredData(): Array<Record<string, unknown>> {
  const p = path.join(process.cwd(), 'public/data', 'legislator-scores.json');
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8')) as { legislators: Array<Record<string, unknown>> };
    return data.legislators ?? [];
  } catch {
    return [];
  }
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
  const scored = loadScoredData();
  const legislator = getLegislatorById(id) ?? loadScoredLegislator(id, scored);
  return {
    title: legislator ? `${legislator.name} 의원 활동 현황` : '국회의원 활동 현황',
    description: legislator ? `${legislator.name} 의원의 출석률, 법안 발의, 말행일치도 현황` : '국회의원 활동 현황',
  };
}

export default async function LegislatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scored = loadScoredData();
  // Try seed data first (leg-001 IDs), then fall back to real scored data by MONA_CD
  const base = getLegislatorById(id) ?? loadScoredLegislator(id, scored);
  // Merge recent_bills from scored data (seed data doesn't have them)
  const legislator = base ? mergeRecentBills(base, base.name, scored) : undefined;
  const allLegislators = getLegislators();

  if (!legislator) {
    return (
      <div className="container-page py-8">
        <Link href="/legislators/ranking" className="text-accent hover:underline">&larr; 의원 랭킹</Link>
        <p className="mt-8 text-gray-400">의원 정보를 찾을 수 없습니다. (ID: {id})</p>
      </div>
    );
  }
  return <LegislatorDetailClient legislator={legislator} allLegislators={allLegislators} />;
}
