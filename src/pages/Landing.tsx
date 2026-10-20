import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Target,
  Building2,
  Sparkles,
  CheckCircle2,
  Play,
  Lock,
  Zap,
  Users,
  Video,
  Sliders,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ButtonLink } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScoreRing } from '../components/ui/Progress';
import {
  StadiumIllustration,
  DossierIllustration,
  SafeguardingIllustration,
  RecruitmentIllustration,
  VideoAnalysisIllustration,
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
    title: 'Deterministic matching',
    body: 'Every player-club score is computed by a pure, rule-based engine. Same inputs, same score — always. No AI, no randomness, no black box.',
    accent: 'text-brand',
    ring: 'border-brand/25 bg-brand/10',
  },
  {
    icon: ShieldCheck,
    title: 'Safeguarding by default',
    body: 'Youth profiles stay invisible until a guardian grants consent, and only verified clubs with live safeguarding clearance can ever see them.',
    accent: 'text-emerald-300',
    ring: 'border-emerald-400/25 bg-emerald-400/10',
  },
  {
    icon: Sparkles,
    title: 'AI that advises, never decides',
    body: 'AI writes video descriptions, squad gap notes and profile tips. It can never touch a match score, a ranking or a weight.',
    accent: 'text-violet-300',
    ring: 'border-violet-400/25 bg-violet-400/10',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Build a verified dossier',
    body: 'Positions, attributes, availability, playing history and video — structured data clubs can actually filter on.',
  },
  {
    n: '02',
    title: 'Get scored, not guessed',
    body: 'The engine weighs position, distance, level, attributes, availability and boost against each club’s live requirements.',
  },
  {
    n: '03',
    title: 'See the full breakdown',
    body: 'Every percentage is itemised. You see exactly which dimension earned the points and which cost you.',
  },
  {
    n: '04',
    title: 'Apply, trial, sign',
    body: 'Applications, shortlists and trial invitations run through one audited pipeline with notifications at every stage.',
  },
];

const AUDIENCES = [
  {
    icon: Users,
    tag: 'Ages 18+',
    title: 'Adult players',
    body: 'Publish a data-backed profile, upload match footage, and get matched against non-league, semi-pro and academy requirements.',
    to: '/players',
    cta: 'Player pathway',
    accent: 'text-brand',
    border: 'hover:border-brand/35',
  },
  {
    icon: ShieldCheck,
    tag: 'Under 18',
    title: 'Youth & guardians',
    body: 'Consent-gated visibility, immutable consent audit trails, and clubs that must hold live youth verification to appear at all.',
    to: '/safeguarding',
    cta: 'Safeguarding model',
    accent: 'text-emerald-300',
    border: 'hover:border-emerald-400/35',
  },
  {
    icon: Building2,
    tag: 'Clubs & academies',
    title: 'Recruitment teams',
    body: 'Search precomputed match results, run squad gap analysis, manage shortlists and trials, and track every candidate in one place.',
    to: '/clubs',
    cta: 'Club platform',
    accent: 'text-sky-300',
    border: 'hover:border-sky-400/35',
  },
];

