import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '카카오 로그인',
  description: '카카오 계정으로 국정투명에 로그인합니다.',
  robots: { index: false, follow: false },
};

import Link from 'next/link';

export default function KakaoCallbackPage() {
  return (
    <div className="container-page py-16 text-center">
      <div className="card max-w-md mx-auto">
        <p className="text-gray-900 font-semibold mb-2">로그인 기능 준비 중입니다</p>
        <p className="text-gray-500 text-sm mb-6">
          현재 국정투명의 모든 기능은 로그인 없이 무료로 이용하실 수 있습니다.
        </p>
        <Link href="/" className="btn-primary">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
