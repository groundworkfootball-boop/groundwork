import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, limit } from 'firebase/firestore';
import type { GDPRRequestRecord } from '../../app/types';
import { Lock, Download, Trash2, CheckCircle2, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';

export const GDPRPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState<GDPRRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'gdprRequests'), limit(50)));
      let list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GDPRRequestRecord, 'id'>),
      }));

      if (list.length === 0) {
        list = [
          {
            id: 'gdpr-seed-1',
            userId: 'usr_player_401',
            userEmail: 'player401@example.com',
            type: 'export',
            status: 'pending',
          },
          {
            id: 'gdpr-seed-2',
            userId: 'usr_retired_88',
            userEmail: 'retired88@example.com',
            type: 'delete',
            status: 'pending',
          },
        ];
      }

      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, status: 'completed' | 'rejected') => {
    setProcessingId(id);
    try {
      if (!id.startsWith('gdpr-seed-')) {
        await updateDoc(doc(db, 'gdprRequests', id), {
          status,
          processedAt: serverTimestamp(),
        });
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      success(`GDPR request marked as ${status}.`);
    } catch {
      toastError('Could not update request.');
    } finally {
      setProcessingId(null);
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
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Privacy & Governance</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">GDPR & Statutory Data Requests</h1>
          <p className="text-sm text-slate-400">
            Process personal data exports and Right to be Forgotten requests with child protection retention rules.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white">Statutory Child Protection Exemption (Section 45)</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            When processing account deletions, discoverable personal profiles and videos are immediately purged, but immutable guardian consent audit logs are legally retained under UK Working Together to Safeguard Children guidelines.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">User Identifier</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Request Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Compliance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{r.userId}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{r.userEmail}</td>
                  <td className="px-4 py-3 uppercase font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        r.type === 'delete'
                          ? 'text-red-400 bg-red-400/10 border border-red-400/30'
                          : 'text-blue-400 bg-blue-400/10 border border-blue-400/30'
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'completed'
                          ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                          : r.status === 'rejected'
                          ? 'text-slate-400 bg-white/5 border border-white/10'
                          : 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleProcess(r.id, 'completed')}
                          disabled={processingId === r.id}
                          className="px-2.5 py-1 rounded bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand font-bold text-[11px] transition-all"
                        >
                          Mark Processed
                        </button>
                        <button
                          onClick={() => handleProcess(r.id, 'rejected')}
                          disabled={processingId === r.id}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-[11px] transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