export const Landing = () => {
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const el = videoRef.current;
    if (!el) return;

    // The video may already have loaded before React attached handlers, so
    // check readyState immediately as well as listening for the event.
    const markReady = () => setVideoReady(true);
    if (el.readyState >= 2) markReady();
    el.addEventListener('loadeddata', markReady);
    el.addEventListener('canplay', markReady);

    const play = () => {
      el.play().catch(() => {
        /* autoplay blocked — poster remains visible */
      });
    };
    if (el.readyState >= 2) play();
    else el.addEventListener('loadeddata', play, { once: true });

    return () => {
      el.removeEventListener('loadeddata', markReady);
      el.removeEventListener('canplay', markReady);
    };
  }, [reducedMotion]);

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-6 px-5 lg:px-8">
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

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </Link>
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
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10">
          {!reducedMotion && (
            <video
              ref={videoRef}
              className={`h-full w-full object-cover object-[50%_58%] transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
              src="/media/hero.mp4"
              poster="/media/hero-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              onLoadedData={() => setVideoReady(true)}
            />
          )}
          {reducedMotion && (
            <img src="/media/hero-poster.jpg" alt="" className="h-full w-full object-cover" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/25 to-ink-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/30 to-transparent" />
          <div className="absolute inset-0 gw-grid-bg opacity-[0.12]" />
        </div>

        <div className="mx-auto w-full max-w-8xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="gw-rise">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand gw-pulse-ring" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  UK non-league &amp; academy opportunity engine
                </span>
              </div>

              <h1 className="gw-display text-[clamp(2.6rem,6.2vw,4.6rem)] text-white">
                Get seen.
                <br />
                <span className="text-slate-500">Get matched.</span>
                <br />
                <span className="text-brand">Get signed.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
                Groundwork connects grassroots, Sunday league and academy talent with non-league, semi-pro and
                professional clubs — through a transparent, deterministic compatibility engine instead of guesswork.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  to="/register"
                  size="lg"
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  className="sm:w-auto"
                >
                  Create your profile
                </ButtonLink>
                <ButtonLink
                  to="/how-it-works"
                  size="lg"
                  variant="secondary"
                  iconLeft={<Play className="h-4 w-4" />}
                >
                  See how scoring works
                </ButtonLink>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/[0.08] pt-7">
                {[
                  { k: '100%', v: 'Deterministic scoring' },
                  { k: '6', v: 'Weighted dimensions' },
                  { k: '0', v: 'AI-scored players' },
                ].map((item) => (
                  <div key={item.v}>
                    <dt className="gw-numeric font-display text-2xl font-bold text-white">{item.k}</dt>
                    <dd className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{item.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Live score card */}
            <div className="gw-rise relative" style={{ animationDelay: '120ms' }}>
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand/[0.06] blur-3xl" />
              <div className="overflow-hidden rounded-3xl border border-white/[0.10] bg-ink-900/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Match result</p>
                    <p className="mt-1 text-sm font-semibold text-white">Central midfielder → Step 4 club</p>
                  </div>
                  <Badge tone="emerald" dot>
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center gap-6 px-5 py-6">
                  <ScoreRing value={87} size={116} label="Match fit" />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    {[
                      { label: 'Position', pct: 100, tone: 'bg-brand' },
                      { label: 'Playing level', pct: 92, tone: 'bg-emerald-400' },
                      { label: 'Attributes', pct: 85, tone: 'bg-violet-400' },
                      { label: 'Distance', pct: 78, tone: 'bg-sky-400' },
                      { label: 'Availability', pct: 70, tone: 'bg-amber-400' },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">{row.label}</span>
                          <span className="gw-numeric font-semibold text-slate-200">{row.pct}%</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
                          <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-5 py-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Lock className="h-3 w-3" />
                    Config v3 · auditable
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    Full breakdown
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/40">
        <div className="mx-auto flex max-w-8xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-6 lg:px-8">
          {[
            { icon: ShieldCheck, text: 'Guardian consent enforced server-side' },
            { icon: Lock, text: 'Firestore rules + custom claims' },
            { icon: Sliders, text: 'Versioned matching configuration' },
            { icon: CheckCircle2, text: 'Immutable audit trail' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
              <item.icon className="h-3.5 w-3.5 text-brand" />
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pillars ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="gw-eyebrow">Two separate intelligence systems</p>
          <h2 className="gw-display mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)] text-white">
            Deterministic matching. Advisory AI. Never mixed.
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-slate-400">
            The score that ranks a player is produced only by the rule engine. AI is confined to descriptions,
            suggestions and gap notes — and it has no write access to scores, rankings or weights.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 transition-colors hover:border-white/[0.16]"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${pillar.ring}`}>
                <pillar.icon className={`h-5 w-5 ${pillar.accent}`} />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold text-white">{pillar.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Engine explainer ───────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-white/[0.06] bg-ink-900/30">
        <div className="absolute inset-0 gw-dot-bg opacity-30" />
        <div className="relative mx-auto grid max-w-8xl items-center gap-14 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <p className="gw-eyebrow">The matching engine</p>
            <h2 className="gw-display mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)] text-white">
              A score you can audit line by line.
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-400">
              Six weighted dimensions, stored in versioned configuration. Change a weight and a new config version is
              created — historical results keep the version they were scored under.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                { label: 'Position compatibility', weight: '30%' },
                { label: 'Playing level', weight: '20%' },
                { label: 'Attributes', weight: '20%' },
                { label: 'Distance / region', weight: '15%' },
                { label: 'Availability overlap', weight: '10%' },
                { label: 'Active boost', weight: '5%' },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5"
                >
                  <span className="text-[13px] text-slate-300">{row.label}</span>
                  <span className="gw-numeric text-[13px] font-semibold text-brand">{row.weight}</span>
                </li>
              ))}
            </ul>

            <ButtonLink
              to="/how-it-works"
              variant="outline"
              size="md"
              className="mt-8"
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Read the scoring spec
            </ButtonLink>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-full bg-emerald-400/[0.05] blur-3xl" />
            <DossierIllustration />
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="gw-eyebrow">The pathway</p>
            <h2 className="gw-display mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)] text-white">
              From grassroots to a signed contract.
            </h2>
          </div>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
          >
            Full walkthrough
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <span className="gw-numeric font-display text-[13px] font-bold text-brand">{step.n}</span>
              <h3 className="mt-3 text-[14.5px] font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Audiences ──────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="gw-eyebrow">Built for every side of the game</p>
            <h2 className="gw-display mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)] text-white">
              One platform, three very different jobs.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <Link
                key={audience.title}
                to={audience.to}
                className={`group flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 transition-all ${audience.border}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04]">
                    <audience.icon className={`h-5 w-5 ${audience.accent}`} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {audience.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-[16px] font-semibold text-white">{audience.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-400">{audience.body}</p>
                <span className={`mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${audience.accent}`}>
                  {audience.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safeguarding ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SafeguardingIllustration />
          </div>
          <div className="order-1 lg:order-2">
            <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
              Safeguarding first
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.9rem,3.6vw,2.9rem)] text-white">
              A minor&apos;s profile is invisible until a guardian says otherwise.
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-400">
              Consent is not a UI toggle. It is enforced in Firestore rules, in Cloud Functions and in Storage rules —
              so bypassing the React app changes nothing.
            </p>

            <ul className="mt-7 space-y-3.5">
              {[
                'Youth profiles start hidden with consentStatus = pending',
                'Only clubs with live youth verification can ever read them',
                'Withdrawal delists the profile and queues media deletion immediately',
                'Every consent action writes an immutable audit record',
                'AI processing is blocked without granted consent — at enqueue and at execution',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-[13px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>

            <ButtonLink to="/safeguarding" variant="secondary" className="mt-8" iconRight={<ArrowRight className="h-4 w-4" />}>
              Read the safeguarding model
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Feature grid ───────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10">
                    <Building2 className="h-4.5 w-4.5 text-sky-300" />
                  </span>
                  <h3 className="mt-4 text-[16px] font-semibold text-white">Recruitment workspace</h3>
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-400">
                    Precomputed match results, cursor-paginated search, shortlists with private notes, trial scheduling
                    and squad gap analysis — all scoped to your club.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <RecruitmentIllustration />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10">
                  <Video className="h-4.5 w-4.5 text-violet-300" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-white">Video with reviewable AI tags</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                  FFmpeg transcode, thumbnail generation, then observable-only AI descriptions you accept, edit or
                  reject.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10">
                  <Zap className="h-4.5 w-4.5 text-amber-300" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-white">Boosts that stay honest</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                  A boost is one documented 5% dimension. It cannot rewrite position, level or attribute scores.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <VideoAnalysisIllustration />
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <StadiumIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gw-aurora" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center lg:px-8">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
            <Star className="h-5 w-5 text-brand" />
          </div>
          <h2 className="gw-display text-[clamp(2rem,4.4vw,3.2rem)] text-white">
            Your next club is one honest score away.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate-400">
            Create a profile, complete your dossier, and see exactly which clubs you match — and why.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Create your profile
            </ButtonLink>
            <ButtonLink to="/pricing" size="lg" variant="secondary">
              View pricing
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-ink-950">
        <div className="mx-auto max-w-8xl px-5 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
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
};




