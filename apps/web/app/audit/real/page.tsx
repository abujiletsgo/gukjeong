'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuditFinding, EvidenceContract } from '@/lib/audit/patterns';

// -- 타입 정의 --

interface AnalyzeResponse {
  demo: boolean;
  timestamp?: string;
  contracts_analyzed?: number;
  total_available?: number;
  findings_count?: number;
  findings?: AuditFinding[];
  error?: string;
}

interface ContractsResponse {
  items: Record<string, unknown>[];
  totalCount: number;
  page: number;
  size: number;
  error?: string;
}

// -- 패턴 뱃지 색상 --

const PATTERN_COLORS: Record<string, string> = {
  CONTRACT_SPLITTING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  VENDOR_CONCENTRATION: 'bg-purple-50 text-purple-700 border-purple-200',
  YEAREND_SPIKE: 'bg-orange-50 text-orange-700 border-orange-200',
  INFLATED_PRICING: 'bg-rose-50 text-rose-700 border-rose-200',
  REPEATED_SOLE_SOURCE: 'bg-blue-50 text-blue-700 border-blue-200',
};

const PATTERN_LABELS: Record<string, string> = {
  CONTRACT_SPLITTING: '계약 분할 의심',
  VENDOR_CONCENTRATION: '업체 집중',
  YEAREND_SPIKE: '연말 계약 급증',
  INFLATED_PRICING: '고가 계약',
  REPEATED_SOLE_SOURCE: '반복 수의계약',
};

function getSeverityColor(score: number): string {
  if (score <= 30) return '#22c55e';
  if (score <= 50) return '#eab308';
  if (score <= 70) return '#f97316';
  return '#ef4444';
}

function getSeverityLabel(score: number): string {
  if (score <= 30) return '낮음';
  if (score <= 50) return '보통';
  if (score <= 70) return '높음';
  return '매우 높음';
}

