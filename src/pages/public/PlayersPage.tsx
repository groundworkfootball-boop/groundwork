import { FeaturePage } from '../../components/layout/FeaturePage';

export const PlayersPage = () => (
  <FeaturePage
    eyebrow="Player platform"
    title="Build a profile that clubs can trust"
    description="Players can manage profiles, matches, opportunities, videos, and notifications in one secure workspace with youth safeguards when required."
    actions={[{ label: 'Create profile', to: '/register', primary: true }, { label: 'Player dashboard', to: '/dashboard' }]}
    bullets={['Profile completeness', 'Match visibility', 'Video clips and AI-assisted tags', 'Applications, shortlists, and trials']}
  />
);
