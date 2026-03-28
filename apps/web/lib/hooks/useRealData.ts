'use client';
import { useDataMode } from '@/lib/context/DataModeContext';
import { useState, useEffect } from 'react';

export function useRealData<T>(apiUrl: string, fallbackData: T): {
  data: T;
  loading: boolean;
  isReal: boolean;
} {
  const { isLive } = useDataMode();
  const [realData, setRealData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLive) {
      setRealData(null);
      return;
    }
    setLoading(true);
    fetch(apiUrl)
      .then(r => r.json())
      .then(d => { setRealData(d); setLoading(false); })
      .catch(() => { setRealData(null); setLoading(false); });
  }, [isLive, apiUrl]);

  return {
    data: isLive && realData ? realData : fallbackData,
    loading: isLive && loading,
    isReal: isLive && realData !== null,
  };
}
