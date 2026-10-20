import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Target,
  MapPin,
  ArrowRight,
  Send,
  Info,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { useAsync } from '../lib/useAsync';
import { listPlayerMatches } from '../lib/services/matchingService';
import { listOpenOpportunities, submitApplication } from '../lib/services/playerService';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Progress } from '../components/ui/Progress';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';

const BREAKDOWN_LABELS: Array<{ key: keyof NonNullable<MatchResultRecord['scoreBreakdown']>; label: string; weight: string }> = [
  { key: 'positionMatch', label: 'Position compatibility', weight: '30%' },
  { key: 'levelMatch', label: 'Playing level', weight: '20%' },
  { key: 'attributesMatch', label: 'Attributes', weight: '20%' },
  { key: 'distanceMatch', label: 'Distance / region', weight: '15%' },
  { key: 'availabilityMatch', label: 'Availability overlap', weight: '10%' },
  { key: 'boostMatch', label: 'Active boost', weight: '5%' },
];

import type { MatchResultRecord } from '../app/types';

export const Opportunities = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const matches = useAsync(() => listPlayerMatches(user!.uid, 50), [user?.uid], { enabled: Boolean(user?.uid) });
  const opportunities = useAsync(() => listOpenOpportunities(50), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'newest'>('match');
  const [breakdownFor, setBreakdownFor] = useState<MatchResultRecord | null>(null);

  const [applyingTo, setApplyingTo] = useState<{ id: string; title: string; clubId: string } | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loading = matches.loading || opportunities.loading;
  const error = matches.error || opportunities.error;

  const positions = useMemo(() => {
    const set = new Set<string>();
    (matches.data ?? []).forEach((m) => {
      if (m.position) set.add(m.position);
    });
    return Array.from(set).sort();
  }, [matches.data]);

  const filteredMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = (matches.data ?? []).filter((match) => {
      if (positionFilter && match.position !== positionFilter) return false;
      if (!term) return true;
      return (
        (match.clubName ?? '').toLowerCase().includes(term) ||
        (match.region ?? '').toLowerCase().includes(term) ||
        (match.position ?? '').toLowerCase().includes(term)
      );
    });
    if (sortBy === 'match') {
      return [...list].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }
    return [...list].sort((a, b) => (b.scoredAt?.seconds ?? 0) - (a.scoredAt?.seconds ?? 0));
  }, [matches.data, searchTerm, positionFilter, sortBy]);

  const handleApply = async () => {
    if (!applyingTo || !user?.uid) return;
    setSubmitting(true);
    try {
      await submitApplication({
        playerId: user.uid,
        clubId: applyingTo.clubId,
        opportunityId: applyingTo.id,
        opportunityTitle: applyingTo.title,
        message: applyMessage.trim(),
      });
      success('Application submitted. You will be notified of any status change.');
      setApplyingTo(null);
      setApplyMessage('');
    } catch (err) {
      console.error(err);
      toastError('We could not submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Opportunities" title="Your matched opportunities" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} rows={3} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState onRetry={() => { matches.reload(); opportunities.reload(); }} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Opportunities"
        title="Your matched opportunities"
        description="Ranked by the deterministic engine using your dossier and each club's live requirements."
        actions={
          <ButtonLink to="/dashboard/player/profile-builder" variant="secondary" size="sm">
            Improve dossier
          </ButtonLink>
        }
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search club, region or position"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconLeft={<Search className="h-4 w-4" />}
              aria-label="Search matches"
            />
          </div>
          <div className="sm:w-44">
            <Select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              aria-label="Filter by position"
            >
              <option value="">All positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'newest')}
              aria-label="Sort results"
            >
              <option value="match">Sort: match score</option>
              <option value="newest">Sort: most recent</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Match results */}
      {filteredMatches.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No match results yet"
          description="The engine scores you against every club requirement once your dossier has positions, level, region and availability."
          action={
            <ButtonLink to="/dashboard/player/profile-builder" size="sm">
              Complete your dossier
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMatches.map((match) => {
            const pct = Math.round((match.matchScore ?? 0) * 100);
            return (
              <Card key={match.id} variant="interactive" padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04]">
                        <Building2 className="h-4 w-4 text-slate-400" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-white">
                          {match.clubName ?? 'Club'}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
                          {match.position ? <span>{match.position}</span> : null}
                          {match.region ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.region}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="gw-numeric text-[22px] font-bold leading-none text-brand">{pct}%</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Match
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress value={pct} size="sm" tone={pct >= 80 ? 'emerald' : pct >= 60 ? 'brand' : 'amber'} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakdownFor(match)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Score breakdown
                  </button>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/club/player/${match.playerId}`}
                      className="hidden rounded-lg border border-white/[0.10] px-2.5 py-1.5 text-[11.5px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] sm:block"
                    >
                      View club
                    </Link>
                    <Button
                      size="sm"
                      onClick={() =>
                        setApplyingTo({
                          id: match.id,
                          title: match.clubName ?? 'Club opportunity',
                          clubId: match.clubId,
                        })
                      }
                      iconLeft={<Send className="h-3.5 w-3.5" />}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Open opportunities */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">Open opportunities</h2>
          <Badge tone="slate">{opportunities.data?.length ?? 0} live</Badge>
        </div>
        {(opportunities.data ?? []).length === 0 ? (
          <EmptyState
            compact
            icon={<Filter className="h-6 w-6" />}
            title="No open opportunities"
            description="Clubs publish trials and recruitment requests here. Check back soon."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(opportunities.data ?? []).slice(0, 9).map((opportunity) => (
              <Card key={opportunity.id} padding="sm" variant="interactive">
                <p className="text-[13px] font-semibold text-white">{opportunity.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
                  {opportunity.clubName ? <span>{opportunity.clubName}</span> : null}
                  {opportunity.position ? <span>· {opportunity.position}</span> : null}
                  {opportunity.region ? <span>· {opportunity.region}</span> : null}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-slate-600">
                    <Clock className="h-3 w-3" />
                    {opportunity.createdAt?.seconds
                      ? new Date(opportunity.createdAt.seconds * 1000).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Open'}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setApplyingTo({
                        id: opportunity.id,
                        title: opportunity.title,
                        clubId: opportunity.clubId,
                      })
                    }
                  >
                    Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Breakdown modal */}
      <Modal
        open={Boolean(breakdownFor)}
        onClose={() => setBreakdownFor(null)}
        title="Score breakdown"
        description="Every dimension is computed by the deterministic engine. AI never contributes."
        size="md"
      >
        {breakdownFor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-white">{breakdownFor.clubName ?? 'Club'}</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500">
                  Config v{breakdownFor.configVersion ?? 1}
                  {breakdownFor.scoredAt?.seconds
                    ? ` · scored ${new Date(breakdownFor.scoredAt.seconds * 1000).toLocaleDateString('en-GB')}`
                    : ''}
                </p>
              </div>
              <p className="gw-numeric text-[24px] font-bold text-brand">
                {Math.round((breakdownFor.matchScore ?? 0) * 100)}%
              </p>
            </div>

            <div className="space-y-3">
              {BREAKDOWN_LABELS.map((row) => {
                const raw = breakdownFor.scoreBreakdown?.[row.key] ?? 0;
                const contribution = Math.round(raw * 100);
                return (
                  <div key={String(row.key)}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="text-slate-300">
                        {row.label} <span className="text-slate-600">({row.weight})</span>
                      </span>
                      <span className="gw-numeric font-semibold text-white">{contribution}%</span>
                    </div>
                    <Progress value={contribution} size="sm" tone={contribution >= 20 ? 'emerald' : 'brand'} />
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-[11.5px] leading-relaxed text-slate-400">
                Contributions are the weighted points earned per dimension. They sum to the final score, clamped
                between 0 and 1.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Apply modal */}
      <Modal
        open={Boolean(applyingTo)}
        onClose={() => setApplyingTo(null)}
        title="Submit application"
        description={applyingTo?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplyingTo(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleApply} loading={submitting} iconRight={<ArrowRight className="h-4 w-4" />}>
              Submit application
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="apply-message" className="mb-1.5 block text-[13px] font-medium text-slate-300">
              Message to the club <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="apply-message"
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              rows={4}
              maxLength={800}
              placeholder="Introduce yourself and explain why you fit this opportunity."
              className="w-full resize-y rounded-xl border border-white/[0.10] bg-ink-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <p className="mt-1 text-[11px] text-slate-600">{applyMessage.length}/800 characters</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-[11.5px] leading-relaxed text-slate-400">
              Your dossier and approved videos are shared with this club. Private notes are never visible to you, and
              your contact details are only released if the club shortlists you.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

