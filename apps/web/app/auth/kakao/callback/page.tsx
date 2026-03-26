import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '카카오 로그인',
  description: '카카오 계정으로 국정투명에 로그인합니다.',
  robots: { index: false, follow: false },
};

export default function KakaoCallbackPage() {
  return (
    <div className="container-page py-16 text-center">
      <p className="text-gray-500">카카오 로그인 처리 중...</p>
    </div>
  );
}
