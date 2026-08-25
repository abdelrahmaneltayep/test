import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { SubNav } from './SubNav';

interface Props {
  subnav?: string[];
  active?: string;
  breadcrumb?: string[];
  children: ReactNode;
  width?: 'narrow' | 'wide';
}

export function SallaShell({ subnav, active = '', breadcrumb, children, width = 'narrow' }: Props) {
  return (
    <div className="min-h-full">
      <TopBar />
      {subnav && <SubNav items={subnav} active={active} />}
      <main className={`mx-auto px-6 pb-24 pt-5 ${width === 'wide' ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {breadcrumb && (
          <nav aria-label="مسار التنقل" className="mb-4 flex gap-2 text-[12.5px] text-salla-text-tertiary">
            {breadcrumb.map((c, i) => (
              <span key={c} className={i === breadcrumb.length - 1 ? 'font-semibold text-salla-primary' : ''}>
                {c}{i < breadcrumb.length - 1 && <span aria-hidden="true" className="ms-2">›</span>}
              </span>
            ))}
          </nav>
        )}
        {children}
      </main>
    </div>
  );
}
