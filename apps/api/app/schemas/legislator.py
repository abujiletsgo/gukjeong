"""국회의원 Pydantic 스키마 — 목록, 상세, 일치도 분석, 통계"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


# ──────────────────────────────────────
# 말과 행동 일치도 분석
# ──────────────────────────────────────

class ConsistencyItemSchema(BaseModel):
    """국회의원 발언-투표 일치도 분석 개별 항목"""
    model_config = {"from_attributes": True}

    issue: Optional[str] = None
    stated_position: Optional[str] = None
    speech_date: Optional[date] = None
    speech_summary: Optional[str] = None
    actual_vote: Optional[str] = None
    vote_date: Optional[date] = None
    is_consistent: Optional[bool] = None
    ai_analysis: Optional[str] = None


# ──────────────────────────────────────
# 국회의원 목록 (Brief)
# ──────────────────────────────────────

class LegislatorBrief(BaseModel):
    """국회의원 목록용 요약 정보"""
    model_config = {"from_attributes": True}

    id: str
    name: str
    name_en: Optional[str] = None
    party: Optional[str] = None
    district: Optional[str] = None
    committee: Optional[str] = None
    term_number: Optional[int] = None
    photo_url: Optional[str] = None
    bills_proposed_count: int = 0
    attendance_rate: Optional[float] = None
    vote_participation_rate: Optional[float] = None
    ai_activity_score: Optional[int] = None
    consistency_score: Optional[float] = None


# ──────────────────────────────────────
# 국회의원 상세 (Detail)
# ──────────────────────────────────────

class LegislatorDetail(LegislatorBrief):
    """국회의원 상세 성적표 — 재산, 정치자금, 공약 이행률, 일치도 분석 포함"""

    assembly_id: Optional[str] = None
    asset_declared: Optional[int] = None
    asset_change: Optional[int] = None
    political_fund_income: Optional[int] = None
    political_fund_expense: Optional[int] = None
    pledge_fulfillment_rate: Optional[float] = None
    consistency_details: list[ConsistencyItemSchema] = []
    career_summary: Optional[str] = None


# ──────────────────────────────────────
# 페이지네이션
# ──────────────────────────────────────

class PaginationMeta(BaseModel):
    """페이지네이션 메타 정보"""
    page: int
    limit: int
    total: int
    total_pages: int


# ──────────────────────────────────────
# 목록 응답
# ──────────────────────────────────────

class LegislatorListResponse(BaseModel):
    """국회의원 목록 응답 — 페이지네이션 포함"""
    data: list[LegislatorBrief]
    pagination: PaginationMeta
    disclaimer: str = (
        "AI 활동 점수 및 일치도 점수는 국회 공식 기록을 기반으로 "
        "AI가 분석한 참고 지표이며, 절대적 평가가 아닙니다."
    )


# ──────────────────────────────────────
# 랭킹 응답
# ──────────────────────────────────────

class RankedLegislator(BaseModel):
    """랭킹 항목 — 순위 포함"""
    rank: int
    id: str
    name: str
    party: Optional[str] = None
    district: Optional[str] = None
    photo_url: Optional[str] = None
    score: Optional[float] = None
    metric: str


class LegislatorRankingResponse(BaseModel):
    """국회의원 랭킹 응답"""
    data: list[RankedLegislator]
    metric: str
    total: int
    disclaimer: str = (
        "AI 활동 점수 및 일치도 점수는 국회 공식 기록을 기반으로 "
        "AI가 분석한 참고 지표이며, 절대적 평가가 아닙니다."
    )


# ──────────────────────────────────────
# 일치도 응답
# ──────────────────────────────────────

class ConsistencyResponse(BaseModel):
    """국회의원 말과 행동 일치도 분석 응답"""
    legislator_id: str
    legislator_name: str
    consistency_score: Optional[float] = None
    total_analyses: int
    consistent_count: int
    inconsistent_count: int
    details: list[ConsistencyItemSchema]
    disclaimer: str = (
        "일치도 분석은 국회 회의록 발언과 본회의 표결 기록을 "
        "AI가 대조 분석한 결과이며, 맥락에 따라 해석이 달라질 수 있습니다."
    )


# ──────────────────────────────────────
# 통계 응답
# ──────────────────────────────────────

class TopPerformer(BaseModel):
    """최고 활동 점수 의원"""
    id: str
    name: str
    party: Optional[str] = None
    ai_activity_score: Optional[int] = None


class LegislatorStatsResponse(BaseModel):
    """국회의원 전체 통계 — 평균, 분포, 최고 활동 의원"""
    total_count: int
    avg_attendance: Optional[float] = None
    avg_activity_score: Optional[float] = None
    avg_consistency: Optional[float] = None
    avg_bills_proposed: Optional[float] = None
    party_distribution: dict[str, int] = {}
    top_performer: Optional[TopPerformer] = None
    출처: str = "국정투명 DB — 국회의원 활동 통계"
