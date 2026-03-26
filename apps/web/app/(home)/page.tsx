import { getPresidents, getFiscalData, getDepartmentScores, getAuditFlags } from '@/lib/data';
import { formatTrillions } from '@/lib/utils';
import Sparkline from '@/components/charts/Sparkline';

export default function HomePage() {
  const presidents = getPresidents();
  const fiscalData = getFiscalData();
  const departmentScores = getDepartmentScores();
  const auditFlags = getAuditFlags();

  const latest = fiscalData[fiscalData.length - 1];
  const latest2024 = fiscalData.find(f => f.year === 2024);
  const spendingTrend = fiscalData.map(f => f.total_spending || 0).filter(v => v > 0);
  const debtTrend = fiscalData.map(f => f.national_debt || 0).filter(v => v > 0);

  const highSeverityFlags = auditFlags.filter(f => f.severity === 'HIGH').length;

  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-header text-white py-12 sm:py-16">
        <div className="container-page text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            수치로 보는 대한민국 정부
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            공공데이터와 AI 분석으로 정부의 예산, 정책, 계약을 투명하게 보여주는 시민 플랫폼
          </p>

          {/* 핵심 수치 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-bold">{latest?.total_spending || 728}조</div>
              <div className="text-xs text-gray-300 mt-1">2026 총지출(안)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-bold">{latest2024?.national_debt || 1175}조</div>
              <div className="text-xs text-gray-300 mt-1">국가채무 (2024)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-bold">{presidents.length}명</div>
              <div className="text-xs text-gray-300 mt-1">역대 대통령</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-bold">{auditFlags.length}건</div>
              <div className="text-xs text-gray-300 mt-1">AI 감지 의심 패턴</div>
            </div>
          </div>
        </div>
      </section>

      {/* 핵심 기능 카드 */}
      <section className="container-page py-10 sm:py-14">
        <div className="grid md:grid-cols-3 gap-6">
          {/* 대통령 비교 */}
          <a href="/presidents" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="text-4xl mb-4">🏛️</div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
              역대 대통령 비교
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              김영삼부터 현재까지 동일한 경제 지표로 비교합니다.
              GDP 성장률, 정부 지출, 국가채무 변화를 한눈에.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{presidents.length}명의 대통령</span>
              <span>·</span>
              <span>{fiscalData.length}년의 재정 데이터</span>
            </div>
            <div className="mt-4">
              <Sparkline data={spendingTrend} width={200} height={32} color="#3b82f6" showArea label="정부 지출 추이" />
            </div>
          </a>

          {/* 예산 시각화 */}
          <a href="/budget" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
              예산 시각화
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              세입에서 세출까지의 자금 흐름, 분야별 예산 비중,
              국가채무 궤적을 인터랙티브 차트로 확인하세요.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>11개 분야</span>
              <span>·</span>
              <span>Sankey · TreeMap · 스택드 에리어</span>
            </div>
            <div className="mt-4">
              <Sparkline data={debtTrend} width={200} height={32} color="#ef4444" showArea label="국가채무 추이" />
            </div>
          </a>

          {/* AI 감사관 */}
          <a href="/audit" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
              AI 감사관
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              나라장터 계약 데이터에서 AI가 연말 급증, 업체 집중,
              계약 분할 등 의심 패턴을 자동으로 탐지합니다.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{auditFlags.length}건 탐지</span>
              <span>·</span>
              <span>{highSeverityFlags}건 높은 심각도</span>
            </div>
            <div className="mt-4 flex gap-1">
              {departmentScores.slice(0, 8).map(d => (
                <div
                  key={d.department}
                  className="w-6 h-6 rounded text-[6px] flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor: d.suspicion_score > 50 ? '#ef4444' :
                      d.suspicion_score > 30 ? '#f97316' :
                      d.suspicion_score > 15 ? '#eab308' : '#22c55e',
                    opacity: Math.max(0.5, d.suspicion_score / 80),
                  }}
                  title={d.department}
                >
                  {d.suspicion_score}
                </div>
              ))}
            </div>
          </a>
        </div>
      </section>

      {/* 데이터 출처 */}
      <section className="bg-gray-50 py-10 border-t border-gray-100">
        <div className="container-page text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4">공공데이터 기반</h2>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>기획재정부</span>
            <span>한국은행 ECOS</span>
            <span>나라장터 (조달청)</span>
            <span>열린국회정보</span>
            <span>공공데이터포털</span>
          </div>
          <p className="text-xs text-gray-400 mt-4 max-w-xl mx-auto">
            모든 데이터는 대한민국 정부가 공개한 공공데이터를 기반으로 합니다.
            미디어 분류는 학술 연구 기반 참고 분류이며, 감사 분석은 AI 기반 의심 패턴 탐지 결과입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
