import { FeaturePage } from '../../components/layout/FeaturePage';

export const PrivacyPage = () => (
  <FeaturePage
    eyebrow="Privacy"
    title="Data handling built for youth safeguarding"
    description="Youth consent, audit records, and privacy notices are treated as first-class server-side concerns rather than frontend toggles."
    actions={[{ label: 'Safeguarding', to: '/safeguarding', primary: true }, { label: 'Terms', to: '/terms' }]}
    bullets={['Consent status controls visibility', 'Audit records are append-only', 'Private club notes stay hidden', 'AI receives only approved structured inputs']}
  />
);
