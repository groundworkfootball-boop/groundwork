import { useAuth } from '../../context/AuthContext';
import { PlayerDashboard } from './PlayerDashboard';
import { ClubDashboard } from './ClubDashboard';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard = () => {
  const { role } = useAuth();

  if (role === 'player') return <PlayerDashboard />;
  if (role === 'club') return <ClubDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  
  return null;
};
