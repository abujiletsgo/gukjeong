'use client';
// 오늘의 판단 — 하루 1건, 실제 감사 finding에 시민이 O/X 판단을 남기는 라이트 인터랙션 루프.
// 백엔드 없음: 선택은 이 브라우저(localStorage)에만 기록된다.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PatternBadge from '@/components/audit/PatternBadge';

interface OXEntry {
  id: string;
  institution: string;
  pattern_type: string;
  score: number;
  situation: string;
  counter: string;
}

type Choice = 'O' | 'X' | '?';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayIndex(): number {
  const d = new Date();
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000);
}

export default function DailyOXCard() {
  const [entry, setEntry] = useState<OXEntry | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetch('/data/daily-ox.json')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        const list: OXEntry[] = d.entries ?? [];
        if (list.length === 0) return;
        setEntry(list[dayIndex() % list.length]);
        try {
          const log = JSON.parse(window.localStorage.getItem('oxLog') ?? '{}');
          if (log[todayKey()]) setChoice(log[todayKey()]);
          setStreak(Object.keys(log).length);
        } catch { /* noop */ }
      })
      .catch(() => { /* 카드 없이 조용히 숨김 */ });
  }, []);

  if (!entry) return null;

  const vote = (c: Choice) => {
    setChoice(c);
    try {
      const log = JSON.parse(window.localStorage.getItem('oxLog') ?? '{}');
      log[todayKey()] = c;
      window.localStorage.setItem('oxLog', JSON.stringify(log));
      setStreak(Object.keys(log).length);
    } catch { /* noop */ }
  };

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="card max-w-2xl mx-auto p-0 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #F0F6FF, #E8F2FF)' }}>
          <div>
            <h2 className="font-bold text-base text-gray-900">오늘의 판단</h2>
            <p className="text-xs text-gray-500 mt-0.5">실제 감사 데이터 한 건, 여러분의 눈으로 판단해 보세요</p>
          </div>
          {streak > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-white/70 px-2.5 py-1 rounded-full">
              {streak}일 참여
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <PatternBadge pattern={entry.pattern_type} size="sm" />
            <span className="text-sm font-bold text-gray-900">{entry.institution}</span>
            <span className="text-xs text-gray-400">의심 점수 {entry.score}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{entry.situation}</p>

          {!choice ? (
            <>
              <p className="text-sm font-bold text-gray-900 mb-3">이 계약, 점검이 필요하다고 보시나요?</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => vote('O')} className="py-3 rounded-xl bg-red-50 text-red-600 font-bold text-lg hover:bg-red-100 transition-colors">O 필요</button>
                <button onClick={() => vote('?')} className="py-3 rounded-xl bg-gray-50 text-gray-500 font-bold text-lg hover:bg-gray-100 transition-colors">△ 글쎄</button>
                <button onClick={() => vote('X')} className="py-3 rounded-xl bg-green-50 text-green-600 font-bold text-lg hover:bg-green-100 transition-colors">X 정상</button>
              </div>
              <p className="text-[11px] text-gray-300 mt-3 text-center">선택은 이 브라우저에만 기록됩니다</p>
            </>
          ) : (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500 mb-1.5">
                {choice === 'O' ? '점검 필요에 한 표 — AI도 이 건을 의심 패턴으로 봤습니다.' : choice === 'X' ? '정상에 한 표 — 아래 반론도 참고해 보세요.' : '판단 보류 — 증거를 직접 확인해 보세요.'}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                <span className="font-semibold text-gray-600">반론 가능성: </span>{entry.counter}
              </p>
              <Link href={`/audit/${entry.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                전체 증거 보러 가기 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
