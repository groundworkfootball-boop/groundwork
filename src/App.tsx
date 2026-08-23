import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard/index';
import { Opportunities } from './pages/Opportunities';
import { Shortlist } from './pages/Shortlist';
import { TrialManager } from './pages/TrialManager';
import { UsersList } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { SystemConfig } from './pages/SystemConfig';
import { Profile } from './pages/Profile';
import { Applications } from './pages/Applications';
import { Landing } from './pages/Landing';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
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
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="shortlist" element={<Shortlist />} />
            <Route path="trial-manager" element={<TrialManager />} />
            <Route path="applications" element={<Applications />} />
            <Route path="profile" element={<Profile />} />

            {/* Admin-only routes */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="system-config"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemConfig />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Legacy route support */}
          <Route path="/opportunities" element={<Navigate to="/dashboard/opportunities" replace />} />
          <Route path="/shortlist" element={<Navigate to="/dashboard/shortlist" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/applications" element={<Navigate to="/dashboard/applications" replace />} />
          <Route path="/trial-manager" element={<Navigate to="/dashboard/trial-manager" replace />} />
          <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
          <Route path="/audit-logs" element={<Navigate to="/dashboard/audit-logs" replace />} />
          <Route path="/system-config" element={<Navigate to="/dashboard/system-config" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
