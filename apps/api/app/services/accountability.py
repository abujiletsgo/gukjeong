"""국회의원 말과 행동 일치도 분석 엔진"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.legislator import Legislator, LegislatorSpeech, LegislatorVote, ConsistencyAnalysis


async def calculate_consistency_score(
    db: AsyncSession,
    legislator_id: str,
) -> float:
    """발언과 투표 일치도 계산"""
    result = await db.execute(
        select(ConsistencyAnalysis)
        .where(ConsistencyAnalysis.legislator_id == legislator_id)
    )
    analyses = result.scalars().all()

    if not analyses:
        return 0.0

    consistent_count = sum(1 for a in analyses if a.is_consistent)
    return round(consistent_count / len(analyses) * 100, 1)


async def get_inconsistencies(
    db: AsyncSession,
    legislator_id: str,
) -> list[dict]:
    """불일치 사례 조회"""
    result = await db.execute(
        select(ConsistencyAnalysis)
        .where(
            ConsistencyAnalysis.legislator_id == legislator_id,
            ConsistencyAnalysis.is_consistent == False,
        )
        .order_by(ConsistencyAnalysis.vote_date.desc())
    )
    return [{
        "issue": a.issue,
        "stated_position": a.stated_position,
        "actual_vote": a.actual_vote,
        "speech_date": str(a.speech_date),
        "vote_date": str(a.vote_date),
        "ai_analysis": a.ai_analysis,
    } for a in result.scalars().all()]
