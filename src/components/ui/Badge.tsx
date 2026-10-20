import type { ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';

const TONES: Record<BadgeTone, string> = {
  brand: 'border-brand/30 bg-brand/10 text-brand',
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  rose: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  sky: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  violet: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  slate: 'border-white/[0.12] bg-white/[0.06] text-slate-300',
};

export function Badge({
  tone = 'slate',
  children,
  icon,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}
