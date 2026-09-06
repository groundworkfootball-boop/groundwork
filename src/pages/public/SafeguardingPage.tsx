import { FeaturePage } from '../../components/layout/FeaturePage';

export const SafeguardingPage = () => (
  <FeaturePage
    eyebrow="Safeguarding"
    title="Youth safety is system-wide"
    description="Every youth access path must validate identity, relationship, club verification, consent, and searchability before data is exposed."
    actions={[{ label: 'Guardian register', to: '/register', primary: true }, { label: 'Privacy policy', to: '/privacy' }]}
    metrics={[{ label: 'Access checks', value: 'Server-side' }, { label: 'Consent', value: 'Time-bound' }, { label: 'Audit log', value: 'Immutable' }, { label: 'AI safety', value: 'Consent-gated' }]}
  />
);
