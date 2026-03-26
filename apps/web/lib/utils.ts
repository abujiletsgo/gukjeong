import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 금액 포맷 (조원 단위)
export function formatTrillions(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}경`;
  }
  if (value >= 1) {
    return `${value.toFixed(1)}조`;
  }
  if (value >= 0.01) {
    return `${(value * 10000).toFixed(0)}억`;
  }
  return `${(value * 100000000).toFixed(0)}만`;
}

// 금액 포맷 (원 단위 → 한국식)
export function formatKRW(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조원`;
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억원`;
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(0)}만원`;
  }
  return `${value.toLocaleString('ko-KR')}원`;
}

// 퍼센트 포맷
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

// 날짜 포맷 (한국식)
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 날짜 포맷 (짧은)
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// 숫자 콤마 포맷
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

// 의심 점수 색상
export function getSeverityColor(score: number): string {
  if (score <= 20) return '#22c55e';  // 녹색
  if (score <= 40) return '#eab308';  // 노랑
  if (score <= 60) return '#f97316';  // 주황
  if (score <= 80) return '#ef4444';  // 빨강
  return '#1f2937';                    // 검정
}

// 의심 점수 라벨
export function getSeverityLabel(score: number): string {
  if (score <= 20) return '정상';
  if (score <= 40) return '관심';
  if (score <= 60) return '주의';
  if (score <= 80) return '경고';
  return '심각';
}

// 미디어 스펙트럼 색상
export function getSpectrumColor(score: number): string {
  if (score < 2.5) return '#3b82f6';  // 진보 (파랑)
  if (score > 3.5) return '#ef4444';  // 보수 (빨강)
  return '#6b7280';                    // 중도 (회색)
}

// 대통령 이니셜 색상 (정당 기반)
export function getPresidentColor(party: string | undefined): string {
  if (!party) return '#6b7280';
  if (party.includes('민주') || party.includes('열린') || party.includes('새정치')) return '#1d4ed8';
  if (party.includes('한나라') || party.includes('새누리') || party.includes('국민의힘') || party.includes('자유')) return '#dc2626';
  return '#6b7280';
}

// 대통령 이니셜 배경색 (밝은 버전)
export function getPresidentBgColor(party: string | undefined): string {
  if (!party) return '#f3f4f6';
  if (party.includes('민주') || party.includes('열린') || party.includes('새정치')) return '#dbeafe';
  if (party.includes('한나라') || party.includes('새누리') || party.includes('국민의힘') || party.includes('자유')) return '#fee2e2';
  return '#f3f4f6';
}

// 임기 기간 (년수)
export function getTermYears(start: string, end: string | null | undefined): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return `${years.toFixed(1)}년`;
}
