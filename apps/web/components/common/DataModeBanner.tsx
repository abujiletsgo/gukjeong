'use client';
import { useDataMode } from '@/lib/context/DataModeContext';

export default function DataModeBanner() {
  const { mode } = useDataMode();

  // Only show banner in demo mode — live mode needs no banner
  if (mode === 'live') return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container-page flex items-center justify-center gap-2 py-1.5 text-xs text-amber-800">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <span><strong>데모 모드</strong> — 시범 데이터를 보고 있습니다</span>
      </div>
    </div>
  );
}
