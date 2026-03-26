"""대통령 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


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


class PresidentDetail(PresidentBase):
    portrait_url: Optional[str] = None
    key_metric: Optional[str] = None


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


class KeyEventBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    event_date: date
    title: str
    description: Optional[str] = None
    impact_type: Optional[str] = None
    significance_score: Optional[int] = None
