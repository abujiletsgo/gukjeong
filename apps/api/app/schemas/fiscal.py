"""재정 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional


class FiscalYearlySchema(BaseModel):
    model_config = {"from_attributes": True}

    year: int
    total_spending: Optional[float] = None
    total_revenue: Optional[float] = None
    tax_revenue: Optional[float] = None
    national_debt: Optional[float] = None
    gdp: Optional[float] = None
    debt_to_gdp: Optional[float] = None
    fiscal_balance: Optional[float] = None
    president_id: Optional[str] = None


class FiscalBySectorSchema(BaseModel):
    model_config = {"from_attributes": True}

    year: int
    sector: str
    amount: Optional[float] = None
    percentage: Optional[float] = None
    yoy_change: Optional[float] = None


class FiscalByDepartmentSchema(BaseModel):
    model_config = {"from_attributes": True}

    year: int
    department: str
    budget_proposed: Optional[int] = None
    budget_approved: Optional[int] = None
    budget_executed: Optional[int] = None
    execution_rate: Optional[float] = None
