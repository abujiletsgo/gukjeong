import { ReactNode } from 'react';

interface MagazineLayoutProps {
  hero?: ReactNode;
  children: ReactNode;
  wide?: boolean; // use container-wide instead of container-page
}

export default function MagazineLayout({ hero, children, wide = false }: MagazineLayoutProps) {
  const container = wide ? 'container-wide' : 'container-page';
  return (
    <div className="min-h-screen">
      {hero && (
        <section className="section-desktop">
          <div className={container}>{hero}</div>
        </section>
      )}
      <section className="section-desktop">
        <div className={container}>{children}</div>
      </section>
    </div>
  );
}
