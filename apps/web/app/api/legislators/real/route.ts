import { NextResponse } from 'next/server';
import { getLocalLegislators, getLocalBills } from '@/lib/local-data';
import {
  parseElectedCount,
  calculateAge,
  extractRegion,
  summarizeCareer,
} from '@/lib/assembly/client';
import type { Legislator } from '@/lib/types';

export const dynamic = 'force-static';

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { items: members, fetched_at } = getLocalLegislators();

    const url = new URL(request.url);
    const withBills = url.searchParams.get('bills') === 'true';
    const billSample = url.searchParams.get('billSample');
    const sampleSize = billSample ? parseInt(billSample, 10) : 0;

    const legislators: Legislator[] = (members as any[]).map((m) => ({
      id: m.MONA_CD || `assembly-${m.HG_NM}`,
      name: m.HG_NM || '',
      name_en: m.ENG_NM || undefined,
      party: m.POLY_NM || '무소속',
      district: m.ORIG_NM || undefined,
      region: extractRegion(m.ORIG_NM),
      elected_count: parseElectedCount(m.REELE_GBN_NM),
      committee: m.CMIT_NM || undefined,
      age: calculateAge(m.BTH_DATE),
      gender: m.SEX_GBN_NM || undefined,
      career_summary: summarizeCareer(m.MEM_TITLE),
      attendance_rate: undefined,
      vote_participation_rate: undefined,
      bills_proposed_count: undefined,
      bills_passed_count: undefined,
      speech_count: undefined,
    }));

    // If bills requested, count from local bills data
    if (withBills && sampleSize > 0) {
      const { items: allBills } = getLocalBills();
      const sample = legislators.slice(0, Math.min(sampleSize, 10));
      for (const l of sample) {
        const count = (allBills as any[]).filter(
          (b) => b.RST_PROPOSER === l.name || (b.PUBL_PROPOSER && b.PUBL_PROPOSER.includes(l.name))
        ).length;
        l.bills_proposed_count = count;
      }
    }

    const elapsed = Date.now() - startTime;

    const partyDistribution: Record<string, number> = {};
    for (const l of legislators) {
      const p = l.party || '무소속';
      partyDistribution[p] = (partyDistribution[p] || 0) + 1;
    }

    const genderDistribution: Record<string, number> = {};
    for (const l of legislators) {
      const g = l.gender || '미상';
      genderDistribution[g] = (genderDistribution[g] || 0) + 1;
    }

    const electedDistribution: Record<string, number> = {};
    for (const l of legislators) {
      const label =
        l.elected_count === 1
          ? '초선'
          : l.elected_count === 2
            ? '재선'
            : `${l.elected_count}선`;
      electedDistribution[label] = (electedDistribution[label] || 0) + 1;
    }

    return NextResponse.json({
      total: legislators.length,
      source: '로컬 데이터 (열린국회정보 API 스냅샷)',
      sourceUrl: 'https://open.assembly.go.kr',
      unitCode: '100022 (22대 국회)',
      fetched_at,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
      summary: {
        partyDistribution,
        genderDistribution,
        electedDistribution,
      },
      billDataIncluded: withBills && sampleSize > 0,
      legislators,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to load local legislators:', message);

    return NextResponse.json(
      {
        error: true,
        message,
        source: '로컬 데이터',
        timestamp: new Date().toISOString(),
        elapsed_ms: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}
