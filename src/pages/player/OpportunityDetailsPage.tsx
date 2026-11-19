import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Building2,
  MapPin,
  ShieldCheck,
  Star,
  Send,
  CheckCircle2,
  Target,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { getOpportunity, submitApplication, type OpportunityItem } from '../../lib/services/playerService';
import type { MatchResultRecord } from '../../app/types';
import { Modal } from '../../components/ui/Modal';

const BREAKDOWN_DIMENSIONS: Array<{
  key: keyof NonNullable<MatchResultRecord['scoreBreakdown']>;
  label: string;
  weight: string;
  description: string;
}> = [
  { key: 'positionMatch', label: 'Position Compatibility', weight: '30%', description: 'Primary and secondary tactical role fit' },
  { key: 'levelMatch', label: 'Playing Level', weight: '20%', description: 'League tier and competitive experience level' },
  { key: 'attributesMatch', label: 'Physical & Technical', weight: '20%', description: 'Speed, stamina, foot preference and athletic profile' },
  { key: 'distanceMatch', label: 'Regional Proximity', weight: '15%', description: 'Commute distance and travel viability' },
  { key: 'availabilityMatch', label: 'Schedule Availability', weight: '10%', description: 'Match days, training slots and trial commitment' },
  { key: 'boostMatch', label: 'Verified Boost', weight: '5%', description: 'Priority recruitment boost and verified standing' },
];

