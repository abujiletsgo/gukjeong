'use client';
// 상태 뱃지

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  'detected': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'active': 'bg-green-50 text-green-700 border-green-200',
  'closed': 'bg-gray-50 text-gray-700 border-gray-200',
  'pending': 'bg-blue-50 text-blue-700 border-blue-200',
  'draft': 'bg-gray-50 text-gray-500 border-gray-200',
  'submitted': 'bg-purple-50 text-purple-700 border-purple-200',
};

const statusLabels: Record<string, string> = {
  'detected': '탐지됨',
  'active': '진행 중',
  'closed': '종료',
  'pending': '대기',
  'draft': '초안',
  'submitted': '제출됨',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  const label = statusLabels[status] || status;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border ${style} ${sizeClass}`} role="status">
      {label}
    </span>
  );
}
