'use client';
import { useRouter } from 'next/navigation';

const REGIONS: [string, string][] = [
  ['seoul', '서울'], ['busan', '부산'], ['daegu', '대구'], ['incheon', '인천'],
  ['gwangju', '광주'], ['daejeon', '대전'], ['ulsan', '울산'], ['sejong', '세종'],
  ['gyeonggi', '경기'], ['gangwon', '강원'], ['chungbuk', '충북'], ['chungnam', '충남'],
  ['jeonbuk', '전북'], ['jeonnam', '전남'], ['gyeongbuk', '경북'], ['gyeongnam', '경남'],
  ['jeju', '제주'],
];

/** "내 지역" 개인화 진입점 — 선택 즉시 /local/{region} 이동 */
export default function RegionQuickFinder() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-sm" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
        내 지역 살림살이는?
      </span>
      <select
        defaultValue=""
        onChange={(e) => { if (e.target.value) router.push(`/local/${e.target.value}`); }}
        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:border-blue-400"
        aria-label="내 지역 선택"
      >
        <option value="" disabled>지역 선택</option>
        {REGIONS.map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
    </div>
  );
}
