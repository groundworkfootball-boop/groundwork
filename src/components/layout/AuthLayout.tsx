import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Target, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

const HIGHLIGHTS = [
  'Deterministic, auditable match scores',
  'Guardian consent enforced server-side',
  'Verified clubs only — adult and youth',
  'Immutable consent and admin audit trail',
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  badge,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex min-h-screen bg-ink-950 text-white">
      {/* ── Brand panel: WebGL instrument viewport ───────────────────── */}
      <aside className="relative hidden w-[46%] max-w-[600px] shrink-0 overflow-hidden border-r border-white/[0.07] lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-ink-950">
          <img
            src="/images/stadium-night.jpg"
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-35"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/65 to-ink-950/95" />

        <div className="relative flex flex-1 flex-col justify-between p-9 xl:p-11">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Groundwork home">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-brand/40 bg-brand/10">
              <Target className="h-4 w-4 text-brand" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(182,255,26,0.9)]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-[0.16em] text-white">GROUNDWORK</span>
              <span className="gw-mono mt-1 text-[8.5px] text-slate-500">Football recruitment</span>
            </span>
          </Link>

          <div className="gw-stagger">
            <div className="mb-4 flex items-center gap-2">
              <span className="gw-live-dot" />
              <span className="gw-mono text-brand">Deterministic engine</span>
            </div>

            <h2 className="gw-display max-w-sm text-[clamp(1.7rem,2.7vw,2.1rem)] leading-[1.06] text-white">
              The score that gets you seen is the one you can explain.
            </h2>
            <p className="mt-3.5 max-w-sm text-[12.5px] leading-relaxed text-slate-400">
              Groundwork replaces guesswork with a transparent, rule-based compatibility engine — and keeps every
              safeguarding decision enforced on the server.
            </p>

            <ul className="mt-7 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <span className="text-[12px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3 w-3 text-emerald-500/80" />
              Safeguarding-first
            </span>
            <span className="gw-mono text-slate-600">config v3</span>
          </div>
        </div>
      </aside>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 gw-hairline-grid opacity-20" />

        <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="Groundwork home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/40 bg-brand/10">
              <Target className="h-4 w-4 text-brand" />
            </span>
            <span className="font-display text-[13.5px] font-bold tracking-[0.14em] text-white">GROUNDWORK</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="gw-rise w-full max-w-[404px]">
            {badge ? (
              <span className="gw-mono mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/[0.08] px-2.5 py-1 text-brand">
                {badge}
              </span>
            ) : null}
            <h1 className="gw-display text-[25px] leading-tight text-white">{title}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{subtitle}</p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 text-center text-[12.5px] text-slate-400">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  );
}