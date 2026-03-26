'use client';
// 국회의원 성적표 카드
import type { Legislator } from '@/lib/types';

export default function Scorecard({ legislator }: { legislator: Legislator }) {
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{legislator.name}</h3>
          <p className="text-sm text-gray-500">{legislator.party} | {legislator.district}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent">{legislator.ai_activity_score || '-'}</div>
          <div className="text-xs text-gray-500">활동 점수</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div>
          <div className="text-lg font-bold">{legislator.attendance_rate ? `${legislator.attendance_rate}%` : '-'}</div>
          <div className="text-xs text-gray-500">출석률</div>
        </div>
        <div>
          <div className="text-lg font-bold">{legislator.bills_proposed_count || 0}</div>
          <div className="text-xs text-gray-500">발의 법안</div>
        </div>
        <div>
          <div className="text-lg font-bold">{legislator.consistency_score ? `${legislator.consistency_score}%` : '-'}</div>
          <div className="text-xs text-gray-500">일치도</div>
        </div>
      </div>
    </div>
  );
}
