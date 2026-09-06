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
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import type { SquadMemberRecord } from '../../app/types';
import { Users, Plus, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SquadPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [members, setMembers] = useState<SquadMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New squad member form
  const [name, setName] = useState('');
  const [position, setPosition] = useState('CM');
  const [squadNumber, setSquadNumber] = useState(10);
  const [age, setAge] = useState(21);
  const [status, setStatus] = useState<'active' | 'injured' | 'trialist' | 'reserve'>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    loadSquad();
  }, [user?.uid]);

  const loadSquad = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'squadMembers'), where('clubId', '==', user!.uid));
      const snap = await getDocs(q);
      setMembers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SquadMemberRecord, 'id'>) })));
    } catch (err) {
      console.error('Failed to load squad:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Please enter player name.');
      return;
    }
    setSaving(true);
    try {
      const newMember: Omit<SquadMemberRecord, 'id'> = {
        clubId: user!.uid,
        name: name.trim(),
        position,
        squadNumber: Number(squadNumber),
        age: Number(age),
        status,
        joinedAt: { seconds: Math.floor(Date.now() / 1000) },
      };

      const docRef = await addDoc(collection(db, 'squadMembers'), {
        ...newMember,
        joinedAt: serverTimestamp(),
      });

      setMembers((prev) => [{ id: docRef.id, ...newMember }, ...prev]);
      setShowModal(false);
      setName('');
      success(`${name} added to squad!`);
    } catch (err) {
      toastError((err as Error)?.message ?? 'Failed to add squad member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'squadMembers', id));
      setMembers((prev) => prev.filter((m) => m.id !== id));
      success('Player removed from squad.');
    } catch {
      toastError('Could not remove member.');
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Roster Management</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Club Squad & Depth</h1>
          <p className="text-sm text-slate-400">
            Manage registered players, squad numbers, and provide structured depth for AI Gap Analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/club/squad-gaps"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4 text-brand" />
            <span>AI Gap Analysis</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <span>Current Roster ({members.length})</span>
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No squad players registered yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Add your current roster or invite players using your Club Code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Player Name</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand">#{m.squadNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{m.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand font-mono text-xs font-bold">
                        {m.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.age || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          m.status === 'active'
                            ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                            : m.status === 'injured'
                            ? 'text-red-400 bg-red-400/10 border border-red-400/30'
                            : 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                        title="Remove player"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Squad Player</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Player Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Harry Kane"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="GK">GK</option>
                    <option value="CB">CB</option>
                    <option value="LB">LB</option>
                    <option value="RB">RB</option>
                    <option value="CDM">CDM</option>
                    <option value="CM">CM</option>
                    <option value="CAM">CAM</option>
                    <option value="LW">LW</option>
                    <option value="RW">RW</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Squad Number</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={squadNumber}
                    onChange={(e) => setSquadNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    min={14}
                    max={45}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="active">Active</option>
                    <option value="injured">Injured</option>
                    <option value="trialist">Trialist</option>
                    <option value="reserve">Reserve</option>
                  </select>
                </div>
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
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
