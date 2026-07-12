import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <div className="card max-w-lg mx-auto">
        <div className="text-4xl mb-4" aria-hidden="true">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-500 mb-6 text-sm">
          주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
          아래에서 원하시는 곳으로 이동해 보세요.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">홈으로</Link>
          <Link
            href="/search"
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            통합 검색
          </Link>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 text-sm">
          <p className="text-gray-400 mb-2 text-xs">자주 찾는 페이지</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/audit" className="text-blue-600 hover:underline">AI 감사</Link>
            <Link href="/legislators" className="text-blue-600 hover:underline">국회의원</Link>
            <Link href="/budget" className="text-blue-600 hover:underline">예산</Link>
            <Link href="/bills" className="text-blue-600 hover:underline">법안</Link>
            <Link href="/news" className="text-blue-600 hover:underline">뉴스</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
