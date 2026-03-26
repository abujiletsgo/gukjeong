"""법안 API 라우터"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.bill import Bill

router = APIRouter()


@router.get("/bills")
async def list_bills(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    committee: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """법안 목록 조회"""
    query = select(Bill).order_by(Bill.proposed_date.desc())
    if status:
        query = query.where(Bill.status == status)
    if committee:
        query = query.where(Bill.committee == committee)
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    bills = result.scalars().all()
    return {"data": [{
        "id": str(b.id),
        "bill_no": b.bill_no,
        "title": b.title,
        "proposed_date": str(b.proposed_date) if b.proposed_date else None,
        "status": b.status,
        "ai_summary": b.ai_summary,
        "ai_category": b.ai_category,
    } for b in bills]}


@router.get("/bills/{bill_id}")
async def get_bill(bill_id: str, db: AsyncSession = Depends(get_db)):
    """법안 상세 정보"""
    result = await db.execute(select(Bill).where(Bill.id == bill_id))
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="법안을 찾을 수 없습니다")
    return {"data": {
        "id": str(bill.id),
        "bill_no": bill.bill_no,
        "title": bill.title,
        "proposed_date": str(bill.proposed_date) if bill.proposed_date else None,
        "proposer_type": bill.proposer_type,
        "proposer_name": bill.proposer_name,
        "committee": bill.committee,
        "status": bill.status,
        "vote_result": bill.vote_result,
        "ai_summary": bill.ai_summary,
        "ai_citizen_impact": bill.ai_citizen_impact,
        "ai_category": bill.ai_category,
        "ai_controversy_score": bill.ai_controversy_score,
    }}
