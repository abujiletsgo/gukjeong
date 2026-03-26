"""국회의원 API 라우터"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.legislator import Legislator, ConsistencyAnalysis

router = APIRouter()


@router.get("/legislators")
async def list_legislators(
    party: str = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """국회의원 목록"""
    query = select(Legislator)
    if party:
        query = query.where(Legislator.party == party)
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    legislators = result.scalars().all()
    return {"data": [{
        "id": str(l.id),
        "name": l.name,
        "party": l.party,
        "district": l.district,
        "attendance_rate": float(l.attendance_rate) if l.attendance_rate else None,
        "ai_activity_score": l.ai_activity_score,
        "consistency_score": float(l.consistency_score) if l.consistency_score else None,
    } for l in legislators]}


@router.get("/legislators/ranking")
async def legislator_ranking(
    sort_by: str = Query("ai_activity_score"),
    db: AsyncSession = Depends(get_db),
):
    """국회의원 랭킹 (Pro 티어)"""
    column = getattr(Legislator, sort_by, Legislator.ai_activity_score)
    result = await db.execute(select(Legislator).order_by(column.desc()).limit(50))
    return {"data": [{
        "id": str(l.id),
        "name": l.name,
        "party": l.party,
        "score": getattr(l, sort_by, None),
    } for l in result.scalars().all()]}


@router.get("/legislators/{legislator_id}")
async def get_legislator(legislator_id: str, db: AsyncSession = Depends(get_db)):
    """국회의원 상세 성적표"""
    result = await db.execute(select(Legislator).where(Legislator.id == legislator_id))
    leg = result.scalar_one_or_none()
    if not leg:
        raise HTTPException(status_code=404, detail="국회의원 정보를 찾을 수 없습니다")
    return {"data": {
        "id": str(leg.id),
        "name": leg.name,
        "party": leg.party,
        "district": leg.district,
        "bills_proposed_count": leg.bills_proposed_count,
        "attendance_rate": float(leg.attendance_rate) if leg.attendance_rate else None,
        "vote_participation_rate": float(leg.vote_participation_rate) if leg.vote_participation_rate else None,
        "pledge_fulfillment_rate": float(leg.pledge_fulfillment_rate) if leg.pledge_fulfillment_rate else None,
        "ai_activity_score": leg.ai_activity_score,
        "consistency_score": float(leg.consistency_score) if leg.consistency_score else None,
    }}


@router.get("/legislators/{legislator_id}/consistency")
async def get_consistency(legislator_id: str, db: AsyncSession = Depends(get_db)):
    """말과 행동 일치도 (Pro 티어)"""
    result = await db.execute(
        select(ConsistencyAnalysis)
        .where(ConsistencyAnalysis.legislator_id == legislator_id)
        .order_by(ConsistencyAnalysis.vote_date.desc())
    )
    analyses = result.scalars().all()
    return {"data": [{
        "issue": a.issue,
        "stated_position": a.stated_position,
        "actual_vote": a.actual_vote,
        "is_consistent": a.is_consistent,
        "ai_analysis": a.ai_analysis,
    } for a in analyses]}
