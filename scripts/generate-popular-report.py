#!/usr/bin/env python3
"""
화제의 감사 (Popular Audit Report) 생성기

목적: "지금 화제가 되는 뉴스" 중에서 정부 예산·조달과 연결되는 사안을 골라,
실제 나라장터 감사 데이터에서 흔적(real traces)을 찾아 한 페이지 리포트로 묶는다.

설계 원칙:
  - AI 분석은 Anthropic API가 아니라 Claude Code가 직접 수행한 결과를
    THEMES 의 큐레이션 내러티브로 내장한다. (use Claude Code, not the API)
  - 뉴스 클러스터링/추적/집계는 결정적(deterministic) 파이썬 로직.
  - 무죄 추정 + 피해 기반(harm-based) 서술: 흔적은 "의심 정황"이지 단정이 아님.

입력:
  - apps/web/data/news-rss.json        (uv run scripts/fetch-data.py news 로 갱신)
  - apps/web/data/news-archive.json    (누적 토픽)
  - apps/web/public/data/audit-results.json  (39k+ 감사 발견)

출력:
  - apps/web/public/data/popular-report.json

사용법:
  uv run scripts/fetch-data.py news          # 1) 최신 뉴스 받기
  uv run scripts/generate-popular-report.py  # 2) 리포트 생성
"""

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "apps" / "web" / "data"
PUBLIC_DIR = ROOT / "apps" / "web" / "public" / "data"

NEWS_RSS = DATA_DIR / "news-rss.json"
NEWS_ARCHIVE = DATA_DIR / "news-archive.json"
AUDIT_PATH = PUBLIC_DIR / "audit-results.json"
OUT_PATH = PUBLIC_DIR / "popular-report.json"

STOPWORDS = {
    "기자", "뉴스", "보도", "연합", "속보", "단독", "오전", "오후", "오늘",
    "내일", "어제", "이날", "지난", "관련", "관계", "지적", "강조", "주장",
    "밝혔", "전했", "말했", "했다", "했습", "있다", "있습", "이라고", "이라며",
}


