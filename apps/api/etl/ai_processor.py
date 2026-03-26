"""Claude AI 분석 파이프라인"""
import logging
from app.services.claude_service import analyze_bill, analyze_audit_flag, analyze_news_frames

logger = logging.getLogger(__name__)


async def process_new_bills(bills: list[dict]) -> list[dict]:
    """새 법안 AI 분석"""
    results = []
    for bill in bills:
        if bill.get("ai_summary"):
            continue  # 이미 분석됨 (캐시)
        try:
            analysis = await analyze_bill(bill["title"], bill.get("content", ""))
            results.append({**bill, **analysis})
        except Exception as e:
            logger.error(f"법안 분석 실패: {bill.get('bill_no')}: {e}")
            results.append(bill)
    return results


async def process_audit_flags(flags: list[dict]) -> list[dict]:
    """감사 플래그 AI 분석"""
    results = []
    for flag in flags:
        try:
            analysis = await analyze_audit_flag(flag.get("detail", {}), flag["pattern_type"])
            flag["ai_analysis"] = analysis
            results.append(flag)
        except Exception as e:
            logger.error(f"감사 분석 실패: {flag.get('pattern_type')}: {e}")
            results.append(flag)
    return results
