import { cn } from './cn';

export function Progress({
  value,
  max = 100,
  tone = 'brand',
  size = 'md',
  label,
  showValue,
  className,
}: {
  value: number;
  max?: number;
  tone?: 'brand' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    brand: 'bg-brand',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    sky: 'bg-sky-400',
    rose: 'bg-rose-400',
    violet: 'bg-violet-400',
  };
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label ? <span className="text-[12px] font-medium text-slate-400">{label}</span> : <span />}
          {showValue ? (
            <span className="gw-numeric text-[12px] font-semibold text-white">{Math.round(pct)}%</span>
          ) : null}
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-white/[0.08]', heights[size])}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreRing({
  value,
  size = 132,
  stroke = 9,
  label,
  tone = '#ccff00',
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="gw-numeric font-bold leading-none text-white" style={{ fontSize: size * 0.26 }}>
          {Math.round(pct)}
          <span className="text-[0.5em] text-slate-400">%</span>
        </span>
        {label ? (
          <span className="mt-1 max-w-[80%] text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
