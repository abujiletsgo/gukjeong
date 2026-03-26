"""지방정부 API 라우터"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

router = APIRouter()


@router.get("/local/{region}")
async def get_local_government(
    region: str,
    db: AsyncSession = Depends(get_db),
):
    """지방정부 정보 조회"""
    # TODO: 지방정부 데이터 모델 및 조회 구현
    return {"data": {
        "region": region,
        "message": "지방정부 데이터 준비 중",
    }}
