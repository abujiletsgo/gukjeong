"""재정 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional


class FiscalYearlySchema(BaseModel):
    year: int
    total_spending: Optional[float] = None
    total_revenue: Optional[float] = None
    national_debt: Optional[float] = None
    debt_to_gdp: Optional[float] = None
    president_id: Optional[str] = None


class FiscalBySectorSchema(BaseModel):
    year: int
    sector: str
    amount: Optional[float] = None
    percentage: Optional[float] = None
    yoy_change: Optional[float] = None
