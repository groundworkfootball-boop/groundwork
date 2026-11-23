import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '../ui/Progress';
import { cn } from '../ui/cn';

export interface BreakdownRow {
  label: string;
  /** Normalised 0–1 contribution for the bar. */
  ratio: number;
  /** Display percentage, already weighted. */
  pct: number;
  tone?: 'brand' | 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
}

const TONE_BG: Record<NonNullable<BreakdownRow['tone']>, string> = {
  brand: 'bg-brand',
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
};

/**
 * Match score panel — the product's signature object. Shows the ring, the six
 * weighted dimensions and the configuration provenance so a score is always
 * traceable. Used on the landing hero and both dashboards.
 */
export function MatchScorePanel({
  score,
  title,
  subtitle,
  rows,
  configVersion = 'v3',
  verified,
  href,
  className,
  compact,
  footer,
}: {
  score: number;
  title: string;
  subtitle?: string;
  rows: BreakdownRow[];
  configVersion?: string;
  verified?: boolean;
  href?: string;
  className?: string;
  compact?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/[0.10] bg-ink-900/85 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="min-w-0">
          <p className="gw-mono text-brand">{subtitle ?? 'Match result'}</p>
          <p className="mt-1 truncate text-[13px] font-semibold text-white">{title}</p>
        </div>
        {verified ? (
          <span className="gw-mono flex shrink-0 items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/[0.09] px-1.5 py-1 text-emerald-300">
            <span className="h-1 w-1 rounded-full bg-current" />
            Verified
          </span>
        ) : null}
      </div>

      <div className={cn('flex items-center gap-4 px-4', compact ? 'py-3.5' : 'py-5')}>
        <ScoreRing
          value={score}
          size={compact ? 84 : 104}
          stroke={compact ? 7 : 8}
          label="Fit"
        />
        <div className="min-w-0 flex-1 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-[74px] shrink-0 truncate text-[10.5px] text-slate-500">{row.label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-700', TONE_BG[row.tone ?? 'brand'])}
                  style={{ width: `${Math.max(2, Math.min(100, row.ratio * 100))}%` }}
                />
              </div>
              <span className="gw-numeric w-8 shrink-0 text-right text-[10.5px] font-semibold text-slate-300">
                {Math.round(row.pct)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {footer}

      <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5">
        <span className="gw-mono flex items-center gap-1.5 text-slate-600">
          <Lock className="h-2.5 w-2.5" />
          {configVersion}
        </span>
        {href ? (
          <Link
            to={href}
            className="gw-mono flex items-center gap-1 text-slate-500 transition-colors hover:text-brand"
          >
            breakdown
            <ChevronRight className="h-2.5 w-2.5" />
          </Link>
        ) : (
          <span className="gw-mono flex items-center gap-1 text-slate-600">
            deterministic
            <ArrowRight className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact metric strip used at the top of dashboards: a row of framed cells
 * with mono labels and tabular values.
 */
export function MetricStrip({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode; hint?: string; tone?: 'brand' | 'emerald' | 'sky' | 'amber' | 'rose' }>;
  className?: string;
}) {
  const toneText: Record<string, string> = {
    brand: 'text-brand',
    emerald: 'text-emerald-300',
    sky: 'text-sky-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
  };

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.055] sm:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-ink-950/95 px-3.5 py-3">
          <dt className="gw-mono truncate text-slate-500">{item.label}</dt>
          <dd
            className={cn(
              'gw-numeric mt-1.5 text-[20px] font-bold leading-none',
              item.tone ? toneText[item.tone] : 'text-white',
            )}
          >
            {item.value}
          </dd>
          {item.hint ? <p className="mt-1.5 truncate text-[10.5px] text-slate-600">{item.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}

/**
 * Stage rail — numbered process steps with one active state. Used to break up
 * long operational pages.
 */
export function StageRail({
  stages,
  active,
  className,
}: {
  stages: Array<{ label: string; hint?: string }>;
  active: number;
  className?: string;
}) {
  return (
    <ol className={cn('flex flex-wrap gap-2', className)}>
      {stages.map((stage, index) => {
        const isActive = index === active;
        const isDone = index < active;
        return (
          <li key={stage.label} className="flex-1 min-w-[110px]">
            <div
              className={cn(
                'rounded-lg border px-2.5 py-2 transition-colors',
                isActive
                  ? 'border-brand/40 bg-brand/[0.08]'
                  : isDone
                    ? 'border-white/[0.10] bg-white/[0.03]'
                    : 'border-white/[0.06] bg-transparent',
              )}
            >
              <p
                className={cn(
                  'gw-mono',
                  isActive ? 'text-brand' : isDone ? 'text-slate-400' : 'text-slate-600',
                )}
              >
                {String(index + 1).padStart(2, '0')}
              </p>
              <p
                className={cn(
                  'mt-1 truncate text-[11.5px] font-medium',
                  isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-600',
                )}
              >
                {stage.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}