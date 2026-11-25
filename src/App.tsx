import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { useAuth, type AdminFlags, type Role } from './context/AuthContext';
import { DashboardShell } from './components/layout/DashboardShell';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ButtonLink } from './components/ui/Button';

const LandingPage = lazy(() => import('./pages/public/LandingPage').then((m) => ({ default: m.LandingPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })));
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const PublicClubsPage = lazy(() => import('./pages/public/ClubsPage').then((m) => ({ default: m.ClubsPage })));
const PublicPlayersPage = lazy(() => import('./pages/public/PlayersPage').then((m) => ({ default: m.PlayersPage })));
const PricingPage = lazy(() => import('./pages/public/PricingPage').then((m) => ({ default: m.PricingPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/public/TermsPage').then((m) => ({ default: m.TermsPage })));
const SafeguardingPage = lazy(() => import('./pages/public/SafeguardingPage').then((m) => ({ default: m.SafeguardingPage })));

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));

const Dashboard = lazy(() => import('./pages/Dashboard/index').then((m) => ({ default: m.Dashboard })));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const ClubOnboardingFlow = lazy(() => import('./pages/onboarding/ClubOnboardingFlow').then((m) => ({ default: m.ClubOnboardingFlow })));
const GuardianOnboardingPage = lazy(() => import('./pages/onboarding/GuardianOnboardingPage').then((m) => ({ default: m.GuardianOnboardingPage })));

const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Player
const PlayerProfilePage = lazy(() => import('./pages/player/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ProfileBuilderPage = lazy(() => import('./pages/player/ProfileBuilderPage').then((m) => ({ default: m.ProfileBuilderPage })));
const PlayerOpportunitiesPage = lazy(() => import('./pages/player/OpportunitiesPage').then((m) => ({ default: m.OpportunitiesPage })));
const OpportunityDetailsPage = lazy(() => import('./pages/player/OpportunityDetailsPage').then((m) => ({ default: m.OpportunityDetailsPage })));
const PlayerApplicationsPage = lazy(() => import('./pages/player/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })));
const PlayerShortlistsPage = lazy(() => import('./pages/player/ShortlistsPage').then((m) => ({ default: m.ShortlistsPage })));
const PlayerVideosPage = lazy(() => import('./pages/player/VideosPage').then((m) => ({ default: m.VideosPage })));
const VideoDetailsPage = lazy(() => import('./pages/player/VideoDetailsPage').then((m) => ({ default: m.VideoDetailsPage })));
const RecommendationsPage = lazy(() => import('./pages/player/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })));
const PlayerNotificationsPage = lazy(() => import('./pages/player/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const PlayerSettingsPage = lazy(() => import('./pages/player/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PlayerSubscriptionPage = lazy(() => import('./pages/player/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage })));

// Guardian
const GuardianDashboardPage = lazy(() => import('./pages/guardian/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const YouthProfilePage = lazy(() => import('./pages/guardian/YouthProfilePage').then((m) => ({ default: m.YouthProfilePage })));
const ConsentPage = lazy(() => import('./pages/guardian/ConsentPage').then((m) => ({ default: m.ConsentPage })));
const ConsentHistoryPage = lazy(() => import('./pages/guardian/ConsentHistoryPage').then((m) => ({ default: m.ConsentHistoryPage })));
const GuardianSettingsPage = lazy(() => import('./pages/guardian/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Club
const ClubProfilePage = lazy(() => import('./pages/club/ClubProfilePage').then((m) => ({ default: m.ClubProfilePage })));
const ClubOnboardingPage = lazy(() => import('./pages/club/ClubOnboardingPage').then((m) => ({ default: m.ClubOnboardingPage })));
const VerificationPage = lazy(() => import('./pages/club/VerificationPage').then((m) => ({ default: m.VerificationPage })));
const SearchPlayersPage = lazy(() => import('./pages/club/SearchPlayersPage').then((m) => ({ default: m.SearchPlayersPage })));
const ClubPlayerProfilePage = lazy(() => import('./pages/club/PlayerProfilePage').then((m) => ({ default: m.PlayerProfilePage })));
const SquadPage = lazy(() => import('./pages/club/SquadPage').then((m) => ({ default: m.SquadPage })));
const SquadGapAnalysisPage = lazy(() => import('./pages/club/SquadGapAnalysisPage').then((m) => ({ default: m.SquadGapAnalysisPage })));
const ClubInvitesPage = lazy(() => import('./pages/club/ClubInvitesPage').then((m) => ({ default: m.ClubInvitesPage })));
const ClubShortlistsPage = lazy(() => import('./pages/club/ShortlistsPage').then((m) => ({ default: m.ShortlistsPage })));
const ClubApplicationsPage = lazy(() => import('./pages/club/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })));
const TrialsPage = lazy(() => import('./pages/club/TrialsPage').then((m) => ({ default: m.TrialsPage })));
const MessagesPage = lazy(() => import('./pages/club/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const AnalyticsPage = lazy(() => import('./pages/club/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ClubSubscriptionPage = lazy(() => import('./pages/club/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage })));
const BoostsPage = lazy(() => import('./pages/club/BoostsPage').then((m) => ({ default: m.BoostsPage })));
const ClubNotificationsPage = lazy(() => import('./pages/club/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ClubSettingsPage = lazy(() => import('./pages/club/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const TrialManager = lazy(() => import('./pages/TrialManager').then((m) => ({ default: m.TrialManager })));

// Admin
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const UsersList = lazy(() => import('./pages/Users').then((m) => ({ default: m.UsersList })));
const AdminPlayersPage = lazy(() => import('./pages/admin/PlayersPage').then((m) => ({ default: m.PlayersPage })));
const AdminClubsPage = lazy(() => import('./pages/admin/ClubsPage').then((m) => ({ default: m.ClubsPage })));
const YouthVerificationPage = lazy(() => import('./pages/admin/YouthVerificationPage').then((m) => ({ default: m.YouthVerificationPage })));
const ConsentManagementPage = lazy(() => import('./pages/admin/ConsentManagementPage').then((m) => ({ default: m.ConsentManagementPage })));
const ModerationPage = lazy(() => import('./pages/admin/ModerationPage').then((m) => ({ default: m.ModerationPage })));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const SubscriptionsPage = lazy(() => import('./pages/admin/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })));
const MatchingConfigPage = lazy(() => import('./pages/admin/MatchingConfigPage').then((m) => ({ default: m.MatchingConfigPage })));
const AIManagementPage = lazy(() => import('./pages/admin/AIManagementPage').then((m) => ({ default: m.AIManagementPage })));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const GDPRPage = lazy(() => import('./pages/admin/GDPRPage').then((m) => ({ default: m.GDPRPage })));
const SystemHealthPage = lazy(() => import('./pages/admin/SystemHealthPage').then((m) => ({ default: m.SystemHealthPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminRolesPage = lazy(() => import('./pages/admin/RolesPage').then((m) => ({ default: m.RolesPage })));
const SystemConfig = lazy(() => import('./pages/SystemConfig').then((m) => ({ default: m.SystemConfig })));

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-500">Loading</p>
      </div>
    </div>
  );
}

function AccessDeniedPanel({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-[18px] font-bold text-white">Access restricted</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{reason}</p>
      <div className="mt-6 flex justify-center">
        <ButtonLink to="/dashboard" size="sm" variant="secondary">
          Return to workspace
        </ButtonLink>
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
  allowedRoles,
  requiredAdminFlags,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredAdminFlags?: Array<keyof AdminFlags>;
}) {
  const { isAuthenticated, role, adminFlags, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }
  if (requiredAdminFlags && requiredAdminFlags.length > 0) {
    const allowed =
      adminFlags.isSuperAdmin || requiredAdminFlags.some((flag) => adminFlags[flag]);
    if (!allowed) {
      return (
        <AccessDeniedPanel
          reason={`This console requires authoritative custom claims (${requiredAdminFlags.join(' or ')}). Server-side rules enforce this boundary independently.`}
        />
      );
    }
  }
  return <>{children}</>;
}

function RoleOnboardingRoute() {
  const { role } = useAuth();

  if (role === 'club') return <ClubOnboardingFlow />;
  if (role === 'guardian') return <Navigate to="/onboarding/guardian" replace />;
  if (role === 'admin') return <Navigate to="/dashboard" replace />;
  return <OnboardingPage />;
}

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/clubs" element={<PublicClubsPage />} />
            <Route path="/players" element={<PublicPlayersPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/safeguarding" element={<SafeguardingPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Guided first-run onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <RoleOnboardingRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/guardian"
              element={
                <ProtectedRoute allowedRoles={['guardian']}>
                  <GuardianOnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Authenticated workspace */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />

              {/* Shared Player + Club */}
              <Route
                path="applications"
                element={
                  <ProtectedRoute allowedRoles={['player', 'club', 'admin']}>
                    <PlayerApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="trial-manager"
                element={
                  <ProtectedRoute allowedRoles={['player', 'club', 'admin']}>
                    <TrialManager />
                  </ProtectedRoute>
                }
              />
              <Route path="notifications" element={<PlayerNotificationsPage />} />

              {/* Player */}
              <Route
                path="opportunities"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <PlayerOpportunitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="opportunities/:id"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <OpportunityDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="opportunity/:id"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <OpportunityDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <PlayerProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="player/profile-builder"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <ProfileBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="videos"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <PlayerVideosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="video/:id"
                element={
                  <ProtectedRoute allowedRoles={['player', 'club', 'admin']}>
                    <VideoDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="recommendations"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <PlayerSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subscription"
                element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <PlayerSubscriptionPage />
                  </ProtectedRoute>
                }
              />

              {/* Guardian */}
              <Route
                path="guardian"
                element={
                  <ProtectedRoute allowedRoles={['guardian']}>
                    <GuardianDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guardian/youth-profile"
                element={
                  <ProtectedRoute allowedRoles={['guardian']}>
                    <YouthProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guardian/consent"
                element={
                  <ProtectedRoute allowedRoles={['guardian']}>
                    <ConsentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guardian/consent-history"
                element={
                  <ProtectedRoute allowedRoles={['guardian']}>
                    <ConsentHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guardian/settings"
                element={
                  <ProtectedRoute allowedRoles={['guardian']}>
                    <GuardianSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Club */}
              <Route
                path="search"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <SearchPlayersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="shortlist"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <PlayerShortlistsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/profile"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/onboarding"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubOnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/verification"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <VerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/invites"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubInvitesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/player/:id"
                element={
                  <ProtectedRoute allowedRoles={['club', 'admin']}>
                    <ClubPlayerProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/squad"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <SquadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/squad-gaps"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <SquadGapAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/shortlists"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubShortlistsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/applications"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/trials"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <TrialsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/messages"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/analytics"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/subscription"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubSubscriptionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/boosts"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <BoostsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/notifications"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubNotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="club/settings"
                element={
                  <ProtectedRoute allowedRoles={['club']}>
                    <ClubSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isModerator']}>
                    <UsersList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/players"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin']}>
                    <AdminPlayersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/clubs"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isSafeguardingAdmin']}>
                    <AdminClubsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/youth-verification"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isSafeguardingAdmin']}>
                    <YouthVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/consent"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isSafeguardingAdmin']}>
                    <ConsentManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/moderation"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin']}>
                    <ModerationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/payments"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isFinanceAdmin']}>
                    <PaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isFinanceAdmin']}>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/matching-config"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin']}>
                    <MatchingConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/ai"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AIManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/gdpr"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin', 'isSafeguardingAdmin', 'isFinanceAdmin']}>
                    <GDPRPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/system-health"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SystemHealthPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/roles"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin']}>
                    <AdminRolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="system-config"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredAdminFlags={['isSuperAdmin']}>
                    <SystemConfig />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Legacy redirects */}
            <Route path="/opportunities" element={<Navigate to="/dashboard/opportunities" replace />} />
            <Route path="/shortlist" element={<Navigate to="/dashboard/shortlist" replace />} />
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/applications" element={<Navigate to="/dashboard/applications" replace />} />
            <Route path="/trial-manager" element={<Navigate to="/dashboard/trial-manager" replace />} />
            <Route path="/search" element={<Navigate to="/dashboard/search" replace />} />
            <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
            <Route path="/audit-logs" element={<Navigate to="/dashboard/audit-logs" replace />} />
            <Route path="/system-config" element={<Navigate to="/dashboard/system-config" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