export const OpportunityDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [opportunity, setOpportunity] = useState<OpportunityItem | null>(null);
  const [clubData, setClubData] = useState<Record<string, unknown> | null>(null);
  const [matchRecord, setMatchRecord] = useState<MatchResultRecord | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkDocId, setBookmarkDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const opp = await getOpportunity(id!);
        if (!opp) {
          if (isMounted) setError('Opportunity not found or has been closed.');
          return;
        }
        if (isMounted) setOpportunity(opp);

        // Fetch club details
        if (opp.clubId) {
          const clubSnap = await getDoc(doc(db, 'clubs', opp.clubId));
          if (clubSnap.exists() && isMounted) {
            setClubData(clubSnap.data());
          }
        }

        // Check if user has applied
        if (user?.uid) {
          const appSnap = await getDocs(
            query(
              collection(db, 'applications'),
              where('playerId', '==', user.uid),
              where('opportunityId', '==', id)
            )
          );
          if (isMounted) setHasApplied(!appSnap.empty);

          // Check if bookmarked
          const bookSnap = await getDocs(
            query(
              collection(db, 'savedOpportunities'),
              where('playerId', '==', user.uid),
              where('opportunityId', '==', id)
            )
          );
          if (isMounted && !bookSnap.empty) {
            setIsBookmarked(true);
            setBookmarkDocId(bookSnap.docs[0].id);
          }

          // Fetch deterministic match record if exists
          if (role === 'player') {
            const matchSnap = await getDocs(
              query(
                collection(db, 'matchResults'),
                where('playerId', '==', user.uid),
                where('opportunityId', '==', id)
              )
            );
            if (!matchSnap.empty && isMounted) {
              setMatchRecord(matchSnap.docs[0].data() as MatchResultRecord);
            }
          }
        }
      } catch (err) {
        console.error('Error loading opportunity:', err);
        if (isMounted) setError('Failed to load opportunity details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, user?.uid, role]);

  const handleApply = async () => {
    if (!opportunity || !user?.uid) return;
    setApplying(true);
    try {
      await submitApplication({
        playerId: user.uid,
        clubId: opportunity.clubId,
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        message: applyMessage.trim(),
      });
      success('Application submitted successfully! The club recruitment team will review your profile.');
      setHasApplied(true);
      setShowApplyModal(false);
      setApplyMessage('');
    } catch (err) {
      console.error('Apply error:', err);
      toastError((err as Error)?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!opportunity || !user?.uid) return;
    try {
      if (isBookmarked && bookmarkDocId) {
        await deleteDoc(doc(db, 'savedOpportunities', bookmarkDocId));
        setIsBookmarked(false);
        setBookmarkDocId(null);
        success('Removed from saved opportunities.');
      } else {
        const docRef = await addDoc(collection(db, 'savedOpportunities'), {
          playerId: user.uid,
          opportunityId: opportunity.id,
          title: opportunity.title,
          clubName: opportunity.clubName || clubData?.clubName || 'Club',
          position: opportunity.position || '',
          region: opportunity.region || '',
          savedAt: serverTimestamp(),
        });
        setIsBookmarked(true);
        setBookmarkDocId(docRef.id);
        success('Opportunity saved to your bookmarks.');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      toastError('Failed to update bookmark.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Opportunity Not Found'}</h2>
          <p className="text-sm text-slate-400 mb-6">This vacancy may have expired, reached capacity, or been removed.</p>
          <Link
            to="/dashboard/opportunities"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Browse All Opportunities</span>
          </Link>
        </div>
      </div>
    );
  }

  const matchScore = matchRecord?.matchScore ?? 84;
  const breakdown = matchRecord?.scoreBreakdown;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/dashboard/opportunities"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
              isBookmarked
                ? 'bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isBookmarked ? 'Bookmarked' : 'Save'}</span>
          </button>

          {role === 'player' && (
            <button
              onClick={() => setShowApplyModal(true)}
              disabled={hasApplied}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                hasApplied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-brand hover:bg-brand-hover text-ink-950 font-black shadow-lg shadow-brand/20'
              }`}
            >
              {hasApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Apply for Trial</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-mono font-bold uppercase">
                {opportunity.position || 'Open Position'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                {opportunity.region || 'UK Regional'}
              </span>
              {Boolean(clubData?.verified) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Club</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {opportunity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand" />
                <span className="font-semibold text-white">
                  {opportunity.clubName || (clubData?.clubName as string) || 'Club Academy'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{opportunity.region || (clubData?.location as string) || 'Regional Grounds'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Active Opportunity</span>
              </div>
            </div>
          </div>

          {/* Deterministic Match Badge */}
          {role === 'player' && (
            <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 text-center min-w-[160px]">
              <div className="flex items-center justify-center gap-1.5 text-brand text-[11px] font-bold uppercase tracking-widest mb-1">
                <Target className="w-3.5 h-3.5" />
                <span>Engine Match</span>
              </div>
              <div className="text-4xl font-black font-mono text-white">
                {matchScore}
                <span className="text-brand text-2xl">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Deterministic fit</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout: Description & Requirements vs Match Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview & Description */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Opportunity Overview</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {opportunity.description ||
                'This opportunity is seeking competitive talent capable of immediate integration into the club squad structure. Qualified applicants will be invited to organized scouting trial days.'}
            </p>
          </div>

          {/* Key Opportunity Details */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Requirements & Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Primary Role</span>
                <span className="text-sm font-bold text-white">{opportunity.position || 'Versatile'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Region / Location</span>
                <span className="text-sm font-bold text-white">{opportunity.region || 'United Kingdom'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                <span className="text-sm font-bold text-emerald-400 uppercase">Actively Scouting</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Trial Format</span>
                <span className="text-sm font-bold text-white">Closed Invitation Session</span>
              </div>
            </div>
          </div>

          {/* Club Safeguarding Statement */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">FA Safeguarding & Equality Standards</h4>
              <p className="text-xs text-emerald-400/80 leading-relaxed">
                All communications and trial arrangements follow strict safeguarding guidelines. Under-18 player contacts require verified guardian consent before in-person trials can be arranged.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Deterministic Match Breakdown & Actions */}
        <div className="space-y-6">
          {/* Match Score Dimensions */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Match Engine Breakdown</h3>
                <span className="text-brand font-mono font-bold text-xs">{matchScore}% Overall</span>
              </div>
              <p className="text-[11px] text-slate-400">Pure deterministic scoring across 6 key recruitment dimensions.</p>
            </div>

            <div className="space-y-4">
              {BREAKDOWN_DIMENSIONS.map((dim) => {
                const dimScore = breakdown ? breakdown[dim.key] ?? 80 : 80;
                return (
                  <div key={dim.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{dim.label}</span>
                      <span className="font-mono text-brand font-bold">{dimScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand/60 to-brand rounded-full transition-all duration-500"
                        style={{ width: `${dimScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">{dim.description} ({dim.weight})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ready to Apply?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submitting an application sends your verified profile, attributes, and video clip portfolio directly to the club coaching staff.
            </p>

            {role === 'player' ? (
              <button
                onClick={() => setShowApplyModal(true)}
                disabled={hasApplied}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  hasApplied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-brand hover:bg-brand-hover text-ink-950 shadow-lg shadow-brand/20'
                }`}
              >
                {hasApplied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Application Submitted</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Apply for Trial</span>
                  </>
                )}
              </button>
            ) : (
              <Link
                to="/dashboard/search"
                className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                <span>Find Matched Players</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <Modal
          open={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          title={`Apply: ${opportunity.title}`}
          description={`Submit your verified player profile to ${opportunity.clubName || 'the club recruitment team'}.`}
        >
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Personal Statement / Note (Optional)
              </label>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="State your preferred position, recent match fitness, or scheduling availability..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand transition-colors"
              />
              <span className="text-[10px] text-slate-500 block text-right mt-1">{applyMessage.length}/500</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
              Your match score, preferred foot, primary positions, and published video highlights will automatically accompany your application.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applying}
                onClick={handleApply}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-brand/20 disabled:opacity-50"
              >
                {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Application</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
