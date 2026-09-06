import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, limit } from 'firebase/firestore';
import type { ModerationReportRecord } from '../../app/types';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export const ModerationPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [reports, setReports] = useState<ModerationReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'moderationReports'), limit(50)));
      let list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ModerationReportRecord, 'id'>),
      }));

      if (list.length === 0) {
        list = [
          {
            id: 'mod-seed-1',
            reporterId: 'user-scout-99',
            targetId: 'club-opportunity-84',
            targetType: 'club',
            reason: 'Suspicious compensation claim in youth trial description.',
            status: 'pending',
          },
          {
            id: 'mod-seed-2',
            reporterId: 'guardian-parent-12',
            targetId: 'video-clip-40',
            targetType: 'video',
            reason: 'Third-party copyright music dispute.',
            status: 'pending',
          },
        ];
      }

      setReports(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    setProcessingId(id);
    try {
      if (!id.startsWith('mod-seed-')) {
        await updateDoc(doc(db, 'moderationReports', id), {
          status,
          updatedAt: serverTimestamp(),
        });
      }
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      success(`Report marked as ${status}.`);
    } catch {
      toastError('Failed to resolve report.');
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
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Platform Integrity</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Content Moderation Desk</h1>
          <p className="text-sm text-slate-400">
            Review reported listings, video clips, user communications, and safeguarding flags.
          </p>
        </div>
        <button
          onClick={loadReports}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Reported Entity</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason / Flag</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Moderator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{r.targetId}</td>
                  <td className="px-4 py-3 capitalize font-bold text-slate-400">{r.targetType}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-md">{r.reason}</td>
                  <td className="px-4 py-3 capitalize">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'resolved'
                          ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                          : r.status === 'dismissed'
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
                          onClick={() => handleResolve(r.id, 'resolved')}
                          disabled={processingId === r.id}
                          className="px-2.5 py-1 rounded bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand font-bold text-[11px] transition-all"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleResolve(r.id, 'dismissed')}
                          disabled={processingId === r.id}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-[11px] transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Processed</span>
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