function formatAmount(val: unknown): string {
  const n = typeof val === 'number' ? val : parseFloat(String(val || '0'));
  if (!n || isNaN(n)) return '-';
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}조원`;
  if (n >= 100_000_000) return `${Math.round(n / 100_000_000)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만원`;
  return `${n.toLocaleString('ko-KR')}원`;
}

// -- 하위 컴포넌트들 --

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-lg font-semibold text-gray-800 mb-1">분석 중...</p>
      <p className="text-sm text-gray-500">나라장터 데이터를 수집하고 패턴을 분석하고 있습니다</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        API 연결 중 (최대 60초 소요)
      </div>
    </div>
  );
}

function ApiKeyMissing() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">API 키 설정 필요</h2>
      <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
        실시간 분석을 위해 공공데이터포털 API 키가 필요합니다.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-lg mx-auto text-left">
        <p className="text-xs font-mono text-gray-600 mb-2">
          1. <a href="https://www.data.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">data.go.kr</a> 에서 API 키 발급
        </p>
        <p className="text-xs font-mono text-gray-600 mb-2">
          2. .env.local 파일에 추가:
        </p>
        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded mt-1 overflow-x-auto">
{`DATA_GO_KR_API_KEY=발급받은_키`}
        </pre>
        <p className="text-xs font-mono text-gray-600 mt-2">
          3. 서버 재시작 후 이 페이지를 새로고침하세요
        </p>
      </div>
      <a
        href="/audit"
        className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        데모 데이터 분석 보기
      </a>
    </div>
  );
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  const [expanded, setExpanded] = useState(false);
  const severityColor = getSeverityColor(finding.suspicion_score);
  const badgeColor = PATTERN_COLORS[finding.pattern_type] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* 카드 헤더 */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
                {PATTERN_LABELS[finding.pattern_type] || finding.pattern_type}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: severityColor }}
              >
                {finding.severity}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              {finding.target_institution}
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold" style={{ color: severityColor }}>
              {finding.suspicion_score}
            </div>
            <div className="text-[10px] text-gray-400">{getSeverityLabel(finding.suspicion_score)}</div>
          </div>
        </div>

        {/* 요약 */}
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">
          {finding.summary}
        </p>

        {/* 다른 해석 */}
        <div className="mt-3 flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-3">
          <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-green-800 mb-0.5">비리가 아닐 수도 있습니다</p>
            <p className="text-xs text-green-700 leading-relaxed">{finding.innocent_explanation}</p>
          </div>
        </div>

        {/* 증거 계약 토글 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          증거 계약 {finding.evidence_contracts.length}건 보기
        </button>
      </div>

      {/* 증거 계약 목록 (확장) */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="space-y-2">
            {finding.evidence_contracts.map((contract: EvidenceContract, i: number) => (
              <div key={`${contract.cntrctNo}-${i}`} className="bg-white rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {contract.cntrctNm}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[11px] text-gray-500">
                        {contract.cntrctorNm}
                      </span>
                      {contract.cntrctMthdNm && (
                        <span className="text-[11px] text-gray-400">
                          {contract.cntrctMthdNm}
                        </span>
                      )}
                      {contract.cntrctCnclsDt && (
                        <span className="text-[11px] text-gray-400">
                          {contract.cntrctCnclsDt}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                    {formatAmount(contract.cntrctAmt)}
                  </span>
                </div>
                {contract.cntrctNo && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">
                      계약번호: {contract.cntrctNo}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContractBrowser() {
  const [contracts, setContracts] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const loadContracts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit/contracts?page=${p}&size=${pageSize}`);
      const data: ContractsResponse = await res.json();
      setContracts(data.items || []);
      setTotalCount(data.totalCount || 0);
      setPage(p);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts(1);
  }, [loadContracts]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-gray-900">원본 계약 데이터</h2>
        <span className="text-xs text-gray-400">
          총 {totalCount.toLocaleString('ko-KR')}건
        </span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-400">불러오는 중...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          데이터가 없습니다. API 키를 확인해주세요.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">공고번호</th>
                  <th className="px-3 py-2 font-medium">공고명</th>
                  <th className="px-3 py-2 font-medium">기관</th>
                  <th className="px-3 py-2 font-medium text-right">추정가격</th>
                  <th className="px-3 py-2 font-medium">계약방법</th>
                  <th className="px-3 py-2 font-medium">공고일</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, i) => (
                  <tr
                    key={`${c.bidNtceNo || i}`}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-blue-600">
                      <a
                        href={`https://www.g2b.go.kr/pt/menu/selectSubFrame.do?framesrc=/pt/menu/frameTgong.do?bidNtceNo=${c.bidNtceNo || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {String(c.bidNtceNo || '-')}
                      </a>
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate text-gray-800">
                      {String(c.bidNtceNm || '-')}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {String(c.dminsttNm || c.ntceInsttNm || '-')}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 whitespace-nowrap">
                      {formatAmount(c.presmptPrce || c.asignBdgtAmt)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {String(c.cntrctMthdNm || '-')}
                    </td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                      {String(c.bidNtceDt || '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => loadContracts(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
              <span className="text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadContracts(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// -- 메인 페이지 --

export default function RealAuditPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/audit/analyze')
      .then(r => r.json())
      .then((d: AnalyzeResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              실시간 감사 분석
            </h1>
            <p className="text-sm text-gray-500">
              나라장터 공개 데이터 기반 AI 패턴 탐지
            </p>
          </div>
        </div>
      </div>

      {/* 실제 데이터 배너 */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              실제 나라장터 데이터 기반 분석 결과입니다
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              data.go.kr 공공데이터포털 API를 통해 조달청 입찰공고 데이터를 실시간으로 분석합니다.
              모든 계약 번호를 나라장터에서 직접 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* AI 분석 경고 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-xs text-yellow-800">
        이 분석은 AI 기반 자동 탐지 결과이며, <strong>의심 패턴</strong>일 뿐 비리 확정이 아닙니다.
        모든 기관에 동일한 기준이 적용됩니다. 각 항목의 &quot;비리가 아닐 수도 있습니다&quot; 설명을 꼭 함께 읽어주세요.
      </div>

      {/* 메인 콘텐츠 */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 font-medium mb-2">분석 중 오류가 발생했습니다</p>
          <p className="text-sm text-gray-500">{error}</p>
          <a href="/audit" className="inline-block mt-4 text-sm text-gray-400 underline">
            데모 데이터 분석 보기
          </a>
        </div>
      ) : data?.demo ? (
        <ApiKeyMissing />
      ) : data ? (
        <>
          {/* 분석 요약 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">분석 계약 수</div>
              <div className="text-2xl font-bold text-gray-900">
                {(data.contracts_analyzed || 0).toLocaleString('ko-KR')}건
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                전체 {(data.total_available || 0).toLocaleString('ko-KR')}건 중
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">탐지된 의심 패턴</div>
              <div className="text-2xl font-bold" style={{ color: (data.findings_count || 0) > 0 ? '#f97316' : '#22c55e' }}>
                {data.findings_count || 0}건
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">5가지 패턴 분석</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">분석 시각</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {data.timestamp
                  ? new Date(data.timestamp).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">실시간 분석</div>
            </div>
          </div>

          {/* 분석 결과 요약 텍스트 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>{(data.contracts_analyzed || 0).toLocaleString('ko-KR')}건</strong>의 계약을 분석하여{' '}
              <strong className="text-orange-600">{data.findings_count || 0}건</strong>의 의심 패턴을 탐지했습니다.
              {(data.findings_count || 0) === 0 && (
                <span className="text-green-600"> 현재 분석 범위에서 특이 패턴이 발견되지 않았습니다.</span>
              )}
            </p>
          </div>

          {/* 발견된 패턴 카드 목록 */}
          {data.findings && data.findings.length > 0 ? (
            <div className="space-y-4 mb-8">
              <h2 className="font-bold text-lg text-gray-900">탐지된 의심 패턴</h2>
              {data.findings.map((finding: AuditFinding, idx: number) => (
                <FindingCard key={`${finding.pattern_type}-${finding.target_institution}-${idx}`} finding={finding} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 mb-8 bg-green-50 border border-green-200 rounded-xl">
              <div className="text-3xl mb-2">&#9989;</div>
              <p className="text-green-800 font-semibold">특이 패턴 없음</p>
              <p className="text-xs text-green-600 mt-1">
                현재 분석 범위의 계약 데이터에서 의심할 만한 패턴이 발견되지 않았습니다.
              </p>
            </div>
          )}

          {/* 원본 계약 데이터 브라우저 */}
          <div className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white">
            <ContractBrowser />
          </div>
        </>
      ) : null}

      {/* 데모 분석 링크 */}
      <div className="mt-6 text-center">
        <a href="/audit" className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors">
          ← AI 감사관 (데모 데이터) 돌아가기
        </a>
      </div>

      {/* 데이터 출처 */}
      <div className="mt-8 border-t border-gray-100 pt-4">
        <p className="text-[10px] text-gray-300 text-center">
          데이터 출처: 공공데이터포털(data.go.kr) &middot; 조달청 나라장터 입찰공고정보서비스
          &middot; 의심 패턴은 AI 자동 분석 결과이며 비리 확정이 아닙니다
          &middot; 계약 번호를 클릭하면 나라장터에서 원본 공고를 확인할 수 있습니다
        </p>
      </div>
    </div>
  );
}
