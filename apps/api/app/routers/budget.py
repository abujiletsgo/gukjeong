"""예산 API 라우터"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.fiscal import FiscalYearly, FiscalBySector, FiscalByDepartment

router = APIRouter()


@router.get("/budget/yearly")
async def get_yearly_budget(
    start_year: int = Query(1998, ge=1998),
    end_year: int = Query(2026, le=2030),
    db: AsyncSession = Depends(get_db),
):
    """연도별 재정 시계열 데이터"""
    result = await db.execute(
        select(FiscalYearly)
        .where(FiscalYearly.year >= start_year, FiscalYearly.year <= end_year)
        .order_by(FiscalYearly.year)
    )
    data = result.scalars().all()
    return {"data": [
        {
            "year": d.year,
            "total_spending": float(d.total_spending) if d.total_spending else None,
            "total_revenue": float(d.total_revenue) if d.total_revenue else None,
            "national_debt": float(d.national_debt) if d.national_debt else None,
            "debt_to_gdp": float(d.debt_to_gdp) if d.debt_to_gdp else None,
            "president_id": d.president_id,
        }
        for d in data
    ]}


@router.get("/budget/sectors")
async def get_budget_by_sector(
    year: int = Query(2026),
    db: AsyncSession = Depends(get_db),
):
    """분야별 예산 현황"""
    result = await db.execute(
        select(FiscalBySector).where(FiscalBySector.year == year).order_by(FiscalBySector.amount.desc())
    )
    sectors = result.scalars().all()
    return {"data": [
        {
            "sector": s.sector,
            "amount": float(s.amount) if s.amount else None,
            "percentage": float(s.percentage) if s.percentage else None,
            "yoy_change": float(s.yoy_change) if s.yoy_change else None,
        }
        for s in sectors
    ]}


@router.get("/budget/department/{name}")
async def get_budget_by_department(
    name: str,
    year: int = Query(2026),
    db: AsyncSession = Depends(get_db),
):
    """부처별 예산 상세 (Pro 티어)"""
    result = await db.execute(
        select(FiscalByDepartment)
        .where(FiscalByDepartment.department == name, FiscalByDepartment.year == year)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        return {"data": None}
    return {"data": {
        "department": dept.department,
        "year": dept.year,
        "budget_proposed": dept.budget_proposed,
        "budget_approved": dept.budget_approved,
        "budget_executed": dept.budget_executed,
        "execution_rate": float(dept.execution_rate) if dept.execution_rate else None,
    }}
