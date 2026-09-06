import { FeaturePage } from '../../components/layout/FeaturePage';

export const AboutPage = () => (
  <FeaturePage
    eyebrow="Platform story"
    title="A recruitment system with safeguarding built in"
    description="GROUNDWORK brings together players, guardians, clubs, and administrators in one audited platform with deterministic matching and server-side enforcement."
    actions={[{ label: 'Back to home', to: '/' }, { label: 'Explore clubs', to: '/clubs', primary: true }]}
    bullets={['Deterministic score calculation', 'Guardian-led youth consent', 'Club verification and audit trails', 'Role-based access throughout the stack']}
  />
);
