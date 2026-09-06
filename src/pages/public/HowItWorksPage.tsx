import { FeaturePage } from '../../components/layout/FeaturePage';

export const HowItWorksPage = () => (
  <FeaturePage
    eyebrow="User journeys"
    title="How the platform works"
    description="Players and clubs register into role-specific flows. Youth profiles remain hidden until consent is granted, while clubs receive precomputed match results and score breakdowns."
    actions={[{ label: 'Register', to: '/register', primary: true }, { label: 'Login', to: '/login' }]}
    bullets={['Authentication and custom claims', 'Profile creation and completeness tracking', 'Club verification and search visibility', 'Precomputed match results and explanations']}
  />
);
