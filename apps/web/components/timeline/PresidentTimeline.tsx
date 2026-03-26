'use client';
// 대통령 타임라인 — 인터랙티브 가로 타임라인
import type { President } from '@/lib/types';

export default function PresidentTimeline({ presidents }: { presidents?: President[] }) {
  const defaultPresidents = [
    { id: 'ysk', name: '김영삼', era: '문민정부', termStart: '1993-02-25', termEnd: '1998-02-24' },
    { id: 'kdj', name: '김대중', era: '국민의 정부', termStart: '1998-02-25', termEnd: '2003-02-24' },
    { id: 'nmh', name: '노무현', era: '참여정부', termStart: '2003-02-25', termEnd: '2008-02-24' },
    { id: 'lmb', name: '이명박', era: '이명박 정부', termStart: '2008-02-25', termEnd: '2013-02-24' },
    { id: 'pgh', name: '박근혜', era: '박근혜 정부', termStart: '2013-02-25', termEnd: '2017-03-10' },
    { id: 'mji', name: '문재인', era: '문재인 정부', termStart: '2017-05-10', termEnd: '2022-05-09' },
    { id: 'ysy', name: '윤석열', era: '윤석열 정부', termStart: '2022-05-10', termEnd: '2025-04-04' },
    { id: 'ljm', name: '이재명', era: '이재명 정부', termStart: '2025-06-04' },
  ];

  const items = presidents || defaultPresidents;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {items.map((p) => (
          <a
            key={p.id}
            href={`/presidents/${p.id}`}
            className="card min-w-[200px] hover:shadow-md transition-shadow"
          >
            <div className="font-bold text-lg">{p.name}</div>
            <div className="text-sm text-gray-500">{p.era}</div>
            <div className="text-xs text-gray-400 mt-2">
              {p.termStart?.substring(0, 4)}~{p.termEnd?.substring(0, 4) || '현재'}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
