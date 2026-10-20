import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  FileText,
  Video,
  Bell,
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
import { Stat } from '../../components/ui/Stat';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { Progress, ScoreRing } from '../../components/ui/Progress';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
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

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={() => { player.reload(); applications.reload(); matches.reload(); }} />;

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Profile completeness"
          value={`${completeness}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone={completeness >= 80 ? 'emerald' : completeness >= 50 ? 'amber' : 'rose'}
          hint={completeness >= 80 ? 'Strong dossier' : 'Add more detail'}
        />
        <Stat
          label="Club matches"
          value={matches.data?.length ?? 0}
          icon={<Target className="h-4 w-4" />}
          tone="brand"
          hint="Precomputed results"
        />
        <Stat
          label="Active applications"
          value={activeApplications}
          icon={<FileText className="h-4 w-4" />}
          tone="sky"
          hint={`${applications.data?.length ?? 0} total`}
        />
        <Stat
          label="Unread notifications"
          value={unread}
          icon={<Bell className="h-4 w-4" />}
          tone={unread > 0 ? 'violet' : 'emerald'}
          hint={unread > 0 ? 'Needs attention' : 'All caught up'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile strength */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Dossier strength"
            description="Deterministic completeness score"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <div className="mt-6 flex flex-col items-center">
            <ScoreRing value={completeness} size={140} label="Complete" />
          </div>
          <div className="mt-6 space-y-3">
            {[
              { label: 'Profile photo', done: Boolean(record?.photoUrl) },
              { label: 'Positions set', done: Boolean(record?.positions?.length) },
              { label: 'Skill ratings', done: Boolean(record?.skillRatings && Object.keys(record.skillRatings).length > 0) },
              { label: 'Availability', done: Boolean(record?.availability?.length) },
              { label: 'Video clip', done: Boolean(record?.videoCount && record.videoCount > 0) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-slate-400">{item.label}</span>
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-600" />
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
    </div>
  );
};
