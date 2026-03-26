'use client';
// 국회의원 랭킹 테이블
import type { Legislator } from '@/lib/types';

export default function RankingTable({ legislators }: { legislators?: Legislator[] }) {
  if (!legislators || legislators.length === 0) {
    return <p className="text-gray-400 text-center py-8">랭킹 데이터 준비 중</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">순위</th>
            <th className="px-4 py-3 text-left">이름</th>
            <th className="px-4 py-3 text-left">정당</th>
            <th className="px-4 py-3 text-right">활동 점수</th>
            <th className="px-4 py-3 text-right">출석률</th>
            <th className="px-4 py-3 text-right">일치도</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {legislators.map((l, i) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-bold">{i + 1}</td>
              <td className="px-4 py-3">
                <a href={`/legislators/${l.id}`} className="text-accent hover:underline">{l.name}</a>
              </td>
              <td className="px-4 py-3 text-gray-600">{l.party}</td>
              <td className="px-4 py-3 text-right font-semibold">{l.ai_activity_score || '-'}</td>
              <td className="px-4 py-3 text-right">{l.attendance_rate ? `${l.attendance_rate}%` : '-'}</td>
              <td className="px-4 py-3 text-right">{l.consistency_score ? `${l.consistency_score}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
