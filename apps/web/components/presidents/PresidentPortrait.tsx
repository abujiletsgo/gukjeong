'use client';
// 대통령 초상화 — 실제 사진 + SVG 폴백
import { useState } from 'react';
import { getPresidentColor, getPresidentBgColor } from '@/lib/utils';

interface PresidentPortraitProps {
  id: string;
  name: string;
  party?: string;
  size?: number;
  className?: string;
}

// 대통령별 특징 (머리 스타일, 안경 여부, 특징)
const PRESIDENT_FEATURES: Record<string, {
  hair: 'side-part' | 'slick-back' | 'full' | 'thin' | 'short';
  glasses: boolean;
  hairColor: string;
  skinTone: string;
  feature?: string; // e.g., 'mustache'
}> = {
  ysk: { hair: 'slick-back', glasses: true, hairColor: '#4a4a4a', skinTone: '#f0d0b0' },
  kdj: { hair: 'thin', glasses: true, hairColor: '#6a6a6a', skinTone: '#f0d0b0' },
  nmh: { hair: 'full', glasses: false, hairColor: '#3a3a3a', skinTone: '#e8c8a0' },
  lmb: { hair: 'slick-back', glasses: true, hairColor: '#5a5a5a', skinTone: '#f0d0b0' },
  pgh: { hair: 'short', glasses: false, hairColor: '#2a2a2a', skinTone: '#f5dcc0' },
  mji: { hair: 'full', glasses: false, hairColor: '#4a4a4a', skinTone: '#e8c8a0' },
  ysy: { hair: 'side-part', glasses: true, hairColor: '#3a3a3a', skinTone: '#f0d0b0' },
  ljm: { hair: 'full', glasses: true, hairColor: '#3a3a3a', skinTone: '#e8c8a0' },
};

