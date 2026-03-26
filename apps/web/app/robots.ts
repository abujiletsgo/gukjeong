import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Yeti',  // Naver
        allow: '/',
      },
    ],
    sitemap: 'https://gukjeong.kr/sitemap.xml',
  };
}
