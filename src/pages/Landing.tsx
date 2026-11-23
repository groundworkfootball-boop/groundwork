import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Lock,
  Menu,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ButtonLink } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MatchScorePanel } from '../components/ui/ScorePanel';
import { ParticleField } from '../components/visual/ParticleField';
import {
  BootIllustration,
  BallIllustration,
  TacticsBoardIllustration,
  ScoutingRadarIllustration,
  TrophyIllustration,
  ClipReviewIllustration,
  CrestIllustration,
  WhistleIllustration,
  JerseyIllustration,
} from '../components/illustrations/football';
import {
  DossierIllustration,
  SafeguardingIllustration,
  RecruitmentIllustration,
} from '../components/illustrations';

const NAV = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'For clubs', to: '/clubs' },
  { label: 'For players', to: '/players' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Safeguarding', to: '/safeguarding' },
];

const PILLARS = [
  {
    icon: Target,
    index: '01',
    title: 'Deterministic matching',
    body: 'Every player-club score is produced by a pure, rule-based engine. Same inputs, same score — always. No randomness, no black box.',
    tone: 'brand' as const,
  },
  {
    icon: ShieldCheck,
    index: '02',
    title: 'Safeguarding by default',
    body: 'Youth profiles stay invisible until a guardian grants consent, and only clubs with live safeguarding clearance can ever see them.',
    tone: 'emerald' as const,
  },
  {
    icon: Sparkles,
    index: '03',
    title: 'AI that advises, never decides',
    body: 'AI writes video descriptions, squad gap notes and profile tips. It has no write access to scores, rankings or weights.',
    tone: 'violet' as const,
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Build a verified dossier',
    body: 'Positions, attributes, availability, history and video — structured data clubs can actually filter on.',
  },
  {
    n: '02',
    title: 'Get scored, not guessed',
    body: 'The engine weighs position, distance, level, attributes, availability and boost against each club’s live requirements.',
  },
  {
    n: '03',
    title: 'See the full breakdown',
    body: 'Every percentage is itemised. You see which dimension earned the points and which cost you.',
  },
  {
    n: '04',
    title: 'Apply, trial, sign',
    body: 'Applications, shortlists and trial invitations run through one audited pipeline with notifications at each stage.',
  },
];

const AUDIENCES = [
  {
    key: 'players',
    tag: 'Ages 18+',
    title: 'Adult players',
    body: 'Publish a data-backed profile, upload match footage, and get matched against non-league, semi-pro and academy requirements.',
    to: '/players',
    cta: 'Player pathway',
    accent: 'text-brand',
  },
  {
    key: 'guardians',
    tag: 'Under 18',
    title: 'Youth & guardians',
    body: 'Consent-gated visibility, immutable consent audit trails, and clubs that must hold live youth verification to appear at all.',
    to: '/safeguarding',
    cta: 'Safeguarding model',
    accent: 'text-emerald-300',
  },
  {
    key: 'clubs',
    tag: 'Clubs & academies',
    title: 'Recruitment teams',
    body: 'Search precomputed match results, run squad gap analysis, manage shortlists and trials, and track every candidate.',
    to: '/clubs',
    cta: 'Club platform',
    accent: 'text-sky-300',
  },
] as const;

function AudienceGlyph({ kind }: { kind: (typeof AUDIENCES)[number]['key'] }) {
  if (kind === 'players') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <BootIllustration className="max-h-[132px] w-auto" />
      </div>
    );
  }
  if (kind === 'guardians') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <SafeguardingIllustration className="max-h-[150px] w-auto" />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <CrestIllustration className="max-h-[150px] w-auto" />
    </div>
  );
}

