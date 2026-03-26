"""국회의원 말과 행동 일치도 검증"""
import logging
from app.services.accountability import calculate_consistency_score, get_inconsistencies

logger = logging.getLogger(__name__)


async def check_all_legislators(db, legislators: list) -> list[dict]:
    """모든 의원의 일치도 검증"""
    results = []
    for legislator in legislators:
        try:
            score = await calculate_consistency_score(db, str(legislator.id))
            results.append({
                "legislator_id": str(legislator.id),
                "name": legislator.name,
                "consistency_score": score,
            })
        except Exception as e:
            logger.error(f"일치도 검증 실패: {legislator.name}: {e}")
    return results
