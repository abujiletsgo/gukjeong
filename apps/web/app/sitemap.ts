import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gukjeong.kr';

  // 정적 페이지
  const staticPages = [
    '', '/presidents', '/budget', '/bills', '/legislators',
    '/audit', '/news', '/survey', '/compare', '/simulator',
    '/search', '/pricing', '/about',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' as const : 'weekly' as const,
    priority: path === '' ? 1.0 : 0.8,
  }));

  // 대통령 개별 페이지
  const presidentIds = ['ysk', 'kdj', 'nmh', 'lmb', 'pgh', 'mji', 'ysy', 'ljm'];
  const presidentPages = presidentIds.map((id) => ({
    url: `${baseUrl}/presidents/${id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...presidentPages];
}
