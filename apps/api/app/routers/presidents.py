"""대통령 API 라우터 — Phase 1 구현"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.president import President, Policy, KeyEvent
from app.models.fiscal import FiscalYearly

router = APIRouter()


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
            "total_spending": float(f.total_spending) if f.total_spending else None,
            "total_revenue": float(f.total_revenue) if f.total_revenue else None,
            "national_debt": float(f.national_debt) if f.national_debt else None,
            "debt_to_gdp": float(f.debt_to_gdp) if f.debt_to_gdp else None,
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
            "gdp_growth_avg": float(p.gdp_growth_avg) if p.gdp_growth_avg else None,
            "portrait_url": p.portrait_url,
            "key_metric": p.key_metric,
            "fiscal_data": fiscal_by_president.get(p.id, []),
        }
        for p in presidents
    ]}


@router.get("/presidents/{president_id}")
async def get_president(president_id: str, db: AsyncSession = Depends(get_db)):
    """대통령 상세 정보 — 정책, 주요 사건, 재정 데이터 포함"""
    result = await db.execute(
        select(President).where(President.id == president_id)
    )
    president = result.scalar_one_or_none()
    if not president:
        raise HTTPException(status_code=404, detail="대통령 정보를 찾을 수 없습니다")

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

    # 경제 성과 지표 계산
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
        "data": {
            "id": president.id,
            "name": president.name,
            "name_en": president.name_en,
            "term_start": str(president.term_start),
            "term_end": str(president.term_end) if president.term_end else None,
            "party": president.party,
            "era": president.era,
            "gdp_growth_avg": float(president.gdp_growth_avg) if president.gdp_growth_avg else None,
            "portrait_url": president.portrait_url,
            "key_metric": president.key_metric,
            "economic_performance": {
                "gdp_growth_avg": float(president.gdp_growth_avg) if president.gdp_growth_avg else None,
                "spending_change_pct": spending_change,
                "debt_change_pct": debt_change,
                "first_year_spending": spending_values[0] if spending_values else None,
                "last_year_spending": spending_values[-1] if spending_values else None,
                "first_year_debt": debt_values[0] if debt_values else None,
                "last_year_debt": debt_values[-1] if debt_values else None,
            },
            "fiscal_data": [{
                "year": f.year,
                "total_spending": float(f.total_spending) if f.total_spending else None,
                "total_revenue": float(f.total_revenue) if f.total_revenue else None,
                "national_debt": float(f.national_debt) if f.national_debt else None,
                "debt_to_gdp": float(f.debt_to_gdp) if f.debt_to_gdp else None,
                "gdp": float(f.gdp) if f.gdp else None,
            } for f in fiscal_data],
            "policies": [{
                "id": str(p.id),
                "title": p.title,
                "category": p.category,
                "description": p.description,
                "status": p.status,
                "impact_score": p.impact_score,
                "ai_summary": p.ai_summary,
                "start_date": str(p.start_date) if p.start_date else None,
                "end_date": str(p.end_date) if p.end_date else None,
            } for p in policies],
            "key_events": [{
                "id": str(e.id),
                "event_date": str(e.event_date),
                "title": e.title,
                "description": e.description,
                "impact_type": e.impact_type,
                "significance_score": e.significance_score,
            } for e in events],
        }
    }
