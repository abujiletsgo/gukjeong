"""국정투명 — 의존성 모듈 (인증, 레이트 리밋)"""
from typing import Optional
from fastapi import Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.config import TIER_LIMITS, get_settings
import hashlib
import logging
import time

logger = logging.getLogger(__name__)


settings = get_settings()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[dict]:
    """현재 사용자 정보 추출 (없으면 anonymous)"""
    if not authorization:
        return None
    # TODO: JWT 토큰 검증 구현
    # token = authorization.replace("Bearer ", "")
    # user = await verify_token(token, db)
    return None


async def require_auth(
    user: Optional[dict] = Depends(get_current_user),
) -> dict:
    """인증 필수 엔드포인트"""
    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    return user


async def require_tier(
    min_tier: str,
    user: dict = Depends(require_auth),
) -> dict:
    """최소 티어 확인"""
    tier_order = ["free", "citizen_pro", "institution"]
    user_tier = user.get("tier", "free")
    if tier_order.index(user_tier) < tier_order.index(min_tier):
        raise HTTPException(
            status_code=403,
            detail=f"{min_tier} 이상 티어가 필요합니다"
        )
    return user


def get_tier_limits(tier: str = "anonymous") -> dict:
    """티어별 제한 조회"""
    return TIER_LIMITS.get(tier, TIER_LIMITS["anonymous"])


class RateLimiter:
    """Redis 기반 레이트 리미터"""

    def __init__(self, key_prefix: str, limit: int, window: int = 86400):
        self.key_prefix = key_prefix
        self.limit = limit
        self.window = window

    async def check(self, identifier: str) -> bool:
        """제한 확인 (True = 허용, False = 초과)"""
        # WARNING: Redis 미연동 — 레이트 리밋 미적용 상태
        # 프로덕션 배포 전 반드시 Redis 연동 필요
        logger.warning("RateLimiter: Redis 미연동 — 모든 요청 허용 중 (프로덕션 위험)")
        return True

    async def __call__(self, request: Request) -> bool:
        client_ip = request.client.host if request.client else "unknown"
        return await self.check(client_ip)


# 검색 레이트 리미터
search_rate_limiter = RateLimiter("search", limit=15, window=86400)
