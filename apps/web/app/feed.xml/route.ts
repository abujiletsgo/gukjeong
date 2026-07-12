// RSS 피드 — 로그인 없는 리텐션 채널 (TheyWorkForYou 이메일 알림의 무백엔드 버전).
// 최신 감사 finding 50건. 빌드 시 정적 생성(fs) — 데이터 갱신 배포마다 새로워진다.
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

const SITE = 'https://gukjeong.kr';

const PATTERN_LABELS: Record<string, string> = {
  ghost_company: '유령업체 의심', zero_competition: '경쟁 부재', bid_rate_anomaly: '예정가격 유출 의심',
  new_company_big_win: '신생업체 고액수주', vendor_concentration: '업체 집중', repeated_sole_source: '반복 수의계약',
  contract_splitting: '계약 분할 의심', high_value_sole_source: '고액 수의계약', bid_rigging: '입찰 담합',
  cross_pattern: '복합 패턴', systemic_risk: '체계적 비리 위험', sanctioned_vendor: '제재 업체 재수주',
  rapid_sole_source_burst: '단기 수의계약 연속', geographic_concentration: '원거리 집중 수주',
  threshold_avoidance: '한도 회피', short_bid_window: '초단기 공고', ceo_rotation: '대표 교체 반복',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  let items = '';
  let lastBuild = new Date().toUTCString();
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'audit-index.json');
    const idx = JSON.parse(fs.readFileSync(p, 'utf-8'));
    type Row = [string, string, string, number, number, string, string, string, string, number, string, string, string, string, number, number, string];
    const rows = (idx.findings as Row[])
      .filter(r => r[0] && r[11])
      .sort((a, b) => String(b[11]).localeCompare(String(a[11])))
      .slice(0, 50);
    if (idx.source_timestamp) lastBuild = new Date(idx.source_timestamp).toUTCString();

    items = rows.map(r => {
      const [id, pattern, , score, , , riskLabel, inst, , , , created, keyStat, summary] = r;
      const label = PATTERN_LABELS[pattern] || pattern;
      const title = `[${riskLabel} ${score}점] ${inst} — ${label}`;
      const descParts = [summary, keyStat && `핵심 지표: ${keyStat}`].filter(Boolean).join(' · ');
      const pub = created ? new Date(created).toUTCString() : lastBuild;
      return `    <item>
      <title>${esc(title)}</title>
      <link>${SITE}/audit/${esc(id)}</link>
      <guid isPermaLink="true">${SITE}/audit/${esc(id)}</guid>
      <description>${esc(descParts)}</description>
      <pubDate>${pub}</pubDate>
    </item>`;
    }).join('\n');
  } catch { /* 인덱스 없으면 빈 피드 */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>국정투명 — AI 감사 새 발견</title>
    <link>${SITE}/audit</link>
    <description>나라장터 공개 데이터에서 AI가 감지한 최신 의심 패턴. 의심 패턴 ≠ 위법 확정.</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
