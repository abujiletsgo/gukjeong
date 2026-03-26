"""대통령 API 라우터 — 정책, 국정과제, 성과표, 공약 이행 현황"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.president import (
    President, Policy, KeyEvent, NationalAgenda, PresidentialReportCard,
)
from app.models.fiscal import FiscalYearly
from app.schemas.president import (
    PolicyBrief, KeyEventBrief,
    NationalAgendaSchema, NationalAgendaBrief,
    ReportCardSchema, ReportCardBrief,
    PledgeSummary, BudgetComparisonItem, BudgetComparisonResponse,
    EconomicPerformance, FiscalYearBrief, PresidentDetail,
)

router = APIRouter()


# ──────────────────────────────────────
# 헬퍼 함수
# ──────────────────────────────────────

def _safe_float(val) -> float | None:
    """DECIMAL 값을 float로 안전 변환"""
    return float(val) if val is not None else None


async def _get_president_or_404(
    president_id: str, db: AsyncSession
) -> President:
    result = await db.execute(
        select(President).where(President.id == president_id)
    )
    president = result.scalar_one_or_none()
    if not president:
        raise HTTPException(
            status_code=404,
            detail="대통령 정보를 찾을 수 없습니다",
        )
    return president


def _build_pledge_summary(policies: list[Policy]) -> PledgeSummary:
    """정책 목록에서 공약 이행 요약 통계 생성"""
    status_map = {
        "이행완료": "fulfilled",
        "추진중": "in_progress",
        "미이행": "not_started",
        "일부이행": "partial",
        "폐기": "abandoned",
        "보류": "on_hold",
    }
    counts: dict[str, int] = {v: 0 for v in status_map.values()}
    total = 0
    for p in policies:
        if p.fulfillment_status:
            total += 1
            key = status_map.get(p.fulfillment_status)
            if key:
                counts[key] += 1

    rate = None
    if total > 0:
        rate = round(counts["fulfilled"] / total * 100, 1)

    return PledgeSummary(total=total, fulfillment_rate=rate, **counts)


def _serialize_policy(p: Policy) -> dict:
    return {
        "id": str(p.id),
        "title": p.title,
        "category": p.category,
        "description": p.description,
        "status": p.status,
        "impact_score": p.impact_score,
        "ai_summary": p.ai_summary,
        "start_date": str(p.start_date) if p.start_date else None,
        "end_date": str(p.end_date) if p.end_date else None,
        "budget_allocated": _safe_float(p.budget_allocated),
        "budget_spent": _safe_float(p.budget_spent),
        "fulfillment_status": p.fulfillment_status,
        "fulfillment_pct": _safe_float(p.fulfillment_pct),
        "pledge_source": p.pledge_source,
        "pledge_type": p.pledge_type,
        "priority_rank": p.priority_rank,
    }


def _serialize_event(e: KeyEvent) -> dict:
    return {
        "id": str(e.id),
        "event_date": str(e.event_date),
        "title": e.title,
        "description": e.description,
        "impact_type": e.impact_type,
        "significance_score": e.significance_score,
    }


def _serialize_agenda_brief(a: NationalAgenda) -> dict:
    return {
        "id": str(a.id),
        "agenda_number": a.agenda_number,
        "goal_category": a.goal_category,
        "title": a.title,
        "implementation_status": a.implementation_status,
        "completion_rate": _safe_float(a.completion_rate),
    }


def _serialize_agenda_full(a: NationalAgenda) -> dict:
    return {
        "id": str(a.id),
        "president_id": a.president_id,
        "agenda_number": a.agenda_number,
        "goal_category": a.goal_category,
        "strategy": a.strategy,
        "title": a.title,
        "description": a.description,
        "implementation_status": a.implementation_status,
        "completion_rate": _safe_float(a.completion_rate),
        "budget_committed": _safe_float(a.budget_committed),
        "budget_executed": _safe_float(a.budget_executed),
        "target_metric": a.target_metric,
        "target_value": a.target_value,
        "actual_value": a.actual_value,
        "outcome_summary": a.outcome_summary,
        "ai_assessment": a.ai_assessment,
        "ai_citizen_impact": a.ai_citizen_impact,
        "related_bill_ids": a.related_bill_ids,
        "related_policy_id": str(a.related_policy_id) if a.related_policy_id else None,
        "source_url": a.source_url,
        "last_verified": str(a.last_verified) if a.last_verified else None,
    }


def _serialize_report_card_brief(r: PresidentialReportCard) -> dict:
    return {
        "category": r.category,
        "metric_name": r.metric_name,
        "baseline_value": _safe_float(r.baseline_value),
        "final_value": _safe_float(r.final_value),
        "trend": r.trend,
        "grade": r.grade,
    }


def _serialize_report_card_full(r: PresidentialReportCard) -> dict:
    return {
        "id": str(r.id),
        "president_id": r.president_id,
        "category": r.category,
        "metric_name": r.metric_name,
        "metric_name_en": r.metric_name_en,
        "baseline_value": _safe_float(r.baseline_value),
        "baseline_year": r.baseline_year,
        "target_value": _safe_float(r.target_value),
        "final_value": _safe_float(r.final_value),
        "unit": r.unit,
        "trend": r.trend,
        "grade": r.grade,
        "source": r.source,
        "source_url": r.source_url,
        "note": r.note,
    }


def _serialize_fiscal(f: FiscalYearly) -> dict:
    return {
        "year": f.year,
        "total_spending": _safe_float(f.total_spending),
        "total_revenue": _safe_float(f.total_revenue),
        "national_debt": _safe_float(f.national_debt),
        "debt_to_gdp": _safe_float(f.debt_to_gdp),
        "gdp": _safe_float(f.gdp),
    }


def _build_economic_performance(fiscal_data: list[FiscalYearly], gdp_growth_avg) -> dict:
    spending_values = [float(f.total_spending) for f in fiscal_data if f.total_spending]
    debt_values = [float(f.national_debt) for f in fiscal_data if f.national_debt]

    spending_change = None
    if len(spending_values) >= 2:
        spending_change = round(
            (spending_values[-1] - spending_values[0]) / spending_values[0] * 100, 1
        )

    debt_change = None
    if len(debt_values) >= 2:
        debt_change = round(
            (debt_values[-1] - debt_values[0]) / debt_values[0] * 100, 1
        )

    return {
        "gdp_growth_avg": _safe_float(gdp_growth_avg),
        "spending_change_pct": spending_change,
        "debt_change_pct": debt_change,
        "first_year_spending": spending_values[0] if spending_values else None,
        "last_year_spending": spending_values[-1] if spending_values else None,
        "first_year_debt": debt_values[0] if debt_values else None,
        "last_year_debt": debt_values[-1] if debt_values else None,
    }


# ──────────────────────────────────────
# 기본 대통령 목록/상세
# ──────────────────────────────────────

@router.get("/presidents")
async def list_presidents(db: AsyncSession = Depends(get_db)):
    """역대 대통령 목록 조회 — 재정 오버레이 데이터 포함"""
    result = await db.execute(
        select(President).order_by(President.term_start)
    )
    presidents = result.scalars().all()

    # 대통령별 재정 데이터 일괄 조회
    fiscal_result = await db.execute(
        select(FiscalYearly).order_by(FiscalYearly.year)
    )
    all_fiscal = fiscal_result.scalars().all()

    # 대통령별 재정 데이터 그룹핑
    fiscal_by_president: dict[str, list] = {}
    for f in all_fiscal:
        pid = f.president_id
        if pid not in fiscal_by_president:
            fiscal_by_president[pid] = []
        fiscal_by_president[pid].append({
            "year": f.year,
            "total_spending": _safe_float(f.total_spending),
            "total_revenue": _safe_float(f.total_revenue),
            "national_debt": _safe_float(f.national_debt),
            "debt_to_gdp": _safe_float(f.debt_to_gdp),
        })

    return {"data": [
        {
            "id": p.id,
            "name": p.name,
            "name_en": p.name_en,
            "term_start": str(p.term_start),
            "term_end": str(p.term_end) if p.term_end else None,
            "party": p.party,
            "era": p.era,
            "gdp_growth_avg": _safe_float(p.gdp_growth_avg),
            "portrait_url": p.portrait_url,
            "key_metric": p.key_metric,
            "fiscal_data": fiscal_by_president.get(p.id, []),
        }
        for p in presidents
    ]}


@router.get("/presidents/{president_id}")
async def get_president(president_id: str, db: AsyncSession = Depends(get_db)):
    """대통령 상세 정보 — 정책, 주요 사건, 재정 데이터 포함"""
    president = await _get_president_or_404(president_id, db)

    # 정책 조회
    policies_result = await db.execute(
        select(Policy).where(Policy.president_id == president_id)
        .order_by(Policy.start_date)
    )
    policies = policies_result.scalars().all()

    # 주요 사건 조회
    events_result = await db.execute(
        select(KeyEvent).where(KeyEvent.president_id == president_id)
        .order_by(KeyEvent.event_date)
    )
    events = events_result.scalars().all()

    # 재정 데이터 조회
    fiscal_result = await db.execute(
        select(FiscalYearly).where(FiscalYearly.president_id == president_id)
        .order_by(FiscalYearly.year)
    )
    fiscal_data = fiscal_result.scalars().all()

    return {
        "data": {
            "id": president.id,
            "name": president.name,
            "name_en": president.name_en,
            "term_start": str(president.term_start),
            "term_end": str(president.term_end) if president.term_end else None,
            "party": president.party,
            "era": president.era,
            "gdp_growth_avg": _safe_float(president.gdp_growth_avg),
            "portrait_url": president.portrait_url,
            "key_metric": president.key_metric,
            "economic_performance": _build_economic_performance(
                fiscal_data, president.gdp_growth_avg,
            ),
            "fiscal_data": [_serialize_fiscal(f) for f in fiscal_data],
            "policies": [_serialize_policy(p) for p in policies],
            "key_events": [_serialize_event(e) for e in events],
        },
        "출처": "국정투명 DB — 대통령 상세 정보",
    }


# ──────────────────────────────────────
# 공약 이행 현황
# ──────────────────────────────────────

@router.get("/presidents/{president_id}/pledges")
async def get_president_pledges(president_id: str, db: AsyncSession = Depends(get_db)):
    """공약(정책) 이행 현황 조회 — 이행 상태별 필터링"""
    president = await _get_president_or_404(president_id, db)

    result = await db.execute(
        select(Policy).where(Policy.president_id == president_id)
        .order_by(Policy.priority_rank.nulls_last(), Policy.start_date)
    )
    policies = result.scalars().all()

    summary = _build_pledge_summary(policies)

    return {
        "data": {
            "president_id": president.id,
            "president_name": president.name,
            "pledge_summary": summary.model_dump(),
            "pledges": [_serialize_policy(p) for p in policies],
        },
        "출처": "국정투명 DB — 공약 이행 현황",
    }


# ──────────────────────────────────────
# 국정과제
# ──────────────────────────────────────

@router.get("/presidents/{president_id}/national-agenda")
async def get_national_agenda(president_id: str, db: AsyncSession = Depends(get_db)):
    """국정과제 목록 조회 — 이행 현황 포함"""
    president = await _get_president_or_404(president_id, db)

    result = await db.execute(
        select(NationalAgenda).where(NationalAgenda.president_id == president_id)
        .order_by(NationalAgenda.agenda_number)
    )
    agenda_items = result.scalars().all()

    # 국정과제 이행 통계
    total = len(agenda_items)
    completed = sum(1 for a in agenda_items if a.implementation_status == "완료")
    in_progress = sum(1 for a in agenda_items if a.implementation_status == "추진중")
    not_started = sum(1 for a in agenda_items if a.implementation_status == "미착수")
    abandoned = sum(1 for a in agenda_items if a.implementation_status == "폐기")

    avg_completion = None
    rates = [float(a.completion_rate) for a in agenda_items if a.completion_rate is not None]
    if rates:
        avg_completion = round(sum(rates) / len(rates), 1)

    return {
        "data": {
            "president_id": president.id,
            "president_name": president.name,
            "통계": {
                "총_과제수": total,
                "완료": completed,
                "추진중": in_progress,
                "미착수": not_started,
                "폐기": abandoned,
                "평균_이행률": avg_completion,
            },
            "과제_목록": [_serialize_agenda_full(a) for a in agenda_items],
        },
        "출처": "국정투명 DB — 국정과제 이행 현황",
    }


# ──────────────────────────────────────
# 대통령 성과표
# ──────────────────────────────────────

@router.get("/presidents/{president_id}/report-card")
async def get_report_card(president_id: str, db: AsyncSession = Depends(get_db)):
    """대통령 성과표 — 취임 전후 핵심 지표 비교"""
    president = await _get_president_or_404(president_id, db)

    result = await db.execute(
        select(PresidentialReportCard)
        .where(PresidentialReportCard.president_id == president_id)
        .order_by(PresidentialReportCard.category)
    )
    cards = result.scalars().all()

    # 카테고리별 그룹핑
    by_category: dict[str, list[dict]] = {}
    grade_counts: dict[str, int] = {}
    for c in cards:
        cat = c.category or "기타"
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(_serialize_report_card_full(c))
        if c.grade:
            grade_counts[c.grade] = grade_counts.get(c.grade, 0) + 1

    return {
        "data": {
            "president_id": president.id,
            "president_name": president.name,
            "총_지표수": len(cards),
            "등급_분포": grade_counts,
            "카테고리별_성과": by_category,
        },
        "출처": "국정투명 DB — 한국은행, 통계청 등 공식 데이터 기반",
    }


# ──────────────────────────────────────
# 예산 비교
# ──────────────────────────────────────

@router.get("/presidents/{president_id}/budget-comparison")
async def get_budget_comparison(president_id: str, db: AsyncSession = Depends(get_db)):
    """정책별 예산 배정 vs 집행 비교"""
    president = await _get_president_or_404(president_id, db)

    result = await db.execute(
        select(Policy).where(
            Policy.president_id == president_id,
            Policy.budget_allocated.is_not(None),
        ).order_by(Policy.budget_allocated.desc())
    )
    policies = result.scalars().all()

    items: list[dict] = []
    total_allocated = 0.0
    total_spent = 0.0

    for p in policies:
        alloc = float(p.budget_allocated) if p.budget_allocated else 0.0
        spent = float(p.budget_spent) if p.budget_spent else 0.0
        exec_rate = round(spent / alloc * 100, 1) if alloc > 0 else None

        total_allocated += alloc
        total_spent += spent

        items.append({
            "policy_id": str(p.id),
            "title": p.title,
            "category": p.category,
            "budget_allocated": alloc,
            "budget_spent": spent,
            "execution_rate": exec_rate,
        })

    avg_rate = round(total_spent / total_allocated * 100, 1) if total_allocated > 0 else None

    return {
        "data": {
            "president_id": president.id,
            "president_name": president.name,
            "총_배정": round(total_allocated, 2),
            "총_집행": round(total_spent, 2),
            "평균_집행률": avg_rate,
            "정책별": items,
        },
        "출처": "국정투명 DB — 정책별 예산 데이터 (단위: 억원)",
    }


# ──────────────────────────────────────
# 통합 상세 (Full)
# ──────────────────────────────────────

@router.get("/presidents/{president_id}/full")
async def get_president_full(president_id: str, db: AsyncSession = Depends(get_db)):
    """대통령 전체 정보 통합 조회 — 정책, 국정과제, 성과표, 주요 사건, 공약 요약"""
    president = await _get_president_or_404(president_id, db)

    # 모든 관련 데이터 병렬 조회
    policies_result = await db.execute(
        select(Policy).where(Policy.president_id == president_id)
        .order_by(Policy.priority_rank.nulls_last(), Policy.start_date)
    )
    policies = policies_result.scalars().all()

    events_result = await db.execute(
        select(KeyEvent).where(KeyEvent.president_id == president_id)
        .order_by(KeyEvent.event_date)
    )
    events = events_result.scalars().all()

    fiscal_result = await db.execute(
        select(FiscalYearly).where(FiscalYearly.president_id == president_id)
        .order_by(FiscalYearly.year)
    )
    fiscal_data = fiscal_result.scalars().all()

    agenda_result = await db.execute(
        select(NationalAgenda).where(NationalAgenda.president_id == president_id)
        .order_by(NationalAgenda.agenda_number)
    )
    agenda_items = agenda_result.scalars().all()

    report_result = await db.execute(
        select(PresidentialReportCard)
        .where(PresidentialReportCard.president_id == president_id)
        .order_by(PresidentialReportCard.category)
    )
    report_cards = report_result.scalars().all()

    pledge_summary = _build_pledge_summary(policies)

    return {
        "data": {
            "id": president.id,
            "name": president.name,
            "name_en": president.name_en,
            "term_start": str(president.term_start),
            "term_end": str(president.term_end) if president.term_end else None,
            "party": president.party,
            "era": president.era,
            "gdp_growth_avg": _safe_float(president.gdp_growth_avg),
            "portrait_url": president.portrait_url,
            "key_metric": president.key_metric,
            "economic_performance": _build_economic_performance(
                fiscal_data, president.gdp_growth_avg,
            ),
            "fiscal_data": [_serialize_fiscal(f) for f in fiscal_data],
            "policies": [_serialize_policy(p) for p in policies],
            "national_agenda": [_serialize_agenda_brief(a) for a in agenda_items],
            "report_card": [_serialize_report_card_brief(r) for r in report_cards],
            "key_events": [_serialize_event(e) for e in events],
            "pledge_summary": pledge_summary.model_dump(),
        },
        "출처": "국정투명 DB — 대통령 종합 정보",
    }
