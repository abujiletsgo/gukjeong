'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// 앱 안에서 일어난 클라이언트 내비게이션 횟수 (모듈 스코프 — 레이아웃이 유지되는 동안 보존)
let inAppNavCount = 0;

/**
 * 레이아웃에 마운트해 앱 내 라우트 전환을 추적한다.
 * referrer는 SPA 이동에서 비어 있으므로, "뒤로가기가 앱 안에 머무는지"는
 * 실제 앱 내 내비게이션 발생 여부로만 확실히 판별할 수 있다.
 */
export function NavTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    inAppNavCount += 1;
  }, [pathname]);
  return null;
}

/**
 * 원위치 복귀 백링크.
 * 이 세션에서 앱 내 이동이 있었을 때만 router.back() (필터/스크롤 상태 보존),
 * 딥링크 직접 진입·외부 유입 첫 화면에서는 fallback으로 이동한다.
 */
export default function BackLink({
  fallback,
  label,
  className,
}: {
  fallback: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={fallback}
      className={className ?? 'inline-flex items-center gap-1 text-sm text-blue-600 hover:underline'}
      onClick={(e) => {
        if (inAppNavCount > 0) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      ← {label}
    </Link>
  );
}
