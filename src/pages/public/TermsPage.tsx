import { FeaturePage } from '../../components/layout/FeaturePage';

export const TermsPage = () => (
  <FeaturePage
    eyebrow="Terms"
    title="Clear platform rules"
    description="Terms and platform policies will map to the underlying security and moderation model, with admin workflows for compliance and retention."
    actions={[{ label: 'Privacy', to: '/privacy' }, { label: 'Register', to: '/register', primary: true }]}
    bullets={['Role-based access', 'Prohibited content moderation', 'Payment and subscription integrity', 'Data retention and deletion workflows']}
  />
);
