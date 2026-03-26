"""뉴스 API 라우터"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.news_event import NewsEvent

router = APIRouter()


@router.get("/news/today")
async def get_today_news(db: AsyncSession = Depends(get_db)):
    """오늘의 뉴스 프레임 비교"""
    result = await db.execute(
        select(NewsEvent)
        .order_by(NewsEvent.event_date.desc())
        .limit(10)
    )
    events = result.scalars().all()
    return {"data": [{
        "id": str(e.id),
        "title": e.title,
        "event_date": str(e.event_date) if e.event_date else None,
        "category": e.category,
        "ai_summary": e.ai_summary,
        "key_facts": e.key_facts,
        "progressive_frame": e.progressive_frame,
        "conservative_frame": e.conservative_frame,
        "citizen_takeaway": e.citizen_takeaway,
        "article_count": e.article_count,
    } for e in events]}