# ────────────────────────────────────────────────────────────────────
#  AUDITABLE THEMES — Claude Code 의 분석 내러티브 (API 미사용)
#
#  각 테마:
#    news_match   : 화제 토픽 제목/기사에 이 정규식이 걸리면 "이 뉴스는 이 테마"
#    audit_query  : 감사 발견(기관+요약+증거)에서 이 정규식이 걸리면 "실제 흔적"
#    inst_focus   : 추적을 이 기관으로 한정 (오탐 방지). None 이면 전체.
#    auditable_angle / what_to_check / citizen_impact : Claude Code 작성 분석
# ────────────────────────────────────────────────────────────────────
THEMES = [
    {
        "id": "wildfire_recovery",
        "label": "산청·하동 산불·수해 재해복구 조달",
        "category": "재해복구",
        "trace_strength": "강함",
        "caveat": (
            "흔적은 산청군·하동군 두 기관으로 한정해 추출했고, 계약명에 "
            "재해복구·산불피해지·응급복구가 직접 명시된 건이 다수다. 직접성이 높다."
        ),
        "news_match": re.compile(r"(산청|하동).*(산불|복구|이재민|피해|기소)|산불.*(산청|하동)"),
        "audit_query": re.compile(r"(산불|재해복구|수해복구|응급복구|호우피해|산사태|복구공사|벌채)"),
        "inst_focus": re.compile(r"(산청군|하동군)"),
        "auditable_angle": (
            "산청·하동 대형 산불과 7월 집중호우는 '재해복구'라는 명목으로 대규모 "
            "긴급·수의계약을 만들어낸다. 재해복구는 신속성 때문에 경쟁입찰 예외가 "
            "광범위하게 허용되는데, 바로 그 점이 동일업체 반복수주·동일대표/주소 "
            "업체 나눠먹기·계약금액 급증의 단골 무대가 된다."
        ),
        "what_to_check": [
            "동일 재해(7.16~20 호우, 산불피해지)에서 같은 업체가 여러 지구를 반복 수주했는가",
            "응급복구를 명분으로 한 수의계약이 단기간에 연속 체결됐는가",
            "벌채·복구 단가가 인근 시군·평년 대비 부풀려졌는가 (계약금액 급증)",
            "낙찰업체들이 동일 대표자·동일 주소를 공유하는 들러리 구조인가",
        ],
        "citizen_impact": (
            "재해복구비는 피해 주민 회복에 쓰여야 할 긴급 예산이다. 여기서 새는 "
            "1원은 곧 무너진 도로·하천·임야의 복구가 그만큼 늦어진다는 뜻이다."
        ),
    },
    {
        "id": "busan_road_subsidence",
        "label": "부산 대심도·내성지하차도 인근 반복 지반침하 / 도로보수",
        "category": "사회기반시설",
        "trace_strength": "중간",
        "caveat": (
            "흔적은 '부산 소재 기관 + 도로·시설 보수/복구' 범위로 추출한 것이며, "
            "내성지하차도 그 현장만을 특정한 것은 아니다. 부산권 도로·보수 조달의 "
            "구조적 리스크를 보여주는 정황으로 읽어야 한다."
        ),
        "news_match": re.compile(r"부산.*(대심도|지하차도|지반|침하|단차|도로\s?보수|긴급\s?보수)"),
        "audit_query": re.compile(r"(도로|지하차도|복구공사|굴착\s?복구|노면|보수|침하|지반)"),
        "inst_focus": re.compile(r"부산"),
        "auditable_angle": (
            "같은 구간에서 지반침하·도로 단차가 반복된다는 것은 (1) 시공 품질 "
            "또는 (2) 보수 발주 구조에 문제가 있다는 신호다. 반복 보수공사는 "
            "'긴급'을 달고 수의·단가계약으로 같은 업체에 흘러가기 쉽다."
        ),
        "what_to_check": [
            "동일 노선·교차로 도로굴착/노면 복구가 단가계약으로 특정 업체에 집중됐는가",
            "'긴급'을 사유로 한 수의계약 비중이 비정상적으로 높은가",
            "지반침하 발생 구간의 원시공·감리 업체와 보수 업체가 겹치는가",
        ],
        "citizen_impact": (
            "지하차도·도로 침하는 시민 안전 직결 사안이다. 부실 보수가 반복되면 "
            "예산은 예산대로 쓰이고 위험은 그대로 남는다."
        ),
    },
    {
        "id": "vulnerable_support",
        "label": "취약계층 지원사업 (그냥드림 등) 확대 발주",
        "category": "복지",
        "trace_strength": "약함",
        "caveat": (
            "그냥드림 같은 결식·취약계층 지원은 상당 부분 보조금·바우처로 집행돼 "
            "나라장터 경쟁조달 데이터에 직접 잡히지 않는다. 아래 흔적은 복지·돌봄 "
            "관련 키워드로 넓게 추린 간접 정황으로, 사업 확대기 일반 리스크의 "
            "예시로만 보아야 한다. (조달 추적의 사각지대 자체가 시사점)"
        ),
        "news_match": re.compile(r"(그냥드림|취약계층|결식|복지\s?사각|시군구로\s?확대)"),
        "audit_query": re.compile(
            r"(취약계층|결식아동|재난취약|복지\s?사각|급식\s?지원|돌봄|"
            r"저소득|기초생활|한부모|독거|푸드뱅크|그냥드림)"
        ),
        "inst_focus": None,
        "auditable_angle": (
            "복지·취약계층 지원사업이 158개 시군구로 빠르게 확대되면 위탁·물품 "
            "발주가 동시다발로 늘어난다. 확대 속도가 빠를수록 수의계약·특정업체 "
            "쏠림·연말 몰아주기 리스크가 함께 커진다."
        ),
        "what_to_check": [
            "지원사업 위탁·물품 계약이 경쟁 없이 동일업체로 반복됐는가",
            "재난취약계층 물품 구입에서 재공고마다 같은 업체가 낙찰됐는가",
            "사업 확대 시점에 연말 신규업체 수의계약이 몰렸는가",
        ],
        "citizen_impact": (
            "복지 예산의 누수는 가장 도움이 절실한 사람에게 갈 몫이 줄어든다는 뜻이다."
        ),
    },
    {
        "id": "disaster_recovery_national",
        "label": "전국 재해복구 수의계약 (배경 패턴)",
        "category": "재해복구",
        "trace_strength": "강함",
        "caveat": (
            "특정 사건이 아니라 '재해복구=수의계약 사각지대'라는 구조를 보여주는 "
            "전국 단위 배경 패턴이다. 계약명에 재해복구·응급복구가 명시된 건 기준."
        ),
        "news_match": re.compile(r"(산불|수해|호우|폭우|침수|재해복구|이재민)"),
        "audit_query": re.compile(r"(재해복구|수해복구|응급복구|호우피해|산사태|긴급복구)"),
        "inst_focus": None,
        "auditable_angle": (
            "특정 지역 산불·수해가 화제가 될 때, 같은 구조의 재해복구 조달 "
            "리스크는 전국에서 동시에 발생한다. 이 테마는 개별 사건을 넘어 "
            "'재해복구 = 수의계약 사각지대'라는 구조적 패턴을 보여준다."
        ),
        "what_to_check": [
            "재해복구를 사유로 한 수의계약이 전국적으로 얼마나 반복되는가",
            "복구공사 다수 수주 업체에 동일대표/주소·담합 정황이 있는가",
        ],
        "citizen_impact": (
            "기후재난이 잦아질수록 재해복구 예산은 매년 늘어난다. 이 사각지대를 "
            "방치하면 누수도 매년 구조적으로 반복된다."
        ),
    },
]

