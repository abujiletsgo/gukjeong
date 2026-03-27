'use client';
// 카카오 공유 버튼
import { useState } from 'react';

interface ShareKakaoProps {
  title: string;
  description: string;
  url: string;
}

export default function ShareKakao({ title, description, url }: ShareKakaoProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // TODO: Kakao SDK 연동
    // Kakao.Link.sendDefault({
    //   objectType: 'feed',
    //   content: { title, description, link: { webUrl: url, mobileWebUrl: url } },
    // });

    // 폴백: 클립보드 복사
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label={`카카오톡으로 공유: ${title}`}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-yellow-900 text-sm font-semibold hover:bg-yellow-500 transition-colors"
    >
      <span aria-hidden="true">💬</span>
      {copied ? '링크 복사됨!' : '카카오톡 공유'}
    </button>
  );
}
