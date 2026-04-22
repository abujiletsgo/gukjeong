import fs from 'fs'
import path from 'path'
import RankingLeaderboard from '@/components/legislators/RankingLeaderboard'

export const metadata = { title: '국회의원 랭킹 | 국정투명' }

export default function LegislatorsRankingPage() {
  // process.cwd() = apps/web when running Next.js
  const publicDataDir = path.join(process.cwd(), 'public/data')
  const rawDataDir = path.join(process.cwd(), 'data')
  function readJSON(filename: string) {
    const publicPath = path.join(publicDataDir, filename)
    const rawPath = path.join(rawDataDir, filename)
    if (fs.existsSync(publicPath)) return JSON.parse(fs.readFileSync(publicPath, 'utf-8'))
    if (fs.existsSync(rawPath)) return JSON.parse(fs.readFileSync(rawPath, 'utf-8'))
    return null
  }

  const rawLegislators = readJSON('legislators-real.json')
  const votingRecords = readJSON('voting-records.json')
  const fundingRaw = readJSON('political-funding.json')

  const legislators: Array<{
    MONA_CD: string;
    HG_NM: string;
    POLY_NM: string;
    bills_proposed?: number;
    bills_passed?: number;
  }> = rawLegislators?.legislators ?? []

  const participation: Record<string, {
    present?: number;
    absent?: number;
    abstain?: number;
  }> = votingRecords?.participation ?? {}

  // Aggregate political funding by 의원명 → total + top category
  const fundingByName: Record<string, { total: number; cats: Record<string, number> }> = {}
  if (fundingRaw?.items) {
    for (const row of fundingRaw.items) {
      const name = row['의원명'] as string
      const amount = Number(row['지출']) || 0
      const cat = (row['분류'] as string) || '기타'
      if (!name) continue
      if (!fundingByName[name]) fundingByName[name] = { total: 0, cats: {} }
      fundingByName[name].total += amount
      fundingByName[name].cats[cat] = (fundingByName[name].cats[cat] || 0) + amount
    }
  }

  const merged = legislators.map(leg => {
    const vote = participation[leg.MONA_CD] || {}
    const present = (vote.present as number) || 0
    const absent = (vote.absent as number) || 0
    const abstain = (vote.abstain as number) || 0
    const total = present + absent + abstain

    const funding = fundingByName[leg.HG_NM]
    const topCat = funding
      ? Object.entries(funding.cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      : ''

    return {
      MONA_CD: leg.MONA_CD,
      HG_NM: leg.HG_NM,
      POLY_NM: leg.POLY_NM,
      bills_proposed: leg.bills_proposed || 0,
      bills_passed: leg.bills_passed || 0,
      participation_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      absent_rate: total > 0 ? Math.round((absent / total) * 100) : 0,
      funding_total: funding?.total ?? 0,
      funding_top_category: topCat,
    }
  })

  return <RankingLeaderboard legislators={merged} />
}
