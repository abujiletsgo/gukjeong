'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page py-16 text-center">
      <div className="card max-w-lg mx-auto">
        <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-gray-500 mb-6 text-sm">
          페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">오류 코드: {error.digest}</p>
        )}
        <button onClick={reset} className="btn-primary">
          다시 시도
        </button>
      </div>
    </div>
  );
}
