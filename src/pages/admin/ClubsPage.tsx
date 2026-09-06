import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { ClubRecord } from '../../app/types';
import { Building2, ShieldCheck, ShieldAlert, Check, X, Loader2, RefreshCw } from 'lucide-react';

export const ClubsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [clubs, setClubs] = useState<ClubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'clubs'));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClubRecord, 'id'>) }));
      setClubs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVerification = async (clubId: string, status: 'approved' | 'rejected' | 'suspended', verifyYouth: boolean) => {
    setActionId(clubId);
    try {
      await updateDoc(doc(db, 'clubs', clubId), {
        verificationStatus: status,
        verifiedAdult: status === 'approved',
        verifiedYouth: status === 'approved' && verifyYouth,
        updatedAt: serverTimestamp(),
      });
      setClubs((prev) =>
        prev.map((c) =>
          c.id === clubId
            ? {
                ...c,
                verificationStatus: status,
                verifiedAdult: status === 'approved',
                verifiedYouth: status === 'approved' && verifyYouth,
              }
            : c
        )
      );
      success(`Club status updated to ${status.toUpperCase()}.`);
    } catch {
      toastError('Could not update club verification.');
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
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Club Management & Approvals</h1>
          <p className="text-sm text-slate-400">
            Review registered clubs, inspect safeguarding documentation, and issue recruitment permissions.
          </p>
        </div>
        <button
          onClick={loadClubs}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        {clubs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No club profiles registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Club Name</th>
                  <th className="px-4 py-3">Unique Code</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Adult Verified</th>
                  <th className="px-4 py-3">Youth Verified</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clubs.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{c.name || 'Unnamed Club'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-brand">{c.clubCode || '—'}</td>
                    <td className="px-4 py-3">{c.region || '—'}</td>
                    <td className="px-4 py-3">
                      {c.verifiedAdult ? (
                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.verifiedYouth ? (
                        <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Authorized</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize font-bold">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                          c.verificationStatus === 'approved'
                            ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                            : c.verificationStatus === 'rejected'
                            ? 'text-red-400 bg-red-400/10 border border-red-400/30'
                            : 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                        }`}
                      >
                        {c.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateVerification(c.id, 'approved', true)}
                          disabled={actionId === c.id}
                          className="px-2.5 py-1 rounded bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand font-bold text-[11px] transition-all"
                          title="Approve Adult & Youth"
                        >
                          Approve All
                        </button>
                        <button
                          onClick={() => handleUpdateVerification(c.id, 'rejected', false)}
                          disabled={actionId === c.id}
                          className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[11px] transition-all"
                        >
                          Reject
                        </button>
                      </div>
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
