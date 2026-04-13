'use client';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  detected:  { label: '탐지됨',  bg: 'rgba(255,204,0,0.12)',   color: '#B8860B' },
  active:    { label: '진행 중', bg: 'rgba(52,199,89,0.12)',   color: 'var(--apple-green)' },
  closed:    { label: '종료',    bg: 'rgba(142,142,147,0.12)', color: 'var(--apple-gray-1)' },
  pending:   { label: '대기',    bg: 'rgba(255,149,0,0.12)',   color: 'var(--apple-orange)' },
  draft:     { label: '초안',    bg: 'rgba(142,142,147,0.10)', color: 'var(--apple-gray-1)' },
  submitted: { label: '제출됨',  bg: 'rgba(88,86,214,0.12)',   color: 'var(--apple-indigo)' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'rgba(142,142,147,0.10)',
    color: 'var(--apple-gray-1)',
  };

  return (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        borderRadius: 100,
        fontSize: size === 'sm' ? 12 : 14,
        fontWeight: 500,
        background: config.bg,
        color: config.color,
        letterSpacing: '0.1px',
      }}
    >
      {config.label}
    </span>
  );
}
