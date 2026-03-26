"""대통령 API 라우터"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.president import President, Policy, KeyEvent

router = APIRouter()


@router.get("/presidents")
async def list_presidents(db: AsyncSession = Depends(get_db)):
    """역대 대통령 목록 조회"""
    result = await db.execute(
        select(President).order_by(President.term_start)
    )
    presidents = result.scalars().all()
    return {"data": [
        {
            "id": p.id,
            "name": p.name,
            "name_en": p.name_en,
            "term_start": str(p.term_start),
            "term_end": str(p.term_end) if p.term_end else None,
            "party": p.party,
            "era": p.era,
            "gdp_growth_avg": float(p.gdp_growth_avg) if p.gdp_growth_avg else None,
        }
        for p in presidents
    ]}


@router.get("/presidents/{president_id}")
async def get_president(president_id: str, db: AsyncSession = Depends(get_db)):
    """대통령 상세 정보 (정책, 주요 사건 포함)"""
    result = await db.execute(
        select(President).where(President.id == president_id)
    )
    president = result.scalar_one_or_none()
    if not president:
        raise HTTPException(status_code=404, detail="대통령 정보를 찾을 수 없습니다")

    # 정책 조회
    policies_result = await db.execute(
        select(Policy).where(Policy.president_id == president_id)
    )
    policies = policies_result.scalars().all()

    # 주요 사건 조회
    events_result = await db.execute(
        select(KeyEvent).where(KeyEvent.president_id == president_id).order_by(KeyEvent.event_date)
    )
    events = events_result.scalars().all()

    return {
        "data": {
            "id": president.id,
            "name": president.name,
            "name_en": president.name_en,
            "term_start": str(president.term_start),
            "term_end": str(president.term_end) if president.term_end else None,
            "party": president.party,
            "era": president.era,
            "gdp_growth_avg": float(president.gdp_growth_avg) if president.gdp_growth_avg else None,
            "portrait_url": president.portrait_url,
            "policies": [{
                "id": str(p.id),
                "title": p.title,
                "category": p.category,
                "status": p.status,
                "impact_score": p.impact_score,
                "ai_summary": p.ai_summary,
            } for p in policies],
            "key_events": [{
                "id": str(e.id),
                "event_date": str(e.event_date),
                "title": e.title,
                "impact_type": e.impact_type,
            } for e in events],
        }
    }
