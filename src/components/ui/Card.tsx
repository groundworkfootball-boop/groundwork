import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({ variant = 'default', padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/[0.08]',
        variant === 'default' && 'bg-gradient-to-b from-white/[0.045] to-white/[0.015] backdrop-blur-sm',
        variant === 'raised' && 'bg-gradient-to-b from-ink-700/70 to-ink-850/90 shadow-lift',
        variant === 'flat' && 'bg-ink-850/70',
        variant === 'interactive' &&
          'bg-gradient-to-b from-white/[0.045] to-white/[0.015] transition-all duration-200 hover:border-brand/30 hover:from-white/[0.07] hover:shadow-[0_18px_44px_-24px_rgba(0,0,0,0.9)]',
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-brand">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
