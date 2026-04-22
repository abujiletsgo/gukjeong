import fs from 'fs'
import path from 'path'
import RankingLeaderboard from '@/components/legislators/RankingLeaderboard'

export const metadata = { title: '국회의원 랭킹 | 국정투명' }

export default function LegislatorsRankingPage() {
  const dataDir = path.join(process.cwd(), 'public/data')

  const rawLegislators = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'legislators-real.json'), 'utf-8')
  )
  const votingRecords = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'voting-records.json'), 'utf-8')
  )

  // legislators-real.json nests the array under "legislators"
  // voting-records.json nests participation under "participation"
  const legislators: Array<{
    MONA_CD: string;
    HG_NM: string;
    POLY_NM: string;
    bills_proposed?: number;
    bills_passed?: number;
  }> = rawLegislators.legislators ?? []

  const participation: Record<string, {
    present?: number;
    absent?: number;
    abstain?: number;
    participation_rate?: number;
  }> = votingRecords.participation ?? {}

  const merged = legislators.map(leg => {
    const vote = participation[leg.MONA_CD] || {}
    const present = vote.present || 0
    const absent = vote.absent || 0
    const abstain = vote.abstain || 0
    const total = present + absent + abstain
    return {
      MONA_CD: leg.MONA_CD,
      HG_NM: leg.HG_NM,
      POLY_NM: leg.POLY_NM,
      bills_proposed: leg.bills_proposed || 0,
      bills_passed: leg.bills_passed || 0,
      participation_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      absent_rate: total > 0 ? Math.round((absent / total) * 100) : 0,
    }
  })

  return <RankingLeaderboard legislators={merged} />
}
