import { ReactNode } from 'react';

interface DetailLayoutProps {
  children: ReactNode;
  rail?: ReactNode; // right rail metadata
}

export default function DetailLayout({ children, rail }: DetailLayoutProps) {
  return (
    <div className="container-page section-desktop">
      <div className={rail ? 'detail-grid' : ''}>
        <article className="min-w-0">{children}</article>
        {rail && (
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">{rail}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
