"""감사 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditFlagBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    pattern_type: str
    severity: str
    suspicion_score: int
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    detail: Optional[dict] = None
    evidence: Optional[dict] = None
    ai_analysis: Optional[str] = None
    related_bai_case: Optional[str] = None
    status: str = "detected"
    created_at: Optional[datetime] = None


class DepartmentScore(BaseModel):
    model_config = {"from_attributes": True}

    department: str
    year: Optional[int] = None
    quarter: Optional[int] = None
    suspicion_score: int
    flag_count: int
    transparency_rank: Optional[int] = None
    details: Optional[dict] = None
