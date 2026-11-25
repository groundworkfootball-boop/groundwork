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
  Sliders,
  Target,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ButtonLink } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MatchScorePanel } from '../components/ui/ScorePanel';
import { Hero3DPitchScene } from '../components/visual/Hero3DPitchScene';
import { MediaFrame } from '../components/visual/MediaFrame';

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
    body: 'Every player-club score comes from a pure, rule-based engine. Same inputs, same score — always. Zero randomness or black-box ranking.',
    tone: 'brand' as const,
  },
  {
    icon: ShieldCheck,
    index: '02',
    title: 'Safeguarding by default',
    body: 'Youth profiles remain invisible until a guardian grants consent, and only clubs with live, unexpired safeguarding clearance can read them.',
    tone: 'emerald' as const,
  },
  {
    icon: Sliders,
    index: '03',
    title: 'AI that advises, never decides',
    body: 'AI writes observable video descriptions, squad gap notes and profile tips. It has zero write access to scores, rankings or weights.',
    tone: 'sky' as const,
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

const PATHWAYS = [
  {
    key: 'players',
    tag: 'Ages 18+',
    title: 'Adult players',
    body: 'Publish a structured dossier, upload match footage, and match deterministically against non-league, semi-pro and academy requirements.',
    to: '/players',
    cta: 'Player pathway',
    image: '/images/player-training.jpg',
    alt: 'Football player striking the ball in match play',
    accent: 'text-brand',
  },
  {
    key: 'guardians',
    tag: 'Under 18',
    title: 'Youth & guardians',
    body: 'Consent-gated visibility, immutable consent audit trails, and clubs that must hold live youth verification to appear at all.',
    to: '/safeguarding',
    cta: 'Safeguarding model',
    image: '/images/player-tunnel.jpg',
    alt: 'Players shaking hands on the touchline during a match',
    accent: 'text-emerald-300',
  },
  {
    key: 'clubs',
    tag: 'Clubs & academies',
    title: 'Recruitment teams',
    body: 'Search precomputed match results, run squad gap analysis, manage shortlists and trials, and track every candidate.',
    to: '/clubs',
    cta: 'Club platform',
    image: '/images/stadium-night.jpg',
    alt: 'Floodlit football stadium pitch at dusk',
    accent: 'text-sky-300',
  },
] as const;

export const Landing = () => {
  const { isAuthenticated } = useAuth();
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const featureVideoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [featurePlaying, setFeaturePlaying] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(motionQuery.matches);
    if (motionQuery.matches) {
      setIsPlaying(false);
      setFeaturePlaying(false);
    }
    const onChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
      if (event.matches) {
        setIsPlaying(false);
        setFeaturePlaying(false);
      }
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
    const targets = [bgVideoRef.current, featureVideoRef.current].filter(
      (v): v is HTMLVideoElement => Boolean(v),
    );
    if (!targets.length) return;

    const tryPlayAll = () => {
      for (const el of targets) {
        el.muted = true;
        const attempt = el.play();
        if (attempt) attempt.catch(() => undefined);
      }
    };

    tryPlayAll();
    targets.forEach((el) => {
      el.addEventListener('loadeddata', tryPlayAll);
      el.addEventListener('canplay', tryPlayAll);
    });
    document.addEventListener('pointerdown', tryPlayAll, { once: true, passive: true });

    return () => {
      targets.forEach((el) => {
        el.removeEventListener('loadeddata', tryPlayAll);
        el.removeEventListener('canplay', tryPlayAll);
      });
      document.removeEventListener('pointerdown', tryPlayAll);
    };
  }, [reduceMotion]);

  const toggleBgVideo = () => {
    const el = bgVideoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => undefined);
      setIsPlaying(true);
    }
  };

  const toggleFeatureVideo = () => {
    const el = featureVideoRef.current;
    if (!el) return;
    if (featurePlaying) {
      el.pause();
      setFeaturePlaying(false);
    } else {
      el.play().catch(() => undefined);
      setFeaturePlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled ? 'border-white/[0.08] bg-ink-950/90 backdrop-blur-xl' : 'border-transparent bg-ink-950/40 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-3 px-5 lg:gap-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Groundwork home">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-brand/40 bg-brand/10">
              <Target className="h-4 w-4 text-brand" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-[0.16em] text-white">GROUNDWORK</span>
              <span className="gw-mono mt-1 text-[8.5px] text-slate-400">Football recruitment</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
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
              className="rounded-md p-2 text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
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

      {/* ── Hero: Real Match Video Backdrop + Interactive 3D Tactical Pitch ── */}
      <section className="relative isolate overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10 bg-ink-950">
          <img
            src="/media/hero-poster.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            aria-hidden
          />
          {!reduceMotion ? (
            <video
              ref={bgVideoRef}
              className="absolute inset-0 h-full w-full object-cover opacity-55"
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

          {/* Clean directional contrast scrim — dark slate only, zero white fog */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/65 via-transparent to-ink-950" />
        </div>

        <div className="mx-auto max-w-8xl px-5 pb-16 pt-12 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-ink-950/75 backdrop-blur-md">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
              {/* Left: Product value & primary actions */}
              <div className="relative flex flex-col justify-between border-b border-white/[0.08] p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-11">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.10] px-2.5 py-1">
                      <span className="gw-live-dot" />
                      <span className="gw-mono text-brand">Match engine online</span>
                    </span>
                    <span className="gw-mono text-slate-400">UK non-league · academy</span>
                  </div>

                  <h1 className="gw-display mt-6 text-[clamp(2.35rem,5vw,3.9rem)] leading-[0.98] text-white">
                    Get seen.
                    <br />
                    <span className="text-slate-400">Get matched.</span>
                    <br />
                    <span className="text-brand">Get signed.</span>
                  </h1>

                  <p className="mt-5 max-w-lg text-[14.5px] leading-relaxed text-slate-300">
                    Groundwork connects grassroots, Sunday league and academy players with verified non-league,
                    semi-pro and professional clubs — powered by a deterministic compatibility engine instead of guesswork.
                  </p>

                  <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                    <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                      Get started
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
                </div>

                <div>
                  <dl className="mt-9 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.07]">
                    {[
                      { k: '100%', v: 'Deterministic' },
                      { k: '6', v: 'Weighted dims' },
                      { k: '0', v: 'AI scores' },
                    ].map((item) => (
                      <div key={item.v} className="bg-ink-950/95 px-3.5 py-3.5">
                        <dt className="gw-numeric font-display text-[20px] font-bold leading-none text-white">{item.k}</dt>
                        <dd className="gw-mono mt-1.5 text-slate-400">{item.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      {[
                        { icon: ShieldCheck, text: 'Consent enforced server-side' },
                        { icon: Lock, text: 'Rules + custom claims' },
                        { icon: BarChart3, text: 'Immutable audit trail' },
                      ].map((item) => (
                        <span key={item.text} className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                          <item.icon className="h-3.5 w-3.5 text-brand/80" />
                          {item.text}
                        </span>
                      ))}
                    </div>

                    {!reduceMotion ? (
                      <button
                        type="button"
                        onClick={toggleBgVideo}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-ink-900/90 px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-300 transition-colors hover:border-brand/50 hover:text-white"
                        aria-label={isPlaying ? 'Pause background pitch video' : 'Play background pitch video'}
                      >
                        {isPlaying ? <Pause className="h-3 w-3 text-brand" /> : <Play className="h-3 w-3 text-brand" />}
                        <span>{isPlaying ? 'Pause video' : 'Play video'}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right: Interactive 3D Tactical Pitch + Match Score Breakdown */}
              <div className="relative flex min-h-[460px] flex-col justify-between bg-ink-950/85">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
                  <span className="gw-mono text-slate-400">3D tactical pitch · drag to orbit</span>
                  <span className="flex items-center gap-1.5">
                    <span className="gw-live-dot" />
                    <span className="gw-mono text-brand">4-3-3 · CM slot</span>
                  </span>
                </div>

                <div className="relative h-[260px] w-full sm:h-[300px]">
                  <Hero3DPitchScene />
                </div>

                <div className="p-4 sm:p-5">
                  <MatchScorePanel
                    compact
                    score={87}
                    title="Central midfielder → Step 4 club"
                    subtitle="Auditable score breakdown"
                    verified
                    href="/how-it-works"
                    rows={[
                      { label: 'Position', ratio: 1, pct: 30, tone: 'brand' },
                      { label: 'Level', ratio: 0.92, pct: 18, tone: 'emerald' },
                      { label: 'Attributes', ratio: 0.85, pct: 17, tone: 'sky' },
                      { label: 'Distance', ratio: 0.78, pct: 12, tone: 'sky' },
                      { label: 'Availability', ratio: 0.7, pct: 7, tone: 'amber' },
                      { label: 'Boost', ratio: 0.6, pct: 3, tone: 'rose' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process rail ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/50">
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
                <h2 className="mt-3 text-[14px] font-semibold text-white">{step.title}</h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three Pathways (Real Photography Cards) ────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="gw-eyebrow">Built for every side of the game</p>
            <h2 className="gw-display mt-3 text-[clamp(1.8rem,3.4vw,2.7rem)] text-white">
              One ecosystem, three dedicated workspaces.
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-slate-400">
            Player profiles, guardian consent gates and club recruitment pipelines run on shared deterministic data —
            never on borrowed spreadsheets.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PATHWAYS.map((pathway) => (
            <Link
              key={pathway.key}
              to={pathway.to}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/50 transition-colors hover:border-white/[0.18]"
            >
              <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.07] bg-ink-950">
                <img
                  src={pathway.image}
                  alt={pathway.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                <span className="gw-mono absolute left-3.5 top-3.5 rounded-md border border-white/[0.16] bg-ink-950/85 px-2 py-1 text-slate-200">
                  {pathway.tag}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-[16px] font-semibold text-white">{pathway.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-400">{pathway.body}</p>
                <span className={`mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${pathway.accent}`}>
                  {pathway.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Match Video & Observable AI Review (Side-by-side real video) ─ */}
      <section className="border-y border-white/[0.06] bg-ink-900/35">
        <div className="mx-auto grid max-w-8xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-ink-950">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-brand" />
                <span className="gw-mono text-slate-300">Match footage pipeline · FFmpeg + reviewable AI</span>
              </div>
              {!reduceMotion ? (
                <button
                  type="button"
                  onClick={toggleFeatureVideo}
                  className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-2 py-1 text-[10.5px] font-mono uppercase text-slate-300 hover:border-brand/50"
                >
                  {featurePlaying ? <Pause className="h-2.5 w-2.5 text-brand" /> : <Play className="h-2.5 w-2.5 text-brand" />}
                  {featurePlaying ? 'Pause' : 'Play'}
                </button>
              ) : null}
            </div>
            <div className="relative aspect-video w-full bg-ink-950">
              <video
                ref={featureVideoRef}
                className="h-full w-full object-cover"
                src="/media/hero.mp4"
                poster="/media/hero-poster.jpg"
                autoPlay={!reduceMotion}
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
            <div className="border-t border-white/[0.07] bg-ink-900/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="gw-mono text-brand">AI-assisted suggestion (player review required)</span>
                <span className="gw-mono text-slate-500">0 impact on matchScore</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['Wide camera framing', 'Attacking third', 'Passing sequence', 'Right-foot strike'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Badge tone="brand" icon={<Target className="h-3 w-3" />}>
              Two separate systems
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.2vw,2.6rem)] text-white">
              Six deterministic weights. Advisory AI only.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Your match score is calculated from six versioned weights stored in Firestore — never by an LLM. AI
              suggests observable clip tags you can accept, edit or reject, and flags squad depth gaps.
            </p>

            <div className="mt-6 space-y-2.5">
              {[
                ['Position compatibility', '30%', 'bg-brand', 100],
                ['Playing level', '20%', 'bg-emerald-400', 67],
                ['Attributes', '20%', 'bg-sky-400', 67],
                ['Distance / region', '15%', 'bg-sky-300', 50],
                ['Availability overlap', '10%', 'bg-amber-400', 33],
                ['Visibility boost', '5%', 'bg-rose-400', 17],
              ].map(([label, pct, tone, width]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <span className="w-[155px] shrink-0 text-[12.5px] text-slate-300">{label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
                  </div>
                  <span className="gw-numeric w-10 shrink-0 text-right text-[12px] font-semibold text-white">
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
        </div>
      </section>

      {/* ── Architecture Pillars ───────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const tone =
              pillar.tone === 'brand'
                ? 'text-brand border-brand/25 bg-brand/10'
                : pillar.tone === 'emerald'
                  ? 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10'
                  : 'text-sky-300 border-sky-400/25 bg-sky-400/10';
            return (
              <div key={pillar.title} className="rounded-2xl border border-white/[0.08] bg-ink-900/45 p-6">
                <div className="flex items-start justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone}`}>
                    <pillar.icon className="h-4 w-4" />
                  </span>
                  <span className="gw-mono text-slate-600">{pillar.index}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Safeguarding + Real Stadium Photography ────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/35">
        <div className="mx-auto grid max-w-8xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
            <MediaFrame
              src="/images/floodlights.jpg"
              alt="Stadium floodlight tower illuminating the night sky"
              caption="Club safeguarding verification"
              tag="12-month expiry"
              aspect="tall"
              className="sm:col-span-2"
            />
            <MediaFrame
              src="/images/pitch-match.jpg"
              alt="Aerial view of a live football match"
              caption="Precomputed match results"
              tag="Rule-based"
              aspect="tall"
            />
            <MediaFrame
              src="/images/stadium-aerial.jpg"
              alt="Football stadium illuminated at night"
              caption="Audit-logged consent"
              tag="Immutable"
              aspect="tall"
            />
          </div>

          <div className="order-1 lg:order-2">
            <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
              Safeguarding first
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.2vw,2.6rem)] text-white">
              A minor&apos;s profile stays invisible until a guardian approves.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Consent is enforced inside Firestore security rules, Storage rules and Cloud Functions — never as a
              frontend checkbox.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'Youth profiles start hidden with consentStatus = pending',
                'Only clubs with live, unexpired youth verification can read them',
                'Withdrawal delists immediately and queues associated media for deletion',
                'Every grant, withdrawal and re-grant writes an immutable consent audit',
                'AI processing is blocked without granted consent at enqueue and execution',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-[13px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to="/safeguarding" variant="secondary" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Read the safeguarding model
              </ButtonLink>
              <ButtonLink to="/register" iconLeft={<Zap className="h-3.5 w-3.5" />}>
                Get started
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-ink-900/70 p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="gw-eyebrow">Ready to step onto the pitch</p>
              <h2 className="gw-display mt-3 max-w-xl text-[clamp(1.9rem,4vw,2.9rem)] text-white">
                Your next club is one honest score away.
              </h2>
              <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-slate-400">
                Build your player dossier, verify your club, or manage guardian consent — all backed by server-enforced
                rules and transparent scoring.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                Get started
              </ButtonLink>
              <ButtonLink to="/pricing" size="lg" variant="secondary">
                View pricing
              </ButtonLink>
            </div>
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
                  { label: 'Get started', to: '/register' },
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
