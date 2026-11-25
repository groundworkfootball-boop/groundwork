import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ShieldCheck, RefreshCw, Search, Download, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import type { GDPRRequestRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const STATUS_TONE = {
  pending: 'amber',
  processing: 'sky',
  completed: 'emerald',
  rejected: 'rose',
} as const;

function formatDate(seconds?: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const GDPRPage = () => {
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState<GDPRRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'gdprRequests'), limit(100)));
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<GDPRRequestRecord, 'id'>),
      }));
      rows.sort((a, b) => {
        const aTime = (a as { createdAt?: { seconds: number } }).createdAt?.seconds ?? 0;
        const bTime = (b as { createdAt?: { seconds: number } }).createdAt?.seconds ?? 0;
        return bTime - aTime;
      });
      setRequests(rows);
    } catch (err) {
      console.error(err);
      setError('We could not load GDPR requests. Compliance admin claims are required.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const processRequest = async (requestId: string, decision: 'completed' | 'rejected') => {
    setProcessingId(requestId);
    try {
      const callable = httpsCallable<
        { requestId: string; decision: 'completed' | 'rejected'; reason?: string },
        { ok: boolean; status: string }
      >(functions, 'adminProcessGdprRequest');

      await callable({
        requestId,
        decision,
        reason: decision === 'rejected' ? 'Retained under statutory safeguarding/audit policy.' : undefined,
      });
      success(
        decision === 'completed'
          ? 'GDPR workflow executed server-side and recorded in auditLogs.'
          : 'GDPR request rejected with audit entry.',
      );
      await load();
    } catch (err) {
      console.error(err);
      toastError((err as { message?: string })?.message ?? 'Could not process this GDPR request.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(
      (row) =>
        (row.userEmail ?? '').toLowerCase().includes(term) ||
        (row.userId ?? '').toLowerCase().includes(term) ||
        (row.type ?? '').toLowerCase().includes(term),
    );
  }, [requests, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Compliance" title="GDPR requests" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  const pending = requests.filter((r) => r.status === 'pending' || r.status === 'processing');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="GDPR requests"
        description="Server-executed data export and erasure workflows. Statutory consentAudits and auditLogs are always preserved."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total requests</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{requests.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Open queue</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{pending.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Completed</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">
            {requests.filter((r) => r.status === 'completed').length}
          </p>
        </Card>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Search by user email, UID or type (export / delete)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="No GDPR requests"
          description="Data export and deletion requests filed by users appear here."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">User</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Requested</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-white">{req.userEmail ?? req.userId}</p>
                      <p className="text-[11px] text-slate-500">{req.userId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={req.type === 'delete' ? 'rose' : 'sky'}>
                        {req.type === 'delete' ? (
                          <span className="inline-flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> Erasure
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Download className="h-3 w-3" /> Export
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {formatDate((req as { createdAt?: { seconds: number } }).createdAt?.seconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[req.status] ?? 'slate'} dot>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'pending' || req.status === 'processing' ? (
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            loading={processingId === req.id}
                            onClick={() => processRequest(req.id, 'completed')}
                            iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Execute
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={processingId === req.id}
                            onClick={() => processRequest(req.id, 'rejected')}
                            iconLeft={<XCircle className="h-3.5 w-3.5" />}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-slate-500">Processed</span>
                      )}
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
