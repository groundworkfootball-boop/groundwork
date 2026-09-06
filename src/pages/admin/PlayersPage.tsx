import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { PlayerRecord } from '../../app/types';
import { Users, ShieldCheck, ShieldAlert, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';

export const PlayersPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'players'));
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlayerRecord, 'id'>) })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSearchable = async (playerId: string, current: boolean) => {
    setActionId(playerId);
    try {
      await updateDoc(doc(db, 'players', playerId), {
        searchable: !current,
        updatedAt: serverTimestamp(),
      });
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, searchable: !current } : p))
      );
      success(`Searchable status updated.`);
    } catch {
      toastError('Could not update player visibility.');
    } finally {
      setActionId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Platform Directory</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Player Roster & Oversight</h1>
          <p className="text-sm text-slate-400">
            Inspect all registered adult and youth talent, guardian links, and search visibility states.
          </p>
        </div>
        <button
          onClick={loadPlayers}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        {players.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No player records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Player Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Consent Status</th>
                  <th className="px-4 py-3">Searchable</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{p.name || p.displayName || 'Player'}</td>
                    <td className="px-4 py-3">
                      {p.isYouth ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                          Youth Minor
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-[10px]">
                          Adult
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-brand">{p.positions?.join(', ') || 'CM'}</td>
                    <td className="px-4 py-3">{p.region || '—'}</td>
                    <td className="px-4 py-3">Tier {p.playingLevel || 5}</td>
                    <td className="px-4 py-3 capitalize">
                      {p.isYouth ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.consentStatus === 'granted'
                              ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                              : 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                          }`}
                        >
                          {p.consentStatus || 'pending'}
                        </span>
                      ) : (
                        <span className="text-slate-500">N/A (Adult)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.searchable ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold"><Eye className="w-3.5 h-3.5" /> Visible</span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Delisted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleSearchable(p.id, !!p.searchable)}
                        disabled={actionId === p.id}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-medium"
                      >
                        Toggle Visibility
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
