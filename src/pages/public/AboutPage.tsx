import { ArrowRight, Target, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StadiumIllustration } from '../../components/illustrations';

const VALUES = [
  {
    icon: Target,
    title: 'Deterministic by design',
    body: 'The score that ranks a player is produced only by a pure rule engine. Same inputs, same output, every time.',
  },
  {
    icon: ShieldCheck,
    title: 'Safeguarding first',
    body: 'Youth visibility is a server decision, gated on guardian consent and live club verification.',
  },
  {
    icon: Sparkles,
    title: 'AI stays advisory',
    body: 'AI writes descriptions and suggestions. It has no write access to scores, rankings or weights.',
  },
];

export const AboutPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="About"
        title="Built for the part of football that gets overlooked."
        description="Groundwork exists because talented players outside the academy system are still discovered by luck. We replaced the luck with a transparent, auditable process."
      />

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="gw-display text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              Two systems. One hard boundary.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              Most recruitment platforms blur the line between data and opinion. Groundwork keeps them strictly
              separate: a deterministic engine decides compatibility, and AI is confined to describing what it can
              observe.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
              That separation is not a marketing claim — it is enforced in the codebase and in the security rules.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { k: '100%', v: 'Deterministic scoring' },
                { k: '6', v: 'Weighted dimensions' },
                { k: '0', v: 'AI-scored players' },
                { k: '12mo', v: 'Youth verification cycle' },
              ].map((stat) => (
                <div key={stat.v} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <p className="gw-numeric font-display text-[20px] font-bold text-brand">{stat.k}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-slate-500">{stat.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <StadiumIllustration />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map((value) => (
              <Card key={value.title} padding="md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04]">
                  <value.icon className="h-4.5 w-4.5 text-brand" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{value.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{value.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Users className="mx-auto h-8 w-8 text-brand" />
          <h2 className="gw-display mt-4 text-[clamp(1.6rem,3vw,2.2rem)] text-white">
            Built for players, guardians and clubs.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
            Three very different jobs, one platform. Each role gets a workspace designed around what they actually need
            to do.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/register" iconRight={<ArrowRight className="h-4 w-4" />}>
              Create an account
            </ButtonLink>
            <ButtonLink to="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
