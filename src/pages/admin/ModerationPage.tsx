import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import type { ModerationReportRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const STATUS_TONE = {
  pending: 'amber',
  investigating: 'sky',
  resolved: 'emerald',
  dismissed: 'slate',
} as const;

type EnforcementAction = 'none' | 'hide_player' | 'hide_video' | 'suspend_user' | 'suspend_club';

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
  const [actions, setActions] = useState<Record<string, EnforcementAction>>({});

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
      setError('We could not load the moderation queue. Moderator claims are required.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewReport = async (
    reportId: string,
    status: 'investigating' | 'resolved' | 'dismissed',
  ) => {
    setProcessingId(reportId);
    const actionTaken = status === 'resolved' ? actions[reportId] ?? 'none' : 'none';
    try {
      const callable = httpsCallable<
        {
          reportId: string;
          status: 'investigating' | 'resolved' | 'dismissed';
          actionTaken?: EnforcementAction;
        },
        { ok: boolean }
      >(functions, 'adminModerateReport');
      await callable({ reportId, status, actionTaken });
      success(`Report marked ${status}${actionTaken !== 'none' ? ` (${actionTaken.replace(/_/g, ' ')})` : ''}.`);
      await load();
    } catch (err) {
      console.error(err);
      toastError((err as { message?: string })?.message ?? 'Could not review this report.');
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
        description="Reports raised by players, guardians and clubs. Enforcement executes server-side with an immutable audit entry."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total reports</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{reports.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Open queue</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{open.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Resolved</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">
            {reports.filter((r) => r.status === 'resolved').length}
          </p>
        </Card>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Filter by reason, target type or target ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="Moderation queue is clear"
          description="No open reports match your filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const isOpen = report.status === 'pending' || report.status === 'investigating';
            return (
              <Card key={report.id} padding="md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[report.status] ?? 'slate'} dot>
                        {report.status}
                      </Badge>
                      <Badge tone="slate">{report.targetType}</Badge>
                      <span className="gw-mono text-slate-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatRelative((report as { createdAt?: { seconds: number } }).createdAt?.seconds)}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] font-semibold text-white">{report.reason}</p>
                    <p className="mt-1 text-[12px] text-slate-400">Target ID: {report.targetId}</p>
                  </div>

                  {isOpen ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-44">
                        <Select
                          value={actions[report.id] ?? 'none'}
                          onChange={(e) =>
                            setActions((prev) => ({
                              ...prev,
                              [report.id]: e.target.value as EnforcementAction,
                            }))
                          }
                          aria-label="Enforcement action"
                        >
                          <option value="none">No target action</option>
                          <option value="hide_player">Hide player profile</option>
                          <option value="hide_video">Unpublish video</option>
                          <option value="suspend_user">Suspend user account</option>
                          <option value="suspend_club">Suspend club</option>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processingId === report.id}
                        onClick={() => reviewReport(report.id, 'investigating')}
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        loading={processingId === report.id}
                        onClick={() => reviewReport(report.id, 'resolved')}
                        iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processingId === report.id}
                        onClick={() => reviewReport(report.id, 'dismissed')}
                        iconLeft={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
