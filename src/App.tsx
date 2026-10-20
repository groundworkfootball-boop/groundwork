import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './lib/toast';
import { DashboardShell } from './components/layout/DashboardShell';
import { Loader2 } from 'lucide-react';

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
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Player
const PlayerProfilePage = lazy(() => import('./pages/player/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ProfileBuilderPage = lazy(() => import('./pages/player/ProfileBuilderPage').then((m) => ({ default: m.ProfileBuilderPage })));
const PlayerOpportunitiesPage = lazy(() => import('./pages/player/OpportunitiesPage').then((m) => ({ default: m.OpportunitiesPage })));
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

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
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

                {/* Player */}
                <Route path="opportunities" element={<PlayerOpportunitiesPage />} />
                <Route path="shortlist" element={<PlayerShortlistsPage />} />
                <Route path="applications" element={<PlayerApplicationsPage />} />
                <Route path="profile" element={<PlayerProfilePage />} />
                <Route path="player/profile-builder" element={<ProfileBuilderPage />} />
                <Route path="videos" element={<PlayerVideosPage />} />
                <Route path="video/:id" element={<VideoDetailsPage />} />
                <Route path="recommendations" element={<RecommendationsPage />} />
                <Route path="notifications" element={<PlayerNotificationsPage />} />
                <Route path="settings" element={<PlayerSettingsPage />} />
                <Route path="subscription" element={<PlayerSubscriptionPage />} />

                {/* Guardian */}
                <Route path="guardian" element={<GuardianDashboardPage />} />
                <Route path="guardian/youth-profile" element={<YouthProfilePage />} />
                <Route path="guardian/consent" element={<ConsentPage />} />
                <Route path="guardian/consent-history" element={<ConsentHistoryPage />} />
                <Route path="guardian/settings" element={<GuardianSettingsPage />} />

                {/* Club */}
                <Route path="search" element={<SearchPlayersPage />} />
                <Route path="club/profile" element={<ClubProfilePage />} />
                <Route path="club/onboarding" element={<ClubOnboardingPage />} />
                <Route path="club/verification" element={<VerificationPage />} />
                <Route path="club/invites" element={<ClubInvitesPage />} />
                <Route path="club/player/:id" element={<ClubPlayerProfilePage />} />
                <Route path="club/squad" element={<SquadPage />} />
                <Route path="club/squad-gaps" element={<SquadGapAnalysisPage />} />
                <Route path="club/shortlists" element={<ClubShortlistsPage />} />
                <Route path="club/applications" element={<ClubApplicationsPage />} />
                <Route path="club/trials" element={<TrialsPage />} />
                <Route path="club/messages" element={<MessagesPage />} />
                <Route path="club/analytics" element={<AnalyticsPage />} />
                <Route path="club/subscription" element={<ClubSubscriptionPage />} />
                <Route path="club/boosts" element={<BoostsPage />} />
                <Route path="club/notifications" element={<ClubNotificationsPage />} />
                <Route path="club/settings" element={<ClubSettingsPage />} />
                <Route path="trial-manager" element={<TrialManager />} />

                {/* Admin */}
                <Route path="admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UsersList />} />
                <Route path="admin/players" element={<AdminPlayersPage />} />
                <Route path="admin/clubs" element={<AdminClubsPage />} />
                <Route path="admin/youth-verification" element={<YouthVerificationPage />} />
                <Route path="admin/consent" element={<ConsentManagementPage />} />
                <Route path="admin/moderation" element={<ModerationPage />} />
                <Route path="admin/reports" element={<ReportsPage />} />
                <Route path="admin/payments" element={<PaymentsPage />} />
                <Route path="admin/subscriptions" element={<SubscriptionsPage />} />
                <Route path="admin/matching-config" element={<MatchingConfigPage />} />
                <Route path="admin/ai" element={<AIManagementPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="admin/gdpr" element={<GDPRPage />} />
                <Route path="admin/system-health" element={<SystemHealthPage />} />
                <Route path="admin/roles" element={<AdminRolesPage />} />
                <Route path="admin/settings" element={<AdminSettingsPage />} />
                <Route path="system-config" element={<SystemConfig />} />
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
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;


