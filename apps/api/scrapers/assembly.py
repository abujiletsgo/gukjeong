"""열린국회정보 API 스크래퍼"""
from scrapers.base import BaseScraper


class AssemblyScraper(BaseScraper):
    """열린국회정보 — 법안, 의원, 투표, 회의록"""
    BASE_URL = "https://open.assembly.go.kr/portal/openapi"
    RATE_LIMIT_PER_DAY = 10000

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def get_bills(self, page: int = 1, size: int = 100) -> list[dict]:
        """의안 목록 조회"""
        params = {"KEY": self.api_key, "Type": "json", "pIndex": page, "pSize": size}
        data = await self.fetch("/nzmimeepazxkubdpn", params)
        return self._extract_items(data)

    async def get_legislators(self) -> list[dict]:
        """현직 국회의원 목록"""
        params = {"KEY": self.api_key, "Type": "json", "pSize": 300}
        data = await self.fetch("/nwvrqwxyaytdsfvhu", params)
        return self._extract_items(data)

    async def get_votes(self, bill_id: str) -> list[dict]:
        """법안 투표 결과"""
        params = {"KEY": self.api_key, "Type": "json", "BILL_ID": bill_id}
        data = await self.fetch("/nojepdqqaweusdfbi", params)
        return self._extract_items(data)

    def _extract_items(self, response: dict) -> list:
        for key in response:
            if isinstance(response[key], list) and len(response[key]) > 1:
                row = response[key][1].get("row", [])
                return row if isinstance(row, list) else [row]
        return []
