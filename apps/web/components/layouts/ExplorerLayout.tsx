import { ReactNode } from 'react';

interface ExplorerLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  summaryBar?: ReactNode; // optional top summary strip
}

export default function ExplorerLayout({ sidebar, children, summaryBar }: ExplorerLayoutProps) {
  return (
    <div className="min-h-screen">
      {summaryBar && (
        <div
          className="sticky top-14 z-40 border-b"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(60,60,67,0.12)',
          }}
        >
          <div className="container-wide py-3">{summaryBar}</div>
        </div>
      )}
      <div className="container-wide">
        <div className="explorer-grid min-h-screen">
          {/* Sidebar — hidden on mobile, shown lg+ */}
          <aside
            className="hidden lg:block border-r sticky top-14 self-start overflow-y-auto"
            style={{
              borderColor: 'rgba(60,60,67,0.08)',
              height: 'calc(100vh - 3.5rem)',
              top: '3.5rem',
            }}
          >
            <div className="p-4">{sidebar}</div>
          </aside>
          {/* Main content */}
          <main className="min-w-0 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
