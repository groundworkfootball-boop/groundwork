import { FeaturePage } from '../../components/layout/FeaturePage';

export const VerifyEmailPage = () => (
  <FeaturePage
    eyebrow="Email verification"
    title="Verify your account"
    description="Email verification is part of the account activation path and will be enforced before sensitive workflows are exposed."
    actions={[{ label: 'Login', to: '/login', primary: true }, { label: 'Home', to: '/' }]}
  />
);
