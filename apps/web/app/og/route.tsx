// OG 이미지 동적 생성 — @vercel/og ImageResponse
import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || '국정투명';
  const description = searchParams.get('desc') || '수치로 보는 대한민국 정부';
  const type = searchParams.get('type') || 'default';
  // 감사 finding 카드용: 의심 점수 + 패턴 라벨 (score가 있으면 점수형 레이아웃)
  const score = Number(searchParams.get('score') || 0);
  const pattern = searchParams.get('pattern') || '';
  const scoreColor = score >= 60 ? '#FF453A' : score >= 35 ? '#FF9F0A' : '#32D74B';

  if (score > 0) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            fontFamily: 'sans-serif', padding: 60,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'absolute', top: 40, left: 60 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff' }}>국정투명</div>
            <div style={{ fontSize: 16, color: '#94a3b8' }}>AI 감사</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 120, fontWeight: 800, color: scoreColor, lineHeight: 1, display: 'flex' }}>{String(score)}</div>
              <div style={{ fontSize: 20, color: '#94a3b8', display: 'flex' }}>{'의심 점수 /100'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1 }}>
              {pattern ? (
                <div style={{ display: 'flex' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor, backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 18px', borderRadius: 999, display: 'flex' }}>
                    {pattern}
                  </div>
                </div>
              ) : null}
              <div style={{ fontSize: 52, fontWeight: 800, color: '#ffffff', lineHeight: 1.15, maxWidth: 760, display: 'flex' }}>{title}</div>
              <div style={{ fontSize: 24, color: '#cbd5e1', lineHeight: 1.4, maxWidth: 760, display: 'flex' }}>{description}</div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 32, left: 60, fontSize: 16, color: '#64748b', display: 'flex' }}>
            {'나라장터 공개 데이터 AI 분석 · 의심 패턴은 위법 확정이 아닙니다 · gukjeong.kr'}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: scoreColor }} />
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

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
