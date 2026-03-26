"""감사 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditFlagBrief(BaseModel):
    id: str
    pattern_type: str
    severity: str
    suspicion_score: int
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    status: str = "detected"


class DepartmentScore(BaseModel):
    department: str
    suspicion_score: int
    flag_count: int
    transparency_rank: Optional[int] = None
