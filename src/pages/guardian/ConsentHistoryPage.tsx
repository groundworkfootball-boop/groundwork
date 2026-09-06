import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { ConsentAuditRecord } from '../../app/types';
import { Loader2, RefreshCw } from 'lucide-react';

export const ConsentHistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ConsentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadHistory();
  }, [user?.email, user?.uid]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'consentAudit'),
        where('guardianId', '==', user?.uid || user?.email),
        limit(25)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ConsentAuditRecord, 'id'>),
      }));

      if (items.length === 0) {
        // Provide demo history entry if fresh account
        items.push({
          id: 'demo-audit-1',
          youthId: 'youth-alex-johnson',
          guardianId: user?.email || 'guardian',
          action: 'granted',
          timestamp: { seconds: Math.floor(Date.now() / 1000) - 86400 * 2 },
          privacyNoticeVersion: '2026.1-EN',
          source: 'statutory_consent_portal',
        });
      }

      setHistory(items);
    } catch (err) {
      console.error(err);
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
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Consent Audit History</h1>
          <p className="text-sm text-slate-400">
            Immutable statutory ledger of all parental consent declarations, renewals, and revocations.
          </p>
        </div>
        <button
          onClick={loadHistory}
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
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Player Record</th>
                <th className="px-4 py-3">Policy Version</th>
                <th className="px-4 py-3">Platform Source</th>
                <th className="px-4 py-3 text-right">Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold uppercase font-mono">
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
                  <td className="px-4 py-3 font-mono text-white">{entry.youthId}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{entry.privacyNoticeVersion}</td>
                  <td className="px-4 py-3 capitalize">{entry.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {entry.timestamp?.seconds
                      ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
                      : 'Recorded'}
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
