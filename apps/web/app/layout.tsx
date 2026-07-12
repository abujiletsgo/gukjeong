import type { Metadata } from 'next';
import Link from 'next/link';
import '@/styles/globals.css';
import { DataModeProvider } from '@/lib/context/DataModeContext';
import DataModeToggle from '@/components/common/DataModeToggle';
import DataModeBanner from '@/components/common/DataModeBanner';
import SiteNav from '@/components/common/SiteNav';
import MobileTabBar from '@/components/common/MobileTabBar';
import { NavTracker } from '@/components/common/BackLink';

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
  alternates: { canonical: '/', languages: { 'ko-KR': '/' } },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gukjeong.kr',
    siteName: '국정투명',
    title: '국정투명 — 수치로 보는 대한민국 정부',
    description: '대한민국 정부의 예산, 정책, 입법 활동을 공공데이터와 AI 분석으로 투명하게 보여주는 시민 플랫폼',
    images: [{ url: '/og/default.png', width: 1200, height: 630, alt: '국정투명' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '국정투명 — 수치로 보는 대한민국 정부',
    description: '공공데이터 기반 정부 투명성 플랫폼',
    images: ['/og/default.png'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: { other: { 'naver-site-verification': ['placeholder-naver-verification-code'] } },
  other: { 'format-detection': 'telephone=no' },
};

const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '국정투명',
  url: 'https://gukjeong.kr',
  description: '대한민국 정부 투명성 플랫폼',
  applicationCategory: 'GovernmentApplication',
  operatingSystem: 'Web',
  inLanguage: 'ko',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  creator: { '@type': 'Organization', name: '국정투명', url: 'https://gukjeong.kr' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
      </head>
      <body>
        <DataModeProvider>
          <NavTracker />
          {/* ── Apple Liquid Glass Header ── */}
          <header
            className="sticky top-0 z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              borderBottom: '0.5px solid rgba(60, 60, 67, 0.12)',
            }}
          >
            <div className="container-page flex items-center justify-between h-14">
              {/* Logo */}
              <Link
                href="/"
                className="text-lg font-bold tracking-tight text-gray-900 hover:opacity-70 transition-opacity"
                style={{ letterSpacing: '-0.5px' }}
              >
                국정투명
              </Link>

              {/* Desktop Nav */}
              <SiteNav />

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <DataModeToggle />
                <Link
                  href="/search"
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-black/5 transition-colors"
                  aria-label="검색"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </Link>
              </div>
            </div>
          </header>

          {/* Data Mode Banner */}
          <DataModeBanner />

          {/* Main */}
          <main className="min-h-screen pb-20 md:pb-0">
            {children}
          </main>

          {/* ── Apple Bottom Tab Bar (mobile) ── */}
          <MobileTabBar />

          {/* ── Footer ── */}
          <footer
            className="py-12 pb-28 md:pb-12"
            style={{
              background: '#F2F2F7',
              borderTop: '0.5px solid rgba(60, 60, 67, 0.12)',
            }}
          >
            <div className="container-page">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="col-span-2 md:col-span-1">
                  <h3 className="font-bold text-gray-900 mb-3" style={{ fontSize: 15, letterSpacing: '-0.2px' }}>국정투명</h3>
                  <p className="text-gray-500" style={{ fontSize: 13 }}>수치로 보는 대한민국 정부</p>
                  <p className="text-gray-400 mt-2" style={{ fontSize: 12 }}>모든 데이터는 공공데이터포털 및 정부 공개 자료 기반</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>데이터</h4>
                  <ul className="space-y-2">
                    {[['대통령 비교', '/presidents'], ['예산 시각화', '/budget'], ['법안 추적', '/bills'], ['국회의원 활동', '/legislators'], ['의원 랭킹', '/legislators/ranking'], ['지역 재정', '/local']].map(([label, href]) => (
                      <li key={href}><Link href={href} className="text-gray-500 hover:text-blue-500 transition-colors" style={{ fontSize: 14 }}>{label}</Link></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>분석</h4>
                  <ul className="space-y-2">
                    {[['AI 감사관', '/audit'], ['화제의 감사', '/popular'], ['뉴스 프레임', '/news'], ['실시간 뉴스 분석', '/news/live'], ['국제 비교', '/compare'], ['예산 시뮬레이터', '/simulator']].map(([label, href]) => (
                      <li key={href}><Link href={href} className="text-gray-500 hover:text-blue-500 transition-colors" style={{ fontSize: 14 }}>{label}</Link></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>정보</h4>
                  <ul className="space-y-2">
                    {[['통합 검색', '/search'], ['소개', '/about'], ['요금제', '/pricing']].map(([label, href]) => (
                      <li key={href}><Link href={href} className="text-gray-500 hover:text-blue-500 transition-colors" style={{ fontSize: 14 }}>{label}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div
                className="mt-8 pt-6 text-center text-gray-400"
                style={{ borderTop: '0.5px solid rgba(60,60,67,0.12)', fontSize: 12 }}
              >
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
