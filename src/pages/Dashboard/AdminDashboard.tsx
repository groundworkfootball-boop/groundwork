import { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Building2,
  FileText,
  Activity,
  Loader2,
  Sliders,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  action: string;
  actorId?: string;
  targetType?: string;
  timestamp?: { seconds: number };
}

interface PendingClub {
  id: string;
  name: string;
  region?: string;
  verificationStatus?: string;
  verifiedAdult?: boolean;
  verifiedYouth?: boolean;
}

interface Stats {
  totalUsers: number;
  totalClubs: number;
  pendingVerifications: number;
  totalOpportunities: number;
  totalPlayers: number;
  youthPlayers: number;
  adultPlayers: number;
  totalAuditLogs: number;
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
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalClubs: 0,
    pendingVerifications: 0,
    totalOpportunities: 0,
    totalPlayers: 0,
    youthPlayers: 0,
    adultPlayers: 0,
    totalAuditLogs: 0,
  });
  const [pendingClubs, setPendingClubs] = useState<PendingClub[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersSnap, clubsSnap, verSnap, oppsSnap, playersSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'clubs')),
          getDocs(query(collection(db, 'clubs'), where('verificationStatus', '==', 'pending'))),
          getDocs(collection(db, 'opportunities')),
          getDocs(collection(db, 'players')),
          getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(6))),
        ]);

        let youthCount = 0;
        let adultCount = 0;
        playersSnap.docs.forEach((d) => {
          if (d.data().isYouth) {
            youthCount++;
          } else {
            adultCount++;
          }
        });

        setStats({
          totalUsers: usersSnap.size,
          totalClubs: clubsSnap.size,
          pendingVerifications: verSnap.size,
          totalOpportunities: oppsSnap.size,
          totalPlayers: playersSnap.size,
          youthPlayers: youthCount,
          adultPlayers: adultCount,
          totalAuditLogs: (await getDocs(collection(db, 'auditLogs'))).size,
        });

        setPendingClubs(
          verSnap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || 'Club Verification Request',
            region: d.data().region,
            verificationStatus: d.data().verificationStatus,
            verifiedAdult: d.data().verifiedAdult,
            verifiedYouth: d.data().verifiedYouth,
          }))
        );

        setAuditLogs(logsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEntry)));
      } catch (err) {
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Master Command Center</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">
              PLATFORM ADMINISTRATOR
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">System Administration</h1>
          <p className="text-sm text-slate-400">
            Oversee platform compliance, club verifications, youth safeguarding, deterministic matching, and security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/admin/matching-config"
            className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20"
          >
            <Sliders className="w-4 h-4" />
            <span>Matching Config</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Platform Registrations</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Total Clubs</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{stats.totalClubs}</p>
            <p className="text-[11px] text-slate-400 mt-1">Recruiting Entities</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Pending Verification</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-amber-400">{stats.pendingVerifications}</p>
            <p className="text-[11px] text-slate-400 mt-1">Requires Admin Action</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Players Roster</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{stats.totalPlayers}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.adultPlayers} Adult • {stats.youthPlayers} Youth
            </p>
          </div>
        </div>
      </div>

      {/* Operational Modules Quick Access Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Users Directory', to: '/dashboard/users', icon: Users },
          { label: 'Club Verification', to: '/dashboard/admin/clubs', icon: Building2 },
          { label: 'Youth Safeguarding', to: '/dashboard/admin/youth-verification', icon: ShieldCheck },
          { label: 'Matching Weights', to: '/dashboard/admin/matching-config', icon: Sliders },
          { label: 'AI Management', to: '/dashboard/admin/ai', icon: Sparkles },
          { label: 'GDPR / Privacy', to: '/dashboard/admin/gdpr', icon: Lock },
        ].map((mod) => (
          <Link
            key={mod.label}
            to={mod.to}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/30 hover:bg-brand/5 transition-all text-center flex flex-col items-center justify-center gap-2 group"
          >
            <mod.icon className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
            <span className="text-xs font-bold text-white leading-tight">{mod.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Grid: Pending Verifications & Real-Time Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Club Verifications Queue */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Club Verification Queue</h2>
            </div>
            <Link to="/dashboard/admin/clubs" className="text-xs text-brand hover:underline font-semibold">
              Manage All
            </Link>
          </div>

          {pendingClubs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-medium">All club verification requests have been processed.</p>
              <p className="text-xs text-slate-500 mt-1">No pending applications in the queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingClubs.map((cl) => (
                <div
                  key={cl.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-white text-sm">{cl.name}</h3>
                    <p className="text-xs text-slate-400">
                      Region: {cl.region || 'UK Regional'} • Status: <span className="text-amber-400 capitalize">{cl.verificationStatus}</span>
                    </p>
                  </div>

                  <Link
                    to="/dashboard/admin/clubs"
                    className="bg-brand hover:bg-brand-hover text-black font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
                  >
                    Review Documents
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Recent System Audit Trail */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-white">Audit Trail</h2>
            </div>
            <Link to="/dashboard/audit-logs" className="text-xs text-brand hover:underline font-semibold">
              View All
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-xs">No recent administrative audits logged.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white capitalize">{log.action.replace('_', ' ')}</span>
                    <span className="text-slate-400 text-[11px]">{formatTimeAgo(log)}</span>
                  </div>
                  <p className="text-slate-400 truncate">
                    Actor: <span className="text-slate-300 font-mono">{log.actorId || 'System Worker'}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
