import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { ConsentAuditRecord } from '../../app/types';
import { Loader2, RefreshCw, FileCheck2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConsentHistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ConsentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email && !user?.uid) return;
    loadHistory();
  }, [user?.email, user?.uid]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Query consent audit trail for this guardian
      const q = query(
        collection(db, 'consentAudit'),
        where('guardianId', 'in', [user?.uid, user?.email].filter(Boolean)),
        limit(50),
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ConsentAuditRecord, 'id'>),
      }));

      // Sort client-side by timestamp if multiple criteria
      items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

      setHistory(items);
    } catch (err) {
      console.warn('Consent audit history load:', err);
    } finally {
      setLoading(false);
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Compliance Audit</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              Append-Only Ledger
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Consent Audit History</h1>
          <p className="text-sm text-slate-400">
            Immutable statutory ledger of all parental consent declarations, renewals, and revocations.
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl border border-white/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Consent Audit Entries Recorded</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              When you grant or withdraw recruitment consent for your child, statutory audit logs are written immutably to this ledger.
            </p>
            <Link
              to="/dashboard/guardian/consent"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-brand-hover transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Visit Consent Center</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Statutory Action</th>
                  <th className="px-4 py-3">Player Record ID</th>
                  <th className="px-4 py-3">Privacy Policy</th>
                  <th className="px-4 py-3">Source Channel</th>
                  <th className="px-4 py-3 text-right">Recorded Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold uppercase font-sans">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                          entry.action === 'granted'
                            ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                            : 'text-red-400 bg-red-400/10 border border-red-400/30'
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white truncate max-w-[140px]">{entry.youthId}</td>
                    <td className="px-4 py-3 text-slate-400">{entry.privacyNoticeVersion || '2026.1-EN'}</td>
                    <td className="px-4 py-3 capitalize font-sans">{entry.source?.replace('_', ' ') || 'Consent Portal'}</td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">
                      {entry.timestamp?.seconds
                        ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
                        : 'Recorded'}
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
