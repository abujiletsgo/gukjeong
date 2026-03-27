'use client';
// 용어 사전 툴팁 — 기술 용어에 마우스 오버 또는 포커스 시 설명
import { useState, useId } from 'react';

interface GlossaryTooltipProps {
  term: string;
  explanation: string;
  children: React.ReactNode;
}

export default function GlossaryTooltip({ term, explanation, children }: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        className="border-b border-dotted border-gray-400 cursor-help"
        role="button"
        tabIndex={0}
        aria-describedby={isOpen ? tooltipId : undefined}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
      >
        {children}
      </span>
      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white rounded-lg shadow-lg border text-sm z-50"
        >
          <div className="font-semibold text-gray-900 mb-1">{term}</div>
          <div className="text-gray-600 text-xs">{explanation}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1" aria-hidden="true">
            <div className="w-2 h-2 bg-white border-r border-b rotate-45" />
          </div>
        </div>
      )}
    </span>
  );
}
