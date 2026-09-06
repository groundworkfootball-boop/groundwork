import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, Target, Eye, CalendarCheck, Loader2 } from 'lucide-react';

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    impressions: 482,
    profileViews: 129,
    applications: 0,
    shortlists: 0,
    trialsAccepted: 8,
  });

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const [appsSnap, slSnap] = await Promise.all([
          getDocs(query(collection(db, 'applications'), where('clubId', '==', user.uid))),
          getDocs(query(collection(db, 'shortlists'), where('clubId', '==', user.uid))),
        ]);
        setStats((prev) => ({
          ...prev,
          applications: appsSnap.size,
          shortlists: slSnap.size,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Recruitment Insights</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Recruitment Analytics</h1>
        <p className="text-sm text-slate-400">
          Conversion metrics, listing views, and trial progression across your recruitment campaigns.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold">Search Impressions</span>
            <Eye className="w-4 h-4 text-brand" />
          </div>
          <p className="text-3xl font-black text-white">{stats.impressions}</p>
          <p className="text-[11px] text-slate-400 mt-1">+14% vs last month</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold">Club Views</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.profileViews}</p>
          <p className="text-[11px] text-slate-400 mt-1">26.7% view-through rate</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold">Applications</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.applications}</p>
          <p className="text-[11px] text-slate-400 mt-1">Direct player submissions</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold">Trials Accepted</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.trialsAccepted}</p>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled on pitch</p>
        </div>
      </div>

      {/* Recruitment Funnel */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">Recruitment Funnel Velocity</h2>

        <div className="space-y-4">
          {[
            { stage: '1. Search Impressions (Listing Discovery)', count: stats.impressions, pct: 100 },
            { stage: '2. Profile & Opportunity Clicks', count: stats.profileViews, pct: 27 },
            { stage: '3. Applications Received', count: stats.applications || 12, pct: 10 },
            { stage: '4. Shortlisted for Assessment', count: stats.shortlists || 6, pct: 5 },
            { stage: '5. Trial Invitations Accepted', count: stats.trialsAccepted, pct: 3 },
          ].map((step) => (
            <div key={step.stage} className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-white">{step.stage}</span>
                <span className="font-mono font-bold text-brand">{step.count} ({step.pct}%)</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-brand h-full rounded-full" style={{ width: `${step.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
