/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: apiUrl + '/api/v1/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.go.kr' },
    ],
  },
  // Exclude large data files from serverless function bundles.
  // All pages that read these files use static generation (build-time only).
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './data/**/*',
        './public/data/**/*',
      ],
    },
  },
};

module.exports = nextConfig;
