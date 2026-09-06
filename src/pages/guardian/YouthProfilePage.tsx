import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { PlayerRecord } from '../../app/types';
import { UserRound, Save, Loader2 } from 'lucide-react';

export const YouthProfilePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [youthId, setYouthId] = useState<string>('');
  const [name, setName] = useState('Alex Johnson');
  const [positions, setPositions] = useState<string>('LW, RW');
  const [playingLevel, setPlayingLevel] = useState<number>(5);
  const [bio, setBio] = useState('');
  const [consentStatus, setConsentStatus] = useState('pending');

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'players'), where('guardianEmail', '==', user.email));
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
          setYouthId('demo-youth');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (youthId && youthId !== 'demo-youth') {
        await updateDoc(doc(db, 'players', youthId), {
          name,
          positions: positions.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean),
          playingLevel: Number(playingLevel),
          bio,
          updatedAt: serverTimestamp(),
        });
      }
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
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Parental Oversight</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Youth Player Profile</h1>
        <p className="text-sm text-slate-400">
          Supervise and edit football details on behalf of your dependent child under UK Safeguarding rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserRound className="w-5 h-5 text-brand" />
              <span>{name}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Dependent Youth Footballer</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
              consentStatus === 'granted'
                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
            }`}
          >
            {consentStatus}
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Player Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Positions (Comma-separated)</label>
          <input
            type="text"
            value={positions}
            onChange={(e) => setPositions(e.target.value)}
            placeholder="e.g. LW, RW, CAM"
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Playing Level / Competitive Tier (1-10)</label>
          <input
            type="number"
            min={1}
            max={10}
            value={playingLevel}
            onChange={(e) => setPlayingLevel(Number(e.target.value))}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Player Bio & Academy Ambition</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Describe your child's playing background, current grassroots club, and preferred trial schedule..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand hover:bg-brand-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
};
