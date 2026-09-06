import { FeaturePage } from '../../components/layout/FeaturePage';

export const PricingPage = () => (
  <FeaturePage
    eyebrow="Commercial model"
    title="Plans designed for clubs and players"
    description="Subscriptions, boosts, and payment workflows will be controlled by Stripe-backed server-side logic, with plan configuration stored centrally."
    actions={[{ label: 'Club sign-up', to: '/register', primary: true }, { label: 'See safeguarding', to: '/safeguarding' }]}
    metrics={[{ label: 'Club plans', value: 'Free / Standard / Premium' }, { label: 'Boosts', value: 'Visibility only' }, { label: 'Payments', value: 'Stripe' }, { label: 'Webhook safety', value: 'Idempotent' }]}
  />
);
