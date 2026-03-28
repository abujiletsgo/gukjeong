'use client';
import { useDataMode } from '@/lib/context/DataModeContext';

export default function DataModeToggle() {
  const { mode, toggleMode } = useDataMode();

  return (
    <button
      onClick={toggleMode}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
        mode === 'demo'
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      }`}
      title={mode === 'demo' ? '시범 데이터 보기 중' : '실시간 데이터 보기 중'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${mode === 'demo' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
      {mode === 'demo' ? '데모' : '실시간'}
    </button>
  );
}
