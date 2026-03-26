"""법안 Pydantic 스키마 — 목록, 상세, 통계 응답"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


# ──────────────────────────────────────
# 투표 결과 (JSONB 내부 구조)
# ──────────────────────────────────────

class VoteResultSchema(BaseModel):
    """국회 본회의 투표 결과"""
    total: Optional[int] = None
    yes: Optional[int] = None
    no: Optional[int] = None
    abstain: Optional[int] = None
    absent: Optional[int] = None
    result: Optional[str] = None  # 가결, 부결 등


# ──────────────────────────────────────
# 법안 기본/상세
# ──────────────────────────────────────

class BillBrief(BaseModel):
    """법안 목록용 요약"""
    model_config = {"from_attributes": True}

    id: str
    bill_no: Optional[str] = None
    title: str
    proposed_date: Optional[date] = None
    proposer_type: Optional[str] = None
    proposer_name: Optional[str] = None
    committee: Optional[str] = None
    status: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_category: Optional[str] = None
    ai_controversy_score: Optional[int] = None
    vote_result: Optional[VoteResultSchema] = None


class BillDetail(BillBrief):
    """법안 상세 — 시민 영향, 공동 발의자, 전문 링크 포함"""
    co_sponsors: Optional[list[str]] = None
    full_text_url: Optional[str] = None
    ai_citizen_impact: Optional[str] = None
    related_policy_id: Optional[str] = None


# ──────────────────────────────────────
# 목록 응답 (페이지네이션 포함)
# ──────────────────────────────────────

class PaginationMeta(BaseModel):
    """페이지네이션 메타데이터"""
    page: int
    limit: int
    total: int
    total_pages: int


class BillListResponse(BaseModel):
    """법안 목록 응답 — 페이지네이션 + 면책 안내 포함"""
    data: list[BillBrief]
    pagination: PaginationMeta
    disclaimer: str = "AI 분석은 참고용이며 공식 법률 해석이 아닙니다."
    출처: str = "국정투명 DB — 국회의안정보시스템 기반"


# ──────────────────────────────────────
# 상세 응답
# ──────────────────────────────────────

class BillDetailResponse(BaseModel):
    """법안 상세 응답"""
    data: BillDetail
    disclaimer: str = "AI 분석은 참고용이며 공식 법률 해석이 아닙니다."
    출처: str = "국정투명 DB — 국회의안정보시스템 기반"


# ──────────────────────────────────────
# 통계 응답
# ──────────────────────────────────────

class BillStatsResponse(BaseModel):
    """법안 통계 집계 응답"""
    total_count: int = 0
    passed_count: int = 0          # 가결
    pending_count: int = 0         # 계류
    rejected_count: int = 0        # 폐기
    avg_controversy_score: Optional[float] = None
    bills_by_committee: dict[str, int] = {}
    bills_by_category: dict[str, int] = {}
    출처: str = "국정투명 DB — 법안 통계"