# 화제이지만 정부 조달 감사 대상이 아닌 토픽(정직하게 표기) 분류용
NON_PROCUREMENT = re.compile(
    r"(파업|노사|긴급조정|테러|신변보호|암살|호르무즈|트럼프|대만|연애|열애|"
    r"드라마|아이유|항소심|선고|구형|영장|단식|개소식|단일화|지방선거|무투표|"
    r"우승|황금사자기|실종)"
)


# ── 뉴스 클러스터링 (generate-news-topics.py 와 동일 알고리즘, API 미사용) ──
def kor_tokens(text: str) -> set:
    return {t for t in re.findall(r"[가-힣]{2,}", text or "") if t not in STOPWORDS}


def cluster(items: list) -> list:
    clusters = []  # (tokenset, [articles])
    for a in items:
        tk = kor_tokens(a.get("title", ""))
        merged = False
        for ct, cl in clusters:
            if len(tk & ct) >= 2:
                cl.append(a)
                ct.update(tk)
                merged = True
                break
        if not merged:
            clusters.append((tk, [a]))
    out = []
    for _, arts in clusters:
        if len(arts) < 2:
            continue
        best = max(arts, key=lambda x: len(kor_tokens(x.get("title", ""))))
        outlets = {x.get("outlet_name", "") for x in arts}
        out.append({
            "title": best.get("title", "").strip(),
            "article_count": len(arts),
            "outlet_count": len(outlets),
            "articles": [
                {
                    "outlet": x.get("outlet_name", ""),
                    "title": x.get("title", ""),
                    "link": x.get("link", ""),
                    "pubDate": x.get("pubDate", ""),
                }
                for x in arts[:6]
            ],
            "blob": " ".join(
                (x.get("title", "") + " " + x.get("description", "")) for x in arts
            ),
        })
    # 화제도 점수: 기사수 + 매체수(다양성 가중)
    out.sort(key=lambda c: -(c["article_count"] + c["outlet_count"]))
    return out


