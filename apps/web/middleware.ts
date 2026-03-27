import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보안 헤더 설정
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://developers.kakao.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "font-src 'self' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://*.go.kr",
    "connect-src 'self' http://localhost:8000 https://gukjeong.kr https://*.go.kr",
    "frame-ancestors 'none'",
  ].join('; '),
};

// 간단한 인메모리 rate limiter (프로덕션에서는 Redis 사용)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1분
const RATE_LIMIT_MAX = 60; // 분당 60 요청

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export function middleware(request: NextRequest) {
  // Rate limiting (API 라우트만)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (isRateLimited(ip)) {
      return new NextResponse('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  }

  // 보안 헤더 추가
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 파일, _next, favicon 제외
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
