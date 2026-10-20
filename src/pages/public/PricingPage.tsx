import { Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const PLAYER_PLANS = [
  {
    name: 'Grassroots',
    price: 'Free',
    period: 'forever',
    description: 'Everything you need to be discoverable.',
    features: [
      'Complete athletic dossier',
      'Deterministic club matching',
      'Up to 3 video clips',
      'Unlimited trial applications',
      'Full safeguarding protections',
    ],
    cta: 'Start free',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Player Pro',
    price: '£9.99',
    period: 'per month',
    description: 'Maximum visibility for serious athletes.',
    features: [
      'Everything in Grassroots',
      'Up to 10 video clips',
      'AI observable action tagging',
      'AI improvement recommendations',
      '5% documented boost dimension',
      'Priority trial notifications',
    ],
    cta: 'Upgrade',
    href: '/register',
    highlight: true,
  },
];

const CLUB_PLANS = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    description: 'Evaluate the platform with adult recruitment.',
    features: ['Adult player search', 'Deterministic match scores', '1 shortlist', 'Basic trial management'],
    cta: 'Get started',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Standard',
    price: '£49',
    period: 'per month',
    description: 'For clubs recruiting across a full season.',
    features: [
      'Everything in Free',
      'Unlimited shortlists',
      'Squad management',
      'AI squad gap analysis',
      'Recruitment analytics',
      'Priority verification review',
    ],
    cta: 'Choose Standard',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '£149',
    period: 'per month',
    description: 'For academies and multi-team setups.',
    features: [
      'Everything in Standard',
      'Youth recruitment (with verification)',
      'Multiple squad profiles',
      'Advanced analytics',
      'Dedicated onboarding',
    ],
    cta: 'Choose Premium',
    href: '/register',
    highlight: false,
  },
];

function PlanCard({ plan }: { plan: (typeof PLAYER_PLANS)[number] }) {
  return (
    <Card
      padding="lg"
      className={plan.highlight ? 'border-brand/35 bg-brand/[0.04]' : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-white">{plan.name}</h3>
          <p className="mt-1 text-[12px] text-slate-500">{plan.description}</p>
        </div>
        {plan.highlight ? <Badge tone="brand">Popular</Badge> : null}
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="gw-numeric font-display text-[32px] font-bold text-white">{plan.price}</span>
        <span className="text-[12px] text-slate-500">{plan.period}</span>
      </div>

      <ul className="mt-5 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            <span className="text-[12.5px] leading-relaxed text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      <ButtonLink
        to={plan.href}
        variant={plan.highlight ? 'primary' : 'secondary'}
        fullWidth
        className="mt-6"
        iconRight={<ArrowRight className="h-4 w-4" />}
      >
        {plan.cta}
      </ButtonLink>
    </Card>
  );
}

export const PricingPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="Pricing"
        title="Transparent plans. No hidden scoring."
        description="Payments are processed by Stripe. Subscription state is authoritative on the server and never trusted from the client."
      />

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="mb-8 flex items-center gap-2">
          <Zap className="h-4 w-4 text-brand" />
          <h2 className="text-[16px] font-semibold text-white">For players</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:max-w-3xl">
          {PLAYER_PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="mb-8 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <h2 className="text-[16px] font-semibold text-white">For clubs</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {CLUB_PLANS.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Boosts are honest',
              body: 'A boost is one documented 5% dimension. It cannot rewrite position, level or attribute scores.',
            },
            {
              title: 'Cancel any time',
              body: 'Stripe Billing manages the subscription. Access continues until the period ends.',
            },
            {
              title: 'Youth requires verification',
              body: 'Youth recruitment is only available to clubs with approved safeguarding documentation.',
            },
          ].map((item) => (
            <Card key={item.title} padding="md">
              <h3 className="text-[13.5px] font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};
