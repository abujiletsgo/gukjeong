"""국회의원 API 라우터 — 목록, 랭킹, 상세, 말과 행동 일치도, 통계"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, desc
from app.db.database import get_db
from app.models.legislator import Legislator, ConsistencyAnalysis
from app.schemas.legislator import (
    LegislatorBrief, LegislatorDetail, ConsistencyItemSchema,
    LegislatorListResponse, LegislatorRankingResponse, RankedLegislator,
    ConsistencyResponse, LegislatorStatsResponse, TopPerformer,
    PaginationMeta,
)
import math

router = APIRouter()


# ──────────────────────────────────────
# 헬퍼 함수
# ──────────────────────────────────────

def _safe_float(val) -> float | None:
    """DECIMAL 값을 float로 안전 변환"""
    return float(val) if val is not None else None


def _safe_int(val) -> int | None:
    """BigInteger 값을 int로 안전 변환"""
    return int(val) if val is not None else None


async def _get_legislator_or_404(
    legislator_id: str, db: AsyncSession
) -> Legislator:
    """국회의원 조회 — 없으면 404"""
    result = await db.execute(
        select(Legislator).where(Legislator.id == legislator_id)
    )
    legislator = result.scalar_one_or_none()
    if not legislator:
        raise HTTPException(
            status_code=404,
            detail="국회의원 정보를 찾을 수 없습니다",
        )
    return legislator


def _serialize_legislator_brief(leg: Legislator) -> dict:
    """국회의원 목록용 직렬화"""
    return {
        "id": str(leg.id),
        "name": leg.name,
        "name_en": leg.name_en,
        "party": leg.party,
        "district": leg.district,
        "committee": leg.committee,
        "term_number": leg.term_number,
        "photo_url": leg.photo_url,
        "bills_proposed_count": leg.bills_proposed_count or 0,
        "attendance_rate": _safe_float(leg.attendance_rate),
        "vote_participation_rate": _safe_float(leg.vote_participation_rate),
        "ai_activity_score": leg.ai_activity_score,
        "consistency_score": _safe_float(leg.consistency_score),
    }


def _serialize_legislator_detail(
    leg: Legislator, consistency_items: list[dict], career_summary: str | None = None,
) -> dict:
    """국회의원 상세 직렬화 — 일치도 분석 포함"""
    base = _serialize_legislator_brief(leg)
    base.update({
        "assembly_id": leg.assembly_id,
        "asset_declared": _safe_int(leg.asset_declared),
        "asset_change": _safe_int(leg.asset_change),
        "political_fund_income": _safe_int(leg.political_fund_income),
        "political_fund_expense": _safe_int(leg.political_fund_expense),
        "pledge_fulfillment_rate": _safe_float(leg.pledge_fulfillment_rate),
        "consistency_details": consistency_items,
        "career_summary": career_summary,
    })
    return base


def _serialize_consistency(a: ConsistencyAnalysis) -> dict:
    """일치도 분석 개별 항목 직렬화"""
    return {
        "issue": a.issue,
        "stated_position": a.stated_position,
        "speech_date": str(a.speech_date) if a.speech_date else None,
        "speech_summary": a.speech_summary,
        "actual_vote": a.actual_vote,
        "vote_date": str(a.vote_date) if a.vote_date else None,
        "is_consistent": a.is_consistent,
        "ai_analysis": a.ai_analysis,
    }


# 정렬 기준 매핑
_SORT_COLUMNS = {
    "activity_score_desc": Legislator.ai_activity_score.desc(),
    "attendance_desc": Legislator.attendance_rate.desc(),
    "bills_desc": Legislator.bills_proposed_count.desc(),
    "consistency_desc": Legislator.consistency_score.desc(),
    "name_asc": Legislator.name.asc(),
}

# 랭킹 메트릭 매핑
_METRIC_COLUMNS = {
    "activity_score": Legislator.ai_activity_score,
    "attendance": Legislator.attendance_rate,
    "bills": Legislator.bills_proposed_count,
    "consistency": Legislator.consistency_score,
}


# ──────────────────────────────────────
# 통계 (static route — /{id} 보다 먼저 선언)
# ──────────────────────────────────────

@router.get("/legislators/stats")
async def get_legislator_stats(db: AsyncSession = Depends(get_db)):
    """국회의원 전체 통계 — 평균 출석률, 활동 점수, 일치도, 정당 분포"""

    # 집계 쿼리
    agg_result = await db.execute(
        select(
            func.count(Legislator.id).label("total_count"),
            func.avg(Legislator.attendance_rate).label("avg_attendance"),
            func.avg(Legislator.ai_activity_score).label("avg_activity_score"),
            func.avg(Legislator.consistency_score).label("avg_consistency"),
            func.avg(Legislator.bills_proposed_count).label("avg_bills_proposed"),
        )
    )
    row = agg_result.one()

    total_count = row.total_count or 0
    avg_attendance = round(float(row.avg_attendance), 1) if row.avg_attendance else None
    avg_activity_score = round(float(row.avg_activity_score), 1) if row.avg_activity_score else None
    avg_consistency = round(float(row.avg_consistency), 1) if row.avg_consistency else None
    avg_bills_proposed = round(float(row.avg_bills_proposed), 1) if row.avg_bills_proposed else None

    # 정당별 분포
    party_result = await db.execute(
        select(
            Legislator.party,
            func.count(Legislator.id).label("cnt"),
        )
        .where(Legislator.party.is_not(None))
        .group_by(Legislator.party)
        .order_by(desc("cnt"))
    )
    party_distribution = {row.party: row.cnt for row in party_result.all()}

    # 최고 활동 점수 의원
    top_result = await db.execute(
        select(Legislator)
        .where(Legislator.ai_activity_score.is_not(None))
        .order_by(Legislator.ai_activity_score.desc())
        .limit(1)
    )
    top_leg = top_result.scalar_one_or_none()

    top_performer = None
    if top_leg:
        top_performer = {
            "id": str(top_leg.id),
            "name": top_leg.name,
            "party": top_leg.party,
            "ai_activity_score": top_leg.ai_activity_score,
        }

    return {
        "data": {
            "total_count": total_count,
            "avg_attendance": avg_attendance,
            "avg_activity_score": avg_activity_score,
            "avg_consistency": avg_consistency,
            "avg_bills_proposed": avg_bills_proposed,
            "party_distribution": party_distribution,
            "top_performer": top_performer,
        },
        "출처": "국정투명 DB — 국회의원 활동 통계",
        "disclaimer": (
            "AI 활동 점수 및 일치도 점수는 국회 공식 기록을 기반으로 "
            "AI가 분석한 참고 지표이며, 절대적 평가가 아닙니다."
        ),
    }


# ──────────────────────────────────────
# 랭킹 (static route — /{id} 보다 먼저 선언)
# ──────────────────────────────────────

@router.get("/legislators/ranking")
async def legislator_ranking(
    metric: str = Query(
        "activity_score",
        description="정렬 기준: activity_score, attendance, bills, consistency",
    ),
    limit: int = Query(20, ge=1, le=100, description="반환할 의원 수"),
    db: AsyncSession = Depends(get_db),
):
    """국회의원 랭킹 — 지표별 상위 N명 조회"""

    column = _METRIC_COLUMNS.get(metric)
    if column is None:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 metric: {metric}. "
                   f"허용 값: {', '.join(_METRIC_COLUMNS.keys())}",
        )

    result = await db.execute(
        select(Legislator)
        .where(column.is_not(None))
        .order_by(column.desc())
        .limit(limit)
    )
    legislators = result.scalars().all()

    ranked: list[dict] = []
    for idx, leg in enumerate(legislators, start=1):
        score_val = getattr(leg, column.key, None)
        ranked.append({
            "rank": idx,
            "id": str(leg.id),
            "name": leg.name,
            "party": leg.party,
            "district": leg.district,
            "photo_url": leg.photo_url,
            "score": _safe_float(score_val) if not isinstance(score_val, int) else score_val,
            "metric": metric,
        })

    return {
        "data": ranked,
        "metric": metric,
        "total": len(ranked),
        "disclaimer": (
            "AI 활동 점수 및 일치도 점수는 국회 공식 기록을 기반으로 "
            "AI가 분석한 참고 지표이며, 절대적 평가가 아닙니다."
        ),
    }


# ──────────────────────────────────────
# 국회의원 목록
# ──────────────────────────────────────

@router.get("/legislators")
async def list_legislators(
    party: str | None = Query(None, description="정당 필터"),
    region: str | None = Query(None, description="지역구 필터 (부분 일치)"),
    committee: str | None = Query(None, description="소속 위원회 필터 (부분 일치)"),
    sort: str = Query(
        "activity_score_desc",
        description="정렬: activity_score_desc, attendance_desc, bills_desc, consistency_desc, name_asc",
    ),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: AsyncSession = Depends(get_db),
):
    """국회의원 목록 조회 — 정당, 지역, 위원회 필터 및 정렬/페이지네이션"""

    # 기본 쿼리 구성
    query = select(Legislator)
    count_query = select(func.count(Legislator.id))

    # 필터 적용
    if party:
        query = query.where(Legislator.party == party)
        count_query = count_query.where(Legislator.party == party)
    if region:
        query = query.where(Legislator.district.ilike(f"%{region}%"))
        count_query = count_query.where(Legislator.district.ilike(f"%{region}%"))
    if committee:
        query = query.where(Legislator.committee.ilike(f"%{committee}%"))
        count_query = count_query.where(Legislator.committee.ilike(f"%{committee}%"))

    # 전체 개수 조회
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / limit) if total > 0 else 0

    # 정렬 적용
    order_clause = _SORT_COLUMNS.get(sort)
    if order_clause is not None:
        query = query.order_by(order_clause)
    else:
        query = query.order_by(Legislator.ai_activity_score.desc().nullslast())

    # 페이지네이션
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    legislators = result.scalars().all()

    return {
        "data": [_serialize_legislator_brief(leg) for leg in legislators],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
        "disclaimer": (
            "AI 활동 점수 및 일치도 점수는 국회 공식 기록을 기반으로 "
            "AI가 분석한 참고 지표이며, 절대적 평가가 아닙니다."
        ),
    }


# ──────────────────────────────────────
# 국회의원 상세
# ──────────────────────────────────────

@router.get("/legislators/{legislator_id}")
async def get_legislator(legislator_id: str, db: AsyncSession = Depends(get_db)):
    """국회의원 상세 성적표 — 재산, 정치자금, 일치도 분석 포함"""
    leg = await _get_legislator_or_404(legislator_id, db)

    # 일치도 분석 조회
    consistency_result = await db.execute(
        select(ConsistencyAnalysis)
        .where(ConsistencyAnalysis.legislator_id == legislator_id)
        .order_by(ConsistencyAnalysis.vote_date.desc())
    )
    analyses = consistency_result.scalars().all()
    consistency_items = [_serialize_consistency(a) for a in analyses]

    # 간략 경력 요약 생성
    career_parts: list[str] = []
    if leg.term_number:
        career_parts.append(f"제{leg.term_number}대 국회의원")
    if leg.party:
        career_parts.append(leg.party)
    if leg.district:
        career_parts.append(leg.district)
    if leg.committee:
        career_parts.append(f"{leg.committee} 소속")
    career_summary = " · ".join(career_parts) if career_parts else None

    return {
        "data": _serialize_legislator_detail(leg, consistency_items, career_summary),
        "출처": "국정투명 DB — 국회의원 상세 정보",
        "disclaimer": (
            "AI 활동 점수 및 일치도 점수는 국회 공식 기록을 기반으로 "
            "AI가 분석한 참고 지표이며, 절대적 평가가 아닙니다."
        ),
    }


# ──────────────────────────────────────
# 말과 행동 일치도
# ──────────────────────────────────────

@router.get("/legislators/{legislator_id}/consistency")
async def get_consistency(legislator_id: str, db: AsyncSession = Depends(get_db)):
    """말과 행동 일치도 분석 — 국회 발언 vs 본회의 표결 대조"""
    leg = await _get_legislator_or_404(legislator_id, db)

    result = await db.execute(
        select(ConsistencyAnalysis)
        .where(ConsistencyAnalysis.legislator_id == legislator_id)
        .order_by(ConsistencyAnalysis.vote_date.desc())
    )
    analyses = result.scalars().all()

    consistent_count = sum(1 for a in analyses if a.is_consistent is True)
    inconsistent_count = sum(1 for a in analyses if a.is_consistent is False)

    return {
        "data": {
            "legislator_id": str(leg.id),
            "legislator_name": leg.name,
            "consistency_score": _safe_float(leg.consistency_score),
            "total_analyses": len(analyses),
            "consistent_count": consistent_count,
            "inconsistent_count": inconsistent_count,
            "details": [_serialize_consistency(a) for a in analyses],
        },
        "출처": "국정투명 DB — 말과 행동 일치도 분석",
        "disclaimer": (
            "일치도 분석은 국회 회의록 발언과 본회의 표결 기록을 "
            "AI가 대조 분석한 결과이며, 맥락에 따라 해석이 달라질 수 있습니다."
        ),
    }
