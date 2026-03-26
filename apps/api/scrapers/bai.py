"""감사원 스크래퍼"""
from scrapers.base import BaseScraper


class BAIScraper(BaseScraper):
    """감사원 — 감사 결과, 시정 요구"""
    BASE_URL = "https://www.bai.go.kr"

    async def get_audit_results(self, year: int) -> list[dict]:
        """감사 결과 수집"""
        # TODO: 감사원 웹페이지 크롤링 구현
        return []

    async def get_corrective_actions(self, year: int) -> list[dict]:
        """시정 요구 사항 수집"""
        # TODO: 시정 요구 크롤링 구현
        return []
