"""뉴스 프레임 분석 서비스"""
from typing import Optional
from app.services.claude_service import analyze_news_frames


async def analyze_event_frames(articles: list[dict]) -> dict:
    """뉴스 이벤트의 진보/보수 프레임 분석"""
    if len(articles) < 5:
        return {"key_facts": [], "progressive_frame": {}, "conservative_frame": {}, "citizen_takeaway": ""}

    # 진보/보수 기사 분류 (spectrum_score 기준)
    progressive = [a for a in articles if a.get("spectrum_score", 3.0) < 2.5]
    conservative = [a for a in articles if a.get("spectrum_score", 3.0) > 3.5]

    if not progressive or not conservative:
        return {"key_facts": [], "progressive_frame": {}, "conservative_frame": {}, "citizen_takeaway": ""}

    return await analyze_news_frames(articles)
