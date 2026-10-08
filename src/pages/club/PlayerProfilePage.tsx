import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Star,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Video,
  Send,
  Loader2,
  ChevronLeft,
  StickyNote,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { PlayerRecord, ClubRecord, VideoRecord } from '../../app/types';
import { calculateMatchScore } from '../../lib/scoringEngine';

export const PlayerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [club, setClub] = useState<ClubRecord | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Private club notes
  const [clubNote, setClubNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [clubOpps, setClubOpps] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedOpp, setSelectedOpp] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (!id || !user?.uid) return;

    const loadDossier = async () => {
      setLoading(true);
      try {
        // Fetch player doc
        const playerSnap = await getDoc(doc(db, 'players', id));
        if (!playerSnap.exists()) {
          toastError('Player profile not found.');
          setPlayer(null);
          return;
        }
        const playerData = { id: playerSnap.id, ...playerSnap.data() } as PlayerRecord;
        setPlayer(playerData);

        // Fetch club doc
        const clubSnap = await getDoc(doc(db, 'clubs', user.uid));
        if (clubSnap.exists()) {
          setClub({ id: clubSnap.id, ...clubSnap.data() } as ClubRecord);
        }

        // Fetch videos
        const vidsSnap = await getDocs(
          query(collection(db, 'playerVideos'), where('playerId', '==', id)),
        );
        setVideos(vidsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as VideoRecord)));

        // Check if shortlisted
        const shortSnap = await getDocs(
          query(
            collection(db, 'shortlists'),
            where('clubId', '==', user.uid),
            where('playerId', '==', id),
          ),
        );
        setIsShortlisted(!shortSnap.empty);

        // Fetch private club note
        const noteDoc = await getDoc(doc(db, 'clubNotes', `${user.uid}_${id}`));
        if (noteDoc.exists()) {
          setClubNote(noteDoc.data().content || '');
        }

        // Fetch club opportunities for invite modal
        const oppsSnap = await getDocs(
          query(
            collection(db, 'opportunities'),
            where('clubId', '==', user.uid),
            where('status', '==', 'active'),
          ),
        );
        setClubOpps(oppsSnap.docs.map((d) => ({ id: d.id, title: d.data().title || 'Trial Opportunity' })));
      } catch (err) {
        console.error('Error loading player dossier:', err);
        toastError('Failed to load player dossier.');
      } finally {
        setLoading(false);
      }
    };

    loadDossier();
  }, [id, user?.uid]);

  const handleToggleShortlist = async () => {
    if (!player || !user?.uid) return;
    try {
      if (isShortlisted) {
        // Find and remove
        const q = query(
          collection(db, 'shortlists'),
          where('clubId', '==', user.uid),
          where('playerId', '==', player.id),
        );
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(d.ref);
        });
        setIsShortlisted(false);
        success('Player removed from shortlist.');
      } else {
        await addDoc(collection(db, 'shortlists'), {
          clubId: user.uid,
          playerId: player.id,
          playerName: player.name || 'Player',
          playerPosition: player.positions?.[0] || 'CM',
          playerRegion: player.region || '',
          createdAt: serverTimestamp(),
        });
        setIsShortlisted(true);
        success('Player saved to shortlist.');
      }
    } catch (err) {
      toastError('Failed to update shortlist.');
    }
  };

  const handleSaveNote = async () => {
    if (!player || !user?.uid) return;
    setSavingNote(true);
    try {
      await setDoc(doc(db, 'clubNotes', `${user.uid}_${player.id}`), {
        clubId: user.uid,
        playerId: player.id,
        content: clubNote,
        updatedAt: serverTimestamp(),
      });
      success('Private scouting note saved.');
    } catch (err) {
      toastError('Failed to save private note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendInvite = async () => {
    if (!player || !user?.uid || !selectedOpp) return;
    setSendingInvite(true);
    try {
      await addDoc(collection(db, 'applications'), {
        playerId: player.id,
        clubId: user.uid,
        opportunityId: selectedOpp,
        opportunityTitle: clubOpps.find((o) => o.id === selectedOpp)?.title || 'Trial Opportunity',
        clubName: club?.name || 'Club',
        playerName: player.name || 'Player',
        status: 'trial_invited',
        message: inviteMsg,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Notification
      await addDoc(collection(db, 'notifications'), {
        userId: player.id,
        type: 'trial_invitation',
        title: 'Trial Invitation Received',
        body: `${club?.name || 'A verified club'} invited you to a trial!`,
        read: false,
        createdAt: serverTimestamp(),
      });

      success(`Trial invitation sent to ${player.name}!`);
      setShowInviteModal(false);
      setInviteMsg('');
    } catch (err) {
      toastError('Failed to dispatch trial invitation.');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <User className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Player Dossier Unavailable</h2>
        <p className="text-xs text-slate-400 mb-6">
          This player profile may be delisted, pending guardian consent, or does not exist.
        </p>
        <button
          onClick={() => navigate('/dashboard/search')}
          className="px-6 py-2.5 bg-brand text-black font-bold text-xs uppercase tracking-wider rounded-xl"
        >
          Return to Player Search
        </button>
      </div>
    );
  }

  // Calculate deterministic match score if club target preferences exist
  const matchResult = calculateMatchScore(
    {
      positions: player.positions || ['CM'],
      region: player.region || 'London',
      playingLevel: player.playingLevel || 5,
      skillRatings: player.skillRatings || { passing: 7, stamina: 7 },
      availability: player.availability || ['Saturday'],
      hasActiveBoost: !!player.boostsActive,
    },
    {
      targetPositions: club?.targetPositions && club.targetPositions.length > 0 ? club.targetPositions : ['CM'],
      region: club?.region || 'London',
      targetLevel: club?.targetPlayingLevels?.[0] || 5,
      requiredAvailability: ['Saturday'],
    },
  );

  const matchPercent = Math.round(matchResult.totalScore * 100);
  const isMinor = !!player.isYouth;
  const clubCanRecruitYouth = club?.verifiedYouth === true;
  const isYouthLocked = isMinor && !clubCanRecruitYouth;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/search"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Player Search</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleShortlist}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
              isShortlisted
                ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-amber-400' : ''}`} />
            <span>{isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}</span>
          </button>
          {!isYouthLocked && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-5 py-2 bg-brand text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.25)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invite to Trial</span>
            </button>
          )}
        </div>
      </div>

      {/* Minor Safeguarding Alert banner */}
      {isMinor && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            clubCanRecruitYouth
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {clubCanRecruitYouth ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            <p className="font-bold uppercase tracking-wider">
              {clubCanRecruitYouth
                ? 'Verified Youth Oversight Active'
                : 'Youth Safeguarding Protocol Restricted'}
            </p>
            <p className="mt-0.5 text-slate-300">
              {clubCanRecruitYouth
                ? 'Your club holds verified youth recruitment clearance. Direct communications are logged and statutory guardian consent has been validated.'
                : 'This is a registered youth player (U18). Direct inquiries, trials, and private contact are restricted until your club completes verified youth safeguarding accreditation.'}
            </p>
            {!clubCanRecruitYouth && (
              <Link
                to="/dashboard/club/verification"
                className="mt-2 inline-block text-[11px] font-bold text-amber-400 underline uppercase tracking-wider"
              >
                Submit Club Safeguarding Documents →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Dossier Header */}
      <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-5 md:col-span-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-dark-bg border-2 border-brand/40 flex items-center justify-center text-brand text-2xl font-black shadow-[0_0_20px_rgba(204,255,0,0.15)] overflow-hidden">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}</span>
                )}
              </div>
              {player.profileCompleteness && player.profileCompleteness >= 80 && (
                <span className="absolute -bottom-1 -right-1 bg-brand text-slate-950 p-1 rounded-full shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                  {player.name || 'Anonymous Player'}
                </h1>
                {isMinor && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase">
                    U18 Minor
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {player.positions?.map((pos) => (
                  <span
                    key={pos}
                    className="px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/30 text-brand text-xs font-black uppercase tracking-wider"
                  >
                    {pos}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                  Tier {player.playingLevel || 5}
                </span>
                {player.dominantFoot && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                    Foot: {player.dominantFoot}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  {player.region || 'UK'}
                </span>
                {player.height && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {player.height} cm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Deterministic Match Score Card */}
          <div className="p-5 rounded-2xl bg-dark-bg/80 border border-dark-border flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Squad Fit Compatibility
            </span>
            <div className="my-2 flex items-baseline gap-1">
              <span className="text-4xl font-black text-brand tracking-tight">{matchPercent}%</span>
              <span className="text-xs text-slate-400 font-mono">match</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-[200px]">
              Computed via pure deterministic rule-based algorithms against your club roster requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Attributes, Availability, Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Attributes, Videos, Bio */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio */}
          {player.bio && (
            <div className="bg-dark-surface border border-dark-border rounded-3xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Scouting Bio & Playing Summary
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{player.bio}</p>
            </div>
          )}

          {/* Technical Ratings */}
          <div className="bg-dark-surface border border-dark-border rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Technical & Physical Skill Ratings
              </h3>
              <span className="text-[10px] font-mono text-brand font-bold uppercase">
                Deterministic Scale (1-10)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(
                player.skillRatings || {
                  passing: 7,
                  dribbling: 7,
                  shooting: 6,
                  defending: 5,
                  pace: 8,
                  stamina: 8,
                },
              ).map(([stat, val]) => (
                <div key={stat} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-bold text-white capitalize">{stat.replace('_', ' ')}</span>
                    <span className="font-mono text-brand font-bold">{val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${(Number(val) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video Highlights */}
          <div className="bg-dark-surface border border-dark-border rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Match Highlights & Video Vault
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {videos.length} clip{videos.length !== 1 ? 's' : ''} uploaded
              </span>
            </div>

            {videos.length === 0 ? (
              <div className="p-8 text-center bg-dark-bg/60 rounded-2xl border border-dark-border">
                <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No match clips published yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-4 rounded-2xl bg-dark-bg border border-dark-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        {vid.title || 'Match Clip'}
                      </span>
                      <span className="text-[10px] font-mono text-brand uppercase font-bold">
                        {vid.processingStatus || 'Ready'}
                      </span>
                    </div>
                    {/* Observable AI tags */}
                    {vid.aiTags && vid.aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {vid.aiTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Availability & Private Club Notes */}
        <div className="space-y-8">
          {/* Availability */}
          <div className="bg-dark-surface border border-dark-border rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Weekly Training & Trial Schedule
            </h3>
            <div className="space-y-2">
              {(player.availability || ['Saturday Morning', 'Tuesday Eve']).map((slot) => (
                <div
                  key={slot}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                >
                  <span className="text-slate-300 font-semibold">{slot}</span>
                  <CheckCircle2 className="w-4 h-4 text-brand" />
                </div>
              ))}
            </div>
          </div>

          {/* Private Club Scouting Notes (Protected from player) */}
          <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                  Private Club Notes
                </h3>
              </div>
              <span className="text-[9px] text-amber-400/90 font-mono uppercase bg-amber-400/10 px-2 py-0.5 rounded">
                Confidential
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Notes recorded here are strictly private to your club staff and are NEVER exposed to the player.
            </p>
            <textarea
              value={clubNote}
              onChange={(e) => setClubNote(e.target.value)}
              rows={4}
              placeholder="Record private technical notes, scout observations, contract discussions..."
              className="w-full bg-dark-bg border border-dark-border rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-brand resize-none placeholder-slate-600"
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
            >
              {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Private Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trial Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Invite {player.name} to Trial
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send a formal trial invitation to this player's workspace.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Club Opportunity *
                </label>
                {clubOpps.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                    You don't have any active recruitment opportunities. Create one in Trial Manager first.
                  </div>
                ) : (
                  <select
                    value={selectedOpp}
                    onChange={(e) => setSelectedOpp(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand"
                  >
                    <option value="">Select Opportunity...</option>
                    {clubOpps.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Invitation Message & Instructions
                </label>
                <textarea
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  rows={4}
                  placeholder="Details on arrival time, surface type, kit required, and trial schedule..."
                  className="w-full bg-dark-bg border border-dark-border rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-brand resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-5 py-2.5 rounded-xl border border-dark-border text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={sendingInvite || !selectedOpp}
                className="px-6 py-2.5 rounded-xl bg-brand text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2"
              >
                {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Dispatch Invitation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
