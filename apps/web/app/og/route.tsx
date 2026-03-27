// OG 이미지 동적 생성 — @vercel/og ImageResponse
import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || '국정투명';
  const description = searchParams.get('desc') || '수치로 보는 대한민국 정부';
  const type = searchParams.get('type') || 'default';

  // 타입별 아이콘
  const icons: Record<string, string> = {
    president: '🏛️',
    budget: '💰',
    bill: '📜',
    audit: '🔍',
    news: '📰',
    legislator: '👥',
    default: '🇰🇷',
  };

  const icon = icons[type] || icons.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단 로고 */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            국정투명
          </div>
          <div
            style={{
              fontSize: 14,
              color: '#94a3b8',
            }}
          >
            수치로 보는 대한민국 정부
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 64 }}>{icon}</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: 700,
            }}
          >
            {description}
          </div>
        </div>

        {/* 하단 액센트 라인 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #ff6b35, #f97316, #ff6b35)',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
