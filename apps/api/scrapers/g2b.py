"""나라장터 API 스크래퍼"""
from scrapers.base import BaseScraper


class G2BScraper(BaseScraper):
    """나라장터 — 계약 정보, 입찰 공고"""
    BASE_URL = "https://apis.data.go.kr/1230000"
    RATE_LIMIT_PER_DAY = 1000

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def get_contracts(self, start_date: str, end_date: str, page: int = 1) -> list[dict]:
        """계약 정보 조회"""
        params = {
            "serviceKey": self.api_key, "resultType": "json",
            "numOfRows": 100, "pageNo": page,
            "inqBgnDt": start_date, "inqEndDt": end_date,
        }
        data = await self.fetch("/HrcspSsstndrdInfoService/getHrcspPblctListInfoCntrctInfo", params)
        return self._extract_items(data)

    async def get_bids(self, start_date: str, end_date: str) -> list[dict]:
        """입찰 공고 조회"""
        params = {
            "serviceKey": self.api_key, "resultType": "json",
            "numOfRows": 100, "inqBgnDt": start_date, "inqEndDt": end_date,
        }
        data = await self.fetch("/BidPublicInfoService/getBidPblancListInfoServc", params)
        return self._extract_items(data)

    def _extract_items(self, response: dict) -> list:
        body = response.get("response", {}).get("body", {})
        items = body.get("items", [])
        return items if isinstance(items, list) else []
