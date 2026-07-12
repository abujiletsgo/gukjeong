'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * URL-persisted state for client components.
 * - 초기값은 현재 URL의 쿼리 파라미터에서 복원 (새로고침/뒤로가기/공유 링크 유지)
 * - 변경 시 history.replaceState로 URL에 반영 (히스토리 오염 없음)
 * - useSearchParams를 쓰지 않아 Suspense 경계가 필요 없음 (SSG 페이지 안전)
 *
 * const [q, setQ] = useUrlState('q', '');
 * defaultValue와 같은 값이면 파라미터를 URL에서 제거한다.
 */
export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (v: string) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get(key);
    if (fromUrl !== null && fromUrl !== defaultValue) setValue(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback(
    (v: string) => {
      setValue(v);
      const params = new URLSearchParams(window.location.search);
      if (v === defaultValue || v === '') params.delete(key);
      else params.set(key, v);
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(window.history.state, '', url);
    },
    [key, defaultValue],
  );

  return [value, set];
}
