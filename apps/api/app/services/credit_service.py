"""크레딧 서비스"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.credit import Credit

# 크레딧 보상 테이블
CREDIT_REWARDS = {
    "profile_level_1": 50,     # 연령/성별/지역
    "profile_level_2": 100,    # 직업/소득/학력
    "profile_level_3": 200,    # 관심사/정치 성향
    "basic_survey": 30,        # 기본 설문 (3-5 문항)
    "deliberative_survey": 80, # 숙의 설문
    "citizen_report": 200,     # 시민 제보 (승인 시)
    "friend_referral": 100,    # 친구 추천
    "daily_checkin": 5,        # 일일 출석
    "weekly_streak": 50,       # 7일 연속 보너스
}

# Pro 전환 기준
PRO_REDEMPTION_COST = 500


async def get_balance(db: AsyncSession, user_id: str) -> int:
    """크레딧 잔액 조회"""
    result = await db.execute(
        select(func.sum(Credit.amount)).where(Credit.user_id == user_id)
    )
    return result.scalar() or 0


async def add_credits(
    db: AsyncSession,
    user_id: str,
    reason: str,
    description: str = "",
) -> int:
    """크레딧 적립"""
    amount = CREDIT_REWARDS.get(reason, 0)
    if amount <= 0:
        return 0

    balance = await get_balance(db, user_id)
    new_balance = balance + amount

    credit = Credit(
        user_id=user_id,
        amount=amount,
        reason=reason,
        description=description,
        balance_after=new_balance,
    )
    db.add(credit)
    await db.flush()
    return new_balance


async def redeem_for_pro(db: AsyncSession, user_id: str) -> bool:
    """500 크레딧으로 1개월 Pro 전환"""
    balance = await get_balance(db, user_id)
    if balance < PRO_REDEMPTION_COST:
        return False

    credit = Credit(
        user_id=user_id,
        amount=-PRO_REDEMPTION_COST,
        reason="pro_redemption",
        description="크레딧으로 Pro 1개월 전환",
        balance_after=balance - PRO_REDEMPTION_COST,
    )
    db.add(credit)
    await db.flush()
    return True
