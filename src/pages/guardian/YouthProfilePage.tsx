import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { PlayerRecord } from '../../app/types';
import { UserRound, Save, Loader2, Lock, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const YouthProfilePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [youthId, setYouthId] = useState<string>('');
  const [name, setName] = useState('');
  const [positions, setPositions] = useState<string>('LW, RW');
  const [playingLevel, setPlayingLevel] = useState<number>(5);
  const [bio, setBio] = useState('');
  const [consentStatus, setConsentStatus] = useState('pending');

  // Linking state
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadProfile();
  }, [user?.email]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'players'), where('guardianEmail', '==', user?.email || ''));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data() as PlayerRecord;
        setYouthId(d.id);
        setName(data.name || 'Youth Player');
        setPositions(data.positions?.join(', ') || 'LW, RW');
        setPlayingLevel(data.playingLevel || 5);
        setBio(data.bio || '');
        setConsentStatus(data.consentStatus || 'pending');
      } else {
        setYouthId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childEmail.trim() || !user?.email) return;
    setLinking(true);
    try {
      const q = query(
        collection(db, 'players'),
        where('email', '==', childEmail.trim().toLowerCase()),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toastError(`No player account found with email "${childEmail}".`);
        return;
      }
      const pDoc = snap.docs[0];
      await updateDoc(doc(db, 'players', pDoc.id), {
        guardianEmail: user.email,
        guardianId: user.uid,
        guardianName: user.name,
        isYouth: true,
        updatedAt: serverTimestamp(),
      });

      success('Linked youth player successfully!');
      setChildEmail('');
      setShowLinkForm(false);
      await loadProfile();
    } catch {
      toastError('Failed to link youth account.');
    } finally {
      setLinking(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youthId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'players', youthId), {
        name,
        positions: positions.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean),
        playingLevel: Number(playingLevel),
        bio,
        updatedAt: serverTimestamp(),
      });
      success('Youth player profile updated successfully.');
    } catch {
      toastError('Could not save youth profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-brand font-bold text-xs uppercase tracking-widest">
            Parental Oversight
          </span>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-1">
            Youth Player Dossier
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain and audit your ward's public athletic attributes, playing positions, and bio.
          </p>
        </div>

        {!youthId && (
          <button
            onClick={() => setShowLinkForm((p) => !p)}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2 self-start"
          >
            <UserPlus className="w-4 h-4 text-brand" />
            <span>Link Child's Account</span>
          </button>
        )}
      </div>

      {showLinkForm && (
        <form
          onSubmit={handleLinkChild}
          className="p-6 bg-slate-900 border border-brand/30 rounded-3xl space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Link Child's Registered Player Account
          </h3>
          <p className="text-xs text-slate-400">
            Enter the email address your child used when registering their player account on Groundwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={childEmail}
              onChange={(e) => setChildEmail(e.target.value)}
              placeholder="child.player@example.com"
              className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand"
              required
            />
            <button
              type="submit"
              disabled={linking}
              className="px-6 py-2.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Link Account</span>
            </button>
          </div>
        </form>
      )}

      {!youthId ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-12 text-center">
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Youth Player Profile Linked</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            There is currently no minor player associated with your guardian email ({user?.email}).
          </p>
          <button
            onClick={() => setShowLinkForm(true)}
            className="px-6 py-2.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-hover transition-all"
          >
            Link Player Account
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center font-black">
                  <UserRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-400">ID: {youthId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        consentStatus === 'granted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      Consent: {consentStatus}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard/guardian/consent"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-brand" />
                <span>Consent Settings</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Player Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Primary Positions (comma-separated)
                </label>
                <input
                  type="text"
                  value={positions}
                  onChange={(e) => setPositions(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand"
                  placeholder="e.g. LW, RW, CAM"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Playing Level / Pathway Tier
                </label>
                <span className="text-xs font-mono font-bold text-brand">Tier {playingLevel} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={playingLevel}
                onChange={(e) => setPlayingLevel(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Scouting Bio & Athletic Background
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-xs focus:outline-none focus:border-brand resize-none"
                placeholder="Share your child's grassroots club history, key match achievements, and aspirations..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.25)] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes to Profile</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