export const Landing = () => {
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(motionQuery.matches);
    const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    motionQuery.addEventListener('change', onChange);

    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      motionQuery.removeEventListener('change', onChange);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(motionQuery.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
      if (event.matches) setIsPlaying(false);
    };
    motionQuery.addEventListener('change', onChange);

    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      motionQuery.removeEventListener('change', onChange);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const el = videoRef.current;
    if (!el) return;

    // Autoplay can be blocked before the element has a non-zero box, so retry
    // once the media is decodable and on the first user gesture.
    const tryPlay = () => {
      const attempt = el.play();
      if (attempt) attempt.catch(() => undefined);
    };

    if (el.readyState >= 2) tryPlay();
    el.addEventListener('loadeddata', tryPlay);
    el.addEventListener('canplay', tryPlay);
    document.addEventListener('pointerdown', tryPlay, { once: true, passive: true });

    return () => {
      el.removeEventListener('loadeddata', tryPlay);
      el.removeEventListener('canplay', tryPlay);
      document.removeEventListener('pointerdown', tryPlay);
    };
  }, [reduceMotion]);

  const toggleVideo = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => undefined);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled ? 'border-white/[0.08] bg-ink-950/85 backdrop-blur-xl' : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-3 px-5 lg:gap-6 lg:px-8">
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
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-[12.5px] font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {isAuthenticated ? (
              <ButtonLink to="/dashboard" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-md px-3 py-2 text-[12.5px] font-medium text-slate-300 transition-colors hover:text-white md:block"
                >
                  Sign in
                </Link>
                <ButtonLink
                  to="/register"
                  size="sm"
                  className="hidden sm:inline-flex"
                  iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Get started
                </ButtonLink>
              </>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/[0.08] bg-ink-950/95 px-5 py-4 backdrop-blur-2xl lg:hidden">
            <nav className="flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              {!isAuthenticated ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-white/10 px-3 py-2.5 text-center text-[13px] font-medium text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-brand px-3 py-2.5 text-center text-[13px] font-semibold text-ink-950"
                  >
                    Get started
                  </Link>
                </div>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>

      {/* ── Hero: split console ────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-16">
        {/* Background video + poster */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/media/hero-poster.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_58%]"
            aria-hidden
          />
          {!reduceMotion ? (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover object-[50%_58%] opacity-[0.85]"
              src="/media/hero.mp4"
              poster="/media/hero-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/35 to-ink-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/30 to-transparent" />
          <div className="gw-hairline-grid absolute inset-0 opacity-[0.3]" />
        </div>

        <div className="mx-auto max-w-8xl px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          {/* Outer technical shell */}
          <div className="gw-frame gw-scanlines relative overflow-hidden rounded-2xl">
            <div className="grid lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
              {/* Left: content + metadata */}
              <div className="relative border-b border-white/[0.07] p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-11">
                <div className="gw-stagger">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.08] px-2.5 py-1">
                      <span className="gw-live-dot" />
                      <span className="gw-mono text-brand">System online</span>
                    </span>
                    <span className="gw-mono text-slate-500">UK non-league · academy</span>
                  </div>

                  <h1 className="gw-display mt-6 text-[clamp(2.3rem,5.2vw,3.9rem)] leading-[0.98] text-white">
                    Get seen.
                    <br />
                    <span className="text-slate-600">Get matched.</span>
                    <br />
                    <span className="text-brand">Get signed.</span>
                  </h1>

                  <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-slate-400">
                    Groundwork connects grassroots, Sunday league and academy talent with non-league, semi-pro and
                    professional clubs — through a transparent, deterministic compatibility engine instead of guesswork.
                  </p>

                  <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                    <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                      Create your profile
                    </ButtonLink>
                    <ButtonLink
                      to="/how-it-works"
                      size="lg"
                      variant="secondary"
                      iconLeft={<Play className="h-3.5 w-3.5" />}
                    >
                      See how scoring works
                    </ButtonLink>
                  </div>

                  <dl className="mt-9 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06]">
                    {[
                      { k: '100%', v: 'Deterministic' },
                      { k: '6', v: 'Weighted dims' },
                      { k: '0', v: 'AI scores' },
                    ].map((item) => (
                      <div key={item.v} className="bg-ink-950/90 px-3 py-3.5">
                        <dt className="gw-numeric font-display text-[19px] font-bold leading-none text-white">{item.k}</dt>
                        <dd className="gw-mono mt-1.5 text-slate-500">{item.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {[
                      { icon: ShieldCheck, text: 'Consent enforced server-side' },
                      { icon: Lock, text: 'Rules + custom claims' },
                      { icon: BarChart3, text: 'Immutable audit trail' },
                    ].map((item) => (
                      <span key={item.text} className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                        <item.icon className="h-3 w-3 text-brand/70" />
                        {item.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: WebGL viewport + live match result */}
              <div className="relative min-h-[420px] bg-ink-950/60">
                <div className="absolute inset-0">
                  <ParticleField count={1700} />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_12%,rgba(4,7,12,0.86)_76%)]" />

                {/* Viewport chrome */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
                  <span className="gw-mono text-slate-500">Match engine</span>
                  <span className="flex items-center gap-1.5">
                    <span className="gw-live-dot" />
                    <span className="gw-mono text-brand">Live</span>
                  </span>
                </div>

                {/* Overlay card */}
                                <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
                                  <MatchScorePanel
                                    score={87}
                                    title="Central midfielder → Step 4 club"
                                    subtitle="Match result"
                                    verified
                                    href="/how-it-works"
                                    rows={[
                                      { label: 'Position', ratio: 1, pct: 30, tone: 'brand' },
                                      { label: 'Level', ratio: 0.92, pct: 18, tone: 'emerald' },
                                      { label: 'Attributes', ratio: 0.85, pct: 17, tone: 'violet' },
                                      { label: 'Distance', ratio: 0.78, pct: 12, tone: 'sky' },
                                      { label: 'Availability', ratio: 0.7, pct: 7, tone: 'amber' },
                                      { label: 'Boost', ratio: 0.6, pct: 3, tone: 'rose' },
                                    ]}
                                  />
                                </div>

                {!reduceMotion ? (
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/80 px-2.5 py-1 backdrop-blur-md transition-colors hover:border-brand/50 sm:flex"
                    aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
                  >
                    {isPlaying ? <Pause className="h-2.5 w-2.5 text-brand" /> : <Play className="h-2.5 w-2.5 text-brand" />}
                    <span className="gw-mono text-slate-400">{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process rail ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/40">
        <div className="mx-auto max-w-8xl px-5 lg:px-8">
          <div className="grid divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {STEPS.map((step, index) => (
              <div
                key={step.n}
                className={`relative px-0 py-6 sm:px-5 lg:px-6 ${index > 0 ? 'sm:border-l sm:border-white/[0.06]' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="gw-mono text-brand">{step.n}</span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>
                <h3 className="mt-3 text-[13.5px] font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pillars ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="gw-eyebrow">Two separate intelligence systems</p>
            <h2 className="gw-display mt-3 text-[clamp(1.8rem,3.4vw,2.7rem)] text-white">
              Deterministic matching. Advisory AI. Never mixed.
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-slate-500">
            The score that ranks a player comes only from the rule engine. AI is confined to descriptions, suggestions
            and gap notes — with no write access to scores, rankings or weights.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const tone =
              pillar.tone === 'brand'
                ? 'text-brand border-brand/25 bg-brand/10'
                : pillar.tone === 'emerald'
                  ? 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10'
                  : 'text-violet-300 border-violet-400/25 bg-violet-400/10';
            return (
              <div key={pillar.title} className="group relative bg-ink-950/90 p-6 transition-colors hover:bg-ink-900/90">
                <div className="flex items-start justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone}`}>
                    <pillar.icon className="h-4 w-4" />
                  </span>
                  <span className="gw-mono text-slate-700">{pillar.index}</span>
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Engine explainer with illustrations ───────────────────────── */}
      <section className="relative overflow-hidden border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto grid max-w-8xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <Badge tone="brand" icon={<Target className="h-3 w-3" />}>
              The scoring engine
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.2vw,2.6rem)] text-white">
              Six weights. One explainable number.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Position 30% · Level 20% · Attributes 20% · Distance 15% · Availability 10% · Boost 5%. Every result stores
              its own breakdown and configuration version, so a score can always be re-derived.
            </p>

            <div className="mt-6 space-y-1.5">
              {[
                ['Position compatibility', '30%', 'bg-brand', 30],
                ['Playing level', '20%', 'bg-emerald-400', 20],
                ['Attributes', '20%', 'bg-violet-400', 20],
                ['Distance / region', '15%', 'bg-sky-400', 15],
                ['Availability', '10%', 'bg-amber-400', 10],
                ['Visibility boost', '5%', 'bg-rose-400', 5],
              ].map(([label, pct, tone, width]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <span className="w-[150px] shrink-0 text-[12px] text-slate-400">{label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full ${tone}`}
                      style={{ width: `${(width as number) * 3}%` }}
                    />
                  </div>
                  <span className="gw-numeric w-9 shrink-0 text-right text-[11.5px] font-semibold text-slate-300">
                    {pct}
                  </span>
                </div>
              ))}
            </div>

            <ButtonLink
              to="/how-it-works"
              variant="secondary"
              className="mt-7"
              iconRight={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Read the engine spec
            </ButtonLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-ink-950/60 p-4">
              <DossierIllustration />
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-ink-950/60 p-4">
                <ScoutingRadarIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audiences ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="gw-eyebrow">Built for every side of the game</p>
          <h2 className="gw-display mt-3 text-[clamp(1.8rem,3.4vw,2.7rem)] text-white">
            One platform, three very different jobs.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <Link
              key={audience.title}
              to={audience.to}
              className="group gw-tilt-hover flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/40"
            >
              <div className="relative h-[190px] overflow-hidden border-b border-white/[0.07] bg-gradient-to-b from-ink-950 to-ink-900/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(182,255,26,0.07),transparent_65%)]" />
                <div className="absolute inset-0 p-3 transition-transform duration-500 group-hover:scale-[1.04]">
                  <AudienceGlyph kind={audience.key} />
                </div>
                <span className="gw-mono absolute left-3 top-3 rounded border border-white/[0.12] bg-ink-950/80 px-1.5 py-0.5 text-slate-400">
                  {audience.tag}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[15px] font-semibold text-white">{audience.title}</h3>
                <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-slate-500">{audience.body}</p>
                <span className={`mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${audience.accent}`}>
                  {audience.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Safeguarding ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto grid max-w-8xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-emerald-400/[0.14] bg-ink-950/60 p-4">
              <SafeguardingIllustration />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
              Safeguarding first
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.2vw,2.6rem)] text-white">
              A minor&apos;s profile is invisible until a guardian says otherwise.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Consent is not a UI toggle. It is enforced in Firestore rules, Cloud Functions and Storage rules — so
              bypassing the React app changes nothing.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'Youth profiles start hidden with consentStatus = pending',
                'Only clubs with live youth verification can read them',
                'Withdrawal delists the profile and queues media deletion',
                'Every consent action writes an immutable audit record',
                'AI processing is blocked without granted consent — at enqueue and execution',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-[12.5px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>

            <ButtonLink
              to="/safeguarding"
              variant="secondary"
              className="mt-7"
              iconRight={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Read the safeguarding model
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Capability mosaic ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-ink-900/40 p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10">
                  <BarChart3 className="h-4 w-4 text-sky-300" />
                </span>
                <h3 className="mt-3.5 text-[15px] font-semibold text-white">Recruitment workspace</h3>
                <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-slate-500">
                  Precomputed match results, cursor-paginated search, shortlists with private notes, trial scheduling and
                  squad gap analysis — all scoped to your club.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <RecruitmentIllustration />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-ink-900/40 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-400/10">
                <Video className="h-4 w-4 text-violet-300" />
              </span>
              <h3 className="mt-3.5 text-[14px] font-semibold text-white">Reviewable AI tags</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                FFmpeg transcode, thumbnails, then observable-only descriptions you accept, edit or reject.
              </p>
              <div className="mt-3">
                <ClipReviewIllustration />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-ink-900/40 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10">
              <Zap className="h-4 w-4 text-amber-300" />
            </span>
            <h3 className="mt-3.5 text-[14px] font-semibold text-white">Boosts that stay honest</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
              A boost is one documented 5% dimension. It cannot rewrite position, level or attribute scores.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-ink-900/40 p-4">
            <TacticsBoardIllustration />
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-ink-900/40 p-4">
            <BallIllustration />
          </div>
        </div>
      </section>

      {/* ── Illustration library ──────────────────────────────────────── */}
            <section className="border-t border-white/[0.06] bg-ink-900/25">
              <div className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <p className="gw-eyebrow">Drawn for this product</p>
                    <h2 className="gw-display mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
                      Every asset is generated, not borrowed.
                    </h2>
                  </div>
                  <p className="max-w-sm text-[12.5px] leading-relaxed text-slate-500">
                    Boots, balls, crests, tactics boards and scouting radars are all hand-authored SVG with layered gradients
                    and a shared hairline system — so the interface reads as one instrument.
                  </p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { node: <BootIllustration />, label: 'Boot', tag: 'SPEC · FG' },
                    { node: <BallIllustration />, label: 'Match ball', tag: 'ICOSAHEDRON' },
                    { node: <CrestIllustration />, label: 'Club crest', tag: 'VERIFIED' },
                    { node: <JerseyIllustration number="10" />, label: 'Squad slot', tag: 'No. 10' },
                  ].map((item) => (
                    <figure
                      key={item.label}
                      className="group overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/70"
                    >
                      <div className="flex h-[190px] items-center justify-center overflow-hidden p-4">
                        <div className="max-h-full transition-transform duration-500 group-hover:scale-[1.04]">{item.node}</div>
                      </div>
                      <figcaption className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2.5">
                        <span className="text-[11.5px] font-medium text-slate-300">{item.label}</span>
                        <span className="gw-mono text-slate-600">{item.tag}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <figure className="group overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/70 sm:col-span-2">
                    <div className="h-[240px] overflow-hidden p-4">
                      <div className="h-full transition-transform duration-500 group-hover:scale-[1.02]">
                        <TacticsBoardIllustration />
                      </div>
                    </div>
                    <figcaption className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2.5">
                      <span className="text-[11.5px] font-medium text-slate-300">Tactical shape</span>
                      <span className="gw-mono text-slate-600">4-3-3 PRESS</span>
                    </figcaption>
                  </figure>

                  <figure className="group overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/70">
                    <div className="flex h-[240px] items-center justify-center overflow-hidden p-4">
                      <div className="transition-transform duration-500 group-hover:scale-[1.04]">
                        <WhistleIllustration />
                      </div>
                    </div>
                    <figcaption className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2.5">
                      <span className="text-[11.5px] font-medium text-slate-300">Decision</span>
                      <span className="gw-mono text-slate-600">FINAL</span>
                    </figcaption>
                  </figure>

                  <figure className="group overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/70">
                    <div className="flex h-[240px] items-center justify-center overflow-hidden p-3">
                      <div className="transition-transform duration-500 group-hover:scale-[1.03]">
                        <TrophyIllustration />
                      </div>
                    </div>
                    <figcaption className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2.5">
                      <span className="text-[11.5px] font-medium text-slate-300">Signed</span>
                      <span className="gw-mono text-slate-600">AUDITED</span>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-t border-white/[0.06]">
              <div className="absolute inset-0">
                <ParticleField count={1200} />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(182,255,26,0.10),transparent_62%)]" />

              {/* Flanking illustrations — hidden on small screens so the copy stays centred */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-1/2 hidden -translate-x-[18%] -translate-y-1/2 opacity-[0.55] xl:block"
              >
                <div className="h-[300px] w-[300px]">
                  <TacticsBoardIllustration />
                </div>
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-1/2 hidden translate-x-[20%] -translate-y-1/2 opacity-[0.55] xl:block"
              >
                <div className="h-[300px] w-[300px]">
                  <TrophyIllustration />
                </div>
              </div>

              <div className="relative mx-auto max-w-3xl px-5 py-24 text-center lg:px-8">
                <div className="mx-auto mb-6 flex items-center justify-center gap-3">
                  <div className="h-12 w-12 opacity-80">
                    <BootIllustration />
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
                    <Target className="h-6 w-6 text-brand" />
                  </div>
                  <div className="h-12 w-12 opacity-80">
                    <BallIllustration />
                  </div>
                </div>
                <h2 className="gw-display text-[clamp(1.9rem,4.2vw,3rem)] text-white">
                  Your next club is one honest score away.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[13.5px] leading-relaxed text-slate-400">
                  Create a profile, complete your dossier, and see exactly which clubs you match — and why.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
                  <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                    Create your profile
                  </ButtonLink>
                  <ButtonLink to="/pricing" size="lg" variant="secondary">
                    View pricing
                  </ButtonLink>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                  {[
                    { node: <JerseyIllustration number="9" />, label: 'Free to start' },
                    { node: <CrestIllustration />, label: 'Verified clubs only' },
                    { node: <WhistleIllustration />, label: 'Safeguarding-first' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="h-7 w-7 shrink-0 opacity-70">{item.node}</div>
                      <span className="gw-mono text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
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
                      <Link
                        to={link.to}
                        className="text-[12px] text-slate-500 transition-colors hover:text-slate-200"
                      >
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
};