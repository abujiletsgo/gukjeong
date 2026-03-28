import { NextResponse } from 'next/server';
import {
  fetchAllLegislators,
  fetchBillsByLegislator,
  parseElectedCount,
  calculateAge,
  extractRegion,
  summarizeCareer,
} from '@/lib/assembly/client';
import type { Legislator } from '@/lib/types';

export const revalidate = 21600; // ISR: 6시간

// ── 의원 데이터를 우리 Legislator 타입으로 변환 ──

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const members = await fetchAllLegislators();

    // URL query params for optional bill fetching
    const url = new URL(request.url);
    const withBills = url.searchParams.get('bills') === 'true';
    const billSample = url.searchParams.get('billSample');
    const sampleSize = billSample ? parseInt(billSample, 10) : 0;

    // Map to our Legislator type
    const legislators: Legislator[] = members.map((m) => ({
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
      // Activity data not available from this endpoint
      // These need separate API calls (attendance, votes, speeches)
      attendance_rate: undefined,
      vote_participation_rate: undefined,
      bills_proposed_count: undefined,
      bills_passed_count: undefined,
      speech_count: undefined,
    }));

    // Optionally fetch bill counts for a sample
    let billData: Record<string, { proposed: number; total: number }> = {};
    if (withBills && sampleSize > 0) {
      const sample = legislators.slice(0, Math.min(sampleSize, 10));
      const billResults = await Promise.all(
        sample.map(async (l) => {
          const { totalCount } = await fetchBillsByLegislator(l.name, 1, 1);
          return { id: l.id, name: l.name, proposed: totalCount, total: totalCount };
        }),
      );
      billData = Object.fromEntries(
        billResults.map((b) => [b.id, { proposed: b.proposed, total: b.total }]),
      );

      // Merge bill data back into legislators
      for (const l of legislators) {
        if (billData[l.id]) {
          l.bills_proposed_count = billData[l.id].proposed;
        }
      }
    }

    const elapsed = Date.now() - startTime;

    // Party distribution summary
    const partyDistribution: Record<string, number> = {};
    for (const l of legislators) {
      const p = l.party || '무소속';
      partyDistribution[p] = (partyDistribution[p] || 0) + 1;
    }

    // Gender distribution
    const genderDistribution: Record<string, number> = {};
    for (const l of legislators) {
      const g = l.gender || '미상';
      genderDistribution[g] = (genderDistribution[g] || 0) + 1;
    }

    // Elected count distribution
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
      source: '열린국회정보 API',
      sourceUrl: 'https://open.assembly.go.kr',
      unitCode: '100022 (22대 국회)',
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
    console.error('Failed to fetch legislators from Assembly API:', message);

    return NextResponse.json(
      {
        error: true,
        message,
        source: '열린국회정보 API',
        timestamp: new Date().toISOString(),
        elapsed_ms: Date.now() - startTime,
      },
      { status: 502 },
    );
  }
}
