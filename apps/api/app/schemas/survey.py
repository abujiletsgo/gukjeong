"""설문 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional


class SurveyBrief(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str = "draft"
    total_responses: int = 0
