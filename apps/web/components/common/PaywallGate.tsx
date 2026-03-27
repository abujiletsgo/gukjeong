'use client';
// 페이월 게이트 — 유료 기능 접근 제한 UI

interface PaywallGateProps {
  requiredTier: 'citizen_pro' | 'institution';
  currentTier?: string;
  children: React.ReactNode;
  featureName: string;
}

export default function PaywallGate({ requiredTier, currentTier, children, featureName }: PaywallGateProps) {
  const tierLabels: Record<string, string> = {
    citizen_pro: '시민 Pro',
    institution: '기관',
  };

  const hasAccess = currentTier === requiredTier || currentTier === 'institution';

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative" role="region" aria-label={`${featureName} — 유료 기능`}>
      <div className="blur-sm pointer-events-none" aria-hidden="true">{children}</div>
      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl">
        <div className="text-4xl mb-3" aria-hidden="true">🔒</div>
        <p className="font-semibold text-gray-900 mb-1">{tierLabels[requiredTier]} 전용 기능</p>
        <p className="text-sm text-gray-500 mb-4">{featureName}을(를) 이용하려면 업그레이드하세요.</p>
        <a href="/pricing" className="btn-primary text-sm">
          요금제 보기
        </a>
      </div>
    </div>
  );
}
