"""Claude AI API 래퍼 서비스"""
import json
from typing import Optional
from anthropic import AsyncAnthropic
from app.config import get_settings


settings = get_settings()
client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None


async def analyze_bill(title: str, content: str) -> dict:
    """법안 AI 분석 — 요약, 시민 영향, 카테고리, 논란 점수"""
    if not client:
        return {"summary": "", "citizen_impact": "", "category": "", "controversy_score": 0}

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""다음 법안을 분석해 주세요. JSON으로 응답하세요.

법안명: {title}
내용: {content[:3000]}

응답 형식:
{{
  "summary": "일반 시민이 이해할 수 있는 2-3문장 요약",
  "citizen_impact": "이 법안이 일반 시민에게 미치는 영향",
  "category": "경제|사회|교육|국방|환경|행정|외교 중 하나",
  "controversy_score": 0-100
}}"""
        }],
    )
    try:
        return json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError):
        return {"summary": response.content[0].text, "citizen_impact": "", "category": "", "controversy_score": 0}


async def analyze_audit_flag(contract_data: dict, pattern_type: str) -> str:
    """감사 플래그 AI 분석"""
    if not client:
        return "AI 분석 준비 중"

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": f"""다음 정부 계약에서 '{pattern_type}' 패턴이 감지되었습니다.
계약 정보: {json.dumps(contract_data, ensure_ascii=False)}

이 패턴이 왜 의심스러운지 일반 시민이 이해할 수 있게 2-3문장으로 설명해 주세요.
주의: '의심 패턴'이라고만 표현하고, '비리'나 '부정'이라고 단정하지 마세요."""
        }],
    )
    return response.content[0].text


async def analyze_news_frames(articles: list[dict]) -> dict:
    """뉴스 프레임 비교 분석"""
    if not client:
        return {"key_facts": [], "progressive_frame": {}, "conservative_frame": {}, "citizen_takeaway": ""}

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""다음 뉴스 기사들은 같은 사건에 대한 서로 다른 미디어의 보도입니다.
기사 목록: {json.dumps(articles[:10], ensure_ascii=False)}

JSON으로 응답:
{{
  "key_facts": ["객관적 사실 1", "객관적 사실 2"],
  "progressive_frame": {{"emphasis": "진보 측 강조점", "framing": "프레이밍 방식"}},
  "conservative_frame": {{"emphasis": "보수 측 강조점", "framing": "프레이밍 방식"}},
  "citizen_takeaway": "시민이 알아야 할 핵심 (중립적 관점)"
}}"""
        }],
    )
    try:
        return json.loads(response.content[0].text)
    except json.JSONDecodeError:
        return {"key_facts": [], "progressive_frame": {}, "conservative_frame": {}, "citizen_takeaway": response.content[0].text}
