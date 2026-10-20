import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from './cn';

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
}) {
  return (
    <header className={cn('space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-[12px] text-slate-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label + '-' + index} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-3 w-3 text-slate-600" aria-hidden /> : null}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition-colors hover:text-slate-300">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-400">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="gw-eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="gw-display text-[26px] leading-tight text-white sm:text-[32px]">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-slate-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
