"""뉴스 API 라우터 — 이벤트, 매체, 통계 조회"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.db.database import get_db
from app.models.news_event import NewsEvent, NewsEventArticle
from app.models.article import MediaOutlet, Article
from app.schemas.news import (
    NewsEventBrief, NewsEventDetail, NewsEventListResponse,
    NewsEventDetailResponse, MediaOutletResponse,
    NewsStatsResponse, NewsArticleSchema, PaginationMeta,
)
import math

router = APIRouter()


# ──────────────────────────────────────
# 헬퍼 함수
# ──────────────────────────────────────

def _safe_float(val) -> float | None:
    """DECIMAL 값을 float로 안전 변환"""
    return float(val) if val is not None else None


async def _get_event_or_404(event_id: str, db: AsyncSession) -> NewsEvent:
    """뉴스 이벤트 조회 — 없으면 404"""
    result = await db.execute(
        select(NewsEvent).where(NewsEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=404,
            detail="뉴스 이벤트를 찾을 수 없습니다",
        )
    return event


def _serialize_event_brief(e: NewsEvent) -> dict:
    """뉴스 이벤트 목록용 직렬화"""
    return {
        "id": str(e.id),
        "title": e.title,
        "event_date": str(e.event_date) if e.event_date else None,
        "category": e.category,
        "ai_summary": e.ai_summary,
        "article_count": e.article_count,
        "citizen_takeaway": e.citizen_takeaway,
    }


def _serialize_event_detail(e: NewsEvent, coverage: list[dict]) -> dict:
    """뉴스 이벤트 상세 직렬화 — 프레임 비교, 관련 기사 포함"""
    data = _serialize_event_brief(e)
    data.update({
        "key_facts": e.key_facts,
        "progressive_frame": e.progressive_frame,
        "conservative_frame": e.conservative_frame,
        "related_policy_id": str(e.related_policy_id) if e.related_policy_id else None,
        "related_bill_id": str(e.related_bill_id) if e.related_bill_id else None,
        "coverage": coverage,
    })
    return data


def _serialize_article(a: Article, outlet_name: str | None = None) -> dict:
    """기사 직렬화"""
    return {
        "id": str(a.id),
        "title": a.title,
        "url": a.url,
        "source_id": a.source_id,
        "source_name": outlet_name,
        "published_at": a.published_at.isoformat() if a.published_at else None,
        "ai_summary": a.ai_summary,
        "sentiment_score": _safe_float(a.sentiment_score),
        "sentiment_label": a.sentiment_label,
        "frame_keywords": a.frame_keywords,
    }


def _serialize_outlet(o: MediaOutlet) -> dict:
    """언론사 직렬화"""
    return {
        "id": o.id,
        "name": o.name,
        "type": o.type,
        "spectrum_score": _safe_float(o.spectrum_score),
        "category": o.category,
        "website_url": o.website_url,
        "owner": o.owner,
        "founded_year": o.founded_year,
        "description": o.description,
        "logo_url": o.logo_url,
    }


# ──────────────────────────────────────
# GET /news/stats — 통계
# ──────────────────────────────────────

@router.get("/news/stats", response_model=NewsStatsResponse)
async def get_news_stats(db: AsyncSession = Depends(get_db)):
    """뉴스 통계 집계 — 총 이벤트, 기사, 매체 수 및 카테고리별 분포

    Returns:
        NewsStatsResponse: 총 이벤트/기사/매체 수, 카테고리별 이벤트 분포
    """
    # 이벤트 수
    event_count_result = await db.execute(select(func.count(NewsEvent.id)))
    total_events = event_count_result.scalar() or 0

    # 기사 수
    article_count_result = await db.execute(select(func.count(Article.id)))
    total_articles = article_count_result.scalar() or 0

    # 매체 수
    outlet_count_result = await db.execute(select(func.count(MediaOutlet.id)))
    outlet_count = outlet_count_result.scalar() or 0

    # 카테고리별 이벤트 분포
    category_result = await db.execute(
        select(NewsEvent.category, func.count(NewsEvent.id))
        .where(NewsEvent.category.is_not(None))
        .group_by(NewsEvent.category)
        .order_by(func.count(NewsEvent.id).desc())
    )
    events_by_category = dict(category_result.all())

    return NewsStatsResponse(
        total_events=total_events,
        total_articles=total_articles,
        outlet_count=outlet_count,
        events_by_category=events_by_category,
    )


# ──────────────────────────────────────
# GET /news/outlets — 매체 목록
# ──────────────────────────────────────

@router.get("/news/outlets", response_model=list[MediaOutletResponse])
async def list_media_outlets(db: AsyncSession = Depends(get_db)):
    """모니터링 대상 언론사 목록 — 정치 성향 스펙트럼 포함

    Returns:
        list[MediaOutletResponse]: 언론사 목록 (스펙트럼 점수순)
    """
    result = await db.execute(
        select(MediaOutlet).order_by(MediaOutlet.spectrum_score.nulls_last())
    )
    outlets = result.scalars().all()

    return [_serialize_outlet(o) for o in outlets]


# ──────────────────────────────────────
# GET /news/events — 이벤트 목록
# ──────────────────────────────────────

@router.get("/news/events", response_model=NewsEventListResponse)
async def list_news_events(
    category: Optional[str] = Query(None, description="이벤트 카테고리 필터"),
    sort: Optional[str] = Query("latest", description="정렬: latest, article_count_desc"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 건수"),
    db: AsyncSession = Depends(get_db),
):
    """뉴스 이벤트 목록 조회 — 필터링, 정렬, 페이지네이션 지원

    Filters:
        - category: 이벤트 카테고리 (정치, 경제, 사회 등)

    Sort:
        - latest (default): 최신 이벤트순
        - article_count_desc: 보도량 많은순

    Returns:
        NewsEventListResponse: 이벤트 목록 + 페이지네이션 메타데이터
    """
    query = select(NewsEvent)
    count_query = select(func.count(NewsEvent.id))

    # 필터
    if category:
        query = query.where(NewsEvent.category == category)
        count_query = count_query.where(NewsEvent.category == category)

    # 정렬
    if sort == "article_count_desc":
        query = query.order_by(
            NewsEvent.article_count.desc().nulls_last(),
            NewsEvent.event_date.desc().nulls_last(),
        )
    else:  # latest (default)
        query = query.order_by(NewsEvent.event_date.desc().nulls_last())

    # 전체 건수
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / limit) if limit > 0 else 0

    # 페이지네이션
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    events = result.scalars().all()

    return NewsEventListResponse(
        data=[_serialize_event_brief(e) for e in events],
        pagination=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        ),
    )


# ──────────────────────────────────────
# GET /news/events/{event_id} — 이벤트 상세
# ──────────────────────────────────────

@router.get("/news/events/{event_id}", response_model=NewsEventDetailResponse)
async def get_news_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """뉴스 이벤트 상세 조회 — 프레임 비교, 핵심 팩트, 관련 기사 포함

    이벤트에 연결된 기사들을 news_event_articles 조인 테이블을 통해
    조회하고, 각 기사의 출처 언론사명을 함께 반환합니다.

    Args:
        event_id: 이벤트 UUID

    Returns:
        NewsEventDetailResponse: 이벤트 상세 + 커버리지 기사 목록

    Raises:
        HTTPException 404: 이벤트를 찾을 수 없을 때
    """
    event = await _get_event_or_404(event_id, db)

    # 이벤트에 연결된 기사 + 매체명 조회
    articles_result = await db.execute(
        select(Article, MediaOutlet.name)
        .join(NewsEventArticle, NewsEventArticle.article_id == Article.id)
        .outerjoin(MediaOutlet, MediaOutlet.id == Article.source_id)
        .where(NewsEventArticle.event_id == event_id)
        .order_by(Article.published_at.desc().nulls_last())
    )
    coverage = [
        _serialize_article(article, outlet_name)
        for article, outlet_name in articles_result.all()
    ]

    return NewsEventDetailResponse(
        data=_serialize_event_detail(event, coverage),
    )
