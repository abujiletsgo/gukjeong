"""빅카인즈 API 스크래퍼"""
from scrapers.base import BaseScraper


class BigKindsScraper(BaseScraper):
    """빅카인즈 — 뉴스 빅데이터 분석"""
    BASE_URL = "https://tools.kinds.or.kr"

    async def search_news(self, query: str, start_date: str, end_date: str) -> list[dict]:
        """뉴스 검색"""
        params = {
            "query": query,
            "published_date_from": start_date,
            "published_date_to": end_date,
            "return_from": 0,
            "return_size": 100,
            "sort": "date",
        }
        data = await self.fetch("/search/news", params, method="POST")
        return data.get("documents", [])

    async def get_trends(self, keywords: list[str], start_date: str, end_date: str) -> dict:
        """키워드 트렌드 분석"""
        params = {"keyword": keywords, "from": start_date, "until": end_date}
        data = await self.fetch("/search/trend", params, method="POST")
        return data
