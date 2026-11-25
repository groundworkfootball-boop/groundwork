import { ArrowRight, Target, Video, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { PublicLayout, PublicPageHeader, Reveal } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MatchScorePanel } from '../../components/ui/ScorePanel';
import { MediaFrame } from '../../components/visual/MediaFrame';

const BENEFITS = [
  {
    icon: Target,
    index: '01',
    title: 'Matched, not filtered',
    body: 'Every club requirement is scored against your dossier. You see the percentage and the exact breakdown behind it.',
  },
  {
    icon: Video,
    index: '02',
    title: 'Video that speaks for you',
    body: 'Upload match clips. Processing, thumbnails and observable AI descriptions all run server-side.',
  },
  {
    icon: Sparkles,
    index: '03',
    title: 'Advice, not judgement',
    body: 'AI suggestions read only your own profile signals. They never rate your ability or affect a single point of your score.',
  },
];

const CHECKLIST = [
  'Primary and secondary positions with adjacent-position scoring',
  'Playing level mapped to the real non-league step system',
  'Technical, physical and mental attribute ratings',
  'Training, trial and match availability windows',
  'Playing history, achievements and current club',
  'Reviewed video clips with thumbnails',
];

const STEPS = [
  {
    n: '01',
    title: 'Register',
    body: 'Create an account. Under-18s are routed through guardian consent automatically before anything is visible.',
  },
  {
    n: '02',
    title: 'Complete setup',
    body: 'A guided four-step flow captures identity, playing profile, availability and your story.',
  },
  {
    n: '03',
    title: 'Add evidence',
    body: 'Skill ratings and video clips raise your completeness score, which changes who can find you.',
  },
  {
    n: '04',
    title: 'Apply and trial',
    body: 'See your matches, apply to opportunities and track every status change through to a trial invitation.',
  },
];

export const PlayersPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="For players"
        title="Your dossier, scored honestly."
        description="Build a structured profile, upload match footage, and see exactly which clubs you match — and why."
        aside={
          <MatchScorePanel
            score={87}
            subtitle="Sample result"
            title="CM → Step 4 club, 38 km"
            verified
            rows={[
              { label: 'Position', ratio: 1, pct: 30, tone: 'brand' },
              { label: 'Level', ratio: 0.92, pct: 18, tone: 'emerald' },
              { label: 'Attributes', ratio: 0.85, pct: 17, tone: 'violet' },
              { label: 'Distance', ratio: 0.78, pct: 12, tone: 'sky' },
              { label: 'Availability', ratio: 0.7, pct: 7, tone: 'amber' },
              { label: 'Boost', ratio: 0.6, pct: 3, tone: 'rose' },
            ]}
          />
        }
      >
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink to="/register" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
            Create your profile
          </ButtonLink>
          <ButtonLink to="/how-it-works" variant="secondary">
            How scoring works
          </ButtonLink>
        </div>
      </PublicPageHeader>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Badge tone="brand" icon={<TrendingUp className="h-3 w-3" />}>
              Player dossier
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] text-white">
              The data clubs actually filter on.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Positions, playing level, physical attributes, availability and video. Completeness is calculated
              server-side and drives how discoverable you are.
            </p>

            <ul className="mt-6 space-y-2.5">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <span className="text-[12.5px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={90} className="grid gap-4 sm:grid-cols-2">
            <MediaFrame
              src="/images/player-training.jpg"
              alt="Player executing a pass on the pitch"
              caption="Verified match profile"
              tag="Profile completeness"
              className="sm:col-span-2"
            />
            <MediaFrame
              src="/images/match-action.jpg"
              alt="Football pitch touchline"
              caption="Position & availability"
              tag="30% + 10%"
            />
            <MediaFrame
              src="/images/player-tunnel.jpg"
              alt="Players on the touchline"
              caption="Trial pathway"
              tag="Audited"
            />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-3">
            {BENEFITS.map((benefit, index) => (
              <Reveal key={benefit.title} delay={index * 80}>
                <div className="h-full bg-ink-950/95 p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/25 bg-brand/10 text-brand">
                      <benefit.icon className="h-4 w-4" />
                    </span>
                    <span className="gw-mono text-slate-700">{benefit.index}</span>
                  </div>
                  <h3 className="mt-4 text-[14px] font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{benefit.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <p className="gw-eyebrow">From signup to trial</p>
          <h2 className="gw-display mt-3 text-[clamp(1.7rem,3.2vw,2.5rem)] text-white">
            Four steps, then the engine does the work.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 70}>
              <div className="h-full rounded-xl border border-white/[0.08] bg-ink-900/40 p-5">
                <span className="gw-mono text-brand">{step.n}</span>
                <h3 className="mt-2.5 text-[13.5px] font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto grid max-w-8xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <Reveal>
            <Badge tone="violet" icon={<Sparkles className="h-3 w-3" />}>
              AI boundary
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] text-white">
              AI reads footage. It never scores you.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Video tagging returns observable descriptions only — dominant foot, camera framing, third of the pitch,
              passing sequences. No ratings, rankings or potential predictions. You accept, edit or reject every
              suggestion.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'No skill ratings or ability judgements from AI',
                'No age or sensitive-attribute inference',
                'Youth footage is blocked from AI without granted consent',
                'Match scores are produced only by the deterministic engine',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
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
          </Reveal>

          <Reveal delay={90} className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-ink-950">
              <video
                className="aspect-video w-full object-cover"
                src="/media/hero.mp4"
                poster="/media/hero-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="border-t border-white/[0.07] p-4">
                <p className="gw-mono text-brand">AI-assisted observable tags</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {['Attacking third', 'Wide framing', 'Passing sequence', 'Right foot'].map((tag) => (
                    <span key={tag} className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="gw-frame overflow-hidden rounded-2xl p-8 text-center sm:p-12">
          <h2 className="gw-display mx-auto max-w-xl text-[clamp(1.6rem,3.2vw,2.3rem)] text-white">
            Stop guessing which clubs will reply.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-slate-400">
            Build the dossier once. See every score, every dimension and every reason.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Create your profile
            </ButtonLink>
            <ButtonLink to="/pricing" size="lg" variant="secondary">
              View pricing
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};