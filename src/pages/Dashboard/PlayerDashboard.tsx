import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  FileText,
  Video,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../lib/useAsync';
import { getPlayerRecord, listPlayerApplications, listPlayerNotifications } from '../../lib/services/playerService';
import { listPlayerMatches } from '../../lib/services/matchingService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { Progress, ScoreRing } from '../../components/ui/Progress';
import { MetricStrip } from '../../components/ui/ScorePanel';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { RulesDeniedNotice } from '../../components/ui/RulesDeniedNotice';
import { isPermissionDenied } from '../../lib/errors';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { cn } from '../../components/ui/cn';

const STATUS_TONE: Record<string, 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate'> = {
  submitted: 'sky',
  viewed: 'amber',
  shortlisted: 'violet',
  trial_invited: 'brand',
  accepted: 'emerald',
  rejected: 'rose',
  withdrawn: 'slate',
  draft: 'slate',
};

function formatRelative(seconds?: number): string {
  if (!seconds) return '—';
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(seconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const PlayerDashboard = () => {
  const { user } = useAuth();

  const player = useAsync(() => getPlayerRecord(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });
  const applications = useAsync(() => listPlayerApplications(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });
  const matches = useAsync(() => listPlayerMatches(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });
  const notifications = useAsync(() => listPlayerNotifications(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });

  const loading = player.loading || applications.loading || matches.loading;
  const error = player.error || applications.error || matches.error;
  const deniedResources = [
    isPermissionDenied(player.rawError) ? 'players' : null,
    isPermissionDenied(matches.rawError) ? 'matchResults' : null,
    isPermissionDenied(applications.rawError) ? 'applications' : null,
  ].filter((value): value is string => Boolean(value));
  const denied = deniedResources.length > 0;

  const record = player.data;
  const completeness = record?.profileCompleteness ?? record?.profileComplete ?? 0;
  const isYouth = record?.isYouth === true;
  const consentPending = isYouth && record?.consentStatus !== 'granted';

  const topMatches = useMemo(() => (matches.data ?? []).slice(0, 5), [matches.data]);
  const recentApplications = useMemo(() => (applications.data ?? []).slice(0, 5), [applications.data]);
  const unread = useMemo(
    () => (notifications.data ?? []).filter((n) => n.read === false).length,
    [notifications.data],
  );

  const activeApplications = useMemo(
    () =>
      (applications.data ?? []).filter((a) =>
        ['submitted', 'viewed', 'shortlisted', 'trial_invited'].includes(String(a.status)),
      ).length,
    [applications.data],
  );

  const recentNotifications = useMemo(() => (notifications.data ?? []).slice(0, 5), [notifications.data]);

  // The engine exposes its six weighted dimensions; surfacing the top match's
  // breakdown is what makes the score auditable rather than a black box.
  const topBreakdown = useMemo(() => {
    const best = topMatches[0];
    const breakdown = best?.scoreBreakdown;
    if (!best || !breakdown) return null;
    const rows: { label: string; value: number }[] = [
      { label: 'Position', value: breakdown.positionMatch },
      { label: 'Distance', value: breakdown.distanceMatch },
      { label: 'Level', value: breakdown.levelMatch },
      { label: 'Attributes', value: breakdown.attributesMatch },
      { label: 'Availability', value: breakdown.availabilityMatch },
      { label: 'Boost', value: breakdown.boostMatch },
    ].filter((row) => typeof row.value === 'number');
    if (rows.length === 0) return null;
    return { clubName: best.clubName ?? 'Top match', rows };
  }, [topMatches]);

  if (loading) return <DashboardSkeleton />;
  if (error && !denied) {
    return <ErrorState onRetry={() => { player.reload(); applications.reload(); matches.reload(); }} />;
  }

  const firstName = (record?.name ?? user?.name ?? 'Player').split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Player workspace"
        title={`Welcome back, ${firstName}`}
        description="Your dossier, live match results and application pipeline in one place."
        actions={
          <>
            <ButtonLink to="/dashboard/player/profile-builder" variant="secondary" size="sm" iconLeft={<Sparkles className="h-3.5 w-3.5" />}>
              Complete profile
            </ButtonLink>
            <ButtonLink to="/dashboard/opportunities" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Find opportunities
            </ButtonLink>
          </>
        }
      />

      {denied && (
        <RulesDeniedNotice
          title="Some panels need the current security rules"
          resource={deniedResources.join(', ')}
        />
      )}

      {consentPending && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-[13.5px] font-semibold text-amber-100">Guardian consent required</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-200/80">
                Your profile is hidden from club search until your guardian approves the consent request.
              </p>
            </div>
          </div>
          <ButtonLink to="/dashboard/guardian/consent" size="sm" variant="secondary">
            View consent status
          </ButtonLink>
        </div>
      )}

      {/* Stats */}
      <MetricStrip
        items={[
          {
            label: 'Completeness',
            value: `${completeness}%`,
            tone: completeness >= 80 ? 'emerald' : completeness >= 50 ? 'amber' : 'rose',
            hint: completeness >= 80 ? 'Strong dossier' : 'Add more detail',
          },
          { label: 'Club matches', value: matches.data?.length ?? 0, tone: 'brand', hint: 'Precomputed' },
          {
            label: 'Active apps',
            value: activeApplications,
            tone: 'sky',
            hint: `${applications.data?.length ?? 0} total`,
          },
          {
            label: 'Unread',
            value: unread,
            tone: unread > 0 ? 'amber' : 'emerald',
            hint: unread > 0 ? 'Needs attention' : 'All caught up',
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile strength */}
        <Card className="lg:col-span-1">
          <CardHeader
            eyebrow="Dossier"
            title="Completeness"
            description="Deterministic score — no AI involved"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <div className="mt-6 flex flex-col items-center">
            <ScoreRing value={completeness} size={132} label="Complete" />
          </div>
          <div className="mt-6 space-y-2.5">
            {[
              { label: 'Profile photo', done: Boolean(record?.photoUrl) },
              { label: 'Positions set', done: Boolean(record?.positions?.length) },
              { label: 'Skill ratings', done: Boolean(record?.skillRatings && Object.keys(record.skillRatings).length > 0) },
              { label: 'Availability', done: Boolean(record?.availability?.length) },
              { label: 'Video clip', done: Boolean(record?.videoCount && record.videoCount > 0) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-slate-400">{item.label}</span>
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-slate-600" />
                )}
              </div>
            ))}
          </div>
          <ButtonLink
            to="/dashboard/player/profile-builder"
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-5"
          >
            Improve dossier
          </ButtonLink>
        </Card>

        {/* Top matches */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Top club matches"
            description="Ranked by the deterministic engine — not by AI"
            icon={<Target className="h-4 w-4" />}
            action={
              <Link to="/dashboard/opportunities" className="text-[12px] font-semibold text-brand hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-5">
            {topMatches.length === 0 ? (
              <EmptyState
                compact
                icon={<Target className="h-6 w-6" />}
                title="No match results yet"
                description="Complete your dossier and the engine will score you against every club requirement."
                action={
                  <ButtonLink to="/dashboard/player/profile-builder" size="sm">
                    Complete profile
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {topMatches.map((match) => {
                  const pct = Math.round((match.matchScore ?? 0) * 100);
                  return (
                    <li key={match.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10">
                        <span className="gw-numeric text-[13px] font-bold text-brand">{pct}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-white">
                          {match.clubName ?? 'Club'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-500">
                          {match.position ? <span>{match.position}</span> : null}
                          {match.region ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.region}
                            </span>
                          ) : null}
                          {match.configVersion ? <span>config v{match.configVersion}</span> : null}
                        </p>
                      </div>
                      <div className="hidden w-28 sm:block">
                        <Progress value={pct} size="sm" tone={pct >= 80 ? 'emerald' : pct >= 60 ? 'brand' : 'amber'} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Applications */}
        <Card>
          <CardHeader
            title="Recent applications"
            description="Your live recruitment pipeline"
            icon={<FileText className="h-4 w-4" />}
            action={
              <Link to="/dashboard/applications" className="text-[12px] font-semibold text-brand hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-5">
            {recentApplications.length === 0 ? (
              <EmptyState
                compact
                icon={<FileText className="h-6 w-6" />}
                title="No applications yet"
                description="Apply to an opportunity and track every status change here."
                action={
                  <ButtonLink to="/dashboard/opportunities" size="sm">
                    Browse opportunities
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="space-y-2.5">
                {recentApplications.map((application) => (
                  <li
                    key={application.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-white">
                        {application.opportunityTitle ?? application.clubName ?? 'Application'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatRelative(application.createdAt?.seconds)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[String(application.status)] ?? 'slate'}>
                      {String(application.status ?? 'submitted').replace(/_/g, ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader
            title="Next steps"
            description="Actions that move your profile forward"
            icon={<Zap className="h-4 w-4" />}
          />
          <div className="mt-5 space-y-2.5">
            {[
              {
                to: '/dashboard/videos',
                icon: Video,
                title: 'Upload a match clip',
                body: 'Video-verified profiles get reviewed faster.',
                tone: 'violet' as const,
              },
              {
                to: '/dashboard/recommendations',
                icon: Sparkles,
                title: 'Review AI suggestions',
                body: 'Advisory tips based only on your own data.',
                tone: 'brand' as const,
              },
              {
                to: '/dashboard/subscription',
                icon: Zap,
                title: 'Boost visibility',
                body: 'One documented 5% dimension — nothing more.',
                tone: 'amber' as const,
              },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                    action.tone === 'violet' && 'border-violet-400/25 bg-violet-400/10 text-violet-300',
                    action.tone === 'brand' && 'border-brand/25 bg-brand/10 text-brand',
                    action.tone === 'amber' && 'border-amber-400/25 bg-amber-400/10 text-amber-300',
                  )}
                >
                  <action.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white">{action.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{action.body}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Score explainer — makes the deterministic engine auditable */}
        <Card>
          <CardHeader
            eyebrow="Explainable"
            title="Why you matched"
            description="The six weighted dimensions behind your top score"
            icon={<TrendingUp className="h-4 w-4" />}
            action={
              topBreakdown ? (
                <Link
                  to="/dashboard/notifications"
                  className="text-[12px] font-semibold text-brand hover:underline"
                >
                  Full breakdown
                </Link>
              ) : undefined
            }
          />
          <div className="mt-5">
            {topBreakdown === null ? (
              <EmptyState
                compact
                icon={<TrendingUp className="h-6 w-6" />}
                title="No score breakdown yet"
                description="Once the engine has scored you against a club, the weighted dimensions appear here."
              />
            ) : (
              <>
                <p className="mb-4 text-[12px] text-slate-500">
                  Top result: <span className="font-medium text-slate-300">{topBreakdown.clubName}</span>
                </p>
                <div className="space-y-3">
                  {topBreakdown.rows.map((row) => {
                    const pct = Math.round(row.value * 100);
                    return (
                      <div key={row.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="text-[12px] text-slate-400">{row.label}</span>
                          <span className="gw-numeric text-[11.5px] font-semibold text-slate-300">{pct}%</span>
                        </div>
                        <Progress
                          value={pct}
                          size="sm"
                          tone={pct >= 80 ? 'emerald' : pct >= 55 ? 'brand' : 'amber'}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                  Computed server-side from your saved profile. AI may narrate these numbers, never
                  change them.
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Notifications — previously fetched but never shown */}
        <Card>
          <CardHeader
            title="Notifications"
            description={unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'Status changes across your pipeline'}
            icon={<Clock className="h-4 w-4" />}
            action={
              <Link to="/dashboard/notifications" className="text-[12px] font-semibold text-brand hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-5">
            {recentNotifications.length === 0 ? (
              <EmptyState
                compact
                icon={<Clock className="h-6 w-6" />}
                title="Nothing to catch up on"
                description="Application updates, shortlists and trial invitations will land here."
              />
            ) : (
              <ul className="space-y-2.5">
                {recentNotifications.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      'rounded-xl border px-3.5 py-3 transition-colors',
                      item.read === false
                        ? 'border-brand/20 bg-brand/[0.04]'
                        : 'border-white/[0.07] bg-white/[0.02]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-white">
                        {item.title ?? 'Update'}
                      </p>
                      <span className="gw-mono shrink-0 text-slate-600">
                        {formatRelative(item.createdAt?.seconds)}
                      </span>
                    </div>
                    {item.body ? (
                      <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{item.body}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
