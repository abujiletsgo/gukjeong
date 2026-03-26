"""기본 스크래퍼 클래스 — 재시도, 레이트 리밋, 에러 처리"""
import asyncio
import logging
from typing import Optional, Any
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class BaseScraper:
    """모든 스크래퍼의 기본 클래스"""

    BASE_URL: str = ""
    RATE_LIMIT_PER_DAY: int = 1000
    TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    RETRY_DELAY: float = 1.0

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self._request_count = 0
        self._last_reset = datetime.now()
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        """HTTP 클라이언트 (싱글톤)"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.TIMEOUT,
                headers={"User-Agent": "GukjeongTumyeong/0.1 (civic-transparency)"},
            )
        return self._client

    async def close(self):
        """클라이언트 종료"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _check_rate_limit(self):
        """일일 요청 제한 확인"""
        now = datetime.now()
        if (now - self._last_reset).days >= 1:
            self._request_count = 0
            self._last_reset = now
        if self._request_count >= self.RATE_LIMIT_PER_DAY:
            raise Exception(f"일일 요청 한도 초과: {self.RATE_LIMIT_PER_DAY}")
        self._request_count += 1

    async def fetch(
        self,
        endpoint: str,
        params: Optional[dict] = None,
        method: str = "GET",
    ) -> dict:
        """API 호출 (재시도 로직 포함)"""
        self._check_rate_limit()
        client = await self.get_client()
        url = f"{self.BASE_URL}{endpoint}"

        for attempt in range(self.MAX_RETRIES):
            try:
                if method == "GET":
                    response = await client.get(url, params=params)
                else:
                    response = await client.post(url, json=params)

                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                logger.warning(f"HTTP 오류 {e.response.status_code}: {url} (시도 {attempt + 1}/{self.MAX_RETRIES})")
                if e.response.status_code == 429:
                    # 레이트 리밋 → 더 오래 대기
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1) * 5)
                elif e.response.status_code >= 500:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                else:
                    raise
            except (httpx.ConnectError, httpx.ReadTimeout) as e:
                logger.warning(f"연결 오류: {url} (시도 {attempt + 1}/{self.MAX_RETRIES}): {e}")
                await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))

        raise Exception(f"최대 재시도 횟수 초과: {url}")

    async def fetch_all_pages(
        self,
        endpoint: str,
        params: dict,
        page_key: str = "pageNo",
        size_key: str = "numOfRows",
        page_size: int = 100,
        max_pages: int = 100,
    ) -> list:
        """페이지네이션 지원 전체 데이터 수집"""
        all_items = []
        for page in range(1, max_pages + 1):
            params[page_key] = page
            params[size_key] = page_size
            data = await self.fetch(endpoint, params)

            items = self._extract_items(data)
            if not items:
                break
            all_items.extend(items)

            if len(items) < page_size:
                break

            await asyncio.sleep(0.1)  # 요청 간 간격

        return all_items

    def _extract_items(self, response: dict) -> list:
        """응답에서 아이템 리스트 추출 (하위 클래스에서 오버라이드)"""
        return response.get("data", response.get("items", []))
