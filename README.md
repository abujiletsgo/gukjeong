# 국정투명 (GukjeongTumyeong)

> 수치로 보는 대한민국 정부

## 소개

국정투명은 시민이 대한민국 정부의 운영을 수치 기반으로 투명하게 볼 수 있도록 설계된 플랫폼입니다.

## 주요 기능

- **대통령 비교**: 역대 대통령별 재정/정책/거버넌스 지표 비교
- **예산 시각화**: 세입/세출/국가채무 인터랙티브 차트
- **AI 감사관**: 나라장터 계약 데이터에서 10가지 의심 패턴 자동 탐지
- **뉴스 프레임**: 같은 사건을 진보/보수 미디어가 어떻게 보도하는지 비교
- **국회의원 성적표**: 공약 이행률, 출석률, 말과 행동 일치도
- **숙의 설문**: 데이터 기반 시민 참여 설문

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 차트 | D3.js + Recharts |
| 백엔드 | FastAPI (Python 3.11+) |
| AI | Claude API (Sonnet 4) |
| DB | PostgreSQL 16 + pgvector |
| 검색 | Meilisearch |
| 캐시/큐 | Redis + Celery |

## 시작하기

### 필수 조건

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose

### 로컬 개발 환경

1. 인프라 시작: cd infra && docker compose up -d
2. 백엔드: cd apps/api && pip install -e . && alembic upgrade head
3. 프론트엔드: cd apps/web && npm install && npm run dev
4. API 서버: cd apps/api && uvicorn app.main:app --reload

### 환경 변수

 파일을 참고하세요.

## 핵심 원칙

1. 데이터 > 의견
2. 정치적 중립
3. 무료 핵심, 유료 고급
4. 프라이버시 (실명 저장 없음)
5. 오픈소스

## 라이선스

MIT License
