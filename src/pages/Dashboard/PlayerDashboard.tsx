import { useEffect, useState } from 'react';
import {
  FileText,
  Star,
  Bell,
  ChevronRight,
  Target,
  Video,
  Loader2,
  Sparkles,
  Zap,
  Building2,
  CheckCircle2,
  Clock,
  Info,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import type { PlayerRecord, VideoRecord } from '../../app/types';
import { getPlayerRecord, listPlayerApplications, listPlayerNotifications, type ApplicationItem } from '../../lib/services/playerService';
import { collection, getDocs, limit, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { isValidClubCode } from '../../lib/clubCode';
import { calculateMatchScore } from '../../lib/scoringEngine';

interface OpportunityDoc {
  id: string;
  title: string;
  clubName?: string;
  clubId?: string;
  position?: string;
  region?: string;
  status: string;
  playingLevel?: number;
  matchScore?: number;
  breakdown?: ReturnType<typeof calculateMatchScore>;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  viewed: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  shortlisted: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  trial_invited: 'text-brand bg-brand/10 border-brand/30',
  accepted: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
};

export const PlayerDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [playerData, setPlayerData] = useState<PlayerRecord | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title?: string; read?: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  // Score breakdown modal
  const [selectedMatch, setSelectedMatch] = useState<OpportunityDoc | null>(null);

  // Join Club with Code modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inputClubCode, setInputClubCode] = useState('');
  const [joiningClub, setJoiningClub] = useState(false);

  // AI recommendations (dismissible)
  const [recommendations, setRecommendations] = useState<Array<{ id: string; action: string; reason: string }>>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const record = await getPlayerRecord(user.uid);
        const resolvedRecord = record ?? {
          id: user.uid,
          uid: user.uid,
          name: user.name,
          profileComplete: 45,
          positions: ['CM'],
          region: 'London',
          playingLevel: 5,
        };
        setPlayerData(resolvedRecord);

        // Calculate completeness
        let scoreCount = 0;
        if (resolvedRecord.photoUrl) scoreCount += 15;
        if (resolvedRecord.positions && resolvedRecord.positions.length > 0) scoreCount += 25;
        if (resolvedRecord.skillRatings && Object.keys(resolvedRecord.skillRatings).length > 0) scoreCount += 20;
        if (resolvedRecord.availability && resolvedRecord.availability.length > 0) scoreCount += 20;
        if (resolvedRecord.region) scoreCount += 10;
        if (resolvedRecord.videoCount && resolvedRecord.videoCount > 0) scoreCount += 10;
        resolvedRecord.profileCompleteness = Math.min(100, Math.max(scoreCount, resolvedRecord.profileCompleteness || 35));

        // Generate AI Recommendations based on data completeness
        const recs: Array<{ id: string; action: string; reason: string }> = [];
        if (!resolvedRecord.videoCount || resolvedRecord.videoCount === 0) {
          recs.push({
            id: 'rec-video',
            action: 'Upload Match Highlight Video',
            reason: 'Clubs review video-verified player profiles 4x faster during scouting cycles.',
          });
        }
        if (!resolvedRecord.availability || resolvedRecord.availability.length === 0) {
          recs.push({
            id: 'rec-avail',
            action: 'Declare Training Availability',
            reason: 'Availability accounts for 10% of deterministic matching compatibility with local squads.',
          });
        }
        if (!resolvedRecord.skillRatings || Object.keys(resolvedRecord.skillRatings).length < 3) {
          recs.push({
            id: 'rec-skills',
            action: 'Log Technical Attributes',
            reason: 'Complete passing, dribbling, and physical scores to unlock detailed club comparisons.',
          });
        }
        setRecommendations(recs);

        // Fetch applications
        const recentApplications = await listPlayerApplications(user.uid);
        setApplications(recentApplications.slice(0, 5));

        // Fetch notifications
        const recentNotifications = await listPlayerNotifications(user.uid);
        setNotifications(recentNotifications.slice(0, 5));

        // Fetch player videos
        const vidsSnap = await getDocs(
          query(collection(db, 'playerVideos'), where('playerId', '==', user.uid), limit(4))
        );
        setVideos(vidsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoRecord, 'id'>) })));

        // Fetch active opportunities and compute deterministic match score
        const oppsQuery = query(
          collection(db, 'opportunities'),
          where('status', '==', 'active'),
          limit(10)
        );
        const oppsSnap = await getDocs(oppsQuery);
        const oppsList = oppsSnap.docs.map((d) => {
          const data = d.data();
          const breakdown = calculateMatchScore(
            {
              positions: resolvedRecord.positions || ['CM'],
              region: resolvedRecord.region || 'London',
              playingLevel: resolvedRecord.playingLevel || 5,
              skillRatings: resolvedRecord.skillRatings || { passing: 7, stamina: 8 },
              availability: resolvedRecord.availability || ['Saturday'],
              hasActiveBoost: !!resolvedRecord.boostsActive,
            },
            {
              targetPositions: data.position ? [data.position] : ['CM'],
              region: data.region || 'London',
              targetLevel: data.playingLevel || 5,
              requiredAvailability: data.availability || ['Saturday'],
            }
          );
          return {
            id: d.id,
            title: data.title || 'Trial Opportunity',
            clubName: data.clubName || 'Regional Club',
            clubId: data.clubId,
            position: data.position,
            region: data.region,
            status: data.status || 'active',
            playingLevel: data.playingLevel || 5,
            matchScore: Math.round(breakdown.totalScore * 100),
            breakdown,
          };
        });

        // Sort by deterministic match score descending
        oppsList.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        setOpportunities(oppsList.slice(0, 5));
      } catch (err) {
        console.error('Error loading player dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, user?.name]);

  const handleJoinClubWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidClubCode(inputClubCode)) {
      toastError('Please enter a valid Club Code in the format GW-XXX-XXXX');
      return;
    }
    setJoiningClub(true);
    try {
      // Find club with this code
      const clubsQuery = query(
        collection(db, 'clubs'),
        where('clubCode', '==', inputClubCode.trim().toUpperCase()),
        limit(1)
      );
      const clubSnap = await getDocs(clubsQuery);
      if (clubSnap.empty) {
        toastError(`No club found with Code ${inputClubCode}. Check spelling with your coach.`);
        return;
      }

      const clubDoc = clubSnap.docs[0];
      const clubData = clubDoc.data();

      // Update player profile with affiliated club
      await updateDoc(doc(db, 'players', user!.uid), {
        affiliatedClubCode: inputClubCode.trim().toUpperCase(),
        affiliatedClubId: clubDoc.id,
        currentClub: clubData.name || 'Affiliated Club',
        updatedAt: serverTimestamp(),
      });

      setPlayerData((prev) =>
        prev
          ? {
              ...prev,
              affiliatedClubCode: inputClubCode.trim().toUpperCase(),
              affiliatedClubId: clubDoc.id,
              currentClub: clubData.name,
            }
          : prev
      );

      setShowJoinModal(false);
      setInputClubCode('');
      success(`Successfully affiliated with ${clubData.name || 'your club'}!`);
    } catch (err) {
      toastError((err as Error)?.message ?? 'Failed to link club code.');
    } finally {
      setJoiningClub(false);
    }
  };

  const handleDismissRec = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const completeness = playerData?.profileCompleteness ?? 50;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Player Command Center</span>
            {playerData?.isYouth && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                Youth Guarded ({playerData.consentStatus === 'granted' ? 'Consent Verified' : 'Consent Pending'})
              </span>
            )}
            {playerData?.affiliatedClubCode && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-mono font-bold">
                Club: {playerData.currentClub || playerData.affiliatedClubCode}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">
            Welcome back, {playerData?.displayName || playerData?.name || user?.name || 'Player'}
          </h1>
          <p className="text-sm text-slate-400">
            Track your recruitment compatibility, club applications, and verified scouting matches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <Building2 className="w-4 h-4 text-brand" />
            <span>Join Club with Code</span>
          </button>
          <Link
            to="/dashboard/profile"
            className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20"
          >
            <span>Edit Profile</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Boost Banner if inactive */}
      {!playerData?.boostsActive && (
        <div className="bg-gradient-to-r from-brand/20 via-slate-900 to-slate-900 border border-brand/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/40 text-brand flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Boost Your Scouting Visibility</h2>
              <p className="text-xs text-slate-300">
                Active visibility boost provides a +5% flat bonus in deterministic club search compatibility ranking.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/subscription"
            className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shrink-0 transition-all text-center"
          >
            Activate Boost
          </Link>
        </div>
      )}

      {/* Top Grid: Profile Completeness & Recruitment KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completeness Meter */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-brand" />
              <span>Profile Completeness</span>
            </h2>
            <span className="text-xs font-mono font-bold text-brand">{completeness}%</span>
          </div>

          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-4 border border-white/5">
            <div
              className="bg-brand h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(204,255,0,0.5)]"
              style={{ width: `${completeness}%` }}
            />
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Primary Position: {playerData?.positions?.[0] || 'Unset'}</span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${playerData?.positions?.length ? 'text-brand' : 'text-slate-600'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span>Region: {playerData?.region || 'Unset'}</span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${playerData?.region ? 'text-brand' : 'text-slate-600'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span>Match Videos Uploaded</span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${(playerData?.videoCount || 0) > 0 ? 'text-brand' : 'text-slate-600'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span>Technical Attribute Ratings</span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${playerData?.skillRatings ? 'text-brand' : 'text-slate-600'}`} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              to="/dashboard/player/profile-builder"
              className="text-xs text-brand hover:underline font-semibold flex items-center justify-between"
            >
              <span>Launch Step-by-Step Profile Wizard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recruitment Summary KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Matches</span>
              <Target className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{opportunities.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Active Compatible Clubs</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Applied</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{applications.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Pending Responses</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Clips</span>
              <Video className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{videos.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Scouting Video Clips</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Alerts</span>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{notifications.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Unread Notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Improvement Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                AI-Assisted Improvement Recommendations
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono bg-white/5 px-2.5 py-0.5 rounded-full">
              STRUCTURED ADVISORY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/25 transition-all relative group"
              >
                <button
                  onClick={() => handleDismissRec(rec.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 p-1"
                  title="Dismiss recommendation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <h3 className="text-xs font-bold text-white mb-1.5">{rec.action}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{rec.reason}</p>
                <Link
                  to="/dashboard/profile"
                  className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Take action</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deterministic Opportunity Feed & Applications Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Compatible Club Opportunities */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold text-white">Deterministic Club Matches</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranked purely via mathematical rule-based weights (Position 30%, Distance 15%, Level 20%, Attributes 20%, Availability 10%, Boost 5%).
              </p>
            </div>
            <Link
              to="/dashboard/opportunities"
              className="text-xs text-brand hover:underline font-semibold shrink-0"
            >
              View All
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Target className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium">No club matches found for your current position and region.</p>
              <p className="text-xs text-slate-500 mt-1">
                Try widening your preferred region in your profile settings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{opp.title}</span>
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-xs font-mono font-bold">
                        {opp.position || 'Any Position'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{opp.clubName}</span>
                      <span>•</span>
                      <span>{opp.region}</span>
                      <span>•</span>
                      <span>Tier {opp.playingLevel}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-brand">
                        {opp.matchScore ?? 85}%
                      </div>
                      <button
                        onClick={() => setSelectedMatch(opp)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 justify-end"
                      >
                        <Info className="w-3 h-3" />
                        <span>Breakdown</span>
                      </button>
                    </div>

                    <Link
                      to={`/dashboard/opportunities`}
                      className="bg-brand hover:bg-brand-hover text-black font-bold px-3.5 py-2 rounded-xl text-xs transition-all"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Applications Status Tracker */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold text-white">My Applications</h2>
              </div>
              <Link to="/dashboard/applications" className="text-xs text-brand hover:underline font-semibold">
                Manage
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-medium">No applications submitted yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Apply to compatible club opportunities from your match feed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate max-w-[150px]">
                        {app.opportunityTitle || app.clubName || 'Trial Application'}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          STATUS_COLORS[app.status || 'submitted'] || STATUS_COLORS.submitted
                        }`}
                      >
                        {(app.status || 'submitted').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{app.clubName || 'Club'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{app.createdAt?.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-white/10">
            <Link
              to="/dashboard/trial-manager"
              className="text-xs text-slate-300 hover:text-white flex items-center justify-between"
            >
              <span>View Scheduled Trials</span>
              <ChevronRight className="w-3.5 h-3.5 text-brand" />
            </Link>
          </div>
        </div>
      </div>

      {/* Join Club with Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Affiliate with a Club</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the unique Club Code provided by your academy, coach, or scout (e.g. <span className="text-brand font-mono">GW-ARS-4821</span>).
            </p>

            <form onSubmit={handleJoinClubWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Unique Club Code</label>
                <input
                  type="text"
                  value={inputClubCode}
                  onChange={(e) => setInputClubCode(e.target.value)}
                  placeholder="GW-XXX-XXXX"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-brand uppercase"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joiningClub}
                  className="w-1/2 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {joiningClub ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deterministic Score Breakdown Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Score Calculation Breakdown</h3>
                <p className="text-xs text-slate-400">{selectedMatch.title} • {selectedMatch.clubName}</p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-brand/10 border border-brand/30 rounded-2xl mb-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-brand mb-1">
                <Info className="w-4 h-4" />
                <span>Deterministic Mathematical Engine</span>
              </div>
              This match score is computed purely through weighted compatibility metrics. AI does not score or rank players.
            </div>

            <div className="space-y-3">
              {[
                { label: 'Position Compatibility (30%)', val: selectedMatch.breakdown?.positionMatch ?? 0.3, max: 0.3 },
                { label: 'Playing Level Tier (20%)', val: selectedMatch.breakdown?.levelMatch ?? 0.18, max: 0.2 },
                { label: 'Player Attributes (20%)', val: selectedMatch.breakdown?.attributesMatch ?? 0.15, max: 0.2 },
                { label: 'Distance & Region (15%)', val: selectedMatch.breakdown?.distanceMatch ?? 0.15, max: 0.15 },
                { label: 'Availability Overlap (10%)', val: selectedMatch.breakdown?.availabilityMatch ?? 0.1, max: 0.1 },
                { label: 'Visibility Boost (5%)', val: selectedMatch.breakdown?.boostMatch ?? 0.0, max: 0.05 },
              ].map((row) => (
                <div key={row.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">{row.label}</span>
                    <span className="font-mono text-brand font-bold">
                      {Math.round((row.val / row.max) * 100)}% ({Math.round(row.val * 100)} pts)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${Math.min(100, (row.val / row.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Total Deterministic Match Score</span>
              <span className="text-2xl font-black font-mono text-brand">{selectedMatch.matchScore}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
