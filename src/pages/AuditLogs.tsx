import { useEffect, useState } from 'react';
import { FileText, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, type DocumentSnapshot } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  timestamp?: { seconds: number };
  metadata?: Record<string, unknown>;
}

const PAGE_SIZE = 20;

function formatTimestamp(ts?: { seconds: number }): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_COLORS: Record<string, string> = {
  login: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  club_approved: 'text-brand bg-brand/10 border-brand/30',
  club_rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
  user_disabled: 'text-red-400 bg-red-400/10 border-red-400/30',
  config_updated: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  consent_granted: 'text-green-400 bg-green-400/10 border-green-400/30',
  consent_withdrawn: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async (after?: DocumentSnapshot) => {
    setLoading(true);
    setFetchError(null);
    try {
      const q = after
        ? query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), startAfter(after), limit(PAGE_SIZE))
        : query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(PAGE_SIZE));

      const snap = await getDocs(q);
      const newLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEntry));

      setLogs((prev) => (after ? [...prev, ...newLogs] : newLogs));
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Audit logs error:', err);
      setFetchError('Failed to load audit logs. Admin permissions may be required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      l.action?.toLowerCase().includes(term) ||
      l.actorId?.toLowerCase().includes(term) ||
      l.targetId?.toLowerCase().includes(term) ||
      l.targetType?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <FileText className="w-7 h-7 text-brand" />
            <span>Audit Logs</span>
          </h3>
          <p className="text-text-secondary text-sm mt-1">Immutable record of system actions. Append-only.</p>
        </div>
        <button
          onClick={() => loadLogs()}
          className="flex items-center space-x-2 px-4 py-2 border border-dark-border text-text-secondary rounded-lg hover:border-brand/50 hover:text-brand transition-colors text-sm font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by action, actor, or target..."
          className="w-full bg-dark-surface border border-dark-border rounded-lg px-9 py-2.5 text-sm focus:outline-none focus:border-brand"
        />
      </div>

      {loading && logs.length === 0 && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      )}

      {!loading && fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm">{fetchError}</p>
            <p className="text-red-400/70 text-xs mt-1">
              Firestore rules must allow admin users to read the <code>auditLogs</code> collection.
            </p>
          </div>
        </div>
      )}

      {!loading && !fetchError && filtered.length === 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
          <h4 className="text-lg font-bold mb-2">No audit log entries</h4>
          <p className="text-text-secondary text-sm">
            {searchTerm ? 'No entries match your filter.' : 'Admin actions will be recorded here as they occur.'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/50">
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Action</th>
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Actor</th>
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Target</th>
                  <th className="text-right text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-bg/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest ${ACTION_COLORS[log.action] ?? 'text-text-secondary border-dark-border bg-transparent'}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{log.actorId ?? '—'}</p>
                        {log.actorRole && (
                          <p className="text-xs text-text-secondary capitalize">{log.actorRole}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.targetType || log.targetId ? (
                        <div>
                          <p className="text-sm font-medium">{log.targetType ?? '—'}</p>
                          {log.targetId && (
                            <p className="text-xs text-text-secondary font-mono">{log.targetId.slice(0, 12)}…</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-text-secondary whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="p-4 border-t border-dark-border text-center">
              <button
                onClick={() => lastDoc && loadLogs(lastDoc)}
                disabled={loading}
                className="px-6 py-2 border border-dark-border text-text-secondary font-bold text-sm rounded hover:border-brand/50 hover:text-brand transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Load More</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
