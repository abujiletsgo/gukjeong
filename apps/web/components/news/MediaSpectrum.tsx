'use client';
// 미디어 스펙트럼 바 — 매체별 보도량 시각화
import type { MediaOutlet } from '@/lib/types';

export default function MediaSpectrum({ outlets }: { outlets?: MediaOutlet[] }) {
  return (
    <div className="w-full h-12 bg-gradient-to-r from-progressive via-gray-300 to-conservative rounded-lg relative">
      <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-white font-semibold">
        <span>진보</span>
        <span className="text-gray-600">중도</span>
        <span>보수</span>
      </div>
    </div>
  );
}