function PortraitSVG({ id, name, party, size }: { id: string; name: string; party?: string; size: number }) {
  const features = PRESIDENT_FEATURES[id] || { hair: 'full', glasses: false, hairColor: '#4a4a4a', skinTone: '#f0d0b0' };
  const accentColor = getPresidentColor(party);
  const cx = size / 2;
  const cy = size / 2;
  const headR = size * 0.28;
  const surname = name.charAt(0);

  // Hair path based on style
  const hairPaths: Record<string, string> = {
    'slick-back': `M ${cx - headR * 0.9} ${cy - headR * 0.4} Q ${cx} ${cy - headR * 1.55} ${cx + headR * 0.9} ${cy - headR * 0.4}`,
    'side-part': `M ${cx - headR * 0.85} ${cy - headR * 0.3} Q ${cx - headR * 0.2} ${cy - headR * 1.5} ${cx + headR * 0.9} ${cy - headR * 0.35}`,
    'full': `M ${cx - headR * 0.95} ${cy - headR * 0.2} Q ${cx} ${cy - headR * 1.6} ${cx + headR * 0.95} ${cy - headR * 0.2}`,
    'thin': `M ${cx - headR * 0.7} ${cy - headR * 0.35} Q ${cx} ${cy - headR * 1.4} ${cx + headR * 0.7} ${cy - headR * 0.35}`,
    'short': `M ${cx - headR * 0.88} ${cy - headR * 0.25} Q ${cx} ${cy - headR * 1.5} ${cx + headR * 0.88} ${cy - headR * 0.25}`,
  };

  const shoulderY = cy + headR * 1.1;
  const shoulderW = size * 0.45;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={size / 2 - 1} fill={getPresidentBgColor(party)} stroke={accentColor} strokeWidth="1.5" />

      {/* Body/shoulders */}
      <path
        d={`M ${cx - shoulderW} ${size} Q ${cx - shoulderW} ${shoulderY + headR * 0.3} ${cx} ${shoulderY} Q ${cx + shoulderW} ${shoulderY + headR * 0.3} ${cx + shoulderW} ${size}`}
        fill={accentColor}
        opacity="0.85"
      />

      {/* Suit collar / shirt */}
      <path
        d={`M ${cx - headR * 0.35} ${shoulderY} L ${cx} ${shoulderY + headR * 0.5} L ${cx + headR * 0.35} ${shoulderY}`}
        fill="white"
        opacity="0.9"
      />
      {/* Tie */}
      <path
        d={`M ${cx - headR * 0.1} ${shoulderY + headR * 0.15} L ${cx} ${shoulderY + headR * 0.7} L ${cx + headR * 0.1} ${shoulderY + headR * 0.15} Z`}
        fill={accentColor}
        opacity="0.6"
      />

      {/* Neck */}
      <rect
        x={cx - headR * 0.2}
        y={cy + headR * 0.65}
        width={headR * 0.4}
        height={headR * 0.55}
        rx={headR * 0.1}
        fill={features.skinTone}
      />

      {/* Head */}
      <ellipse cx={cx} cy={cy - headR * 0.05} rx={headR * 0.85} ry={headR} fill={features.skinTone} />

      {/* Ears */}
      <ellipse cx={cx - headR * 0.82} cy={cy} rx={headR * 0.12} ry={headR * 0.2} fill={features.skinTone} />
      <ellipse cx={cx + headR * 0.82} cy={cy} rx={headR * 0.12} ry={headR * 0.2} fill={features.skinTone} />

      {/* Hair */}
      <path
        d={hairPaths[features.hair]}
        stroke={features.hairColor}
        strokeWidth={headR * 0.45}
        strokeLinecap="round"
        fill="none"
      />
      {/* Hair fill */}
      <path
        d={`${hairPaths[features.hair]} L ${cx + headR * 0.5} ${cy - headR * 0.6} Q ${cx} ${cy - headR * 0.9} ${cx - headR * 0.5} ${cy - headR * 0.6} Z`}
        fill={features.hairColor}
        opacity="0.8"
      />

      {/* Eyes */}
      <ellipse cx={cx - headR * 0.28} cy={cy - headR * 0.05} rx={headR * 0.08} ry={headR * 0.06} fill="#2a2a2a" />
      <ellipse cx={cx + headR * 0.28} cy={cy - headR * 0.05} rx={headR * 0.08} ry={headR * 0.06} fill="#2a2a2a" />
      {/* Eye highlights */}
      <circle cx={cx - headR * 0.26} cy={cy - headR * 0.07} r={headR * 0.025} fill="white" />
      <circle cx={cx + headR * 0.3} cy={cy - headR * 0.07} r={headR * 0.025} fill="white" />

      {/* Eyebrows */}
      <path
        d={`M ${cx - headR * 0.4} ${cy - headR * 0.2} Q ${cx - headR * 0.28} ${cy - headR * 0.28} ${cx - headR * 0.16} ${cy - headR * 0.18}`}
        stroke="#3a3a3a"
        strokeWidth={headR * 0.06}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${cx + headR * 0.16} ${cy - headR * 0.18} Q ${cx + headR * 0.28} ${cy - headR * 0.28} ${cx + headR * 0.4} ${cy - headR * 0.2}`}
        stroke="#3a3a3a"
        strokeWidth={headR * 0.06}
        strokeLinecap="round"
        fill="none"
      />

      {/* Nose */}
      <path
        d={`M ${cx} ${cy} L ${cx - headR * 0.08} ${cy + headR * 0.18} Q ${cx} ${cy + headR * 0.22} ${cx + headR * 0.08} ${cy + headR * 0.18}`}
        stroke="#c0a080"
        strokeWidth={headR * 0.04}
        fill="none"
        strokeLinecap="round"
      />

      {/* Mouth */}
      <path
        d={`M ${cx - headR * 0.18} ${cy + headR * 0.36} Q ${cx} ${cy + headR * 0.44} ${cx + headR * 0.18} ${cy + headR * 0.36}`}
        stroke="#c08080"
        strokeWidth={headR * 0.04}
        fill="none"
        strokeLinecap="round"
      />

      {/* Glasses (if applicable) */}
      {features.glasses && (
        <g stroke="#4a4a4a" strokeWidth={headR * 0.05} fill="none">
          <circle cx={cx - headR * 0.28} cy={cy - headR * 0.03} r={headR * 0.18} />
          <circle cx={cx + headR * 0.28} cy={cy - headR * 0.03} r={headR * 0.18} />
          <path d={`M ${cx - headR * 0.1} ${cy - headR * 0.03} L ${cx + headR * 0.1} ${cy - headR * 0.03}`} />
          <path d={`M ${cx - headR * 0.46} ${cy - headR * 0.06} L ${cx - headR * 0.82} ${cy - headR * 0.02}`} />
          <path d={`M ${cx + headR * 0.46} ${cy - headR * 0.06} L ${cx + headR * 0.82} ${cy - headR * 0.02}`} />
        </g>
      )}

      {/* Name label at bottom */}
      <text
        x={cx}
        y={size - size * 0.06}
        textAnchor="middle"
        fill={accentColor}
        fontSize={size * 0.14}
        fontWeight="bold"
        fontFamily="'Pretendard', sans-serif"
      >
        {surname}
      </text>
    </svg>
  );
}

// 실제 초상화 이미지 경로 매핑
const PORTRAIT_IMAGES: Record<string, string> = {
  ysk: '/presidents/ysk.jpg',
  kdj: '/presidents/kdj.jpg',
  nmh: '/presidents/nmh.jpg',
  lmb: '/presidents/lmb.jpg',
  pgh: '/presidents/pgh.png',
  mji: '/presidents/mji.jpg',
  ysy: '/presidents/ysy.jpg',
  ljm: '/presidents/ljm.jpg',
};

export default function PresidentPortrait({ id, name, party, size = 64, className = '' }: PresidentPortraitProps) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = PORTRAIT_IMAGES[id];
  const accentColor = getPresidentColor(party);

  // Use real photo if available, fallback to SVG illustration
  if (imgSrc && !imgError) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size, boxShadow: `0 0 0 2px ${accentColor}` }}
      >
        <img
          src={imgSrc}
          alt={`${name} 대통령 초상화`}
          width={size}
          height={size}
          className="w-full h-full object-cover object-top"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <PortraitSVG id={id} name={name} party={party} size={size} />
    </div>
  );
}
