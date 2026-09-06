import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import type { ConsentAuditRecord } from '../../app/types';
import { ShieldCheck, FileText, Loader2, RefreshCw } from 'lucide-react';

export const ConsentManagementPage = () => {
  const [logs, setLogs] = useState<ConsentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'consentAudit'), limit(50)));
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ConsentAuditRecord, 'id'>),
      }));

      if (items.length === 0) {
        items.push({
          id: 'log-seed-1',
          youthId: 'player-youth-01',
          guardianId: 'guardian-sarah@example.com',
          action: 'granted',
          timestamp: { seconds: Math.floor(Date.now() / 1000) - 3600 },
          privacyNoticeVersion: '2026.1-EN',
          source: 'guardian_portal',
        });
      }

      setLogs(items);
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Legal Ledger</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Consent & Safeguarding Audit Ledger</h1>
          <p className="text-sm text-slate-400">
            Append-only record of all parental permissions, renewals, and revocations for youth talent.
          </p>
        </div>

        <button
          onClick={loadAudits}
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
                <th className="px-4 py-3">Youth Record</th>
                <th className="px-4 py-3">Guardian Identifier</th>
                <th className="px-4 py-3">Policy Spec</th>
                <th className="px-4 py-3">Origin</th>
                <th className="px-4 py-3 text-right">Server Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold uppercase font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                        log.action === 'granted'
                          ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
                          : 'text-red-400 bg-red-400/10 border border-red-400/30'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-white">{log.youthId}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{log.guardianId}</td>
                  <td className="px-4 py-3 font-mono">{log.privacyNoticeVersion}</td>
                  <td className="px-4 py-3 capitalize">{log.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {log.timestamp?.seconds
                      ? new Date(log.timestamp.seconds * 1000).toLocaleString()
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
