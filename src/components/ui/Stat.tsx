import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from './cn';

export function Stat({
  label,
  value,
  hint,
  icon,
  trend,
  tone = 'brand',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  tone?: 'brand' | 'emerald' | 'amber' | 'sky' | 'violet' | 'rose';
  className?: string;
}) {
  const tones = {
    brand: 'text-brand border-brand/25 bg-brand/10',
    emerald: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10',
    amber: 'text-amber-300 border-amber-400/25 bg-amber-400/10',
    sky: 'text-sky-300 border-sky-400/25 bg-sky-400/10',
    violet: 'text-violet-300 border-violet-400/25 bg-violet-400/10',
    rose: 'text-rose-300 border-rose-400/25 bg-rose-400/10',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-5 transition-colors hover:border-white/[0.14]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        {icon ? (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', tones[tone])}>{icon}</span>
        ) : null}
      </div>
      <p className="gw-numeric mt-3 text-[28px] font-bold leading-none tracking-tight text-white">{value}</p>
      <div className="mt-2.5 flex items-center gap-2">
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-semibold',
              trend.direction === 'up' && 'text-emerald-400',
              trend.direction === 'down' && 'text-rose-400',
              trend.direction === 'flat' && 'text-slate-400',
            )}
          >
            {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : null}
            {trend.direction === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            {trend.value}
          </span>
        ) : null}
        {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
      </div>
    </div>
  );
}
