import { FeaturePage } from '../../components/layout/FeaturePage';

export const PlayerProfilePage = () => (
  <FeaturePage
    eyebrow="Player profile"
    title="Club-facing player details"
    description="Club views will surface only the public and permitted profile fields, with youth controls enforced server-side."
    actions={[{ label: 'Search players', to: '/club/search', primary: true }, { label: 'Dashboard', to: '/dashboard' }]}
  />
);
