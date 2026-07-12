'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type DataMode = 'live' | 'demo';

interface DataModeContextType {
  mode: DataMode;
  toggleMode: () => void;
  isDemo: boolean;
  isLive: boolean;
}

const DataModeContext = createContext<DataModeContextType>({
  mode: 'live',
  toggleMode: () => {},
  isDemo: false,
  isLive: true,
});

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>('live');

  // 모드는 세션 간 유지 — 페이지 이동/새로고침 시 데모 선택이 초기화되지 않도록
  useEffect(() => {
    const saved = window.localStorage.getItem('dataMode');
    if (saved === 'demo' || saved === 'live') setMode(saved);
  }, []);

  const persist = (m: DataMode) => {
    try { window.localStorage.setItem('dataMode', m); } catch { /* private mode 등 */ }
  };

  return (
    <DataModeContext.Provider value={{
      mode,
      toggleMode: () => setMode(m => {
        const next = m === 'live' ? 'demo' : 'live';
        persist(next);
        return next;
      }),
      isDemo: mode === 'demo',
      isLive: mode === 'live',
    }}>
      {children}
    </DataModeContext.Provider>
  );
}

export function useDataMode() {
  return useContext(DataModeContext);
}
