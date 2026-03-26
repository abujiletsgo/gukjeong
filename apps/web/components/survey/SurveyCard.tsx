'use client';
// 설문 카드
import type { Survey } from '@/lib/types';

export default function SurveyCard({ survey }: { survey: Survey }) {
  return (
    <a href={`/survey/${survey.id}`} className="card hover:shadow-md transition-shadow block">
      <h3 className="font-bold text-lg">{survey.title}</h3>
      <p className="text-sm text-gray-600 mt-2">{survey.description}</p>
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <span>참여: {survey.totalResponses}명</span>
        {survey.representativenessScore && (
          <span>대표성: {survey.representativenessScore}/100</span>
        )}
      </div>
    </a>
  );
}
