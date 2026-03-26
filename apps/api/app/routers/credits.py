"""크레딧 API 라우터"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

router = APIRouter()


@router.get("/credits/balance")
async def get_balance(db: AsyncSession = Depends(get_db)):
    """크레딧 잔액 조회 (인증 필요)"""
    # TODO: 사용자별 크레딧 잔액 조회
    return {"data": {"balance": 0, "history": []}}


@router.post("/credits/redeem")
async def redeem_credits(db: AsyncSession = Depends(get_db)):
    """크레딧 사용 (500 크레딧 = 1개월 Pro)"""
    # TODO: 크레딧 차감 및 Pro 전환
    return {"status": "크레딧 사용 기능 준비 중"}
