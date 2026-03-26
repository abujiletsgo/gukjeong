"""공공데이터포털 기본 스크래퍼"""
from scrapers.base import BaseScraper


class DataGoKrScraper(BaseScraper):
    """data.go.kr 공공데이터포털 — 범용 API 커넥터"""
    BASE_URL = "https://apis.data.go.kr"
    RATE_LIMIT_PER_DAY = 1000

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def get_data(self, service_path: str, params: dict = None) -> list[dict]:
        """범용 데이터 조회"""
        if params is None:
            params = {}
        params["serviceKey"] = self.api_key
        params.setdefault("resultType", "json")
        data = await self.fetch(service_path, params)
        return self._extract_items(data)

    def _extract_items(self, response: dict) -> list:
        body = response.get("response", {}).get("body", {})
        items = body.get("items", {})
        if isinstance(items, dict):
            items = items.get("item", [])
        return items if isinstance(items, list) else [items] if items else []