def load_popular_topics() -> list:
    rss = json.loads(NEWS_RSS.read_text(encoding="utf-8"))
    topics = cluster(rss.get("items", []))

    # 아카이브의 화제 토픽도 흡수 (큰 사건은 며칠~몇 주 지속됨)
    try:
        arch = json.loads(NEWS_ARCHIVE.read_text(encoding="utf-8"))
        for t in arch.get("topics", []):
            if t.get("article_count", 0) < 2:
                continue
            blob = t.get("title", "") + " " + (t.get("ai_summary") or "") + " " + \
                " ".join(a.get("title", "") for a in t.get("articles", []))
            topics.append({
                "title": t.get("title", ""),
                "article_count": t.get("article_count", 0),
                "outlet_count": t.get("outlet_count", 0),
                "articles": [
                    {
                        "outlet": a.get("outlet_name", ""),
                        "title": a.get("title", ""),
                        "link": a.get("link", ""),
                        "pubDate": a.get("pubDate", ""),
                    }
                    for a in t.get("articles", [])[:6]
                ],
                "blob": blob,
                "from_archive": True,
            })
    except FileNotFoundError:
        pass
    return topics


# ── 감사 데이터에서 실제 흔적 추적 ──
def finding_haystack(f: dict) -> str:
    ev = json.dumps(f.get("evidence_contracts", [])[:5], ensure_ascii=False)
    return " ".join([
        str(f.get("target_institution", "")),
        str(f.get("summary", "")),
        str(f.get("detail", "")),
        ev,
    ])


def trim_finding(f: dict) -> dict:
    ev = []
    for e in f.get("evidence_contracts", [])[:4]:
        ev.append({
            "name": str(e.get("name", ""))[:70],
            "vendor": str(e.get("vendor", ""))[:30],
            "amount": int(float(e.get("amount", 0) or 0)),
            "date": str(e.get("date", ""))[:10],
        })
    return {
        "id": f.get("id"),
        "pattern_type": f.get("pattern_type"),
        "suspicion_score": f.get("suspicion_score"),
        "verdict": f.get("verdict"),
        "target_institution": f.get("target_institution"),
        "summary": str(f.get("summary", ""))[:280],
        "innocent_explanation": str(f.get("innocent_explanation", ""))[:240] or None,
        "evidence_contracts": ev,
    }


