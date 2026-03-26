"""법안 API 라우터 — 목록, 상세, 통계 조회"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.db.database import get_db
from app.models.bill import Bill
from app.schemas.bill import (
    BillBrief, BillDetail, BillListResponse, BillDetailResponse,
    BillStatsResponse, VoteResultSchema, PaginationMeta,
)
import math

router = APIRouter()


# ──────────────────────────────────────
# 헬퍼 함수
# ──────────────────────────────────────

def _safe_float(val) -> float | None:
    """DECIMAL 값을 float로 안전 변환"""
    return float(val) if val is not None else None


async def _get_bill_or_404(bill_id: str, db: AsyncSession) -> Bill:
    """법안 조회 — 없으면 404"""
    result = await db.execute(
        select(Bill).where(Bill.id == bill_id)
    )
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(
            status_code=404,
            detail="법안을 찾을 수 없습니다",
        )
    return bill


def _serialize_bill_brief(b: Bill) -> dict:
    """법안 목록용 직렬화"""
    return {
        "id": str(b.id),
        "bill_no": b.bill_no,
        "title": b.title,
        "proposed_date": str(b.proposed_date) if b.proposed_date else None,
        "proposer_type": b.proposer_type,
        "proposer_name": b.proposer_name,
        "committee": b.committee,
        "status": b.status,
        "ai_summary": b.ai_summary,
        "ai_category": b.ai_category,
        "ai_controversy_score": b.ai_controversy_score,
        "vote_result": b.vote_result,
    }


def _serialize_bill_detail(b: Bill) -> dict:
    """법안 상세 직렬화 — 모든 필드 포함"""
    data = _serialize_bill_brief(b)
    data.update({
        "co_sponsors": b.co_sponsors,
        "full_text_url": b.full_text_url,
        "ai_citizen_impact": b.ai_citizen_impact,
        "related_policy_id": str(b.related_policy_id) if b.related_policy_id else None,
    })
    return data


# ──────────────────────────────────────
# GET /bills/stats — 통계 (순서 중요: /bills/{bill_id} 보다 먼저)
# ──────────────────────────────────────

@router.get("/bills/stats", response_model=BillStatsResponse)
async def get_bill_stats(db: AsyncSession = Depends(get_db)):
    """법안 통계 집계 — 상태별, 위원회별, 카테고리별 분포

    Returns:
        BillStatsResponse: 전체 법안 수, 가결/계류/폐기 수,
        평균 논쟁 점수, 위원회별·카테고리별 분포
    """
    # 전체 건수
    total_result = await db.execute(select(func.count(Bill.id)))
    total_count = total_result.scalar() or 0

    # 상태별 건수
    status_counts_result = await db.execute(
        select(Bill.status, func.count(Bill.id))
        .group_by(Bill.status)
    )
    status_map = dict(status_counts_result.all())
    passed_count = status_map.get("가결", 0)
    pending_count = status_map.get("계류", 0)
    rejected_count = status_map.get("폐기", 0)

    # 평균 논쟁 점수
    avg_result = await db.execute(
        select(func.avg(Bill.ai_controversy_score))
        .where(Bill.ai_controversy_score.is_not(None))
    )
    avg_raw = avg_result.scalar()
    avg_controversy = round(float(avg_raw), 1) if avg_raw is not None else None

    # 위원회별 분포
    committee_result = await db.execute(
        select(Bill.committee, func.count(Bill.id))
        .where(Bill.committee.is_not(None))
        .group_by(Bill.committee)
        .order_by(func.count(Bill.id).desc())
    )
    bills_by_committee = dict(committee_result.all())

    # 카테고리별 분포
    category_result = await db.execute(
        select(Bill.ai_category, func.count(Bill.id))
        .where(Bill.ai_category.is_not(None))
        .group_by(Bill.ai_category)
        .order_by(func.count(Bill.id).desc())
    )
    bills_by_category = dict(category_result.all())

    return BillStatsResponse(
        total_count=total_count,
        passed_count=passed_count,
        pending_count=pending_count,
        rejected_count=rejected_count,
        avg_controversy_score=avg_controversy,
        bills_by_committee=bills_by_committee,
        bills_by_category=bills_by_category,
    )


# ──────────────────────────────────────
# GET /bills — 법안 목록
# ──────────────────────────────────────

@router.get("/bills", response_model=BillListResponse)
async def list_bills(
    status: Optional[str] = Query(None, description="법안 상태 필터 (가결, 계류, 폐기)"),
    committee: Optional[str] = Query(None, description="소관 위원회 필터"),
    category: Optional[str] = Query(None, description="AI 분류 카테고리 필터"),
    proposer_type: Optional[str] = Query(None, description="발의 유형 필터 (의원, 정부)"),
    sort: Optional[str] = Query("latest", description="정렬 기준: latest, controversy_desc"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 건수"),
    db: AsyncSession = Depends(get_db),
):
    """법안 목록 조회 — 필터링, 정렬, 페이지네이션 지원

    Filters:
        - status: 가결, 계류, 폐기
        - committee: 소관 위원회명
        - category: AI 분류 카테고리 (ai_category)
        - proposer_type: 의원, 정부

    Sort:
        - latest (default): 발의일 최신순
        - controversy_desc: 논쟁 점수 높은순

    Returns:
        BillListResponse: 법안 목록 + 페이지네이션 메타데이터
    """
    # 기본 쿼리
    query = select(Bill)
    count_query = select(func.count(Bill.id))

    # 필터 적용
    if status:
        query = query.where(Bill.status == status)
        count_query = count_query.where(Bill.status == status)
    if committee:
        query = query.where(Bill.committee == committee)
        count_query = count_query.where(Bill.committee == committee)
    if category:
        query = query.where(Bill.ai_category == category)
        count_query = count_query.where(Bill.ai_category == category)
    if proposer_type:
        query = query.where(Bill.proposer_type == proposer_type)
        count_query = count_query.where(Bill.proposer_type == proposer_type)

    # 정렬
    if sort == "controversy_desc":
        query = query.order_by(
            Bill.ai_controversy_score.desc().nulls_last(),
            Bill.proposed_date.desc().nulls_last(),
        )
    else:  # latest (default)
        query = query.order_by(Bill.proposed_date.desc().nulls_last())

    # 전체 건수 조회
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / limit) if limit > 0 else 0

    # 페이지네이션 적용
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    bills = result.scalars().all()

    return BillListResponse(
        data=[_serialize_bill_brief(b) for b in bills],
        pagination=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        ),
    )


# ──────────────────────────────────────
# GET /bills/{bill_id} — 법안 상세
# ──────────────────────────────────────

@router.get("/bills/{bill_id}", response_model=BillDetailResponse)
async def get_bill(bill_id: str, db: AsyncSession = Depends(get_db)):
    """법안 상세 정보 조회 — AI 분석, 시민 영향, 투표 결과 포함

    Args:
        bill_id: 법안 UUID

    Returns:
        BillDetailResponse: 법안 전체 필드 + 면책 안내

    Raises:
        HTTPException 404: 법안을 찾을 수 없을 때
    """
    bill = await _get_bill_or_404(bill_id, db)

    return BillDetailResponse(
        data=_serialize_bill_detail(bill),
    )
