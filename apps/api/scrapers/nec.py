"""선거관리위원회 스크래퍼"""
from scrapers.base import BaseScraper


class NECScraper(BaseScraper):
    """선거관리위원회 — 선거 결과, 정치자금"""
    BASE_URL = "https://www.nec.go.kr"

    async def get_election_results(self, election_type: str, year: int) -> list[dict]:
        """선거 결과 수집"""
        # TODO: 선관위 크롤링 구현
        return []

    async def get_political_funds(self, year: int) -> list[dict]:
        """정치자금 수입/지출 수집"""
        # TODO: 정치자금 크롤링 구현
        return []
