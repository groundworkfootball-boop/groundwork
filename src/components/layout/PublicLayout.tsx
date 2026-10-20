import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Target, ShieldCheck, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ButtonLink } from '../ui/Button';
import { cn } from '../ui/cn';

const NAV = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'For clubs', to: '/clubs' },
  { label: 'For players', to: '/players' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Safeguarding', to: '/safeguarding' },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-6 px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Groundwork home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
              <Target className="h-4 w-4 text-brand" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[17px] font-bold tracking-tight text-white">GROUNDWORK</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Football recruitment
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <ButtonLink to="/dashboard" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:text-white sm:block"
                >
                  Sign in
                </Link>
                <ButtonLink to="/register" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                  Get started
                </ButtonLink>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="border-t border-white/[0.06] bg-ink-900 px-5 py-3 lg:hidden" aria-label="Mobile">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2.5 text-[13.5px] font-medium',
                    isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/[0.06] bg-ink-950">
        <div className="mx-auto max-w-8xl px-5 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
                  <Target className="h-4 w-4 text-brand" />
                </span>
                <span className="font-display text-[15px] font-bold tracking-tight text-white">GROUNDWORK</span>
              </div>
              <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-slate-500">
                Deterministic football recruitment for players, guardians and clubs. Built safeguarding-first.
              </p>
            </div>

            {[
              {
                title: 'Platform',
                links: [
                  { label: 'How it works', to: '/how-it-works' },
                  { label: 'For players', to: '/players' },
                  { label: 'For clubs', to: '/clubs' },
                  { label: 'Pricing', to: '/pricing' },
                ],
              },
              {
                title: 'Trust',
                links: [
                  { label: 'Safeguarding', to: '/safeguarding' },
                  { label: 'Privacy', to: '/privacy' },
                  { label: 'Terms', to: '/terms' },
                  { label: 'Contact', to: '/contact' },
                ],
              },
              {
                title: 'Account',
                links: [
                  { label: 'Sign in', to: '/login' },
                  { label: 'Create account', to: '/register' },
                  { label: 'Reset password', to: '/forgot-password' },
                  { label: 'About', to: '/about' },
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-[12.5px] text-slate-500 transition-colors hover:text-slate-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
            <p className="text-[11.5px] text-slate-600">
              © {new Date().getFullYear()} Groundwork Football Technologies Ltd.
            </p>
            <p className="flex items-center gap-1.5 text-[11.5px] text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
              Safeguarding-first architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PublicPageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="absolute inset-0 gw-aurora" />
      <div className="absolute inset-0 gw-grid-bg opacity-30" />
      <div className="relative mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <p className="gw-eyebrow">{eyebrow}</p>
        <h1 className="gw-display mt-3 max-w-3xl text-[clamp(2rem,4.4vw,3.2rem)] text-white">{title}</h1>
        <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-slate-400">{description}</p>
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
