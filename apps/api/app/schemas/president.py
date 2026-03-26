"""대통령 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import date
from uuid import UUID


class PresidentBase(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    name_en: Optional[str] = None
    term_start: date
    term_end: Optional[date] = None
    party: Optional[str] = None
    era: Optional[str] = None
    gdp_growth_avg: Optional[float] = None
    note: Optional[str] = None


class PolicyBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    impact_score: Optional[int] = None
    ai_summary: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_allocated: Optional[float] = None
    budget_spent: Optional[float] = None
    fulfillment_status: Optional[str] = None
    fulfillment_pct: Optional[float] = None
    pledge_source: Optional[str] = None
    pledge_type: Optional[str] = None
    priority_rank: Optional[int] = None


class KeyEventBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    event_date: date
    title: str
    description: Optional[str] = None
    impact_type: Optional[str] = None
    significance_score: Optional[int] = None


# ──────────────────────────────────────
# 국정과제 (National Agenda)
# ──────────────────────────────────────

class NationalAgendaSchema(BaseModel):
    """국정과제 전체 필드"""
    model_config = {"from_attributes": True}

    id: UUID
    president_id: str
    agenda_number: Optional[int] = None
    goal_category: Optional[str] = None
    strategy: Optional[str] = None
    title: str
    description: Optional[str] = None
    implementation_status: Optional[str] = None
    completion_rate: Optional[float] = None
    budget_committed: Optional[float] = None
    budget_executed: Optional[float] = None
    target_metric: Optional[str] = None
    target_value: Optional[str] = None
    actual_value: Optional[str] = None
    outcome_summary: Optional[str] = None
    ai_assessment: Optional[str] = None
    ai_citizen_impact: Optional[str] = None
    related_bill_ids: Optional[list[str]] = None
    related_policy_id: Optional[UUID] = None
    source_url: Optional[str] = None
    last_verified: Optional[date] = None


class NationalAgendaBrief(BaseModel):
    """국정과제 목록용 요약"""
    model_config = {"from_attributes": True}

    id: UUID
    agenda_number: Optional[int] = None
    goal_category: Optional[str] = None
    title: str
    implementation_status: Optional[str] = None
    completion_rate: Optional[float] = None


# ──────────────────────────────────────
# 대통령 성과표 (Report Card)
# ──────────────────────────────────────

class ReportCardSchema(BaseModel):
    """대통령 성과표 전체 필드"""
    model_config = {"from_attributes": True}

    id: UUID
    president_id: str
    category: Optional[str] = None
    metric_name: Optional[str] = None
    metric_name_en: Optional[str] = None
    baseline_value: Optional[float] = None
    baseline_year: Optional[int] = None
    target_value: Optional[float] = None
    final_value: Optional[float] = None
    unit: Optional[str] = None
    trend: Optional[str] = None
    grade: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    note: Optional[str] = None


class ReportCardBrief(BaseModel):
    """성과표 요약용"""
    model_config = {"from_attributes": True}

    category: Optional[str] = None
    metric_name: Optional[str] = None
    baseline_value: Optional[float] = None
    final_value: Optional[float] = None
    trend: Optional[str] = None
    grade: Optional[str] = None


# ──────────────────────────────────────
# 공약 이행 요약 통계
# ──────────────────────────────────────

class PledgeSummary(BaseModel):
    """공약 이행 현황 요약 통계"""
    total: int = 0
    fulfilled: int = 0       # 이행완료
    in_progress: int = 0     # 추진중
    not_started: int = 0     # 미이행
    partial: int = 0         # 일부이행
    abandoned: int = 0       # 폐기
    on_hold: int = 0         # 보류
    fulfillment_rate: Optional[float] = None  # 이행완료 비율 %


# ──────────────────────────────────────
# 재정 데이터 스키마
# ──────────────────────────────────────

class FiscalYearBrief(BaseModel):
    model_config = {"from_attributes": True}

    year: int
    total_spending: Optional[float] = None
    total_revenue: Optional[float] = None
    national_debt: Optional[float] = None
    debt_to_gdp: Optional[float] = None
    gdp: Optional[float] = None


class EconomicPerformance(BaseModel):
    gdp_growth_avg: Optional[float] = None
    spending_change_pct: Optional[float] = None
    debt_change_pct: Optional[float] = None
    first_year_spending: Optional[float] = None
    last_year_spending: Optional[float] = None
    first_year_debt: Optional[float] = None
    last_year_debt: Optional[float] = None


# ──────────────────────────────────────
# 예산 비교
# ──────────────────────────────────────

class BudgetComparisonItem(BaseModel):
    """정책별 예산 비교"""
    policy_id: str
    title: str
    category: Optional[str] = None
    budget_allocated: Optional[float] = None
    budget_spent: Optional[float] = None
    execution_rate: Optional[float] = None  # 집행률 %


class BudgetComparisonResponse(BaseModel):
    president_id: str
    president_name: str
    총_배정: Optional[float] = None
    총_집행: Optional[float] = None
    평균_집행률: Optional[float] = None
    정책별: list[BudgetComparisonItem] = []
    출처: str = "국정투명 DB — 정책별 예산 데이터"


# ──────────────────────────────────────
# 대통령 상세 (통합 응답)
# ──────────────────────────────────────

class PresidentDetail(BaseModel):
    """대통령 상세 정보 — 정책, 국정과제, 성과표, 주요 사건, 공약 요약 포함"""
    model_config = {"from_attributes": True}

    id: str
    name: str
    name_en: Optional[str] = None
    term_start: date
    term_end: Optional[date] = None
    party: Optional[str] = None
    era: Optional[str] = None
    gdp_growth_avg: Optional[float] = None
    portrait_url: Optional[str] = None
    key_metric: Optional[str] = None
    economic_performance: Optional[EconomicPerformance] = None
    fiscal_data: list[FiscalYearBrief] = []
    policies: list[PolicyBrief] = []
    national_agenda: list[NationalAgendaBrief] = []
    report_card: list[ReportCardBrief] = []
    key_events: list[KeyEventBrief] = []
    pledge_summary: Optional[PledgeSummary] = None
