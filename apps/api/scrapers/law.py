"""법제처 API 스크래퍼"""
from scrapers.base import BaseScraper


class LawScraper(BaseScraper):
    """국가법령정보 — 법령, 개정 이력"""
    BASE_URL = "https://www.law.go.kr"

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def search_laws(self, query: str, page: int = 1) -> list[dict]:
        """법령 검색"""
        params = {"OC": self.api_key, "target": "law", "query": query, "type": "json", "page": page}
        data = await self.fetch("/DRF/lawSearch.do", params)
        return data.get("LawSearch", {}).get("law", [])

    async def get_law_detail(self, law_id: str) -> dict:
        """법령 상세"""
        params = {"OC": self.api_key, "ID": law_id, "type": "json"}
        data = await self.fetch("/DRF/lawService.do", params)
        return data
