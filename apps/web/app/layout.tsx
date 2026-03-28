import type { Metadata } from 'next';
import '@/styles/globals.css';
import { DataModeProvider } from '@/lib/context/DataModeContext';
import DataModeToggle from '@/components/common/DataModeToggle';
import DataModeBanner from '@/components/common/DataModeBanner';

// Pretendard 폰트 최적화
// 프로덕션에서는 next/font/local 사용 권장:
//   1. public/fonts/PretendardVariable.woff2 다운로드
//      https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/woff2/PretendardVariable.woff2
//   2. layout.tsx에서 localFont({ src: '../public/fonts/PretendardVariable.woff2', ... }) 사용
// 현재: preconnect + CDN 폴백 사용 (폰트 파일 설치 전까지)

export const metadata: Metadata = {
  title: {
    default: '국정투명 — 수치로 보는 대한민국 정부',
    template: '%s | 국정투명',
  },
  description: '대한민국 정부의 예산, 정책, 입법 활동을 공공데이터와 AI 분석으로 투명하게 보여주는 시민 플랫폼',
  keywords: ['국정투명', '정부예산', '국가채무', '국회의원', 'AI감사', '대통령비교', '예산시각화', '정치투명성'],
  authors: [{ name: '국정투명' }],
  creator: '국정투명 (GukjeongTumyeong)',
  publisher: '국정투명',
  metadataBase: new URL('https://gukjeong.kr'),
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gukjeong.kr',
    siteName: '국정투명',
    title: '국정투명 — 수치로 보는 대한민국 정부',
    description: '대한민국 정부의 예산, 정책, 입법 활동을 공공데이터와 AI 분석으로 투명하게 보여주는 시민 플랫폼',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: '국정투명',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '국정투명 — 수치로 보는 대한민국 정부',
    description: '공공데이터 기반 정부 투명성 플랫폼',
    images: ['/og/default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'naver-site-verification': ['placeholder-naver-verification-code'],
    },
  },
  other: {
    'format-detection': 'telephone=no',
  },
};

// JSON-LD 구조화 데이터 — WebApplication
const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '국정투명',
  alternateName: 'GukjeongTumyeong',
  url: 'https://gukjeong.kr',
  description: '대한민국 정부의 예산, 정책, 입법 활동을 공공데이터와 AI 분석으로 투명하게 보여주는 시민 플랫폼',
  applicationCategory: 'GovernmentApplication',
  operatingSystem: 'Web',
  inLanguage: 'ko',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    description: '기본 기능 무료 제공',
  },
  creator: {
    '@type': 'Organization',
    name: '국정투명',
    url: 'https://gukjeong.kr',
  },
};

// JSON-LD — GovernmentOrganization (Schema.org)
const jsonLdGovOrg = {
  '@context': 'https://schema.org',
  '@type': 'GovernmentOrganization',
  name: '국정투명',
  alternateName: 'GukjeongTumyeong',
  url: 'https://gukjeong.kr',
  description: '공공데이터와 AI 분석 기반 대한민국 정부 투명성 플랫폼',
  areaServed: {
    '@type': 'Country',
    name: '대한민국',
    sameAs: 'https://en.wikipedia.org/wiki/South_Korea',
  },
  inLanguage: 'ko',
  sameAs: [
    'https://gukjeong.kr',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 폰트 — CDN 폴백 (next/font/local 마이그레이션 시 제거) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGovOrg) }}
        />
      </head>
      <body>
        <DataModeProvider>
        {/* 헤더 */}
        <header className="bg-header text-white sticky top-0 z-50">
          <div className="container-page flex items-center justify-between h-16">
            <a href="/" className="text-xl font-bold tracking-tight">
              국정투명
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="주요 메뉴">
              <a href="/presidents" className="hover:text-accent transition-colors">대통령</a>
              <a href="/budget" className="hover:text-accent transition-colors">예산</a>
              <a href="/bills" className="hover:text-accent transition-colors">법안</a>
              <a href="/legislators" className="hover:text-accent transition-colors">국회의원</a>
              <a href="/audit" className="hover:text-accent transition-colors">AI 감사</a>
              <a href="/news" className="hover:text-accent transition-colors">뉴스</a>
            </nav>
            <div className="flex items-center gap-3">
              <DataModeToggle />
              <a href="/search" className="text-gray-300 hover:text-white flex items-center gap-1.5 text-sm" aria-label="검색">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span className="hidden sm:inline">검색</span>
              </a>
            </div>
          </div>
          {/* 모바일 하단 네비게이션 */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-header border-t border-gray-700 z-50" aria-label="모바일 메뉴">
            <div className="flex justify-around py-2.5">
              <a href="/" className="flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l9-8 9 8"/><path d="M5 10v10h4v-6h6v6h4V10"/></svg>
                <span>홈</span>
              </a>
              <a href="/presidents" className="flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/></svg>
                <span>대통령</span>
              </a>
              <a href="/budget" className="flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                <span>예산</span>
              </a>
              <a href="/legislators" className="flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                <span>국회의원</span>
              </a>
              <a href="/audit" className="flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span>감사</span>
              </a>
              <a href="/news" className="flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                <span>뉴스</span>
              </a>
            </div>
          </nav>
        </header>

        {/* 데이터 모드 배너 */}
        <DataModeBanner />

        {/* 메인 콘텐츠 */}
        <main className="min-h-screen pb-20 md:pb-0">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="bg-gray-50 border-t border-gray-200 py-12 hidden md:block">
          <div className="container-page">
            <div className="grid grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">국정투명</h3>
                <p className="text-sm text-gray-500">수치로 보는 대한민국 정부</p>
                <p className="text-xs text-gray-400 mt-2">모든 데이터는 공공데이터포털 및 정부 공개 자료를 기반으로 합니다.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">데이터</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/presidents" className="hover:text-gray-700">대통령 비교</a></li>
                  <li><a href="/budget" className="hover:text-gray-700">예산 시각화</a></li>
                  <li><a href="/bills" className="hover:text-gray-700">법안 추적</a></li>
                  <li><a href="/legislators" className="hover:text-gray-700">국회의원 활동 분류</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">분석</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/audit" className="hover:text-gray-700">AI 감사관</a></li>
                  <li><a href="/news" className="hover:text-gray-700">뉴스 프레임</a></li>
                  <li><a href="/compare" className="hover:text-gray-700">국제 비교</a></li>
                  <li><a href="/simulator" className="hover:text-gray-700">예산 시뮬레이터</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">정보</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/about" className="hover:text-gray-700">소개</a></li>
                  <li><a href="/pricing" className="hover:text-gray-700">요금제</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
              <p>미디어 분류는 학술 연구 기반 참고 분류이며, 감사 분석은 AI 기반 의심 패턴 탐지 결과입니다.</p>
              <p className="mt-1">&copy; 2026 국정투명. All rights reserved.</p>
            </div>
          </div>
        </footer>
        </DataModeProvider>
      </body>
    </html>
  );
}
