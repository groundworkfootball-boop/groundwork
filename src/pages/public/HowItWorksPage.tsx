import { ArrowRight, CheckCircle2, ShieldCheck, Target, Sliders, Video, Users, Lock } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DossierIllustration, SafeguardingIllustration } from '../../components/illustrations';

const STEPS = [
  {
    n: '01',
    title: 'Build a structured dossier',
    body: 'Positions, playing level, physical attributes, availability and video — the exact fields the engine scores.',
    icon: Target,
  },
  {
    n: '02',
    title: 'The engine scores you',
    body: 'Six weighted dimensions are evaluated against every club requirement. Pure function, no AI, no randomness.',
    icon: Sliders,
  },
  {
    n: '03',
    title: 'See the full breakdown',
    body: 'Every percentage is itemised so you know which dimension earned the points and which cost you.',
    icon: CheckCircle2,
  },
  {
    n: '04',
    title: 'Apply, trial, sign',
    body: 'Applications, shortlists and trial invitations run through one audited pipeline with notifications.',
    icon: Users,
  },
];

const WEIGHTS = [
  { label: 'Position compatibility', weight: '30%', detail: 'Exact 1.0 · adjacent 0.5 · incompatible 0' },
  { label: 'Playing level', weight: '20%', detail: 'Normalised distance from the club target tier' },
  { label: 'Attributes', weight: '20%', detail: 'Weighted average of skill, physical and mental ratings' },
  { label: 'Distance / region', weight: '15%', detail: 'Deterministic decay against preferred radius' },
  { label: 'Availability overlap', weight: '10%', detail: 'Overlap between player and club slots' },
  { label: 'Active boost', weight: '5%', detail: 'Flat bonus while a boost is active' },
];

export const HowItWorksPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="How it works"
        title="A score you can audit line by line."
        description="Groundwork replaces recruiter guesswork with a transparent, rule-based compatibility engine. Every number is reproducible and explainable."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/register" iconRight={<ArrowRight className="h-4 w-4" />}>
            Create your profile
          </ButtonLink>
          <ButtonLink to="/pricing" variant="secondary">
            View pricing
          </ButtonLink>
        </div>
      </PublicPageHeader>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <Card key={step.n} padding="md">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-brand/10">
                  <step.icon className="h-4.5 w-4.5 text-brand" />
                </span>
                <span className="gw-numeric font-display text-[13px] font-bold text-slate-600">{step.n}</span>
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto grid max-w-8xl items-center gap-14 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="gw-eyebrow">The six dimensions</p>
            <h2 className="gw-display mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              Weighted, versioned, reproducible.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              Weights live in versioned configuration. Change one and a new version is created — historical results keep
              the version they were scored under.
            </p>

            <ul className="mt-7 space-y-2.5">
              {WEIGHTS.map((row) => (
                <li
                  key={row.label}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-white">{row.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{row.detail}</p>
                  </div>
                  <span className="gw-numeric shrink-0 text-[13px] font-semibold text-brand">{row.weight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <DossierIllustration />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SafeguardingIllustration />
          </div>
          <div>
            <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
              Safeguarding
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              Youth visibility is a server decision.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              A minor&apos;s profile is invisible until a guardian grants consent, and even then only clubs with live
              youth verification can read it. Bypassing the interface changes nothing.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Consent enforced in Firestore rules and Cloud Functions',
                'Verification expiry checked on every read',
                'Withdrawal delists immediately and blocks AI processing',
                'Immutable consent audit trail',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-[13px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
            <ButtonLink to="/safeguarding" variant="secondary" className="mt-7" iconRight={<ArrowRight className="h-4 w-4" />}>
              Read the safeguarding model
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Video,
                title: 'Video with reviewable AI tags',
                body: 'FFmpeg transcode and thumbnail generation, then observable-only AI descriptions you accept, edit or reject.',
              },
              {
                icon: Lock,
                title: 'Server-owned trust state',
                body: 'Verification, consent, visibility and payment state are writable only by Cloud Functions.',
              },
              {
                icon: Sliders,
                title: 'Auditable configuration',
                body: 'Every weight change creates a new version. Nothing is silently rewritten.',
              },
            ].map((item) => (
              <Card key={item.title} padding="md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04]">
                  <item.icon className="h-4.5 w-4.5 text-slate-300" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
