'use client';
// 뉴스 프레임 비교 — 진보/보수 분할 뷰
import type { NewsEvent } from '@/lib/types';

export default function FrameComparison({ event }: { event?: NewsEvent }) {
  if (!event) {
    return <p className="text-gray-400 text-center py-8">뉴스 이벤트 데이터 준비 중</p>;
  }

  return (
    <div className="card">
      <h3 className="font-bold text-lg mb-4">{event.title}</h3>

      {/* 핵심 사실 */}
      {event.key_facts && event.key_facts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">핵심 사실</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {event.key_facts.map((fact: string, i: number) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 프레임 비교 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-progressive mb-2">진보 프레임</h4>
          <p className="text-sm text-gray-700">
            {event.progressive_frame?.emphasis || '분석 준비 중'}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-conservative mb-2">보수 프레임</h4>
          <p className="text-sm text-gray-700">
            {event.conservative_frame?.emphasis || '분석 준비 중'}
          </p>
        </div>
      </div>

      {/* 시민 테이크어웨이 */}
      {event.citizen_takeaway && (
        <div className="mt-4 bg-amber-50 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-amber-700 mb-1">시민이 알아야 할 것</h4>
          <p className="text-sm text-gray-700">{event.citizen_takeaway}</p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        * 미디어 분류는 학술 연구 기반 참고 분류입니다.
      </div>
    </div>
  );
}
