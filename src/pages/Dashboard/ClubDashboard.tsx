import { useEffect, useState } from 'react';
import { Users, FileText, Star, ShieldAlert, BrainCircuit, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface ClubData {
  name: string;
  verificationStatus?: string;
  verifiedAdult?: boolean;
  verifiedYouth?: boolean;
  youthVerificationExpiry?: unknown;
  region?: string;
}

interface ApplicationDoc {
  id: string;
  status: string;
  playerName?: string;
  opportunityTitle?: string;
  createdAt: unknown;
}

interface OpportunityDoc {
  id: string;
  title: string;
  position?: string;
  status: string;
}

export const ClubDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // New opportunity modal state
  const [showModal, setShowModal] = useState(false);
  const [newOpp, setNewOpp] = useState({ title: '', position: '', region: '', description: '', type: 'trial' });
  const [savingOpp, setSavingOpp] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Club profile
        const clubSnap = await getDoc(doc(db, 'clubs', user.uid));
        setClubData(clubSnap.exists() ? (clubSnap.data() as ClubData) : { name: user.name });

        // Applications to this club's opportunities
        const appsQuery = query(collection(db, 'applications'), where('clubId', '==', user.uid));
        const appsSnap = await getDocs(appsQuery);
        setApplications(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ApplicationDoc)));

        // This club's opportunities
        const oppsQuery = query(collection(db, 'opportunities'), where('clubId', '==', user.uid));
        const oppsSnap = await getDocs(oppsQuery);
        setOpportunities(oppsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc)));

        // Shortlist count
        const slQuery = query(collection(db, 'shortlists'), where('clubId', '==', user.uid));
        const slSnap = await getDocs(slQuery);
        setShortlistCount(slSnap.size);
      } catch (err) {
        console.error('Club dashboard error:', err);
        setFetchError('Failed to load club dashboard. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handlePostOpportunity = async () => {
    if (!newOpp.title.trim() || !newOpp.position.trim()) {
      toastError('Please fill in title and position fields.');
      return;
    }
    setSavingOpp(true);
    try {
      const docRef = await addDoc(collection(db, 'opportunities'), {
        clubId: user?.uid,
        clubName: clubData?.name ?? user?.name,
        title: newOpp.title,
        position: newOpp.position,
        region: newOpp.region,
        description: newOpp.description,
        type: newOpp.type,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOpportunities((prev) => [
        { id: docRef.id, title: newOpp.title, position: newOpp.position, status: 'active' },
        ...prev,
      ]);
      setNewOpp({ title: '', position: '', region: '', description: '', type: 'trial' });
      setShowModal(false);
      success('Opportunity posted successfully!');
    } catch (err) {
      console.error('Error posting opportunity:', err);
      toastError('Failed to post opportunity. Please try again.');
    } finally {
      setSavingOpp(false);
    }
  };

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

  const verificationStatus = clubData?.verificationStatus ?? 'pending';
  const isVerified = verificationStatus === 'approved';
  const isYouthVerified = clubData?.verifiedYouth ?? false;

  const VERIFICATION_BADGE: Record<string, string> = {
    approved: 'text-brand border-brand/30 bg-brand/10',
    pending: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    rejected: 'text-red-400 border-red-400/30 bg-red-400/10',
  };

  const inputClass = 'w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand transition-colors';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black tracking-tight uppercase">{clubData?.name ?? 'Club'} Command</h3>
          <p className="text-text-secondary text-sm mt-1">Manage squad, scout players, and analyze gaps.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-brand text-dark-bg font-bold uppercase tracking-wider rounded hover:bg-brand-hover transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(204,255,0,0.2)] flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Post Opportunity</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black">{opportunities.length}</span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Active Listings</h4>
        </div>

        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand/10 text-brand rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black">{applications.length}</span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Applications</h4>
        </div>

        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black">{shortlistCount}</span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Shortlisted</h4>
        </div>

        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-dark-bg rounded-lg">
              <ShieldAlert className="w-6 h-6 text-text-secondary" />
            </div>
            <span className={`text-xs font-bold px-2 py-1 border rounded uppercase tracking-widest ${VERIFICATION_BADGE[verificationStatus] ?? VERIFICATION_BADGE.pending}`}>
              {verificationStatus}
            </span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Club Status</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Squad Gap Analysis placeholder */}
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
            <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center z-10 relative">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold tracking-tight uppercase">AI Squad Gap Analysis</h4>
              </div>
              <span className="px-2 py-1 bg-dark-bg border border-dark-border text-[10px] font-bold uppercase tracking-widest rounded text-text-secondary">
                Not Configured
              </span>
            </div>
            <div className="p-6 relative z-10">
              <div className="text-center py-8">
                <BrainCircuit className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                <p className="text-text-secondary text-sm font-medium">AI features not configured.</p>
                <p className="text-text-secondary/60 text-xs mt-2 max-w-sm mx-auto">
                  Configure CLAUDE_API_KEY in Firebase Functions to enable AI Squad Gap Analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center">
              <h4 className="font-bold tracking-tight uppercase">Recent Applications</h4>
              <Link to="/applications" className="text-sm text-brand cursor-pointer hover:underline">
                View All
              </Link>
            </div>
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">
                  <Users className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                  <p>No applications yet.</p>
                  <p className="text-xs mt-1 text-text-secondary/60">Applications will appear here when players apply to your opportunities.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded-lg">
                      <div>
                        <p className="font-bold text-sm">{app.playerName ?? 'Player'}</p>
                        <p className="text-xs text-text-secondary">{app.opportunityTitle ?? 'Opportunity'}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-dark-surface border border-dark-border text-[10px] font-bold uppercase tracking-widest rounded text-text-secondary">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick actions */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg space-y-3">
            <h4 className="font-bold tracking-tight uppercase text-sm mb-4">Quick Actions</h4>
            <Link
              to="/search"
              className="w-full flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 hover:text-brand transition-colors text-sm font-bold"
            >
              <Users className="w-4 h-4" />
              <span>Search Players</span>
            </Link>
            <Link
              to="/shortlist"
              className="w-full flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 hover:text-brand transition-colors text-sm font-bold"
            >
              <Star className="w-4 h-4" />
              <span>View Shortlist ({shortlistCount})</span>
            </Link>
            <Link
              to="/applications"
              className="w-full flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/50 hover:text-brand transition-colors text-sm font-bold"
            >
              <FileText className="w-4 h-4" />
              <span>Manage Applications</span>
            </Link>
          </div>

          {/* Safeguarding Status */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-brand" />
                <h4 className="font-bold tracking-tight uppercase">Safeguarding</h4>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">Adult Verification</span>
                <span className={`text-xs font-bold ${isVerified ? 'text-brand' : 'text-amber-400'}`}>
                  {isVerified ? 'Approved' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-text-secondary">Youth Verification</span>
                <span className={`text-xs font-bold ${isYouthVerified ? 'text-brand' : 'text-text-secondary'}`}>
                  {isYouthVerified ? 'Active' : 'Not Verified'}
                </span>
              </div>

              {!isVerified && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                  <p className="text-[11px] text-amber-400 leading-relaxed">
                    Club verification is pending admin review. You cannot recruit youth players until approved.
                  </p>
                </div>
              )}

              {isVerified && (
                <p className="text-xs text-text-secondary mt-2">
                  Your club is authorised to recruit. All access is strictly audited per GROUNDWORK safeguarding protocol.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Opportunity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h3 className="text-lg font-bold uppercase tracking-tight">Post Opportunity</h3>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Title *</label>
                <input
                  type="text"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp((p) => ({ ...p, title: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Seeking Left Midfielder for Step 4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Position *</label>
                  <input
                    type="text"
                    value={newOpp.position}
                    onChange={(e) => setNewOpp((p) => ({ ...p, position: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. CM, ST, LB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Type</label>
                  <select
                    value={newOpp.type}
                    onChange={(e) => setNewOpp((p) => ({ ...p, type: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="trial">Trial</option>
                    <option value="open_recruitment">Open Recruitment</option>
                    <option value="academy">Academy</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Region</label>
                <input
                  type="text"
                  value={newOpp.region}
                  onChange={(e) => setNewOpp((p) => ({ ...p, region: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. North West, London"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={newOpp.description}
                  onChange={(e) => setNewOpp((p) => ({ ...p, description: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Describe the opportunity, requirements, trial dates..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-dark-border flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-dark-border text-text-secondary font-bold text-sm rounded hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePostOpportunity}
                disabled={savingOpp}
                className="px-6 py-2 bg-brand text-dark-bg font-bold text-sm rounded hover:bg-brand-hover transition-colors disabled:opacity-60 flex items-center space-x-2"
              >
                {savingOpp && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Post Opportunity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
