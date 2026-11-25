import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../ui/cn';
import { Hero3DPitchScene } from '../visual/Hero3DPitchScene';

/* ─────────────────────────────────────────────────────────────────────────
   Progress rail — chunky, segmented, unmistakably "you're getting there"
   ───────────────────────────────────────────────────────────────────────── */
export function OnboardingRail({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels?: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="gw-mono text-slate-500">
          Step {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        {labels?.[step - 1] ? (
          <span className="gw-mono text-brand">{labels[step - 1]}</span>
        ) : null}
      </div>

      <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }).map((_, index) => {
          const state = index + 1 < step ? 'done' : index + 1 === step ? 'active' : 'todo';
          return (
            <div
              key={index}
              className={cn(
                'h-2 flex-1 overflow-hidden rounded-full transition-colors duration-500',
                state === 'done' && 'bg-brand/70',
                state === 'active' && 'bg-white/15',
                state === 'todo' && 'bg-white/[0.07]',
              )}
            >
              {state === 'active' ? <div className="gw-rail h-full w-full origin-left animate-[gw-reveal_0.5s_ease-out]" /> : null}
            </div>
          );
        })}
      </div>

      <div className="hidden gap-2 sm:flex">
        {(labels ?? []).map((label, index) => (
          <span
            key={label}
            className={cn(
              'gw-mono truncate transition-colors',
              index + 1 === step ? 'text-brand' : index + 1 < step ? 'text-slate-400' : 'text-slate-600',
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Choice tile — the primary onboarding interaction (big, tactile, animated)
   ───────────────────────────────────────────────────────────────────────── */
export function ChoiceTile({
  selected,
  onClick,
  title,
  description,
  icon,
  badge,
  tone = 'brand',
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  badge?: string;
  tone?: 'brand' | 'emerald' | 'sky' | 'violet' | 'amber';
  compact?: boolean;
}) {
  const tones = {
    brand: 'text-brand border-brand/45 bg-brand/[0.10]',
    emerald: 'text-emerald-300 border-emerald-400/45 bg-emerald-400/[0.10]',
    sky: 'text-sky-300 border-sky-400/45 bg-sky-400/[0.10]',
    violet: 'text-violet-300 border-violet-400/45 bg-violet-400/[0.10]',
    amber: 'text-amber-300 border-amber-400/45 bg-amber-400/[0.10]',
  } as const;

  const glyphTones = {
    brand: 'text-brand',
    emerald: 'text-emerald-300',
    sky: 'text-sky-300',
    violet: 'text-violet-300',
    amber: 'text-amber-300',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200',
        compact ? 'p-3.5' : 'p-4',
        selected
          ? cn(tones[tone], 'shadow-[0_0_0_1px_rgba(182,255,26,0.18)]')
          : 'border-white/[0.09] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]',
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
              selected ? 'border-current/30 bg-white/[0.06]' : 'border-white/[0.10] bg-white/[0.04]',
              selected ? glyphTones[tone] : 'text-slate-400',
            )}
          >
            {icon}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('text-[13.5px] font-semibold', selected ? 'text-white' : 'text-slate-200')}>{title}</p>
            {badge ? (
              <span className="gw-mono rounded border border-white/[0.12] bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-slate-400">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>

        <span
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
            selected ? 'border-brand bg-brand text-ink-950' : 'border-white/20 text-transparent',
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Onboarding shell — split console: content rail + live system panel
   ───────────────────────────────────────────────────────────────────────── */
export function OnboardingShell({
  step,
  total,
  labels,
  eyebrow,
  title,
  description,
  children,
  aside,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  saving,
  onSkip,
  skipLabel,
  footerNote,
}: {
  step: number;
  total: number;
  labels?: string[];
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  saving?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  footerNote?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 gw-grid-bg opacity-[0.16]" />
      <div className="pointer-events-none absolute inset-0 gw-aurora" />

      <header className="relative z-20 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Groundwork home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
              <Sparkles className="h-4 w-4 text-brand" />
            </span>
            <span className="font-display text-[14px] font-bold tracking-[0.12em] text-white">GROUNDWORK</span>
          </Link>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="gw-mono text-slate-500 transition-colors hover:text-slate-200"
            >
              {skipLabel ?? 'Skip for now'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:px-8 lg:py-14">
        <div className="min-w-0">
          <OnboardingRail step={step} total={total} labels={labels} />

          <div key={step} className="gw-stagger mt-8 space-y-6">
            <div>
              <p className="gw-eyebrow">{eyebrow}</p>
              <h1 className="gw-display mt-2.5 text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.08] text-white">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-slate-400">{description}</p>
              ) : null}
            </div>

            {children}

            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[12.5px] font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                ) : (
                  <span className="gw-mono text-slate-600">Autosaved</span>
                )}
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                {footerNote ? <span className="gw-mono hidden text-slate-600 sm:block">{footerNote}</span> : null}
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled || saving}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-all',
                    'bg-brand text-ink-950 hover:bg-brand-hover',
                    'shadow-[0_14px_40px_-16px_rgba(182,255,26,0.7)]',
                    'disabled:pointer-events-none disabled:opacity-40',
                  )}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {nextLabel}
                  {!saving ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive 3D instrument panel */}
        <aside className="hidden lg:block">
          <div className="gw-frame sticky top-24 overflow-hidden rounded-2xl">
            <div className="relative h-[300px] overflow-hidden border-b border-white/[0.07] bg-ink-950">
              <Hero3DPitchScene />
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
                <span className="gw-live-dot" />
                <span className="gw-mono text-slate-300">3D engine</span>
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="gw-mono text-slate-400">Deterministic</span>
                <span className="gw-mono text-brand">v{step}.0</span>
              </div>
            </div>
            <div className="p-4">{aside}</div>
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Field + counter primitives tuned for onboarding density
   ───────────────────────────────────────────────────────────────────────── */
export function ArenaField({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11.5px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function ArenaInput({
  className,
  invalid,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid}
      className={cn(
        'h-12 w-full rounded-xl border bg-ink-950/70 px-4 text-[14px] text-white',
        'placeholder:text-slate-600 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand/25',
        invalid ? 'border-rose-500/60' : 'border-white/[0.10] focus:border-brand/60',
        className,
      )}
      {...rest}
    />
  );
}

export function ArenaTextarea({
  className,
  invalid,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid}
      className={cn(
        'min-h-[104px] w-full resize-y rounded-xl border bg-ink-950/70 px-4 py-3 text-[14px] leading-relaxed text-white',
        'placeholder:text-slate-600 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand/25',
        invalid ? 'border-rose-500/60' : 'border-white/[0.10] focus:border-brand/60',
        className,
      )}
      {...rest}
    />
  );
}

export function ArenaSelect({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-12 w-full appearance-none rounded-xl border border-white/[0.10] bg-ink-950/70 px-4 pr-10 text-[14px] text-white',
        'transition-colors focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        backgroundSize: '16px',
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function ChipToggle({
  active,
  onClick,
  children,
  tone = 'brand',
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: 'brand' | 'sky' | 'emerald';
}) {
  const activeTones = {
    brand: 'border-brand/60 bg-brand/15 text-brand',
    sky: 'border-sky-400/60 bg-sky-400/15 text-sky-300',
    emerald: 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97]',
        active
          ? activeTones[tone]
          : 'border-white/[0.10] bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
        <span className="gw-numeric text-[13px] font-bold text-brand">
          {value}
          {suffix}
        </span>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="gw-rail h-full" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="relative h-6 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-ink-950 [&::-webkit-slider-thumb]:bg-brand
            [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(182,255,26,0.18)]
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink-950 [&::-moz-range-thumb]:bg-brand"
          aria-label={label}
        />
      </div>
      {hint ? <p className="mt-1.5 text-[11.5px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Completion celebration
   ───────────────────────────────────────────────────────────────────────── */
export function OnboardingComplete({
  title,
  summary,
  checklist,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  summary: string;
  checklist: Array<{ label: string; done: boolean }>;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0">
        <img
          src="/images/stadium-night.jpg"
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-25"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/90 via-ink-950/75 to-ink-950" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
        <div className="gw-pop mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/40 bg-brand/12">
          <Check className="h-9 w-9 text-brand" strokeWidth={3} />
        </div>

        <p className="gw-eyebrow">Setup complete</p>
        <h1 className="gw-display mt-3 text-[clamp(1.9rem,4.6vw,2.9rem)] text-white">{title}</h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-slate-400">{summary}</p>

        <ul className="mt-8 w-full space-y-2.5 text-left">
          {checklist.map((item, index) => (
            <li
              key={item.label}
              className="gw-rise flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  item.done ? 'border-brand bg-brand/15 text-brand' : 'border-white/20 text-slate-600',
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className={cn('text-[13px]', item.done ? 'text-slate-200' : 'text-slate-500')}>{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={primaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-[14px] font-semibold text-ink-950 shadow-[0_16px_44px_-16px_rgba(182,255,26,0.7)] transition-colors hover:bg-brand-hover"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              to={secondaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}