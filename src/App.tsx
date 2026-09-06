import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard/index';
import { TrialManager } from './pages/TrialManager';
import { UsersList } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { SystemConfig } from './pages/SystemConfig';
import { Loader2 } from 'lucide-react';
import { NotFound } from './pages/NotFound';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage } from './pages/public/AboutPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { ClubsPage as PublicClubsPage } from './pages/public/ClubsPage';
import { PlayersPage as PublicPlayersPage } from './pages/public/PlayersPage';
import { PricingPage } from './pages/public/PricingPage';
import { ContactPage } from './pages/public/ContactPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { SafeguardingPage } from './pages/public/SafeguardingPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Player pages
import { ProfilePage as PlayerProfilePage } from './pages/player/ProfilePage';
import { ProfileBuilderPage } from './pages/player/ProfileBuilderPage';
import { OpportunitiesPage as PlayerOpportunitiesPage } from './pages/player/OpportunitiesPage';
import { ApplicationsPage as PlayerApplicationsPage } from './pages/player/ApplicationsPage';
import { ShortlistsPage as PlayerShortlistsPage } from './pages/player/ShortlistsPage';
import { VideosPage as PlayerVideosPage } from './pages/player/VideosPage';
import { VideoDetailsPage } from './pages/player/VideoDetailsPage';
import { RecommendationsPage } from './pages/player/RecommendationsPage';
import { NotificationsPage as PlayerNotificationsPage } from './pages/player/NotificationsPage';
import { SettingsPage as PlayerSettingsPage } from './pages/player/SettingsPage';
import { SubscriptionPage as PlayerSubscriptionPage } from './pages/player/SubscriptionPage';

// Guardian pages
import { DashboardPage as GuardianDashboardPage } from './pages/guardian/DashboardPage';
import { YouthProfilePage } from './pages/guardian/YouthProfilePage';
import { ConsentPage } from './pages/guardian/ConsentPage';
import { ConsentHistoryPage } from './pages/guardian/ConsentHistoryPage';
import { SettingsPage as GuardianSettingsPage } from './pages/guardian/SettingsPage';

// Club pages
import { ClubProfilePage } from './pages/club/ClubProfilePage';
import { ClubOnboardingPage } from './pages/club/ClubOnboardingPage';
import { VerificationPage } from './pages/club/VerificationPage';
import { SearchPlayersPage } from './pages/club/SearchPlayersPage';
import { PlayerProfilePage as ClubPlayerProfilePage } from './pages/club/PlayerProfilePage';
import { SquadPage } from './pages/club/SquadPage';
import { SquadGapAnalysisPage } from './pages/club/SquadGapAnalysisPage';
import { ClubInvitesPage } from './pages/club/ClubInvitesPage';
import { ShortlistsPage as ClubShortlistsPage } from './pages/club/ShortlistsPage';
import { ApplicationsPage as ClubApplicationsPage } from './pages/club/ApplicationsPage';
import { TrialsPage } from './pages/club/TrialsPage';
import { MessagesPage } from './pages/club/MessagesPage';
import { AnalyticsPage } from './pages/club/AnalyticsPage';
import { SubscriptionPage as ClubSubscriptionPage } from './pages/club/SubscriptionPage';
import { BoostsPage } from './pages/club/BoostsPage';
import { NotificationsPage as ClubNotificationsPage } from './pages/club/NotificationsPage';
import { SettingsPage as ClubSettingsPage } from './pages/club/SettingsPage';

// Admin pages
import { DashboardPage as AdminDashboardPage } from './pages/admin/DashboardPage';
import { PlayersPage as AdminPlayersPage } from './pages/admin/PlayersPage';
import { ClubsPage as AdminClubsPage } from './pages/admin/ClubsPage';
import { YouthVerificationPage } from './pages/admin/YouthVerificationPage';
import { ConsentManagementPage } from './pages/admin/ConsentManagementPage';
import { ModerationPage } from './pages/admin/ModerationPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage';
import { MatchingConfigPage } from './pages/admin/MatchingConfigPage';
import { AIManagementPage } from './pages/admin/AIManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { GDPRPage } from './pages/admin/GDPRPage';
import { SystemHealthPage } from './pages/admin/SystemHealthPage';
import { SettingsPage as AdminSettingsPage } from './pages/admin/SettingsPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="opportunities" element={<PlayerOpportunitiesPage />} />
            <Route path="shortlist" element={<PlayerShortlistsPage />} />
            <Route path="trial-manager" element={<TrialManager />} />
            <Route path="applications" element={<PlayerApplicationsPage />} />
            <Route path="profile" element={<PlayerProfilePage />} />
            <Route path="search" element={<SearchPlayersPage />} />
            <Route path="guardian" element={<GuardianDashboardPage />} />
            <Route path="videos" element={<PlayerVideosPage />} />
            <Route path="video/:id" element={<VideoDetailsPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="notifications" element={<PlayerNotificationsPage />} />
            <Route path="settings" element={<PlayerSettingsPage />} />
            <Route path="subscription" element={<PlayerSubscriptionPage />} />

            <Route path="player/profile-builder" element={<ProfileBuilderPage />} />
            <Route path="guardian/consent" element={<ConsentPage />} />
            <Route path="guardian/consent-history" element={<ConsentHistoryPage />} />
            <Route path="guardian/youth-profile" element={<YouthProfilePage />} />
            <Route path="guardian/settings" element={<GuardianSettingsPage />} />

            <Route path="club/profile" element={<ClubProfilePage />} />
            <Route path="club/onboarding" element={<ClubOnboardingPage />} />
            <Route path="club/verification" element={<VerificationPage />} />
            <Route path="club/invites" element={<ClubInvitesPage />} />
            <Route path="club/search" element={<SearchPlayersPage />} />
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

            {/* Admin-only routes */}
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<UsersList />} />
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
            <Route path="admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="admin/gdpr" element={<GDPRPage />} />
            <Route path="admin/system-health" element={<SystemHealthPage />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />

            <Route path="users" element={<UsersList />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="system-config" element={<SystemConfig />} />
          </Route>

          {/* Legacy route support */}
          <Route path="/opportunities" element={<Navigate to="/dashboard/opportunities" replace />} />
          <Route path="/shortlist" element={<Navigate to="/dashboard/shortlist" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/applications" element={<Navigate to="/dashboard/applications" replace />} />
          <Route path="/trial-manager" element={<Navigate to="/dashboard/trial-manager" replace />} />
          <Route path="/search" element={<Navigate to="/dashboard/search" replace />} />
          <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
          <Route path="/audit-logs" element={<Navigate to="/dashboard/audit-logs" replace />} />
          <Route path="/system-config" element={<Navigate to="/dashboard/system-config" replace />} />

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
