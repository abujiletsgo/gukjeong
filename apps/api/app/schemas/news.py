"""뉴스 Pydantic 스키마 — 이벤트, 매체, 통계 응답"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ──────────────────────────────────────
# 뉴스 기사 (이벤트 내 커버리지)
# ──────────────────────────────────────

class NewsArticleSchema(BaseModel):
    """뉴스 기사 요약 — 이벤트별 보도 비교용"""
    model_config = {"from_attributes": True}

    id: str
    title: str
    url: Optional[str] = None
    source_id: Optional[str] = None
    source_name: Optional[str] = None
    published_at: Optional[datetime] = None
    ai_summary: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    frame_keywords: Optional[list[str]] = None


# ──────────────────────────────────────
# 프레임 구조
# ──────────────────────────────────────

class FrameSchema(BaseModel):
    """뉴스 프레임 분석 — 진보/보수 시각"""
    headline: Optional[str] = None
    emphasis: Optional[str] = None
    tone: Optional[str] = None
    key_quote: Optional[str] = None


# ──────────────────────────────────────
# 뉴스 이벤트
# ──────────────────────────────────────

class NewsEventBrief(BaseModel):
    """뉴스 이벤트 목록용 요약"""
    model_config = {"from_attributes": True}

    id: str
    title: str
    event_date: Optional[date] = None
    category: Optional[str] = None
    ai_summary: Optional[str] = None
    article_count: Optional[int] = None
    citizen_takeaway: Optional[str] = None


class NewsEventDetail(NewsEventBrief):
    """뉴스 이벤트 상세 — 프레임 비교, 핵심 팩트, 관련 기사 포함"""
    key_facts: Optional[list[str]] = None
    progressive_frame: Optional[dict] = None
    conservative_frame: Optional[dict] = None
    related_policy_id: Optional[str] = None
    related_bill_id: Optional[str] = None
    coverage: list[NewsArticleSchema] = []


# ──────────────────────────────────────
# 매체 (Media Outlet)
# ──────────────────────────────────────

class MediaOutletResponse(BaseModel):
    """언론사 정보 — 정치 성향 스펙트럼 포함"""
    model_config = {"from_attributes": True}

    id: str
    name: str
    type: Optional[str] = None
    spectrum_score: Optional[float] = None   # -1.0 (진보) ~ 1.0 (보수)
    category: Optional[str] = None
    website_url: Optional[str] = None
    owner: Optional[str] = None
    founded_year: Optional[int] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None


# ──────────────────────────────────────
# 페이지네이션
# ──────────────────────────────────────

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


# ──────────────────────────────────────
# 목록 응답
# ──────────────────────────────────────

class NewsEventListResponse(BaseModel):
    """뉴스 이벤트 목록 응답"""
    data: list[NewsEventBrief]
    pagination: PaginationMeta
    disclaimer: str = "AI 프레임 분석은 참고용이며, 각 언론사의 보도를 직접 확인하시기 바랍니다."
    출처: str = "국정투명 DB — 뉴스 프레임 비교 분석"


# ──────────────────────────────────────
# 상세 응답
# ──────────────────────────────────────

class NewsEventDetailResponse(BaseModel):
    """뉴스 이벤트 상세 응답"""
    data: NewsEventDetail
    disclaimer: str = "AI 프레임 분석은 참고용이며, 각 언론사의 보도를 직접 확인하시기 바랍니다."
    출처: str = "국정투명 DB — 뉴스 프레임 비교 분석"


# ──────────────────────────────────────
# 통계 응답
# ──────────────────────────────────────

class NewsStatsResponse(BaseModel):
    """뉴스 통계 집계 응답"""
    total_events: int = 0
    total_articles: int = 0
    outlet_count: int = 0
    events_by_category: dict[str, int] = {}
    출처: str = "국정투명 DB — 뉴스 통계"
