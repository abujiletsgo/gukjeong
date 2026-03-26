"""인증 API 라우터"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

router = APIRouter()


@router.post("/auth/kakao")
async def kakao_callback(db: AsyncSession = Depends(get_db)):
    """카카오 OAuth 콜백"""
    # TODO: 카카오 OAuth 구현
    return {"status": "카카오 로그인 준비 중"}


@router.post("/auth/naver")
async def naver_callback(db: AsyncSession = Depends(get_db)):
    """네이버 OAuth 콜백"""
    # TODO: 네이버 OAuth 구현
    return {"status": "네이버 로그인 준비 중"}


@router.get("/auth/me")
async def get_me(db: AsyncSession = Depends(get_db)):
    """현재 사용자 정보"""
    # TODO: JWT 토큰에서 사용자 정보 추출
    return {"data": None, "message": "로그인이 필요합니다"}
