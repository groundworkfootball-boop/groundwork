import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Target, ShieldCheck, ArrowRight, Menu, X } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-colors duration-300',
          scrolled
            ? 'border-white/[0.08] bg-ink-950/85 backdrop-blur-xl'
            : 'border-white/[0.04] bg-ink-950/50 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-6 px-5 lg:px-8">
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

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-[12.5px] font-medium transition-colors',
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
                  className="hidden rounded-md px-3 py-2 text-[12.5px] font-medium text-slate-300 transition-colors hover:text-white sm:block"
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
              onClick={() => setOpen((value) => !value)}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav
            className="border-t border-white/[0.08] bg-ink-950/95 px-5 py-3 backdrop-blur-2xl lg:hidden"
            aria-label="Mobile"
          >
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
        <div className="mx-auto max-w-8xl px-5 py-12 lg:px-8">
          <div className="grid gap-9 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
                  <Target className="h-3.5 w-3.5 text-brand" />
                </span>
                <span className="font-display text-[13.5px] font-bold tracking-[0.14em] text-white">GROUNDWORK</span>
              </div>
              <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-slate-500">
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
                <h3 className="gw-mono text-slate-400">{group.title}</h3>
                <ul className="mt-3.5 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-[12px] text-slate-500 transition-colors hover:text-slate-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2.5 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center">
            <p className="gw-mono text-slate-600">
              © {new Date().getFullYear()} Groundwork Football Technologies Ltd.
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <ShieldCheck className="h-3 w-3 text-emerald-500/70" />
              Safeguarding-first architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Public page header — framed split console with corner brackets and an
 * optional right-hand slot for illustration or live data.
 */
export function PublicPageHeader({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="absolute inset-0 bg-ink-950" />
      <div className="absolute inset-0 gw-hairline-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_0%,rgba(182,255,26,0.10),transparent_60%),radial-gradient(ellipse_50%_45%_at_88%_10%,rgba(52,211,153,0.07),transparent_62%)]" />

      <div className="relative mx-auto max-w-8xl px-5 py-14 lg:px-8 lg:py-20">
        <div
          className={cn(
            'grid gap-10',
            aside ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center' : '',
          )}
        >
          <div className="gw-stagger">
            <div className="flex items-center gap-2.5">
              <span className="gw-live-dot" />
              <p className="gw-mono text-brand">{eyebrow}</p>
            </div>
            <h1 className="gw-display mt-4 max-w-3xl text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.02] text-white">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-slate-400">{description}</p>
            {children ? <div className="mt-7">{children}</div> : null}
          </div>

          {aside ? <div className="min-w-0">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}

/**
 * Scroll-triggered reveal. Keeps long marketing pages feeling alive without
 * shipping an animation library.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
        shown ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-5 opacity-0 blur-[3px]',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}