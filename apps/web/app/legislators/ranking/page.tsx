import fs from 'fs';
import path from 'path';
import RankingLeaderboard, { type ScoredLegislator } from '@/components/legislators/RankingLeaderboard';

export const metadata = { title: '국회의원 랭킹 | 국정투명' };

function readJSON(filename: string) {
  const p = path.join(process.cwd(), 'public/data', filename);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  return null;
}

export default function LegislatorsRankingPage() {
  const scoresData = readJSON('legislator-scores.json');

  if (!scoresData) {
    return (
      <div className="container-page py-8">
        <p className="text-gray-400 text-sm">
          성과 데이터를 생성 중입니다.{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">uv run scripts/generate-legislator-scores.py</code>를 실행해 주세요.
        </p>
      </div>
    );
  }

  const legislators: ScoredLegislator[] = scoresData.legislators ?? [];
  const summary = scoresData.summary;

  return <RankingLeaderboard legislators={legislators} summary={summary} />;
}
