// 클라이언트 사이드 레이트 리밋 체크

const TIER_SEARCH_LIMITS: Record<string, number> = {
  anonymous: 5,
  free_registered: 15,
  citizen_pro: -1,  // 무제한
  institution: -1,
};

export function checkSearchLimit(tier: string, todayCount: number): boolean {
  const limit = TIER_SEARCH_LIMITS[tier] || 5;
  if (limit === -1) return true;
  return todayCount < limit;
}

export function getRemainingSearches(tier: string, todayCount: number): number {
  const limit = TIER_SEARCH_LIMITS[tier] || 5;
  if (limit === -1) return Infinity;
  return Math.max(0, limit - todayCount);
}
