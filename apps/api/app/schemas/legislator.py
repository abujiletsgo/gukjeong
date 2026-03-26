"""국회의원 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional


class LegislatorBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    party: Optional[str] = None
    district: Optional[str] = None
    ai_activity_score: Optional[int] = None
    consistency_score: Optional[float] = None


class LegislatorDetail(LegislatorBrief):
    bills_proposed_count: int = 0
    attendance_rate: Optional[float] = None
    vote_participation_rate: Optional[float] = None
    pledge_fulfillment_rate: Optional[float] = None
