"""인증 API 라우터

OAuth 흐름: 카카오/네이버 → one-way hash → UUID 전용
실명 저장 금지, auth_hash 기반 식별
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/auth/kakao")
async def kakao_callback(db: AsyncSession = Depends(get_db)):
    """카카오 OAuth 콜백 — auth_hash 생성 후 UUID만 저장"""
    # TODO: 카카오 OAuth 구현
    # 흐름: 카카오 ID → hashlib.sha256(kakao_id).hexdigest() → auth_hash
    # 실명/이메일 저장 금지 — nickname만 선택적 저장
    return {"status": "카카오 로그인 준비 중"}


@router.post("/auth/naver")
async def naver_callback(db: AsyncSession = Depends(get_db)):
    """네이버 OAuth 콜백 — auth_hash 생성 후 UUID만 저장"""
    # TODO: 네이버 OAuth 구현
    # 흐름: 네이버 ID → hashlib.sha256(naver_id).hexdigest() → auth_hash
    # 실명/이메일 저장 금지 — nickname만 선택적 저장
    return {"status": "네이버 로그인 준비 중"}


@router.get("/auth/me")
async def get_me(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """현재 사용자 정보 — 인증 토큰 기반 조회"""
    if user is None:
        return {"data": None, "message": "로그인이 필요합니다"}
    # 실명 노출 금지 — id, nickname, tier만 반환
    return {"data": {"id": user["id"], "nickname": user.get("nickname"), "tier": user.get("tier", "free")}}