def main():
    print("화제의 감사 리포트 생성 시작")
    topics = load_popular_topics()
    print(f"  화제 토픽 후보: {len(topics)}개")

    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    findings = audit.get("findings", [])
    print(f"  감사 발견 로드: {len(findings):,}건")

    # 각 테마에 해당하는 발견 인덱스를 한 번의 패스로 수집
    theme_findings: dict[str, list] = {t["id"]: [] for t in THEMES}
    for f in findings:
        hay = finding_haystack(f)
        for t in THEMES:
            if t["inst_focus"] is not None:
                if not t["inst_focus"].search(str(f.get("target_institution", ""))):
                    continue
            if t["audit_query"].search(hay):
                theme_findings[t["id"]].append(f)

    # 화제 토픽 → 테마 매칭
    matched_entries = []
    used_titles = set()
    watchlist = []

    for topic in topics:
        title = topic["title"]
        if title in used_titles:
            continue
        blob = topic.get("blob", "") + " " + title

        hit_theme = None
        for t in THEMES:
            if t["news_match"].search(blob):
                hit_theme = t
                break

        if hit_theme is None:
            # 화제지만 조달 감사 대상 아님 → 정직하게 워치리스트
            if NON_PROCUREMENT.search(blob) and len(watchlist) < 8:
                watchlist.append({
                    "title": title,
                    "article_count": topic["article_count"],
                    "outlet_count": topic["outlet_count"],
                    "reason": "정부 조달·예산과 직접 연결되는 데이터 흔적 없음 (정치/사회/외교 사안)",
                })
            continue

        used_titles.add(title)
        tf = theme_findings[hit_theme["id"]]
        if not tf:
            continue

        # 점수순 정렬 후 상위 발견 (기관 다양성 위해 dedupe-light)
        tf_sorted = sorted(tf, key=lambda x: -(x.get("suspicion_score") or 0))
        seen = set()
        top = []
        for f in tf_sorted:
            key = (f.get("target_institution"), f.get("pattern_type"),
                   str(f.get("summary", ""))[:40])
            if key in seen:
                continue
            seen.add(key)
            top.append(f)
            if len(top) >= 12:
                break

        # 집계
        insts = Counter(f.get("target_institution", "") for f in tf)
        patterns = Counter(f.get("pattern_type", "") for f in tf)
        vendors = set()
        total_amt = 0
        dates = []
        for f in tf:
            for e in f.get("evidence_contracts", []):
                v = str(e.get("vendor", "")).strip()
                if v:
                    vendors.add(v)
                total_amt += float(e.get("amount", 0) or 0)
                d = str(e.get("date", ""))[:10]
                if re.match(r"\d{4}-\d{2}-\d{2}", d):
                    dates.append(d)

        matched_entries.append({
            "theme_id": hit_theme["id"],
            "theme_label": hit_theme["label"],
            "category": hit_theme["category"],
            "trace_strength": hit_theme["trace_strength"],
            "caveat": hit_theme["caveat"],
            "popular_topic": {
                "title": title,
                "article_count": topic["article_count"],
                "outlet_count": topic["outlet_count"],
                "popularity_score": topic["article_count"] + topic["outlet_count"],
                "from_archive": topic.get("from_archive", False),
                "articles": topic["articles"],
            },
            "analysis": {
                "auditable_angle": hit_theme["auditable_angle"],
                "what_to_check": hit_theme["what_to_check"],
                "citizen_impact": hit_theme["citizen_impact"],
            },
            "traces": {
                "finding_count": len(tf),
                "flagged_evidence_total_won": int(total_amt),
                "distinct_vendors": len(vendors),
                "distinct_institutions": len(insts),
                "date_range": (
                    [min(dates), max(dates)] if dates else None
                ),
                "top_institutions": [
                    {"institution": k, "findings": v}
                    for k, v in insts.most_common(6)
                ],
                "pattern_breakdown": [
                    {"pattern": k, "count": v}
                    for k, v in patterns.most_common(8)
                ],
                "top_findings": [trim_finding(f) for f in top],
            },
        })

    # 테마 우선 + 화제도 순 정렬
    theme_order = {t["id"]: i for i, t in enumerate(THEMES)}
    matched_entries.sort(
        key=lambda e: (
            theme_order.get(e["theme_id"], 99),
            -e["popular_topic"]["popularity_score"],
        )
    )

    report = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "title": "화제의 감사",
        "subtitle": "지금 화제가 되는 뉴스 → 실제 나라장터 조달 데이터에서 찾은 흔적",
        "method": (
            "최신 RSS 뉴스를 클러스터링해 화제 토픽을 뽑고, 정부 예산·조달과 "
            "연결되는 사안만 골라 39,518건의 AI 감사 발견에서 실제 데이터 흔적을 "
            "교차 확인했습니다. 분석 서술은 Claude Code 가 직접 작성했으며, 모든 "
            "수치는 무죄 추정 하에 '의심 정황'으로 해석해야 합니다."
        ),
        "news_source_fetched_at": json.loads(
            NEWS_RSS.read_text(encoding="utf-8")
        ).get("fetched_at", ""),
        "audit_findings_total": len(findings),
        "entries": matched_entries,
        "popular_but_not_procurement": watchlist,
    }

    OUT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    kb = OUT_PATH.stat().st_size // 1024
    print(f"\n✅ {OUT_PATH} ({kb} KB)")
    print(f"   화제 감사 항목: {len(matched_entries)}개")
    for e in matched_entries:
        tr = e["traces"]
        print(
            f"   - [{e['category']}] {e['theme_label']}\n"
            f"       화제: {e['popular_topic']['title'][:46]} "
            f"({e['popular_topic']['popularity_score']}점)\n"
            f"       흔적: {tr['finding_count']}건 / "
            f"{tr['flagged_evidence_total_won']/1e8:.1f}억원 / "
            f"업체 {tr['distinct_vendors']} / 기관 {tr['distinct_institutions']}"
        )
    print(f"   화제이나 조달 무관(워치리스트): {len(watchlist)}개")


if __name__ == "__main__":
    main()
