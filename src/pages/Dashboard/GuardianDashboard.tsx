import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserRound,
  FileCheck2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../lib/useAsync';
import { listGuardianYouth, listGuardianConsentAudits } from '../../lib/services/guardianService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Stat } from '../../components/ui/Stat';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

const CONSENT_TONE = {
  granted: 'emerald',
  pending: 'amber',
  withdrawn: 'rose',
} as const;

function formatDate(seconds?: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const GuardianDashboard = () => {
  const { user } = useAuth();

  const youth = useAsync(() => listGuardianYouth(user!.email ?? ''), [user?.email], {
    enabled: Boolean(user?.email),
  });
  const audits = useAsync(() => listGuardianConsentAudits(user!.uid), [user?.uid], {
    enabled: Boolean(user?.uid),
  });

  const loading = youth.loading || audits.loading;
  const error = youth.error || audits.error;

  const profiles = youth.data ?? [];
  const pendingCount = useMemo(
    () => profiles.filter((p) => p.consentStatus === 'pending').length,
    [profiles],
  );
  const grantedCount = useMemo(
    () => profiles.filter((p) => p.consentStatus === 'granted').length,
    [profiles],
  );
  const recentAudits = useMemo(() => (audits.data ?? []).slice(0, 6), [audits.data]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={() => { youth.reload(); audits.reload(); }} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guardian workspace"
        title="Consent & safeguarding"
        description="You control whether a youth profile is visible to clubs. Every action is recorded in an immutable audit trail."
        actions={
          <ButtonLink to="/dashboard/guardian/consent" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
            Consent centre
          </ButtonLink>
        }
      />

      {pendingCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-[13.5px] font-semibold text-amber-100">
                {pendingCount} consent {pendingCount === 1 ? 'request' : 'requests'} awaiting your decision
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-200/80">
                The youth profile stays hidden and unsearchable until you approve.
              </p>
            </div>
          </div>
          <ButtonLink to="/dashboard/guardian/consent" size="sm" variant="secondary">
            Review now
          </ButtonLink>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Linked youth"
          value={profiles.length}
          icon={<UserRound className="h-4 w-4" />}
          tone="brand"
          hint="Profiles you manage"
        />
        <Stat
          label="Consent granted"
          value={grantedCount}
          icon={<ShieldCheck className="h-4 w-4" />}
          tone="emerald"
          hint="Visible to verified clubs"
        />
        <Stat
          label="Awaiting decision"
          value={pendingCount}
          icon={<Clock className="h-4 w-4" />}
          tone={pendingCount > 0 ? 'amber' : 'emerald'}
          hint={pendingCount > 0 ? 'Action required' : 'Nothing pending'}
        />
        <Stat
          label="Audit records"
          value={audits.data?.length ?? 0}
          icon={<FileCheck2 className="h-4 w-4" />}
          tone="violet"
          hint="Immutable trail"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Youth profiles"
            description="Consent state and visibility"
            icon={<UserRound className="h-4 w-4" />}
            action={
              <Link to="/dashboard/guardian/youth-profile" className="text-[12px] font-semibold text-brand hover:underline">
                Manage
              </Link>
            }
          />
          <div className="mt-5">
            {profiles.length === 0 ? (
              <EmptyState
                compact
                icon={<UserRound className="h-6 w-6" />}
                title="No youth profiles linked"
                description="When a youth player registers with your email as guardian, their profile appears here for consent."
              />
            ) : (
              <ul className="space-y-2.5">
                {profiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-white">{profile.name ?? 'Youth player'}</p>
                      <p className="mt-0.5 text-[11.5px] text-slate-500">
                        {profile.positions?.join(' · ') || 'No positions set'}
                        {profile.region ? ` · ${profile.region}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={CONSENT_TONE[profile.consentStatus] ?? 'slate'} dot>
                        {profile.consentStatus}
                      </Badge>
                      <Badge tone={profile.searchable ? 'emerald' : 'slate'}>
                        {profile.searchable ? 'Searchable' : 'Hidden'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent consent activity"
            description="Append-only audit trail"
            icon={<FileCheck2 className="h-4 w-4" />}
          />
          <div className="mt-5">
            {recentAudits.length === 0 ? (
              <EmptyState
                compact
                icon={<FileCheck2 className="h-6 w-6" />}
                title="No consent activity"
                description="Granting or withdrawing consent creates an immutable record here."
              />
            ) : (
              <ol className="relative space-y-4 border-l border-white/[0.08] pl-4">
                {recentAudits.map((audit) => (
                  <li key={audit.id} className="relative">
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 border-ink-850 bg-brand" />
                    <p className="text-[12.5px] font-medium capitalize text-white">
                      Consent {audit.action.replace(/-/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatDate(audit.timestamp?.seconds)} · notice v{audit.privacyNoticeVersion ?? '1.0'}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="How youth visibility works"
          description="Enforced on the server, not in the interface"
          icon={<Lock className="h-4 w-4" />}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Consent pending',
              body: 'Profile is hidden. No club can read it, even with a direct database request.',
              tone: 'amber' as const,
            },
            {
              title: 'Consent granted',
              body: 'Visible only to clubs holding live youth verification. Expiry is checked on every read.',
              tone: 'emerald' as const,
            },
            {
              title: 'Consent withdrawn',
              body: 'Delisted immediately, AI processing blocked, media queued for deletion.',
              tone: 'rose' as const,
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Badge tone={item.tone} dot>
                {item.title}
              </Badge>
              <p className="mt-2.5 text-[12px] leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

