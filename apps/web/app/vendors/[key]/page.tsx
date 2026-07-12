import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVendorByKey, getTopVendorsFromIndex } from '@/lib/vendors';
import PatternBadge from '@/components/audit/PatternBadge';
import BackLink from '@/components/common/BackLink';
import { formatKRW } from '@/lib/utils';

export const dynamicParams = true;

export async function generateStaticParams() {
  return getTopVendorsFromIndex(100).map(([key]) => ({ key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const v = await getVendorByKey(key);
  return {
    title: v ? `${v.name} — 업체 프로필` : '업체 프로필',
    description: v
      ? `${v.name}: 감사 플래그 ${v.flag_count}건 · 거래 기관 ${v.institution_count}곳 · 관련 계약 ${formatKRW(v.contracts_total)}`
      : '정부 조달 업체 프로필',
  };
}

export default async function VendorPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const v = await getVendorByKey(key);
  if (!v) notFound();

  const scoreColor = v.max_score >= 60 ? '#FF3B30' : v.max_score >= 35 ? '#FF9500' : '#34C759';

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-4">
        <BackLink fallback="/vendors" label="업체 목록" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors" />
      </div>

      {/* ── 헤더: 한눈에 보기 ── */}
      <div className="card mb-6 overflow-hidden p-0">
        <div className="h-2" style={{ backgroundColor: scoreColor }} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{v.name}</h1>
              {v.bizno && <p className="text-xs text-gray-400 mt-1">사업자등록번호 {v.bizno}</p>}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                {v.patterns.slice(0, 6).map(p => <PatternBadge key={p} pattern={p} size="sm" />)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-black tabular-nums" style={{ color: scoreColor }}>{v.max_score}</div>
              <div className="text-[10px] text-gray-400">최고 의심 점수</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
            {([
              [`${v.flag_count}건`, '감사 플래그'],
              [`${v.institution_count}곳`, '거래 기관'],
              [`${v.contracts_count}건`, '관련 계약'],
              [formatKRW(v.contracts_total), '계약 총액'],
            ] as [string, string][]).map(([val, label]) => (
              <div key={label} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-sm font-bold text-gray-900">{val}</div>
                <div className="text-[11px] text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 기업 정보 ── */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-3">기업 정보</h2>
        {v.company ? (
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {([
              ['개업일', v.company.opbizDt?.slice(0, 10)],
              ['소재지', v.company.adrs],
              ['지역', v.company.rgnNm],
              ['종업원 수', v.company.emplyeNum != null ? `${v.company.emplyeNum}명` : null],
              ['업종', v.company.mnfctDivNm],
              ['홈페이지', v.company.hmpgAdrs],
            ] as [string, string | null | undefined][]).filter(([, val]) => val).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-4 py-1 border-b border-gray-50">
                <dt className="text-gray-400 shrink-0">{label}</dt>
                <dd className="text-gray-800 text-right break-all">
                  {label === '홈페이지'
                    ? <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{val}</a>
                    : val}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-gray-400">나라장터 기업 등록 정보와 자동 매칭되지 않았습니다. 감사 데이터에 나타난 업체명 기준으로 집계합니다.</p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          부정당업자 제재 이력: {v.sanctions.length > 0 ? `${v.sanctions.length}건` : '수집된 데이터 없음'}
        </p>
      </div>

      {/* ── 감사 플래그 목록 ── */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">이 업체가 등장한 감사 플래그</h2>
        <p className="text-xs text-gray-400 mb-4">클릭하면 해당 감사 상세(증거 포함)로 이동합니다 · 상위 {v.flags.length}건</p>
        <div className="space-y-2">
          {v.flags.map((f) => (
            <Link
              key={`${f.id}-${f.institution}`}
              href={`/audit/${f.id}`}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <PatternBadge pattern={f.pattern_type} size="sm" />
                  <span className="text-xs text-gray-500 font-medium">{f.institution}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{f.summary}</p>
              </div>
              <span className="text-lg font-bold shrink-0" style={{ color: f.score >= 60 ? '#FF3B30' : f.score >= 35 ? '#FF9500' : '#34C759' }}>
                {f.score}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 관련 계약 표 ── */}
      {v.contracts_sample.length > 0 && (
        <div className="card mb-6 overflow-x-auto">
          <h2 className="font-bold text-lg mb-1">관련 계약</h2>
          <p className="text-xs text-gray-400 mb-3">감사 플래그에 증거로 첨부된 계약 {v.contracts_count}건 중 {v.contracts_sample.length}건 표시</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">계약명</th>
                <th className="py-2 pr-3 font-medium">발주 기관</th>
                <th className="py-2 pr-3 font-medium text-right">금액</th>
                <th className="py-2 pr-3 font-medium">방식</th>
                <th className="py-2 font-medium">일자</th>
              </tr>
            </thead>
            <tbody>
              {v.contracts_sample.map((c, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 pr-3 text-gray-800">
                    {c.url
                      ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">{c.name}</a>
                      : c.name}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{c.institution}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-800">{formatKRW(c.amount)}</td>
                  <td className="py-2 pr-3 text-gray-500">{c.method}</td>
                  <td className="py-2 text-gray-400">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-gray-300 text-center">
        본 프로필은 나라장터 공개 데이터의 AI 패턴 분석 결과를 업체 기준으로 재구성한 것입니다. 의심 패턴 ≠ 위법 확정.
      </p>
    </div>
  );
}
