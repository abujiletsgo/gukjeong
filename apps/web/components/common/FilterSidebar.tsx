import { ReactNode } from 'react';

interface FilterSectionProps {
  title: string;
  children: ReactNode;
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="mb-6">
      <h3
        className="font-semibold text-gray-500 mb-3"
        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

interface FilterSidebarProps {
  children: ReactNode;
  title?: string;
}

export default function FilterSidebar({ children, title = '필터' }: FilterSidebarProps) {
  return (
    <div className="py-2">
      {title && (
        <h2 className="font-bold text-gray-900 mb-4" style={{ fontSize: 15, letterSpacing: '-0.2px' }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
