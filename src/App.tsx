import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Opportunities } from './pages/Opportunities';
import { Shortlist } from './pages/Shortlist';
import { TrialManager } from './pages/TrialManager';
import { UsersList } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { SystemConfig } from './pages/SystemConfig';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="shortlist" element={<Shortlist />} />
            <Route path="trial-manager" element={<TrialManager />} />
            <Route path="users" element={<UsersList />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="system-config" element={<SystemConfig />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
