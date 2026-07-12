import Link from 'next/link';
import { getLegislatorsFromDB } from '@/lib/db/queries';
import RankingLeaderboard, { type ScoredLegislator } from '@/components/legislators/RankingLeaderboard';
import type { Legislator } from '@/lib/types';

export const metadata = { title: '국회의원 랭킹 | 국정투명' };

function legislatorToScored(leg: Legislator): ScoredLegislator {
  const termMap: Record<number, string> = { 1: '초선', 2: '재선', 3: '3선', 4: '4선', 5: '5선', 6: '6선' };
  return {
    MONA_CD: leg.id,
    HG_NM: leg.name,
    POLY_NM: leg.party ?? '',
    ORIG_NM: leg.district ?? '',
    CMIT_NM: leg.committee ?? '',
    REELE_GBN_NM: termMap[leg.elected_count ?? 1] ?? '초선',
    bills_total: leg.bills_proposed_count ?? 0,
    bills_cosponsor: 0,
    bills_passed: leg.bills_passed_count ?? 0,
    bills_partial: 0,
    bills_effective: 0,
    bills_passage_rate: 0,
    bills_effective_rate: 0,
    bills_week: 0,
    bills_month: 0,
    bills_quarter: 0,
    bills_year: 0,
    bills_passed_month: 0,
    bills_passed_year: 0,
    primary_area: leg.career_summary ?? '',
    policy_concentration: 0,
    bipartisan_bills: 0,
    bipartisan_rate: 0,
    bipartisan_parties: [],
    vote_participation_rate: leg.vote_participation_rate ?? 0,
    spending_total: 0,
    spending_self_promo_pct: 0,
    spending_policy_pct: 0,
    words_vs_actions_score: leg.consistency_score ?? 0,
    consistency_items: (leg.consistency_details ?? []).map(item => ({
      topic: item.topic,
      speech_stance: item.speech_stance,
      vote_stance: item.vote_stance,
      is_consistent: item.is_consistent,
      explanation: item.explanation,
    })),
    activity_score: leg.ai_activity_score ?? 0,
    bills_percentile: 0,
    effective_percentile: 0,
    bipartisan_percentile: 0,
    grade: 'C',
    rank_overall: 0,
    rank_bills_total: 0,
    rank_bills_week: 0,
    rank_bills_month: 0,
    rank_bills_quarter: 0,
    rank_bills_year: 0,
    rank_effective_rate: 0,
    rank_bipartisan: 0,
    rank_wva: 0,
    rank_spending_total: 0,
    rank_self_promo: 0,
  };
}

export default async function LegislatorsRankingPage() {
  const { legislators } = await getLegislatorsFromDB({ pageSize: 300, sortBy: 'rank_overall' });

  if (legislators.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-gray-500">랭킹 데이터를 준비 중입니다.</p>
        <Link href="/legislators" className="mt-3 inline-block text-accent hover:underline">
          의원 목록 보기 →
        </Link>
      </div>
    );
  }

  // Strip recent_bills — only needed on the detail page, not the leaderboard
  const scored: ScoredLegislator[] = legislators.map(leg => {
    const s = legislatorToScored(leg);
    return s;
  });

  return <RankingLeaderboard legislators={scored} summary={undefined} />;
}
