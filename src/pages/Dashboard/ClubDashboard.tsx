import { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Star,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Plus,
  X,
  Share2,
  Copy,
  Check,
  Sparkles,
  Building2,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  getClubRecord,
  listClubApplications,
  listClubOpportunities,
  type ClubApplicationItem,
  type ClubOpportunityItem,
} from '../../lib/services/clubService';
import { generateClubCode, getClubInviteUrl, multiPlatformShare } from '../../lib/clubCode';
import type { ClubRecord } from '../../app/types';

export const ClubDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [clubData, setClubData] = useState<ClubRecord | null>(null);
  const [clubCode, setClubCode] = useState('');
  const [applications, setApplications] = useState<ClubApplicationItem[]>([]);
  const [opportunities, setOpportunities] = useState<ClubOpportunityItem[]>([]);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [squadCount, setSquadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // New opportunity modal state
  const [showModal, setShowModal] = useState(false);
  const [newOpp, setNewOpp] = useState({
    title: '',
    position: 'CM',
    region: 'London',
    description: '',
    playingLevel: 5,
  });
  const [savingOpp, setSavingOpp] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const clubRecord = await getClubRecord(user.uid);
        let currentCode = '';

        if (clubRecord) {
          setClubData(clubRecord);
          if (clubRecord.clubCode) {
            currentCode = clubRecord.clubCode;
            setClubCode(clubRecord.clubCode);
          } else {
            currentCode = generateClubCode(clubRecord.name || user.name);
            await updateDoc(doc(db, 'clubs', user.uid), { clubCode: currentCode });
            setClubCode(currentCode);
          }
        } else {
          currentCode = generateClubCode(user.name);
          setClubCode(currentCode);
          setClubData({
            id: user.uid,
            uid: user.uid,
            name: user.name,
            clubCode: currentCode,
            verificationStatus: 'pending',
            verifiedAdult: false,
            verifiedYouth: false,
          });
        }

        // Applications
        const recentApplications = await listClubApplications(user.uid);
        setApplications(recentApplications.slice(0, 8));

        // Opportunities
        const recentOpps = await listClubOpportunities(user.uid);
        setOpportunities(recentOpps);

        // Shortlist count
        const slQuery = query(collection(db, 'shortlists'), where('clubId', '==', user.uid));
        const slSnap = await getDocs(slQuery);
        setShortlistCount(slSnap.size);

        // Squad count
        const sqQuery = query(collection(db, 'squadMembers'), where('clubId', '==', user.uid));
        const sqSnap = await getDocs(sqQuery);
        setSquadCount(sqSnap.size);
      } catch (err) {
        console.error('Club dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, user?.name]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(clubCode);
    setCopied(true);
    success(`Club Code ${clubCode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpp.title.trim() || !newOpp.position.trim()) {
      toastError('Please fill in title and position fields.');
      return;
    }
    setSavingOpp(true);
    try {
      const oppPayload = {
        clubId: user?.uid,
        clubName: clubData?.name ?? user?.name,
        title: newOpp.title,
        position: newOpp.position,
        region: newOpp.region,
        description: newOpp.description,
        playingLevel: Number(newOpp.playingLevel) || 5,
        status: 'active',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'opportunities'), oppPayload);
      setOpportunities((prev) => [
        {
          id: docRef.id,
          ...oppPayload,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        },
        ...prev,
      ]);

      setShowModal(false);
      setNewOpp({ title: '', position: 'CM', region: 'London', description: '', playingLevel: 5 });
      success('Recruitment opportunity published!');
    } catch (err) {
      toastError((err as Error)?.message ?? 'Failed to publish opportunity.');
    } finally {
      setSavingOpp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const isVerifiedAdult = clubData?.verifiedAdult || clubData?.verificationStatus === 'approved';
  const isVerifiedYouth = clubData?.verifiedYouth;
  const inviteUrl = getClubInviteUrl(clubCode, 'player');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Club Operations</span>
            {isVerifiedYouth ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Youth Scouting Authorized</span>
              </span>
            ) : isVerifiedAdult ? (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Adult Verified</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Verification Pending</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">
            {clubData?.name || user?.name || 'Club Command Center'}
          </h1>
          <p className="text-sm text-slate-400">
            Manage your recruitment pipeline, trials, deterministic matches, and unique club invites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/club/invites"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <Share2 className="w-4 h-4 text-brand" />
            <span>Invite Hub</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20"
          >
            <Plus className="w-4 h-4" />
            <span>Post Opportunity</span>
          </button>
        </div>
      </div>

      {/* Unique Club Code Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-brand/30 rounded-3xl p-6 relative overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Club Code for Invites & Academy Linkage
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-black text-brand tracking-wider select-all">
                {clubCode || 'GW-FC-0000'}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand transition-all"
                title="Copy Club Code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Players entering this code link directly with your club. Share via WhatsApp, Email, or QR Code.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={multiPlatformShare.whatsapp({
                clubName: clubData?.name || 'Our Club',
                clubCode,
                inviteUrl,
              })}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Invite</span>
            </a>
            <Link
              to="/dashboard/club/invites"
              className="bg-brand text-black font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all hover:bg-brand-hover shadow-md shadow-brand/20"
            >
              Manage All Invites
            </Link>
          </div>
        </div>
      </div>

      {/* Recruitment KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Active Listings</span>
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{opportunities.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Open Trials & Positions</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Applications</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{applications.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Incoming Player Submissions</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Shortlisted</span>
            <Star className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{shortlistCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Bookmarked Talent</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Squad Depth</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{squadCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Active Roster Members</p>
          </div>
        </div>
      </div>

      {/* AI Squad Gap Analysis Callout */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-bold text-white">AI Squad Gap Analysis</h2>
              <span className="text-[10px] font-mono font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                TACTICAL INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Analyzes your current formation and squad counts to isolate critical depth shortages. Click any identified gap to launch a deterministic search for compatible talent.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/club/squad-gaps"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shrink-0 transition-all text-center flex items-center justify-center gap-2"
        >
          <span>Analyze Squad Gaps</span>
          <ExternalLink className="w-3.5 h-3.5 text-brand" />
        </Link>
      </div>

      {/* Main Grid: Active Opportunities & Incoming Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Opportunities */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-white">Active Recruitment Opportunities</h2>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-brand hover:underline font-semibold"
            >
              + Add New
            </button>
          </div>

          {opportunities.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium">No active opportunities published.</p>
              <p className="text-xs text-slate-500 mt-1">
                Post an opportunity to start receiving deterministic player applications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/25 transition-all flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{opp.title}</span>
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-xs font-mono font-bold">
                        {opp.position || 'Any'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {opp.region || 'Regional'} • Status: <span className="text-emerald-400 capitalize">{opp.status}</span>
                    </p>
                  </div>

                  <Link
                    to="/dashboard/search"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-all"
                  >
                    Search Candidates
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Incoming Applications */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-white">Recent Applications</h2>
            </div>
            <Link to="/dashboard/applications" className="text-xs text-brand hover:underline font-semibold">
              View All
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium">No applications received yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Applications will appear here once players apply to your listings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate max-w-[150px]">
                      {app.playerName || 'Prospective Player'}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize text-blue-400 bg-blue-400/10 border-blue-400/30">
                      {app.status || 'submitted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    For: {app.opportunityTitle || 'General Application'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Opportunity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Recruitment Opportunity</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostOpportunity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Opportunity Title</label>
                <input
                  type="text"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  placeholder="e.g. First Team Centre Midfielder Trial"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Position</label>
                  <select
                    value={newOpp.position}
                    onChange={(e) => setNewOpp({ ...newOpp, position: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="GK">GK (Goalkeeper)</option>
                    <option value="CB">CB (Centre Back)</option>
                    <option value="LB">LB (Left Back)</option>
                    <option value="RB">RB (Right Back)</option>
                    <option value="CDM">CDM (Defensive Mid)</option>
                    <option value="CM">CM (Centre Mid)</option>
                    <option value="CAM">CAM (Attacking Mid)</option>
                    <option value="LW">LW (Left Wing)</option>
                    <option value="RW">RW (Right Wing)</option>
                    <option value="ST">ST (Striker)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Tier (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newOpp.playingLevel}
                    onChange={(e) => setNewOpp({ ...newOpp, playingLevel: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Region</label>
                <input
                  type="text"
                  value={newOpp.region}
                  onChange={(e) => setNewOpp({ ...newOpp, region: e.target.value })}
                  placeholder="e.g. London, North West"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  value={newOpp.description}
                  onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })}
                  rows={3}
                  placeholder="Provide trial schedule, age requirements, and instructions..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOpp}
                  className="w-1/2 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {savingOpp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
