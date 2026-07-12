'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/presidents', label: '대통령' },
  { href: '/budget', label: '예산' },
  { href: '/bills', label: '법안' },
  { href: '/legislators', label: '국회의원' },
  { href: '/audit', label: 'AI 감사' },
  { href: '/popular', label: '화제의 감사' },
  { href: '/local', label: '지역' },
  { href: '/news', label: '뉴스' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
      {NAV_LINKS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${active ? ' nav-link-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
