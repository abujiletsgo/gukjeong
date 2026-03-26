// 국정투명 API 클라이언트
// Backend router 엔드포인트와 1:1 매칭

const API_BASE = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : '/api/v1';

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = endpoint.startsWith('/api/v1') ? endpoint : API_BASE + endpoint;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  } as RequestInit);
  if (!response.ok) {
    throw new Error('API error: ' + response.status);
  }
  return response.json();
}

// 대통령 — /api/v1/presidents
export const presidentsApi = {
  list: () => apiFetch<any>('/api/v1/presidents'),
  get: (id: string) => apiFetch<any>('/api/v1/presidents/' + id),
};

// 예산 — /api/v1/budget
export const budgetApi = {
  yearly: (startYear = 1998, endYear = 2026) =>
    apiFetch<any>('/api/v1/budget/yearly?start_year=' + startYear + '&end_year=' + endYear),
  sectors: (year = 2026) => apiFetch<any>('/api/v1/budget/sectors?year=' + year),
  sectorTrend: (sector: string, startYear = 2020, endYear = 2026) =>
    apiFetch<any>('/api/v1/budget/sectors/trend?sector=' + encodeURIComponent(sector) + '&start_year=' + startYear + '&end_year=' + endYear),
  departments: (year = 2026) => apiFetch<any>('/api/v1/budget/departments?year=' + year),
  department: (name: string, year = 2026) =>
    apiFetch<any>('/api/v1/budget/department/' + encodeURIComponent(name) + '?year=' + year),
};

// 법안 — /api/v1/bills
export const billsApi = {
  list: (page = 1, size = 20) => apiFetch<any>('/api/v1/bills?page=' + page + '&size=' + size),
  get: (id: string) => apiFetch<any>('/api/v1/bills/' + id),
};

// 국회의원 — /api/v1/legislators
export const legislatorsApi = {
  list: (page = 1) => apiFetch<any>('/api/v1/legislators?page=' + page),
  get: (id: string) => apiFetch<any>('/api/v1/legislators/' + id),
  ranking: (sortBy = 'ai_activity_score') =>
    apiFetch<any>('/api/v1/legislators/ranking?sort_by=' + sortBy),
  consistency: (id: string) => apiFetch<any>('/api/v1/legislators/' + id + '/consistency'),
};

// AI 감사 — /api/v1/audit
export const auditApi = {
  heatmap: (year = 2026) => apiFetch<any>('/api/v1/audit/heatmap?year=' + year),
  flags: (page = 1) => apiFetch<any>('/api/v1/audit/flags?page=' + page),
  summary: () => apiFetch<any>('/api/v1/audit/summary'),
  get: (id: string) => apiFetch<any>('/api/v1/audit/' + id),
};

// 뉴스 — /api/v1/news
export const newsApi = {
  today: () => apiFetch<any>('/api/v1/news/today'),
};

// 설문 — /api/v1/surveys
export const surveyApi = {
  active: () => apiFetch<any>('/api/v1/surveys/active'),
  get: (id: string) => apiFetch<any>('/api/v1/surveys/' + id),
  respond: (id: string, body: unknown) =>
    apiFetch<any>('/api/v1/surveys/' + id + '/respond', { method: 'POST', body }),
};

// 지방정부 — /api/v1/local
export const localApi = {
  get: (region: string) => apiFetch<any>('/api/v1/local/' + encodeURIComponent(region)),
};

// 검색 — /api/v1/search
export const searchApi = {
  search: (q: string, page = 1) => apiFetch<any>('/api/v1/search?q=' + encodeURIComponent(q) + '&page=' + page),
};

// 인증 — /api/v1/auth
export const authApi = {
  kakao: () => apiFetch<any>('/api/v1/auth/kakao', { method: 'POST' }),
  naver: () => apiFetch<any>('/api/v1/auth/naver', { method: 'POST' }),
  me: () => apiFetch<any>('/api/v1/auth/me'),
};

// 크레딧 — /api/v1/credits
export const creditsApi = {
  balance: () => apiFetch<any>('/api/v1/credits/balance'),
  redeem: () => apiFetch<any>('/api/v1/credits/redeem', { method: 'POST' }),
};

// 댓글 — /api/v1/comments
export const commentsApi = {
  list: (targetType: string, targetId: string, page = 1) =>
    apiFetch<any>('/api/v1/comments?target_type=' + targetType + '&target_id=' + targetId + '&page=' + page),
  replies: (commentId: string) =>
    apiFetch<any>('/api/v1/comments/' + commentId + '/replies'),
  create: (body: { target_type: string; target_id: string; parent_id?: string; content: string }) =>
    apiFetch<any>('/api/v1/comments', { method: 'POST', body }),
  update: (commentId: string, content: string) =>
    apiFetch<any>('/api/v1/comments/' + commentId, { method: 'PUT', body: { content } }),
  delete: (commentId: string) =>
    apiFetch<any>('/api/v1/comments/' + commentId, { method: 'DELETE' }),
  vote: (commentId: string, direction: 'up' | 'down') =>
    apiFetch<any>('/api/v1/comments/' + commentId + '/vote?direction=' + direction, { method: 'POST' }),
};
