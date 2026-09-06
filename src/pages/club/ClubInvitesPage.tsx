import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import {
  generateClubCode,
  getClubInviteUrl,
  multiPlatformShare,
  generateDeterministicQRMatrix,
} from '../../lib/clubCode';
import type { ClubInviteRecord, ClubRecord, PlayerRecord } from '../../app/types';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Mail,
  MessageSquare,
  Smartphone,
  ExternalLink,
  Users,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Send,
} from 'lucide-react';

export const ClubInvitesPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [club, setClub] = useState<ClubRecord | null>(null);
  const [clubCode, setClubCode] = useState<string>('');
  const [invites, setInvites] = useState<ClubInviteRecord[]>([]);
  const [affiliatedPlayers, setAffiliatedPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // New Invite form
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviteeName, setInviteeName] = useState('');
  const [inviteRole, setInviteRole] = useState<'player' | 'coach' | 'scout' | 'trialist'>('player');
  const [notes, setNotes] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    loadClubData();
  }, [user?.uid]);

  const loadClubData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      // 1. Fetch club record
      const clubRef = doc(db, 'clubs', user.uid);
      const clubSnap = await getDoc(clubRef);
      let currentCode = '';

      if (clubSnap.exists()) {
        const data = clubSnap.data() as ClubRecord;
        setClub({ ...data, id: clubSnap.id });
        if (data.clubCode) {
          currentCode = data.clubCode;
          setClubCode(data.clubCode);
        } else {
          // Generate and save a unique code if club doesn't have one yet
          currentCode = generateClubCode(data.name || user.name);
          await updateDoc(clubRef, { clubCode: currentCode });
          setClubCode(currentCode);
        }
      } else {
        currentCode = generateClubCode(user.name);
        setClubCode(currentCode);
      }

      // 2. Fetch invites sent by this club
      const invitesQuery = query(
        collection(db, 'clubInvites'),
        where('clubId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      try {
        const invitesSnap = await getDocs(invitesQuery);
        setInvites(
          invitesSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ClubInviteRecord, 'id'>),
          }))
        );
      } catch {
        // In case index is building
        const fallbackQuery = query(collection(db, 'clubInvites'), where('clubId', '==', user.uid));
        const fallbackSnap = await getDocs(fallbackQuery);
        setInvites(
          fallbackSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ClubInviteRecord, 'id'>),
          }))
        );
      }

      // 3. Fetch players who linked with this club code
      if (currentCode) {
        const playersQuery = query(
          collection(db, 'players'),
          where('affiliatedClubCode', '==', currentCode)
        );
        const playersSnap = await getDocs(playersQuery);
        setAffiliatedPlayers(
          playersSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PlayerRecord, 'id'>),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load club invite data:', err);
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = getClubInviteUrl(clubCode, 'player');
  const clubName = club?.name || user?.name || 'Our Football Club';

  const shareContent = {
    clubName,
    clubCode,
    inviteUrl,
    role: inviteRole,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(clubCode);
    success(`Club Code ${clubCode} copied!`);
  };

  const handleSendDirectInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeEmail.trim()) {
      toastError('Please enter an email address.');
      return;
    }
    setSendingInvite(true);
    try {
      const newInvite: Omit<ClubInviteRecord, 'id'> = {
        clubId: user!.uid,
        clubName,
        clubCode,
        inviteeEmail: inviteeEmail.trim().toLowerCase(),
        inviteeName: inviteeName.trim() || undefined,
        role: inviteRole,
        channel: 'email',
        status: 'pending',
        notes: notes.trim() || undefined,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      };

      const docRef = await addDoc(collection(db, 'clubInvites'), {
        ...newInvite,
        createdAt: serverTimestamp(),
      });

      setInvites((prev) => [{ id: docRef.id, ...newInvite }, ...prev]);
      setShowSendModal(false);
      setInviteeEmail('');
      setInviteeName('');
      setNotes('');
      success(`Invitation recorded for ${inviteeEmail}!`);
    } catch (err) {
      toastError((err as Error)?.message ?? 'Failed to send invite.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await updateDoc(doc(db, 'clubInvites', inviteId), {
        status: 'revoked',
        updatedAt: serverTimestamp(),
      });
      setInvites((prev) =>
        prev.map((item) => (item.id === inviteId ? { ...item, status: 'revoked' } : item))
      );
      success('Invitation revoked.');
    } catch {
      toastError('Could not revoke invite.');
    }
  };

  const qrMatrix = generateDeterministicQRMatrix(inviteUrl, 25);

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
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Recruitment & Network</span>
            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-mono font-bold">
              MULTI-PLATFORM
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Club Management & Invites</h1>
          <p className="text-sm text-slate-400">
            Share your unique Club Code to invite footballers, coaches, and scouts across any messaging platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20"
          >
            <Send className="w-4 h-4" />
            <span>Send Direct Invite</span>
          </button>
        </div>
      </div>

      {/* Main Club Code & Share Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Unique Club Code Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-brand/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Unique Club Invitation Code
              </p>
              <div className="flex items-center gap-4">
                <span className="font-mono text-4xl sm:text-5xl font-black text-brand tracking-wider select-all">
                  {clubCode || 'GW-FC-0000'}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Copy Club Code"
                  className="p-3 rounded-2xl bg-brand/15 hover:bg-brand/25 border border-brand/30 text-brand transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Players or staff can enter this code during registration or from their dashboard to join {clubName}.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setShowQRModal(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 text-xs"
              >
                <QrCode className="w-4 h-4 text-brand" />
                <span>Show QR Code</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="bg-brand text-black font-bold px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 text-xs shadow-md shadow-brand/20 hover:bg-brand-hover"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </div>

          {/* Multi-Platform 1-Click Share Grid */}
          <div className="border-t border-white/10 pt-6 relative z-10">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-brand" />
              <span>1-Click Share via Platforms</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* WhatsApp */}
              <a
                href={multiPlatformShare.whatsapp(shareContent)}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">WhatsApp</span>
              </a>

              {/* Email */}
              <a
                href={multiPlatformShare.email(shareContent).mailto}
                className="p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Email</span>
              </a>

              {/* SMS */}
              <a
                href={multiPlatformShare.sms(shareContent)}
                className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">SMS</span>
              </a>

              {/* Twitter / X */}
              <a
                href={multiPlatformShare.twitter(shareContent)}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 text-slate-300 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <span className="text-lg font-black leading-none group-hover:scale-110 transition-transform">𝕏</span>
                <span className="text-xs font-bold">Twitter</span>
              </a>

              {/* Facebook */}
              <a
                href={multiPlatformShare.facebook(shareContent)}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Facebook</span>
              </a>

              {/* LinkedIn */}
              <a
                href={multiPlatformShare.linkedin(shareContent)}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Stats & Safeguarding Banner */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <span>Recruitment Summary</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl font-black text-white">{invites.length}</p>
                <p className="text-xs text-slate-400 mt-1">Invites Sent</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl font-black text-brand">{affiliatedPlayers.length}</p>
                <p className="text-xs text-slate-400 mt-1">Affiliated Players</p>
              </div>
            </div>
          </div>

          <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-brand font-bold text-sm mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Safeguarding Guaranteed</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When youth players join with your Club Code, their profiles remain protected until parental consent is verified by our safeguarding team.
            </p>
          </div>
        </div>
      </div>

      {/* Affiliated Players Section */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-white">Players Affiliated via Club Code</h2>
          </div>
          <span className="text-xs font-mono bg-white/5 text-slate-400 px-3 py-1 rounded-full">
            {affiliatedPlayers.length} total
          </span>
        </div>

        {affiliatedPlayers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No players have registered with your Club Code yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Share your Club Code <span className="text-brand font-mono">{clubCode}</span> with trialists and prospects!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Player Name</th>
                  <th className="px-4 py-3">Positions</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {affiliatedPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      {player.name || player.displayName || 'Anonymous Player'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {player.positions?.map((pos) => (
                          <span key={pos} className="px-2 py-0.5 rounded bg-brand/15 text-brand font-mono text-xs">
                            {pos}
                          </span>
                        )) || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">{player.region || '—'}</td>
                    <td className="px-4 py-3">Tier {player.playingLevel || 1}</td>
                    <td className="px-4 py-3">
                      {player.isYouth ? (
                        <span className="text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full text-xs font-semibold">
                          Youth
                        </span>
                      ) : (
                        <span className="text-slate-300 bg-white/5 px-2 py-0.5 rounded-full text-xs">
                          Adult
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Affiliated
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invitations History Table */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-white">Sent Invitations Tracker</h2>
          </div>
          <button
            onClick={loadClubData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {invites.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Send className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No direct invitations logged yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Use &quot;Send Direct Invite&quot; to log personalized invitations to prospects.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{inv.inviteeName || 'Prospective Member'}</div>
                      <div className="text-xs text-slate-400 font-mono">{inv.inviteeEmail || inv.inviteePhone}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{inv.role}</td>
                    <td className="px-4 py-3 uppercase text-xs font-mono">{inv.channel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          inv.status === 'accepted'
                            ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                            : inv.status === 'pending'
                            ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                            : 'text-red-400 bg-red-400/10 border border-red-400/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {inv.createdAt?.seconds
                        ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString()
                        : 'Recent'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                          title="Revoke Invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Invite Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Send Personalized Invitation</h3>
            <p className="text-xs text-slate-400 mb-4">
              Send an invite to join {clubName} with code <span className="text-brand font-mono">{clubCode}</span>.
            </p>

            <form onSubmit={handleSendDirectInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  placeholder="e.g. Leo Silva"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                >
                  <option value="player">Player</option>
                  <option value="trialist">Trialist</option>
                  <option value="coach">Coach</option>
                  <option value="scout">Scout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Personal Note (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Looked forward to your trial on Saturday"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="w-1/2 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log & Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Scan Club QR Code</h3>
            <p className="text-xs text-slate-400 mb-6">
              Players or parents can scan this at training or trial sessions to immediately claim and register.
            </p>

            {/* Standalone SVG QR Matrix */}
            <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow-xl">
              <svg width="200" height="200" viewBox="0 0 25 25" className="shape-rendering-crispEdges">
                {qrMatrix.map((row, r) =>
                  row.map((active, c) =>
                    active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#090d16" /> : null
                  )
                )}
              </svg>
            </div>

            <div className="mt-4">
              <span className="text-sm font-mono font-bold text-brand">{clubCode}</span>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
