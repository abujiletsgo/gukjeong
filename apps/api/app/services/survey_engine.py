"""숙의 설문 엔진"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.survey import Survey, SurveyResponse, SurveyAggregate


# K-익명성 최소값
K_ANONYMITY_MIN = 30


async def calculate_aggregates(
    db: AsyncSession,
    survey_id: str,
    question_id: str,
) -> list[dict]:
    """설문 응답 집계 (K-익명성 보장)"""
    # 차원별 집계
    dimensions = ["age_group", "gender", "region_sido", "job_category"]
    aggregates = []

    for dimension in dimensions:
        result = await db.execute(
            select(
                func.count().label("count"),
            )
            .where(
                SurveyResponse.survey_id == survey_id,
                SurveyResponse.question_id == question_id,
            )
        )
        total = result.scalar() or 0

        # K-익명성: 그룹 크기가 30 미만이면 공개하지 않음
        if total < K_ANONYMITY_MIN:
            continue

        aggregates.append({
            "dimension": dimension,
            "total": total,
        })

    return aggregates


async def check_representativeness(
    db: AsyncSession,
    survey_id: str,
) -> int:
    """대표성 점수 계산 (0-100)"""
    # TODO: 인구통계 분포와 비교하여 대표성 점수 계산
    return 0
