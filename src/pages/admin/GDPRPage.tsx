import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, limit, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, RefreshCw, Search, Download, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/firebase';
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
      setError('We could not load GDPR requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (requestId: string, status: GDPRRequestRecord['status']) => {
    setProcessingId(requestId);
    try {
      await updateDoc(doc(db, 'gdprRequests', requestId), {
        status,
        processedAt: status === 'completed' ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      success(`Request marked ${status}.`);
      await load();
    } catch (err) {
      console.error(err);
      toastError('Could not update this request.');
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
        description="Data export and erasure requests. Consent audit records are retained under statutory obligation."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Open requests</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{pending.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Completed</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">
            {requests.filter((r) => r.status === 'completed').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{requests.length}</p>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
        <div>
          <p className="text-[13px] font-semibold text-sky-100">Retention policy</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sky-200/80">
            Erasure removes discoverable personal data. Consent audit records and financial transaction records are
            retained for the statutory period and are never deleted by this workflow.
          </p>
        </div>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Search by email, user ID or request type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
          aria-label="Search GDPR requests"
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="No GDPR requests"
          description={
            search
              ? 'No request matches that search.'
              : 'Export and deletion requests submitted by users will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <Card key={row.id} padding="md">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={row.type === 'delete' ? 'rose' : 'sky'} icon={row.type === 'delete' ? <Trash2 className="h-3 w-3" /> : <Download className="h-3 w-3" />}>
                      {row.type}
                    </Badge>
                    <Badge tone={STATUS_TONE[row.status] ?? 'slate'} dot>
                      {row.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-white">{row.userEmail ?? row.userId ?? '—'}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    Requested {(row as { createdAt?: { seconds: number } }).createdAt?.seconds
                      ? formatDate((row as { createdAt?: { seconds: number } }).createdAt?.seconds)
                      : '—'}
                    {row.processedAt?.seconds ? ` · processed ${formatDate(row.processedAt.seconds)}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {row.status === 'pending' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setStatus(row.id, 'processing')}
                      loading={processingId === row.id}
                    >
                      Start processing
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => setStatus(row.id, 'completed')}
                    disabled={processingId === row.id || row.status === 'completed'}
                    iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(row.id, 'rejected')}
                    disabled={processingId === row.id || row.status === 'rejected'}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
