"""10가지 감사 의심 패턴 탐지"""
from app.services.audit_engine import (
    PATTERN_WEIGHTS,
    detect_yearend_spike,
    detect_vendor_concentration,
    detect_contract_splitting,
    run_all_patterns,
)

# 패턴 목록 (spec-facts.md 기반)
AUDIT_PATTERNS = [
    {"id": 1, "name": "yearend_spike", "label": "연말 지출 급증", "weight": 15, "description": "Q4 > 40% of annual"},
    {"id": 2, "name": "vendor_concentration", "label": "업체 집중도", "weight": 15, "description": "동일 업체 30%+"},
    {"id": 3, "name": "inflated_pricing", "label": "고가 계약", "weight": 20, "description": "타기관 대비 30%+"},
    {"id": 4, "name": "contract_splitting", "label": "계약 분할", "weight": 20, "description": "수의계약 한도 80-100% 3건+"},
    {"id": 5, "name": "zombie_project", "label": "좀비 사업", "weight": 10, "description": "3년+ 집행률 50% 미만"},
    {"id": 6, "name": "revolving_door", "label": "전관예우", "weight": 30, "description": "퇴직 공무원 → 업체 임원"},
    {"id": 7, "name": "paper_company", "label": "페이퍼 컴퍼니", "weight": 25, "description": "설립 1년 미만 + 5인 미만"},
    {"id": 8, "name": "unnecessary_renovation", "label": "불필요 개보수", "weight": 10, "description": "3년 이내 동일 장소 재공사"},
    {"id": 9, "name": "poor_roi", "label": "낮은 ROI", "weight": 20, "description": "고액 + 모호한 성과 지표"},
    {"id": 10, "name": "bid_rigging", "label": "입찰 담합", "weight": 30, "description": "동일 입찰자 조합 5회+"},
]

# 의심 점수 등급
SEVERITY_SCALE = {
    (0, 20): "LOW",      # 🟢
    (21, 40): "MEDIUM",   # 🟡
    (41, 60): "HIGH",     # 🟠
    (61, 80): "CRITICAL", # 🔴
    (81, 100): "EXTREME", # ⚫
}


def get_severity(score: int) -> str:
    """의심 점수에서 심각도 등급 반환"""
    for (low, high), severity in SEVERITY_SCALE.items():
        if low <= score <= high:
            return severity
    return "LOW"
