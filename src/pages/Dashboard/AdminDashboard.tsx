import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Activity,
  ArrowRight,
  Sliders,
  Lightbulb,
  DollarSign,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAsync } from '../../lib/useAsync';
import { getAdminOverview, listRecentAuditLogs } from '../../lib/services/adminService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Stat } from '../../components/ui/Stat';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

function formatRelative(seconds?: number): string {
  if (!seconds) return '—';
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const AdminDashboard = () => {
  const overview = useAsync(() => getAdminOverview(), []);
  const audits = useAsync(() => listRecentAuditLogs(8), []);

  const loading = overview.loading || audits.loading;
  const error = overview.error || audits.error;

  const stats = overview.data;
  const recentAudits = useMemo(() => audits.data ?? [], [audits.data]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={() => { overview.reload(); audits.reload(); }} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Platform operations"
        description="Verification queues, safeguarding, moderation and system health."
        actions={
          <>
            <ButtonLink to="/dashboard/admin/matching-config" variant="secondary" size="sm" iconLeft={<Sliders className="h-3.5 w-3.5" />}>
              Matching config
            </ButtonLink>
            <ButtonLink to="/dashboard/admin/youth-verification" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Review queue
            </ButtonLink>
          </>
        }
      />

      {(stats?.pendingVerifications ?? 0) > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-[13.5px] font-semibold text-amber-100">
                {stats?.pendingVerifications} verification {stats?.pendingVerifications === 1 ? 'request' : 'requests'} pending
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-200/80">
                Youth verification requires safeguarding documentation review before approval.
              </p>
            </div>
          </div>
          <ButtonLink to="/dashboard/admin/clubs" size="sm" variant="secondary">
            Open queue
          </ButtonLink>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total players"
          value={stats?.totalPlayers ?? 0}
          icon={<Users className="h-4 w-4" />}
          tone="brand"
          hint={`${stats?.adultPlayers ?? 0} adult · ${stats?.youthPlayers ?? 0} youth`}
        />
        <Stat
          label="Clubs"
          value={stats?.totalClubs ?? 0}
          icon={<Building2 className="h-4 w-4" />}
          tone="sky"
          hint={`${stats?.verifiedClubs ?? 0} verified`}
        />
        <Stat
          label="Pending verification"
          value={stats?.pendingVerifications ?? 0}
          icon={<ShieldCheck className="h-4 w-4" />}
          tone={(stats?.pendingVerifications ?? 0) > 0 ? 'amber' : 'emerald'}
          hint="Awaiting review"
        />
        <Stat
          label="Open reports"
          value={stats?.openReports ?? 0}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone={(stats?.openReports ?? 0) > 0 ? 'rose' : 'emerald'}
          hint="Moderation queue"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Applications"
          value={stats?.totalApplications ?? 0}
          icon={<FileText className="h-4 w-4" />}
          tone="violet"
          hint="All time"
        />
        <Stat
          label="Active subscriptions"
          value={stats?.activeSubscriptions ?? 0}
          icon={<DollarSign className="h-4 w-4" />}
          tone="emerald"
          hint="Stripe-authoritative"
        />
        <Stat
          label="AI calls (30d)"
          value={stats?.aiCalls30d ?? 0}
          icon={<Lightbulb className="h-4 w-4" />}
          tone="amber"
          hint="Advisory only"
        />
        <Stat
          label="GDPR requests"
          value={stats?.openGdprRequests ?? 0}
          icon={<Lock className="h-4 w-4" />}
          tone={(stats?.openGdprRequests ?? 0) > 0 ? 'amber' : 'emerald'}
          hint="Pending processing"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent audit activity"
            description="Append-only — written by Cloud Functions only"
            icon={<Activity className="h-4 w-4" />}
            action={
              <Link to="/dashboard/audit-logs" className="text-[12px] font-semibold text-brand hover:underline">
                Full trail
              </Link>
            }
          />
          <div className="mt-5">
            {recentAudits.length === 0 ? (
              <EmptyState
                compact
                icon={<Activity className="h-6 w-6" />}
                title="No audit activity yet"
                description="Administrative actions, verification decisions and consent changes appear here."
              />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {recentAudits.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-white">
                        {String(entry.action ?? 'action').replace(/_/g, ' ')}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {entry.actorRole ? `${entry.actorRole} · ` : ''}
                        {entry.resourceType ?? 'resource'}
                        {entry.resourceId ? ` · ${String(entry.resourceId).slice(0, 12)}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-600">
                      {formatRelative(entry.timestamp?.seconds)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Operational queues"
            description="Where attention is needed"
            icon={<Clock className="h-4 w-4" />}
          />
          <div className="mt-5 space-y-2.5">
            {[
              {
                to: '/dashboard/admin/clubs',
                label: 'Club verification',
                count: stats?.pendingVerifications ?? 0,
                tone: 'amber' as const,
              },
              {
                to: '/dashboard/admin/youth-verification',
                label: 'Youth verification',
                count: stats?.pendingYouthVerifications ?? 0,
                tone: 'rose' as const,
              },
              {
                to: '/dashboard/admin/moderation',
                label: 'Moderation reports',
                count: stats?.openReports ?? 0,
                tone: 'violet' as const,
              },
              {
                to: '/dashboard/admin/gdpr',
                label: 'GDPR requests',
                count: stats?.openGdprRequests ?? 0,
                tone: 'sky' as const,
              },
            ].map((queue) => (
              <Link
                key={queue.to}
                to={queue.to}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <span className="text-[12.5px] font-medium text-white">{queue.label}</span>
                <Badge tone={queue.count > 0 ? queue.tone : 'slate'}>{queue.count}</Badge>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-3.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <p className="text-[12px] font-semibold text-emerald-200">Safeguarding enforced</p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-emerald-200/70">
              Youth reads require live club verification, granted consent and searchable state — checked in rules and
              functions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
