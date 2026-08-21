import { useEffect, useState } from 'react';
import { ShieldAlert, Users, FileText, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  action: string;
  actorId?: string;
  targetType?: string;
  timestamp?: { seconds: number };
}

interface Stats {
  totalUsers: number;
  totalClubs: number;
  pendingVerifications: number;
  totalOpportunities: number;
}

function formatTimeAgo(entry: AuditEntry): string {
  if (!entry.timestamp?.seconds) return 'Just now';
  const diff = Date.now() / 1000 - entry.timestamp.seconds;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalClubs: 0, pendingVerifications: 0, totalOpportunities: 0 });
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [usersSnap, clubsSnap, verSnap, oppsSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'clubs')),
          getDocs(query(collection(db, 'clubVerificationRequests'))),
          getDocs(collection(db, 'opportunities')),
          getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(5))),
        ]);

        setStats({
          totalUsers: usersSnap.size,
          totalClubs: clubsSnap.size,
          pendingVerifications: verSnap.size,
          totalOpportunities: oppsSnap.size,
        });

        setAuditLogs(logsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEntry)));
      } catch (err) {
        console.error('Admin dashboard error:', err);
        setFetchError('Failed to load admin data. Check your connection and permissions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Total Clubs', value: stats.totalClubs, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Opportunities', value: stats.totalOpportunities, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const quickActions = [
    { label: 'Manage Users', to: '/users', icon: Users },
    { label: 'Club Verifications', to: '/users', icon: ShieldAlert },
    { label: 'Audit Logs', to: '/audit-logs', icon: FileText },
    { label: 'System Config', to: '/system-config', icon: Activity },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h3 className="text-3xl font-bold tracking-tight">System Administration</h3>
        <p className="text-text-secondary text-sm mt-1">Platform overview and management tools.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 ${bg} rounded-lg`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="font-semibold text-sm text-text-secondary">{label}</span>
            </div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Audit Logs */}
        <div>
          <h4 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand" />
            <span>Recent Audit Logs</span>
          </h4>
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-text-secondary text-sm">
                <FileText className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                <p>No audit log entries yet.</p>
                <p className="text-xs mt-1 text-text-secondary/60">Admin actions will be recorded here.</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center text-sm p-4">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-text-secondary">{log.actorId ?? 'System'}</p>
                    </div>
                    <span className="text-xs text-text-secondary">{formatTimeAgo(log)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/audit-logs" className="block text-center mt-3 text-xs text-brand font-bold uppercase tracking-wider hover:underline">
            View All Audit Logs →
          </Link>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-xl font-bold mb-4">Quick Actions</h4>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 hover:text-brand transition-colors text-left flex flex-col gap-2 group"
                >
                  <Icon className="w-6 h-6 text-brand" />
                  <span className="font-semibold text-sm">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mt-6">
            <h4 className="font-bold text-sm uppercase tracking-widest mb-4 text-text-secondary">System Status</h4>
            <div className="space-y-3">
              {[
                { label: 'Firebase Auth', status: 'Operational' },
                { label: 'Firestore', status: 'Operational' },
                { label: 'Firebase Storage', status: 'Operational' },
                { label: 'Claude AI', status: 'Not Configured' },
                { label: 'Stripe Payments', status: 'Not Configured' },
              ].map(({ label, status }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">{label}</span>
                  <span className={`text-xs font-bold ${status === 'Operational' ? 'text-brand' : 'text-text-secondary'}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
