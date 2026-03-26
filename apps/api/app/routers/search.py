"""검색 API 라우터"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

router = APIRouter()


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    year: int = Query(None),
    sector: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """통합 검색 (레이트 리밋 적용)"""
    # TODO: Meilisearch 연동
    return {
        "data": [],
        "total": 0,
        "page": page,
        "query": q,
        "message": "검색 기능 준비 중",
    }
