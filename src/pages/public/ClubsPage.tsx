import { ArrowRight, Search, Users, ShieldCheck, CheckCircle2, Layers, Lock } from 'lucide-react';
import { PublicLayout, PublicPageHeader, Reveal } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MatchScorePanel } from '../../components/ui/ScorePanel';
import { RecruitmentIllustration } from '../../components/illustrations';
import {
  TacticsBoardIllustration,
  CrestIllustration,
  ScoutingRadarIllustration,
} from '../../components/illustrations/football';

const CAPABILITIES = [
  {
    icon: Search,
    index: '01',
    title: 'Precomputed match search',
    body: 'Results are read from precomputed match documents — never calculated during a search request. Cursor pagination keeps it fast at any squad size.',
  },
  {
    icon: Users,
    index: '02',
    title: 'Shortlists with private notes',
    body: 'Organise candidates into shortlists. Internal notes live in a private subcollection players can never read.',
  },
  {
    icon: ShieldCheck,
    index: '03',
    title: 'Verification-gated youth access',
    body: 'Youth profiles appear only when your safeguarding verification is approved and unexpired — re-checked on every read.',
  },
];

const FILTERS = [
  'Position and secondary position',
  'Age band',
  'Region and travel radius',
  'Playing level',
  'Availability overlap',
  'Match score threshold',
  'Verified status',
  'Video availability',
  'Profile completeness',
];

const PLATFORM = [
  {
    title: 'Deterministic match results',
    body: 'Every player-club pair is scored in the background against your live requirements, then stored with its own breakdown and configuration version.',
  },
  {
    title: 'Squad roster and gap analysis',
    body: 'Record squad composition, formation and target level. AI identifies the positional gaps; the deterministic engine finds the players.',
  },
  {
    title: 'Applications and trials',
    body: 'One audited pipeline from application to trial invitation, with notifications at every status change.',
  },
  {
    title: 'Analytics that respect privacy',
    body: 'Funnel and conversion metrics on your own recruitment activity. No cross-club leakage, no youth identifiers.',
  },
];

export const ClubsPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="For clubs"
        title="Recruit on evidence, not on vibes."
        description="Search precomputed match results, run squad gap analysis, manage shortlists and trials — all scoped to your club and fully audited."
        aside={
          <MatchScorePanel
            score={92}
            subtitle="Club-side view"
            title="ST → your 4-3-3, Step 3 requirement"
            verified
            configVersion="config v3 · club scope"
            rows={[
              { label: 'Position', ratio: 1, pct: 30, tone: 'brand' },
              { label: 'Level', ratio: 0.96, pct: 19, tone: 'emerald' },
              { label: 'Attributes', ratio: 0.9, pct: 18, tone: 'violet' },
              { label: 'Distance', ratio: 0.86, pct: 13, tone: 'sky' },
              { label: 'Availability', ratio: 0.8, pct: 8, tone: 'amber' },
              { label: 'Boost', ratio: 0.7, pct: 4, tone: 'rose' },
            ]}
          />
        }
      >
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink to="/register" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
            Register your club
          </ButtonLink>
          <ButtonLink to="/pricing" variant="secondary">
            View club plans
          </ButtonLink>
        </div>
      </PublicPageHeader>

      {/* Capabilities */}
      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-3">
          {CAPABILITIES.map((capability, index) => (
            <Reveal key={capability.title} delay={index * 80}>
              <div className="h-full bg-ink-950/95 p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300">
                    <capability.icon className="h-4 w-4" />
                  </span>
                  <span className="gw-mono text-slate-700">{capability.index}</span>
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{capability.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{capability.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Search + illustration */}
      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto grid max-w-8xl gap-12 px-5 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <Reveal>
            <Badge tone="sky" icon={<Layers className="h-3 w-3" />}>
              Discovery
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] text-white">
              Filter on the dimensions that actually matter.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Search reads denormalised match snapshots, so a page of results is one bounded query — not hundreds of
              full profile reads.
            </p>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {FILTERS.map((filter) => (
                <span
                  key={filter}
                  className="rounded-md border border-white/[0.10] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-slate-300"
                >
                  {filter}
                </span>
              ))}
            </div>

            <p className="mt-5 flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-500">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />
              Youth results are never returned by client filters alone — the read itself requires live youth
              verification.
            </p>
          </Reveal>

          <Reveal delay={90} className="grid gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-ink-950/60 p-4">
              <RecruitmentIllustration />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-ink-950/60 p-4">
                <TacticsBoardIllustration />
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-ink-950/60 p-4">
                <ScoutingRadarIllustration />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Platform detail */}
      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <Reveal>
            <p className="gw-eyebrow">The workspace</p>
            <h2 className="gw-display mt-3 text-[clamp(1.7rem,3.2vw,2.5rem)] text-white">
              One recruitment surface, not six disconnected tools.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
              Everything a recruitment team needs sits inside one club-scoped console, from first search to signed
              squad member.
            </p>
            <div className="mt-7 rounded-xl border border-white/[0.08] bg-ink-950/60 p-4">
              <CrestIllustration className="mx-auto max-h-56" />
            </div>
          </Reveal>

          <div className="space-y-3">
            {PLATFORM.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <div className="rounded-xl border border-white/[0.08] bg-ink-900/40 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-white">{item.title}</h3>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{item.body}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="border-t border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="gw-frame overflow-hidden rounded-2xl p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] lg:items-center">
              <div>
                <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
                  Verification
                </Badge>
                <h2 className="gw-display mt-4 text-[clamp(1.6rem,3vw,2.2rem)] text-white">
                  Two separate approvals. Youth access expires on its own.
                </h2>
                <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-slate-400">
                  Adult recruitment verification and youth safeguarding verification are granted independently by an
                  administrator. Youth clearance carries an expiry date; when it lapses, access disappears without
                  anyone needing to act.
                </p>

                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    'Registration documents',
                    'Proof of club identity',
                    'Authorised representative',
                    'Safeguarding certificates',
                    'Expiry tracking',
                    'Immutable audit record',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[12px] text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center">
                <CrestIllustration className="max-h-64" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="text-center">
          <h2 className="gw-display mx-auto max-w-lg text-[clamp(1.6rem,3.2vw,2.3rem)] text-white">
            Start with a verified club record.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-slate-400">
            Register, complete the guided setup and submit verification to unlock search.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <ButtonLink to="/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Register your club
            </ButtonLink>
            <ButtonLink to="/pricing" size="lg" variant="secondary">
              Compare plans
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};