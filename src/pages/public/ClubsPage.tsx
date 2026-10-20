import { ArrowRight, Building2, Search, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RecruitmentIllustration } from '../../components/illustrations';

const CAPABILITIES = [
  {
    icon: Search,
    title: 'Precomputed match search',
    body: 'Results are read from precomputed match documents — never calculated during a search request. Cursor pagination keeps it fast.',
  },
  {
    icon: Users,
    title: 'Shortlists with private notes',
    body: 'Organise candidates into shortlists. Internal notes are stored in a private subcollection players can never read.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification-gated youth access',
    body: 'Youth profiles appear only when your safeguarding verification is approved and unexpired.',
  },
];

export const ClubsPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="For clubs"
        title="Recruit on evidence, not on vibes."
        description="Search precomputed match results, run squad gap analysis, manage shortlists and trials — all scoped to your club and fully audited."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/register" iconRight={<ArrowRight className="h-4 w-4" />}>
            Register your club
          </ButtonLink>
          <ButtonLink to="/pricing" variant="secondary">
            View club plans
          </ButtonLink>
        </div>
      </PublicPageHeader>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Badge tone="sky" icon={<Building2 className="h-3 w-3" />}>
              Recruitment workspace
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              Every candidate, ranked by a score you can defend.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              Set your target positions, playing levels, region and availability. The engine scores every eligible
              player against those requirements and stores the breakdown.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Filter by position, age band, region, level and match score',
                'Sort by score, distance, completeness or recent activity',
                'See the exact weighted contribution per dimension',
                'Shortlist, invite to trial and track every status change',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                  <span className="text-[13px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <RecruitmentIllustration />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <Card key={item.title} padding="md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10">
                  <item.icon className="h-4.5 w-4.5 text-sky-300" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card padding="lg">
            <h3 className="text-[15px] font-semibold text-white">Verification pathway</h3>
            <ol className="mt-4 space-y-3">
              {[
                'Register your club and complete the profile',
                'Upload registration documents and proof of identity',
                'An administrator reviews and approves adult recruitment',
                'For youth recruitment, submit safeguarding certification',
                'Youth access is granted for 12 months and expires automatically',
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="gw-numeric flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-[11px] font-bold text-slate-400">
                    {index + 1}
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card padding="lg">
            <h3 className="text-[15px] font-semibold text-white">What stays private</h3>
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
              Club internal data is separated from the public profile document.
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                'Recruitment notes and candidate comments',
                'Internal squad notes and staff information',
                'Financial and subscription details',
                'Verification documents',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-[12.5px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};
