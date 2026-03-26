"""뉴스 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


class NewsEventSchema(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    event_date: Optional[date] = None
    category: Optional[str] = None
    ai_summary: Optional[str] = None
    key_facts: Optional[list[str]] = None
    progressive_frame: Optional[dict[str, str]] = None
    conservative_frame: Optional[dict[str, str]] = None
    citizen_takeaway: Optional[str] = None
    article_count: Optional[int] = None
