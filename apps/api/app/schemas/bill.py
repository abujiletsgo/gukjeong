"""법안 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


class BillBrief(BaseModel):
    id: str
    bill_no: Optional[str] = None
    title: str
    proposed_date: Optional[date] = None
    status: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_category: Optional[str] = None


class BillDetail(BillBrief):
    proposer_type: Optional[str] = None
    proposer_name: Optional[str] = None
    committee: Optional[str] = None
    vote_result: Optional[dict] = None
    ai_citizen_impact: Optional[str] = None
    ai_controversy_score: Optional[int] = None
