'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

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

  return (
    <DataModeContext.Provider value={{
      mode,
      toggleMode: () => setMode(m => m === 'live' ? 'demo' : 'live'),
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
