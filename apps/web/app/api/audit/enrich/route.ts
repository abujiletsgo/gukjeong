/**
 * POST /api/audit/enrich
 *
 * On-demand Claude AI analysis for a single audit finding.
 * Returns a streaming text response so the UI can show progressive rendering.
 *
 * Body: { finding: AuditFlag }
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AuditFlag } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATTERN_LABELS_KR: Record<string, string> = {
  ghost_company: '유령회사 의심',
  zero_competition: '경쟁 부재',
  bid_rate_anomaly: '낙찰률 이상',
  new_company_big_win: '신설업체 대형 수주',
  vendor_concentration: '업체 집중',
  repeated_sole_source: '반복 수의계약',
  contract_splitting: '계약 분할',
  low_bid_competition: '과소 경쟁',
  yearend_new_vendor: '연말 신규업체 수의계약',
  related_companies: '동일 대표/주소 업체',
  high_value_sole_source: '고액 수의계약',
  same_winner_repeat: '동일업체 반복 수주',
  amount_spike: '계약액 급증',
  bid_rigging: '담합',
  contract_inflation: '계약 금액 부풀리기',
  cross_pattern: '복합 패턴',
  systemic_risk: '체계적 비리 위험',
  sanctioned_vendor: '제재 업체 재수주',
  price_clustering: '가격 담합',
  network_collusion: '네트워크 담합',
  vendor_rotation: '업체 순번제',
  ai_anomaly: 'AI 이상탐지',
};

function buildContext(flag: AuditFlag): string {
  const patternKr = PATTERN_LABELS_KR[flag.pattern_type] ?? flag.pattern_type;
  const evidence = (flag.evidence_contracts ?? []).slice(0, 5);
  const evLines = evidence.map(e =>
    `  - ${String(e.name ?? '').slice(0, 50)} | ${Math.round((e.amount ?? 0) / 10000).toLocaleString()}만원 | ${e.vendor ?? ''} | ${String(e.date ?? '').slice(0, 10)}`
  ).join('\n');
  const detail = flag.detail ?? {};
  const detailLines = Object.entries(detail).slice(0, 8).map(([k, v]) => `  ${k}: ${v}`).join('\n');

  return `패턴: ${patternKr}
기관: ${flag.target_institution ?? ''}
의심 점수: ${flag.suspicion_score ?? 0}/100
요약: ${String(flag.summary ?? '').slice(0, 300)}

상세 지표:
${detailLines}

증거 계약:
${evLines}`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let flag: AuditFlag;
  try {
    const body = await req.json();
    flag = body.finding;
    if (!flag?.id) throw new Error('finding.id missing');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey });
  const context = buildContext(flag);

  const prompt = `당신은 한국 정부 조달 전문 감사관입니다. 아래 감사 발견에 대해 시민 눈높이에서 분석하세요.

${context}

다음 JSON 형식으로만 응답하세요:
{
  "ai_headline": "기자가 쓸 수 있는 강렬하고 구체적인 한 줄 헤드라인 (40자 이내, 기관명+핵심 의혹 포함)",
  "ai_narrative": "시민 눈높이에서 쓴 2-3단락 조사 브리핑. 무슨 일이 일어났는지, 왜 의심스러운지, 실제 세금 낭비 가능성을 구체적으로 설명. 총 250자 이내.",
  "ai_questions": ["감사관이나 기자가 물어야 할 구체적 질문 1", "질문 2", "질문 3"],
  "ai_risk_assessment": "LOW|MEDIUM|HIGH|CRITICAL 중 하나와 한 줄 이유",
  "ai_comparable": "유사한 실제 한국 조달 비리 사례 참조 (있으면). 없으면 null."
}`;

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Finding-Id': flag.id,
      },
    });
  } catch (err) {
    console.error('[audit/enrich] Claude API error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
