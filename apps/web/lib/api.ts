// 국정투명 API 클라이언트

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
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API 오류: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// 대통령 API
export const presidentsApi = {
  list: () => apiFetch<any>('/api/v1/presidents'),
  get: (id: string) => apiFetch<any>(`/api/v1/presidents/${id}`),
};

// 예산 API
export const budgetApi = {
  yearly: (startYear = 1998, endYear = 2026) =>
    apiFetch<any>(`/api/v1/budget/yearly?start_year=${startYear}&end_year=${endYear}`),
  sectors: (year = 2026) => apiFetch<any>(`/api/v1/budget/sectors?year=${year}`),
  department: (name: string, year = 2026) =>
    apiFetch<any>(`/api/v1/budget/department/${name}?year=${year}`),
};

// 법안 API
export const billsApi = {
  list: (page = 1, size = 20) => apiFetch<any>(`/api/v1/bills?page=${page}&size=${size}`),
  get: (id: string) => apiFetch<any>(`/api/v1/bills/${id}`),
};

// 국회의원 API
export const legislatorsApi = {
  list: (page = 1) => apiFetch<any>(`/api/v1/legislators?page=${page}`),
  get: (id: string) => apiFetch<any>(`/api/v1/legislators/${id}`),
  ranking: (sortBy = 'ai_activity_score') =>
    apiFetch<any>(`/api/v1/legislators/ranking?sort_by=${sortBy}`),
  consistency: (id: string) => apiFetch<any>(`/api/v1/legislators/${id}/consistency`),
};

// 감사 API
export const auditApi = {
  heatmap: (year = 2026) => apiFetch<any>(`/api/v1/audit/heatmap?year=${year}`),
  flags: (page = 1) => apiFetch<any>(`/api/v1/audit/flags?page=${page}`),
  get: (id: string) => apiFetch<any>(`/api/v1/audit/${id}`),
};

// 뉴스 API
export const newsApi = {
  today: () => apiFetch<any>('/api/v1/news/today'),
};

// 설문 API
export const surveyApi = {
  active: () => apiFetch<any>('/api/v1/surveys/active'),
  get: (id: string) => apiFetch<any>(`/api/v1/surveys/${id}`),
};

// 검색 API
export const searchApi = {
  search: (q: string, page = 1) => apiFetch<any>(`/api/v1/search?q=${q}&page=${page}`),
};

// 크레딧 API
export const creditsApi = {
  balance: () => apiFetch<any>('/api/v1/credits/balance'),
};

// 용어 사전 API
export const glossaryApi = {
  get: (term: string) => apiFetch<any>(`/api/v1/glossary/${term}`),
};
