'use client';

interface FindingShareBarProps {
  findingId: string;
  institution: string;
  patternType: string;
}

export default function FindingShareBar({
  findingId,
  institution,
  patternType,
}: FindingShareBarProps) {
  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : `https://gukjeong.vercel.app/audit/${findingId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('링크가 복사되었습니다. 카카오톡에 붙여넣기하여 공유하세요.');
      });
    } else {
      // Fallback: open kakao share URL
      const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${institution} 의심 계약 발견 — 국정투명`)}`;
      window.open(kakaoUrl, '_blank', 'width=600,height=500');
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
      style={{
        background: 'var(--apple-gray-6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(60,60,67,0.12)',
      }}
    >
      {/* Left: KakaoTalk share */}
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        style={{
          background: '#FEE500',
          color: '#3C1E1E',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.71 2 11.3c0 2.88 1.79 5.42 4.5 6.93L5.25 21l3.38-2.03C9.5 19.31 10.73 19.6 12 19.6c5.52 0 10-3.71 10-8.3C22 6.71 17.52 3 12 3z" />
        </svg>
        카카오톡 공유
      </button>

      {/* Right: National petition */}
      <a
        href="https://www.epeople.go.kr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        style={{
          background: 'var(--apple-blue)',
          color: '#FFFFFF',
        }}
        title={`${institution} (${patternType}) 신고하기`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        국민신문고 신고하기
      </a>
    </div>
  );
}
