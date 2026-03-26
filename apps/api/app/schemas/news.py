"""뉴스 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


class NewsEventSchema(BaseModel):
    id: str
    title: str
    event_date: Optional[date] = None
    category: Optional[str] = None
    ai_summary: Optional[str] = None
    article_count: Optional[int] = None
