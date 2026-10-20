import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { FileCheck2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/firebase';
import type { ConsentAuditRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const ACTION_TONE = {
  granted: 'emerald',
  're-granted': 'emerald',
  withdrawn: 'rose',
} as const;

function formatDate(seconds?: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ConsentManagementPage = () => {
  const [logs, setLogs] = useState<ConsentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'consentAudits'), limit(200)));
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<ConsentAuditRecord, 'id'>),
      }));
      rows.sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));
      setLogs(rows);
    } catch (err) {
      console.error(err);
      setError('We could not load the consent audit trail. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter(
      (log) =>
        (log.youthId ?? '').toLowerCase().includes(term) ||
        (log.guardianId ?? '').toLowerCase().includes(term) ||
        (log.action ?? '').toLowerCase().includes(term),
    );
  }, [logs, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Safeguarding" title="Consent audit trail" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  const granted = logs.filter((l) => l.action === 'granted' || l.action === 're-granted').length;
  const withdrawn = logs.filter((l) => l.action === 'withdrawn').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safeguarding"
        title="Consent audit trail"
        description="Append-only and immutable. Written exclusively by Cloud Functions."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total records</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{logs.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Grants</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">{granted}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Withdrawals</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-rose-300">{withdrawn}</p>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-[13px] font-semibold text-emerald-100">Immutable by design</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-200/80">
            No client can create, update or delete these records. They are retained under statutory safeguarding
            obligations even when a GDPR erasure request is fulfilled.
          </p>
        </div>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Search by youth ID, guardian ID or action"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
          aria-label="Search consent records"
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="h-6 w-6" />}
          title="No consent records"
          description={
            search
              ? 'No record matches that search.'
              : 'Consent grants and withdrawals will appear here as guardians act.'
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Action</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Youth</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Guardian</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Notice</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <Badge tone={ACTION_TONE[log.action] ?? 'slate'} dot>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.youthId?.slice(0, 14) ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.guardianId?.slice(0, 14) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-500">
                      v{log.privacyNoticeVersion ?? '1.0'}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-500">
                      {formatDate(log.timestamp?.seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

