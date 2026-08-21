import { useEffect, useState } from 'react';
import { Eye, FileText, Star, Bell, ChevronRight, Target, Video, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

interface PlayerData {
  name: string;
  positions?: string[];
  profileComplete?: number;
  searchable?: boolean;
  consentStatus?: string;
  isYouth?: boolean;
  region?: string;
  playingLevel?: number;
}

interface ApplicationDoc {
  id: string;
  status: string;
  clubName?: string;
  opportunityTitle?: string;
  createdAt: unknown;
}

interface OpportunityDoc {
  id: string;
  title: string;
  clubName?: string;
  position?: string;
  region?: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  viewed: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  shortlisted: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  trial_invited: 'text-brand bg-brand/10 border-brand/30',
  accepted: 'text-green-400 bg-green-400/10 border-green-400/30',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
};

export const PlayerDashboard = () => {
  const { user } = useAuth();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load player profile
        const playerSnap = await getDoc(doc(db, 'players', user.uid));
        if (playerSnap.exists()) {
          setPlayerData(playerSnap.data() as PlayerData);
        } else {
          setPlayerData({ name: user.name, profileComplete: 0 });
        }

        // Load recent applications
        const appsQuery = query(
          collection(db, 'applications'),
          where('playerId', '==', user.uid),
          limit(5),
        );
        const appsSnap = await getDocs(appsQuery);
        setApplications(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ApplicationDoc)));

        // Load active opportunities
        const oppsQuery = query(
          collection(db, 'opportunities'),
          where('status', '==', 'active'),
          limit(5),
        );
        const oppsSnap = await getDocs(oppsQuery);
        setOpportunities(oppsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc)));
      } catch (err) {
        console.error('Error loading player dashboard:', err);
        setError('Failed to load your dashboard. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const profileComplete = playerData?.profileComplete ?? 0;
  const profilePct = Math.round(profileComplete * 100);
  const isSearchable = playerData?.searchable ?? false;
  const isYouth = playerData?.isYouth ?? false;
  const consentStatus = playerData?.consentStatus;

  // Circular SVG calculation
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (circumference * profilePct) / 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-dark-surface border border-brand/30 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-brand" />
          <div>
            <p className="font-bold text-sm">Welcome back, {playerData?.name || user?.name || 'Player'}!</p>
            <p className="text-xs text-text-secondary">
              {isSearchable
                ? 'Your profile is visible to clubs. Keep it updated for best matches.'
                : isYouth && consentStatus === 'pending'
                ? 'Awaiting guardian consent. Your profile is not yet searchable.'
                : 'Enable profile visibility in settings to be discovered by clubs.'}
            </p>
          </div>
        </div>
        {isYouth && consentStatus === 'pending' && (
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded uppercase tracking-widest">
            Consent Pending
          </span>
        )}
        {isSearchable && (
          <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-bold rounded uppercase tracking-widest flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>Visible</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-surface border border-dark-border p-4 rounded-xl flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">Applications</p>
                <p className="text-2xl font-bold">{applications.length}</p>
                <p className="text-xs text-text-secondary">Total</p>
              </div>
              <FileText className="w-5 h-5 text-brand opacity-50" />
            </div>

            <div className="bg-dark-surface border border-dark-border p-4 rounded-xl flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">Visibility</p>
                <p className="text-sm font-bold mt-1">{isSearchable ? 'Active' : 'Hidden'}</p>
                <p className="text-[10px] text-text-secondary mt-1">Profile Status</p>
              </div>
              <Eye className="w-5 h-5 text-brand opacity-50" />
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-8 flex flex-col items-center">
            <h3 className="text-sm font-bold tracking-widest mb-6 uppercase text-text-secondary">Profile Score</h3>

            <div className="relative w-40 h-40 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#ccff00"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-brand">{profilePct}</span>
                <span className="text-xs text-text-secondary font-bold">/ 100</span>
              </div>
            </div>

            {profilePct < 100 && (
              <Link
                to="/profile"
                className="w-full text-center px-4 py-2 border border-brand text-brand font-bold text-xs rounded hover:bg-brand/10 transition-colors uppercase tracking-wider"
              >
                Complete Profile →
              </Link>
            )}
            {profilePct === 100 && (
              <div className="px-3 py-1 bg-dark-bg border border-brand/30 rounded-full flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Profile Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Opportunities */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight uppercase flex items-center space-x-2">
                <Target className="w-5 h-5 text-brand" />
                <span>Active Opportunities</span>
              </h3>
              <Link to="/opportunities" className="text-xs text-brand font-bold uppercase tracking-wider hover:underline">
                View All
              </Link>
            </div>

            {opportunities.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No active opportunities yet.</p>
                <p className="text-text-secondary/60 text-xs mt-1">Clubs will post opportunities that match your profile.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    to="/opportunities"
                    className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded-lg group hover:border-brand/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-sm">{opp.title}</h4>
                      <p className="text-xs text-text-secondary">
                        {opp.clubName} {opp.position ? `• ${opp.position}` : ''} {opp.region ? `• ${opp.region}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-brand transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight uppercase flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand" />
                <span>My Applications</span>
              </h3>
              <Link to="/applications" className="text-xs text-brand font-bold uppercase tracking-wider hover:underline">
                View All
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No applications yet.</p>
                <p className="text-text-secondary/60 text-xs mt-1">Browse opportunities and apply to get started.</p>
                <Link
                  to="/opportunities"
                  className="inline-block mt-4 px-4 py-2 bg-brand text-dark-bg font-bold text-xs rounded uppercase tracking-wider hover:bg-brand-hover transition-colors"
                >
                  Browse Opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded-lg">
                    <div>
                      <h4 className="font-bold text-sm">{app.opportunityTitle ?? 'Opportunity'}</h4>
                      <p className="text-xs text-text-secondary">{app.clubName ?? 'Club'}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[app.status] ?? 'text-text-secondary border-dark-border'}`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos Placeholder */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold tracking-tight uppercase flex items-center space-x-2">
                <Video className="w-5 h-5 text-brand" />
                <span>Match Videos</span>
              </h3>
              <Link to="/profile" className="text-xs text-brand font-bold uppercase tracking-wider hover:underline">
                Manage
              </Link>
            </div>
            <div className="text-center py-6">
              <Video className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No videos uploaded yet.</p>
              <p className="text-text-secondary/60 text-xs mt-1">
                Upload match footage from your profile page to boost visibility.
              </p>
              <Link
                to="/profile"
                className="inline-block mt-4 px-4 py-2 border border-brand text-brand font-bold text-xs rounded uppercase tracking-wider hover:bg-brand/10 transition-colors"
              >
                Upload Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
