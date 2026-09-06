import { FeaturePage } from '../../components/layout/FeaturePage';

export const ContactPage = () => (
  <FeaturePage
    eyebrow="Support"
    title="Contact the team"
    description="Use this entry point for onboarding, club verification help, safeguarding queries, and platform support."
    actions={[{ label: 'Back home', to: '/' }, { label: 'Login', to: '/login', primary: true }]}
    bullets={['Onboarding support', 'Safeguarding escalation', 'Verification guidance', 'Operational feedback']}
  />
);
