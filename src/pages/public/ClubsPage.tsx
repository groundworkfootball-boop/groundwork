import { FeaturePage } from '../../components/layout/FeaturePage';

export const ClubsPage = () => (
  <FeaturePage
    eyebrow="Club recruitment"
    title="Find the right players faster"
    description="Club dashboards are structured around recruitment, verification, shortlist management, and deterministic player matching."
    actions={[{ label: 'Create club account', to: '/register', primary: true }, { label: 'Club dashboard', to: '/dashboard' }]}
    metrics={[{ label: 'Match factors', value: '6 weighted signals' }, { label: 'Security model', value: 'Claim-based' }, { label: 'Search', value: 'Paginated' }, { label: 'Auditability', value: 'Full' }]}
  />
);
