"""대통령기록관 스크래퍼"""
from scrapers.base import BaseScraper


class PresidentialScraper(BaseScraper):
    """대통령기록관 — 대통령 기록물, 연설문"""
    BASE_URL = "https://www.pa.go.kr"

    async def get_speeches(self, president_id: str) -> list[dict]:
        """대통령 연설문 수집"""
        # TODO: 대통령기록관 크롤링 구현
        return []

    async def get_records(self, president_id: str) -> list[dict]:
        """대통령 기록물 수집"""
        # TODO: 기록물 크롤링 구현
        return []
