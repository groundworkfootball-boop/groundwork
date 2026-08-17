import { ShieldAlert, Server, Users, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-6xl mx-auto">
      <h3 className="text-3xl font-bold mb-8 tracking-tight">System Admin - {user?.name || 'Administrator'}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-dark-surface p-4 rounded-xl border border-dark-border">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-5 h-5 text-brand" />
            <span className="font-semibold">Total Users</span>
          </div>
          <div className="text-3xl font-bold">1,204</div>
          <div className="text-xs text-brand mt-1">+12 this week</div>
        </div>
        
        <div className="bg-dark-surface p-4 rounded-xl border border-dark-border">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">Active Clubs</span>
          </div>
          <div className="text-3xl font-bold">87</div>
        </div>
        
        <div className="bg-dark-surface p-4 rounded-xl border border-dark-border">
          <div className="flex items-center space-x-3 mb-2">
            <Server className="w-5 h-5 text-green-400" />
            <span className="font-semibold">System Status</span>
          </div>
          <div className="text-xl font-bold text-green-400">Operational</div>
        </div>

        <div className="bg-dark-surface p-4 rounded-xl border border-dark-border">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span className="font-semibold">Pending Verifications</span>
          </div>
          <div className="text-3xl font-bold">5</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xl font-bold mb-4">Recent Audit Logs</h4>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
            <div className="space-y-3">
              {[
                { action: 'Admin login', user: 'admin@groundwork.com', time: '10 min ago' },
                { action: 'Club verified', user: 'London FC', time: '1 hour ago' },
                { action: 'System config updated', user: 'admin@groundwork.com', time: '3 hours ago' },
              ].map((log, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-text-secondary">{log.user}</p>
                  </div>
                  <span className="text-xs text-text-secondary">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xl font-bold mb-4">Quick Actions</h4>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 transition-colors text-left flex flex-col gap-2">
                <Users className="w-6 h-6 text-brand" />
                <span className="font-semibold">Manage Users</span>
              </button>
              <button className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 transition-colors text-left flex flex-col gap-2">
                <ShieldAlert className="w-6 h-6 text-blue-400" />
                <span className="font-semibold">Review Verifications</span>
              </button>
              <button className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 transition-colors text-left flex flex-col gap-2">
                <Server className="w-6 h-6 text-green-400" />
                <span className="font-semibold">Platform Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
