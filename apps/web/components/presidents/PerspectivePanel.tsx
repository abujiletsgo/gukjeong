'use client';
// 다른 시각 패널 — 진보/보수 언론 프레이밍, 시민 체감, 맥락 표시
import { useState } from 'react';

export interface PerspectivePanelProps {
  progressive_frame?: string;
  conservative_frame?: string;
  citizen_reality?: string;
  context_note?: string;
  real_world_example?: string;
}

export function hasPerspectiveData(props: PerspectivePanelProps): boolean {
  return !!(
    props.progressive_frame ||
    props.conservative_frame ||
    props.citizen_reality ||
    props.context_note ||
    props.real_world_example
  );
}

export default function PerspectivePanel({
  progressive_frame,
  conservative_frame,
  citizen_reality,
  context_note,
  real_world_example,
}: PerspectivePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!hasPerspectiveData({ progressive_frame, conservative_frame, citizen_reality, context_note, real_world_example })) {
    return null;
  }

  return (
    <div className="mt-1 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors py-1 px-2 rounded hover:bg-gray-50"
        aria-expanded={isOpen}
      >
        <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        다른 시각 보기
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '600px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="mt-2 rounded-lg border border-gray-100 p-3 sm:p-4 space-y-3" style={{ backgroundColor: '#f8f9fa' }}>
          {progressive_frame && (
            <div className="flex gap-2">
              <span className="flex-shrink-0 text-sm mt-0.5" style={{ color: '#2563eb' }}>●</span>
              <div>
                <div className="text-[11px] font-semibold text-gray-600 mb-0.5">진보 시각</div>
                <p className="text-xs text-gray-700 leading-relaxed">{progressive_frame}</p>
              </div>
            </div>
          )}

          {conservative_frame && (
            <div className="flex gap-2">
              <span className="flex-shrink-0 text-sm mt-0.5" style={{ color: '#dc2626' }}>●</span>
              <div>
                <div className="text-[11px] font-semibold text-gray-600 mb-0.5">보수 시각</div>
                <p className="text-xs text-gray-700 leading-relaxed">{conservative_frame}</p>
              </div>
            </div>
          )}

          {citizen_reality && (
            <div className="flex gap-2">
              <span className="flex-shrink-0 text-sm mt-0.5" style={{ color: '#7c3aed' }}>●</span>
              <div>
                <div className="text-[11px] font-semibold text-gray-600 mb-0.5">시민 체감</div>
                <p className="text-xs text-gray-700 leading-relaxed">{citizen_reality}</p>
              </div>
            </div>
          )}

          {context_note && (
            <div className="flex gap-2">
              <span className="flex-shrink-0 text-sm mt-0.5" style={{ color: '#d97706' }}>●</span>
              <div>
                <div className="text-[11px] font-semibold text-gray-600 mb-0.5">맥락</div>
                <p className="text-xs text-gray-700 leading-relaxed">{context_note}</p>
              </div>
            </div>
          )}

          {real_world_example && (
            <div className="flex gap-2">
              <span className="flex-shrink-0 text-sm mt-0.5" style={{ color: '#059669' }}>●</span>
              <div>
                <div className="text-[11px] font-semibold text-gray-600 mb-0.5">사례</div>
                <p className="text-xs text-gray-700 leading-relaxed">{real_world_example}</p>
              </div>
            </div>
          )}

          <p className="text-[9px] text-gray-400 pt-2 border-t border-gray-200 leading-relaxed">
            각 시각은 해당 언론의 보도 경향을 요약한 것으로, 특정 입장을 지지하거나 반대하지 않습니다. 학술 연구 기반 참고 분류입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
