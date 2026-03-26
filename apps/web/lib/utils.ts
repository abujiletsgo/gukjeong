import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 금액 포맷 (조원 단위)
export function formatTrillions(value: number): string {
  if (value >= 1) {
    return `${value.toFixed(1)}조`;
  }
  return `${(value * 10000).toFixed(0)}억`;
}

// 퍼센트 포맷
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// 날짜 포맷 (한국식)
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
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

// 미디어 스펙트럼 색상
export function getSpectrumColor(score: number): string {
  if (score < 2.5) return '#3b82f6';  // 진보 (파랑)
  if (score > 3.5) return '#ef4444';  // 보수 (빨강)
  return '#6b7280';                    // 중도 (회색)
}
