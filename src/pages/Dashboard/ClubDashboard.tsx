import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Star,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Search,
  CalendarCheck,
  Lightbulb,
  Building2,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../lib/useAsync';
import {
  getClubRecord,
  listClubApplications,
  listClubMatches,
  listClubOpportunities,
} from '../../lib/services/clubService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Stat } from '../../components/ui/Stat';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

const STATUS_TONE: Record<string, 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate'> = {
  submitted: 'sky',
  viewed: 'amber',
  shortlisted: 'violet',
  trial_invited: 'brand',
  accepted: 'emerald',
  rejected: 'rose',
  withdrawn: 'slate',
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

export const ClubDashboard = () => {
  const { user } = useAuth();

  const club = useAsync(() => getClubRecord(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });
  const matches = useAsync(() => listClubMatches(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });
  const applications = useAsync(() => listClubApplications(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });
  const opportunities = useAsync(() => listClubOpportunities(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });

  const loading = club.loading || matches.loading || applications.loading;
  const error = club.error || matches.error || applications.error;

  const record = club.data;
  const verifiedAdult = record?.verifiedAdult === true;
  const verifiedYouth = record?.verifiedYouth === true;
  const verificationStatus = record?.verificationStatus ?? 'pending';

  const topMatches = useMemo(() => (matches.data ?? []).slice(0, 6), [matches.data]);
  const recentApplications = useMemo(() => (applications.data ?? []).slice(0, 5), [applications.data]);
  const activeOpportunities = useMemo(
    () => (opportunities.data ?? []).filter((o) => o.status === 'active').length,
    [opportunities.data],
  );
  const pendingApplications = useMemo(
    () => (applications.data ?? []).filter((a) => a.status === 'submitted' || a.status === 'viewed').length,
    [applications.data],
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={() => { club.reload(); matches.reload(); applications.reload(); }} />;

  const clubName = record?.name ?? user?.name ?? 'Your club';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recruitment workspace"
        title={clubName}
        description="Precomputed match results, live applications and verification status."
        actions={
          <>
            <ButtonLink to="/dashboard/search" variant="secondary" size="sm" iconLeft={<Search className="h-3.5 w-3.5" />}>
              Search players
            </ButtonLink>
            <ButtonLink to="/dashboard/club/squad-gaps" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Squad gap analysis
            </ButtonLink>
          </>
        }
      />

      {/* Verification banner */}
      {!verifiedAdult && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-[13.5px] font-semibold text-amber-100">
                {verificationStatus === 'pending' ? 'Verification not submitted' : `Verification ${verificationStatus.replace(/_/g, ' ')}`}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-200/80">
                Adult recruitment unlocks once an administrator approves your club documents. Youth recruitment
                additionally requires safeguarding certification.
              </p>
            </div>
          </div>
          <ButtonLink to="/dashboard/club/verification" size="sm" variant="secondary">
            Submit verification
          </ButtonLink>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Matched players"
          value={matches.data?.length ?? 0}
          icon={<Users className="h-4 w-4" />}
          tone="brand"
          hint="Precomputed results"
        />
        <Stat
          label="Pending applications"
          value={pendingApplications}
          icon={<FileText className="h-4 w-4" />}
          tone={pendingApplications > 0 ? 'amber' : 'emerald'}
          hint={`${applications.data?.length ?? 0} total`}
        />
        <Stat
          label="Live opportunities"
          value={activeOpportunities}
          icon={<CalendarCheck className="h-4 w-4" />}
          tone="sky"
          hint={`${opportunities.data?.length ?? 0} published`}
        />
        <Stat
          label="Youth access"
          value={verifiedYouth ? 'Granted' : 'Locked'}
          icon={<ShieldCheck className="h-4 w-4" />}
          tone={verifiedYouth ? 'emerald' : 'rose'}
          hint={verifiedYouth ? 'Verification live' : 'Requires approval'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Verification card */}
        <Card>
          <CardHeader
            title="Verification"
            description="Required before recruiting"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-medium text-white">Adult recruitment</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Club identity documents</p>
              </div>
              {verifiedAdult ? (
                <Badge tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>Verified</Badge>
              ) : (
                <Badge tone="amber" icon={<AlertCircle className="h-3 w-3" />}>Pending</Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-medium text-white">Youth recruitment</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Safeguarding certification</p>
              </div>
              {verifiedYouth ? (
                <Badge tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>Verified</Badge>
              ) : (
                <Badge tone="rose" icon={<ShieldAlert className="h-3 w-3" />}>Locked</Badge>
              )}
            </div>
          </div>
          <ButtonLink to="/dashboard/club/verification" variant="secondary" size="sm" fullWidth className="mt-4">
            Manage verification
          </ButtonLink>
        </Card>

        {/* Top matches */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Highest-scoring players"
            description="Deterministic engine output for your requirements"
            icon={<TrendingUp className="h-4 w-4" />}
            action={
              <Link to="/dashboard/search" className="text-[12px] font-semibold text-brand hover:underline">
                Open search
              </Link>
            }
          />
          <div className="mt-5">
            {topMatches.length === 0 ? (
              <EmptyState
                compact
                icon={<Users className="h-6 w-6" />}
                title="No match results yet"
                description="Set your target positions and playing levels, then the engine will score every eligible player."
                action={
                  <ButtonLink to="/dashboard/club/profile" size="sm">
                    Set requirements
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
                          {match.playerName ?? match.playerSnapshot?.displayName ?? 'Player'}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
                          {match.position ? <span>{match.position}</span> : null}
                          {match.ageBand ? <span>{match.ageBand}</span> : null}
                          {match.region ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.region}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="hidden w-28 sm:block">
                        <Progress value={pct} size="sm" tone={pct >= 80 ? 'emerald' : pct >= 60 ? 'brand' : 'amber'} />
                      </div>
                      <Link
                        to={`/dashboard/club/player/${match.playerId}`}
                        className="shrink-0 rounded-lg border border-white/[0.10] px-2.5 py-1.5 text-[11.5px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
                      >
                        View
                      </Link>
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
            description="Candidates who applied to your opportunities"
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
                description="Publish an opportunity and applications will appear here in real time."
                action={
                  <ButtonLink to="/dashboard/club/profile" size="sm">
                    Publish opportunity
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
                        {application.playerName ?? 'Player'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatRelative(application.createdAt?.seconds)}
                        {application.opportunityTitle ? ` · ${application.opportunityTitle}` : ''}
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
            title="Recruitment actions"
            description="Everything scoped to your club"
            icon={<Building2 className="h-4 w-4" />}
          />
          <div className="mt-5 space-y-2.5">
            {[
              {
                to: '/dashboard/shortlist',
                icon: Star,
                title: 'Manage shortlists',
                body: 'Private notes stay private — never shown to players.',
                tone: 'violet' as const,
              },
              {
                to: '/dashboard/trial-manager',
                icon: CalendarCheck,
                title: 'Schedule a trial',
                body: 'Invite shortlisted players and send reminders.',
                tone: 'sky' as const,
              },
              {
                to: '/dashboard/club/squad-gaps',
                icon: Lightbulb,
                title: 'Run squad gap analysis',
                body: 'AI identifies the need; the engine finds the players.',
                tone: 'brand' as const,
              },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <span
                  className={
                    action.tone === 'violet'
                      ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-400/10 text-violet-300'
                      : action.tone === 'sky'
                        ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300'
                        : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/25 bg-brand/10 text-brand'
                  }
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

