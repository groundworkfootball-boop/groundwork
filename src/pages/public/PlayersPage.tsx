import { ArrowRight, Target, Video, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DossierIllustration, VideoAnalysisIllustration } from '../../components/illustrations';

const BENEFITS = [
  {
    icon: Target,
    title: 'Matched, not filtered',
    body: 'Every club requirement is scored against your dossier. You see the percentage and the exact breakdown.',
  },
  {
    icon: Video,
    title: 'Video that speaks for you',
    body: 'Upload match clips. Processing, thumbnails and observable AI descriptions run server-side.',
  },
  {
    icon: Sparkles,
    title: 'Advice, not judgement',
    body: 'AI suggestions read only your own profile signals. They never rate your ability or affect your score.',
  },
];

export const PlayersPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="For players"
        title="Your dossier, scored honestly."
        description="Build a structured profile, upload match footage, and see exactly which clubs you match — and why."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/register" iconRight={<ArrowRight className="h-4 w-4" />}>
            Create your profile
          </ButtonLink>
          <ButtonLink to="/how-it-works" variant="secondary">
            How scoring works
          </ButtonLink>
        </div>
      </PublicPageHeader>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Badge tone="brand" icon={<TrendingUp className="h-3 w-3" />}>
              Player dossier
            </Badge>
            <h2 className="gw-display mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              The data clubs actually filter on.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              Positions, playing level, physical attributes, availability and video. Completeness is calculated
              server-side and drives how discoverable you are.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Primary and secondary positions',
                'Technical, physical and mental ratings',
                'Training and trial availability',
                'Playing history and achievements',
                'Up to 10 reviewed video clips',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-[13px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <DossierIllustration />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {BENEFITS.map((item) => (
              <Card key={item.title} padding="md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-brand/10">
                  <item.icon className="h-4.5 w-4.5 text-brand" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <VideoAnalysisIllustration />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="gw-display text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              AI describes. You decide.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              After processing, AI generates observable-only descriptions — camera framing, dominant foot, third of the
              pitch, action type. You review and accept, edit or reject each one.
            </p>
            <div className="mt-6 rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
              <p className="text-[12.5px] leading-relaxed text-violet-100/85">
                AI never rates your ability, predicts potential, or influences your match score. Those are hard
                boundaries enforced in code and in security rules.
              </p>
            </div>
            <ButtonLink to="/register" className="mt-7" iconRight={<ArrowRight className="h-4 w-4" />}>
              Start your dossier
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
