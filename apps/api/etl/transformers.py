"""데이터 변환 유틸리티"""
from datetime import datetime, date
from typing import Optional


def parse_korean_date(date_str: str) -> Optional[date]:
    """한국식 날짜 파싱 (YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD)"""
    for fmt in ["%Y%m%d", "%Y-%m-%d", "%Y.%m.%d"]:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
    return None


def amount_to_millions(amount_str: str) -> Optional[int]:
    """금액 문자열을 백만원 단위로 변환"""
    try:
        amount = float(amount_str.replace(",", "").replace("원", ""))
        return int(amount / 1_000_000)
    except (ValueError, AttributeError):
        return None


def trillions_to_display(millions: int) -> str:
    """백만원 → 조원 표시 (예: 639000 → '639조')"""
    trillions = millions / 1_000_000
    if trillions >= 1:
        return f"{trillions:.1f}조"
    billions = millions / 1_000
    return f"{billions:.0f}억"


def normalize_party_name(party: str) -> str:
    """정당명 정규화 (약칭 통일)"""
    mappings = {
        "더불어민주당": "더불어민주당",
        "민주당": "더불어민주당",
        "국민의힘": "국민의힘",
        "국힘": "국민의힘",
        "정의당": "정의당",
    }
    return mappings.get(party, party)
