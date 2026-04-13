import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple System Colors (light mode)
        'apple-blue': '#007AFF',
        'apple-blue-dark': '#0A84FF',
        'apple-red': '#FF3B30',
        'apple-green': '#34C759',
        'apple-orange': '#FF9500',
        'apple-yellow': '#FFCC00',
        'apple-purple': '#AF52DE',
        'apple-pink': '#FF2D55',
        'apple-teal': '#5AC8FA',
        'apple-indigo': '#5856D6',
        // Apple System Grays
        'apple-gray-1': '#8E8E93',
        'apple-gray-2': '#AEAEB2',
        'apple-gray-3': '#C7C7CC',
        'apple-gray-4': '#D1D1D6',
        'apple-gray-5': '#E5E5EA',
        'apple-gray-6': '#F2F2F7',
        // Semantic aliases (used in layout)
        header: 'rgba(255,255,255,0.72)',
        body: '#F2F2F7',
        accent: '#007AFF',
        progressive: '#34C759',
        conservative: '#FF3B30',
        surface: '#FFFFFF',
        'surface-secondary': '#F2F2F7',
        'surface-tertiary': '#E5E5EA',
      },
      fontFamily: {
        sans: [
          'var(--font-pretendard)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'apple-large-title': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'apple-title1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'apple-title2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'apple-title3': ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'apple-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'apple-body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'apple-callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'apple-subheadline': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'apple-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'apple-caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'apple-caption2': ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
      },
      boxShadow: {
        'apple-1': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'apple-2': '0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
        'apple-3': '0 8px 32px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.05)',
        'apple-4': '0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
        'apple-inset': 'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      backdropBlur: {
        'apple': '20px',
        'apple-xl': '40px',
      },
      animation: {
        'apple-fade-in': 'appleFadeIn 0.3s ease-out',
        'apple-slide-up': 'appleSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-scale-in': 'appleScaleIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-bounce': 'appleBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        appleFadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        appleSlideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        appleScaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        appleBounce: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
};

export default config;
