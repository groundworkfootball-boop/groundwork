import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, limit, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import type { ModerationReportRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const STATUS_TONE = {
  pending: 'amber',
  investigating: 'sky',
  resolved: 'emerald',
  dismissed: 'slate',
} as const;

function formatRelative(seconds?: number): string {
  if (!seconds) return '—';
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const ModerationPage = () => {
  const { success, error: toastError } = useToast();

  const [reports, setReports] = useState<ModerationReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'moderationReports'), limit(100)));
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<ModerationReportRecord, 'id'>),
      }));
      rows.sort((a, b) => {
        const aTime = (a as { createdAt?: { seconds: number } }).createdAt?.seconds ?? 0;
        const bTime = (b as { createdAt?: { seconds: number } }).createdAt?.seconds ?? 0;
        return bTime - aTime;
      });
      setReports(rows);
    } catch (err) {
      console.error(err);
      setError('We could not load the moderation queue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (reportId: string, status: ModerationReportRecord['status']) => {
    setProcessingId(reportId);
    try {
      await updateDoc(doc(db, 'moderationReports', reportId), {
        status,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      success(`Report marked ${status}.`);
      await load();
    } catch (err) {
      console.error(err);
      toastError('Could not update this report.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter(
      (report) =>
        (report.reason ?? '').toLowerCase().includes(term) ||
        (report.targetType ?? '').toLowerCase().includes(term) ||
        (report.targetId ?? '').toLowerCase().includes(term),
    );
  }, [reports, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Trust & safety" title="Moderation queue" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  const open = reports.filter((r) => r.status === 'pending' || r.status === 'investigating');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & safety"
        title="Moderation queue"
        description="Reports raised by players, guardians and clubs. Every action is audited."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Open reports</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{open.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Resolved</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">
            {reports.filter((r) => r.status === 'resolved').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{reports.length}</p>
        </Card>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Search by reason, target type or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
          aria-label="Search reports"
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="No reports in the queue"
          description={
            search
              ? 'No report matches that search.'
              : 'Reports submitted by users will appear here for review.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <Card key={report.id} padding="md">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[report.status] ?? 'slate'} dot>
                      {report.status}
                    </Badge>
                    <Badge tone="slate">{report.targetType}</Badge>
                    <span className="font-mono text-[10.5px] text-slate-600">{report.targetId}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white">{report.reason}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    Reported by {report.reporterId?.slice(0, 12) ?? 'unknown'}
                    {(report as { createdAt?: { seconds: number } }).createdAt?.seconds
                      ? ` · ${formatRelative((report as { createdAt?: { seconds: number } }).createdAt?.seconds)}`
                      : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {report.status !== 'investigating' && report.status !== 'resolved' && report.status !== 'dismissed' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setStatus(report.id, 'investigating')}
                      loading={processingId === report.id}
                    >
                      Investigate
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => setStatus(report.id, 'resolved')}
                    disabled={processingId === report.id || report.status === 'resolved'}
                    iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(report.id, 'dismissed')}
                    disabled={processingId === report.id || report.status === 'dismissed'}
                    iconLeft={<XCircle className="h-3.5 w-3.5" />}
                  >
                    Dismiss
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
