import { FeaturePage } from '../../components/layout/FeaturePage';

export const ResetPasswordPage = () => (
  <FeaturePage
    eyebrow="Account recovery"
    title="Reset your password"
    description="Password reset will remain Firebase-authenticated and user-friendly, with clear recovery flows for registered accounts."
    actions={[{ label: 'Login', to: '/login', primary: true }, { label: 'Register', to: '/register' }]}
  />
);
