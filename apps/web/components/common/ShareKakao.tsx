'use client';
// 카카오 공유 버튼

interface ShareKakaoProps {
  title: string;
  description: string;
  url: string;
}

export default function ShareKakao({ title, description, url }: ShareKakaoProps) {
  const handleShare = () => {
    // TODO: Kakao SDK 연동
    // Kakao.Link.sendDefault({
    //   objectType: 'feed',
    //   content: { title, description, link: { webUrl: url, mobileWebUrl: url } },
    // });

    // 폴백: 클립보드 복사
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-yellow-900 text-sm font-semibold hover:bg-yellow-500 transition-colors"
    >
      <span>💬</span>
      카카오톡 공유
    </button>
  );
}
