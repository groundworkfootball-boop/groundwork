import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserRound,
  FileCheck2,
  ArrowRight,
  Lock,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../lib/useAsync';
import {
  listGuardianYouth,
  listGuardianConsentAudits,
  type GuardianYouthProfile,
} from '../../lib/services/guardianService';
import { isPermissionDenied } from '../../lib/errors';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Stat } from '../../components/ui/Stat';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { RulesDeniedNotice } from '../../components/ui/RulesDeniedNotice';
import { SafeguardingIllustration } from '../../components/illustrations';

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

  const profiles = useMemo<GuardianYouthProfile[]>(() => youth.data ?? [], [youth.data]);
  const pendingCount = useMemo(
    () => profiles.filter((p) => p.consentStatus === 'pending').length,
    [profiles],
  );
  const grantedCount = useMemo(
    () => profiles.filter((p) => p.consentStatus === 'granted').length,
    [profiles],
  );
  const withdrawnCount = useMemo(
    () => profiles.filter((p) => p.consentStatus === 'withdrawn').length,
    [profiles],
  );
  const visibleCount = useMemo(() => profiles.filter((p) => p.searchable).length, [profiles]);
  const recentAudits = useMemo(() => (audits.data ?? []).slice(0, 6), [audits.data]);

  // A rules denial is a deployment-order problem, not a user error. Say so
  // plainly and keep the rest of the workspace usable.
  const youthDenied = isPermissionDenied(youth.rawError);
  const auditsDenied = isPermissionDenied(audits.rawError);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guardian workspace"
        title="Consent & safeguarding"
        description="You control whether a youth profile is visible to clubs. Every decision is written to an append-only audit trail."
        actions={
          <ButtonLink
            to="/dashboard/guardian/consent"
            size="sm"
            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Consent centre
          </ButtonLink>
        }
      />

      {pendingCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-[13.5px] font-semibold text-amber-100">
                {pendingCount} consent {pendingCount === 1 ? 'request' : 'requests'} awaiting your decision
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-200/80">
                The profile stays hidden and unsearchable until you approve it.
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
          hint="Approved by you"
        />
        <Stat
          label="Visible to clubs"
          value={visibleCount}
          icon={<Eye className="h-4 w-4" />}
          tone="sky"
          hint="Live youth-verified clubs only"
        />
        <Stat
          label="Audit records"
          value={audits.data?.length ?? 0}
          icon={<FileCheck2 className="h-4 w-4" />}
          tone="violet"
          hint="Immutable trail"
        />
      </div>

      {youthDenied && <RulesDeniedNotice title="Youth profiles are not readable yet" resource="players" />}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Youth profiles"
            description="Consent state and visibility"
            icon={<UserRound className="h-4 w-4" />}
            action={
              <Link
                to="/dashboard/guardian/youth-profile"
                className="text-[12px] font-semibold text-brand hover:underline"
              >
                Manage
              </Link>
            }
          />
          <div className="mt-5">
            {youthDenied ? (
              <EmptyState
                compact
                icon={<Lock className="h-6 w-6" />}
                title="Awaiting rules deployment"
                description="Once the current Firestore rules are live, your linked youth profiles appear here automatically."
              />
            ) : youth.error ? (
              <ErrorState
                title="Could not load youth profiles"
                description="The request failed. Check your connection and try again."
                onRetry={youth.reload}
              />
            ) : profiles.length === 0 ? (
              <EmptyState
                compact
                icon={<UserRound className="h-6 w-6" />}
                title="No youth profiles linked"
                description="When a youth registers with your email as guardian, their profile appears here for consent."
                action={
                  <ButtonLink to="/dashboard/guardian/consent" size="sm" variant="secondary">
                    Link a player
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="space-y-2.5">
                {profiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/[0.12] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-white">
                          {profile.name ?? 'Youth player'}
                        </p>
                        <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                          {profile.positions?.join(' · ') || 'No positions set'}
                          {profile.region ? ` · ${profile.region}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={CONSENT_TONE[profile.consentStatus] ?? 'slate'} dot>
                        {profile.consentStatus}
                      </Badge>
                      <Badge tone={profile.searchable ? 'emerald' : 'slate'}>
                        {profile.searchable ? (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        )}
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
            {auditsDenied ? (
              <EmptyState
                compact
                icon={<Lock className="h-6 w-6" />}
                title="Audit trail unavailable"
                description="Deploy the current ruleset to read consent history."
              />
            ) : audits.error ? (
              <ErrorState
                title="Could not load activity"
                description="The audit trail request failed."
                onRetry={audits.reload}
              />
            ) : recentAudits.length === 0 ? (
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
                      {formatDate(audit.timestamp?.seconds)} · notice v
                      {audit.privacyNoticeVersion ?? '1.0'}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="How youth visibility works"
            description="Enforced by the database, not the interface"
            icon={<Lock className="h-4 w-4" />}
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Consent pending',
                body: 'Profile is hidden. No club can read it, even with a direct database request.',
                tone: 'amber' as const,
                icon: Clock,
              },
              {
                title: 'Consent granted',
                body: 'Visible only to clubs holding live youth verification. Expiry is checked on every read.',
                tone: 'emerald' as const,
                icon: ShieldCheck,
              },
              {
                title: 'Consent withdrawn',
                body: 'Delisted immediately. AI processing stops and media is queued for deletion.',
                tone: 'rose' as const,
                icon: EyeOff,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-slate-400" />
                  <Badge tone={item.tone} dot>
                    {item.title}
                  </Badge>
                </div>
                <p className="text-[12px] leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-[12.5px] font-medium text-white">Guardian-only authority</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                  Only the guardian on record can grant or withdraw consent. Clubs cannot request it
                  directly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-[12.5px] font-medium text-white">Every change is audited</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                  Grants and withdrawals are appended to an immutable log with the privacy-notice
                  version.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="relative">
            <SafeguardingIllustration className="h-40 w-full" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
          </div>
          <div className="mt-4">
            <Badge tone="brand" dot>
              Safeguarding first
            </Badge>
            <h3 className="mt-2.5 text-[15px] font-semibold text-white">Youth data is never public</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">
              Youth profiles are excluded from search, sitemaps and AI training by default. Access
              requires consent, a verified club and a live youth verification.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to="/dashboard/guardian/youth-profile" size="sm" variant="secondary">
                Youth profile
              </ButtonLink>
              <ButtonLink to="/dashboard/guardian/settings" size="sm" variant="ghost">
                Settings
              </ButtonLink>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Need to change a decision?</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-400">
                Withdrawal takes effect immediately and is reversible. Open the consent centre to review
                each linked player.
              </p>
            </div>
          </div>
          <ButtonLink
            to="/dashboard/guardian/consent"
            size="sm"
            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Open consent centre
          </ButtonLink>
        </div>
      </Card>

      {withdrawnCount > 0 && (
        <p className="text-center text-[11.5px] text-slate-600">
          {withdrawnCount} profile{withdrawnCount === 1 ? '' : 's'} currently withdrawn and hidden from all
          clubs.
        </p>
      )}
    </div>
  );
};
