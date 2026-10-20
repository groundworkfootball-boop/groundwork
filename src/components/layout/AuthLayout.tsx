import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Target, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
    <div className="flex min-h-screen bg-ink-950">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] max-w-[620px] shrink-0 overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col">
        <div className="absolute inset-0">
          <img
            src="/media/hero-poster.jpg"
            alt=""
            className="h-full w-full object-cover object-[50%_62%] opacity-70"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/60 to-transparent" />
          <div className="absolute inset-0 gw-grid-bg opacity-20" />
        </div>

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-12">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Groundwork home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
              <Target className="h-4.5 w-4.5 text-brand" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[17px] font-bold tracking-tight text-white">GROUNDWORK</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Football recruitment
              </span>
            </span>
          </Link>

          <div>
            <h2 className="gw-display max-w-sm text-[2.1rem] leading-[1.05] text-white">
              The score that gets you seen is the one you can explain.
            </h2>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-slate-400">
              Groundwork replaces guesswork with a transparent, rule-based compatibility engine — and keeps every
              safeguarding decision enforced on the server.
            </p>

            <ul className="mt-8 space-y-3">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-[12.5px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/80" />
            Safeguarding-first architecture
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="Groundwork home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
              <Target className="h-4 w-4 text-brand" />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
                GROUNDWORK
              </span>
          </Link>
          <Link to="/" className="text-[12px] font-medium text-slate-400 hover:text-white">
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px] gw-rise">
            {badge ? (
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand">
                {badge}
              </span>
            ) : null}
            <h1 className="gw-display text-[26px] leading-tight text-white">{title}</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">{subtitle}</p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 text-center text-[13px] text-slate-400">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  );
}

