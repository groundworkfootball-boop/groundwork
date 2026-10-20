import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { Building2, ShieldCheck, Check, X, RefreshCw } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import type { ClubRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const STATUS_TONE = {
  approved: 'emerald',
  pending: 'amber',
  under_review: 'sky',
  rejected: 'rose',
  expired: 'slate',
  suspended: 'rose',
} as const;

export const ClubsPage = () => {
  const { success, error: toastError } = useToast();

  const [clubs, setClubs] = useState<ClubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, 'clubs'));
      const list = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<ClubRecord, 'id'>),
      }));
      list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
      setClubs(list);
    } catch (err) {
      console.error(err);
      setError('We could not load clubs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  const review = async (
    clubId: string,
    decision: 'approved' | 'rejected',
    grantYouth: boolean,
  ) => {
    setActionId(clubId);
    try {
      // Server writes verification state, enqueues match recalculation and
      // writes an immutable audit record.
      const callable = httpsCallable<
        {
          clubId: string;
          decision: 'approved' | 'rejected';
          grantYouthVerification?: boolean;
          youthVerificationExpiresAtMs?: number;
        },
        { ok: boolean }
      >(functions, 'adminReviewClubVerification');

      await callable({
        clubId,
        decision,
        grantYouthVerification: decision === 'approved' && grantYouth,
        youthVerificationExpiresAtMs:
          decision === 'approved' && grantYouth ? Date.now() + 365 * 24 * 60 * 60 * 1000 : undefined,
      });

      success(`Club ${decision}.`);
      await loadClubs();
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'Could not update club verification.';
      toastError(message);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Administration" title="Club verification" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={loadClubs} />;

  const pending = clubs.filter((c) => c.verificationStatus === 'pending' || c.verificationStatus === 'under_review');
  const reviewed = clubs.filter((c) => c.verificationStatus !== 'pending' && c.verificationStatus !== 'under_review');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Club verification"
        description="Approve adult recruitment and grant time-limited youth verification. Every decision is audited."
        actions={
          <Button variant="secondary" size="sm" onClick={loadClubs} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total clubs</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{clubs.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Awaiting review</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{pending.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Youth verified</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">
            {clubs.filter((c) => c.verifiedYouth).length}
          </p>
        </Card>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-[14px] font-semibold text-white">Awaiting review</h2>
          <div className="space-y-3">
            {pending.map((club) => (
              <Card key={club.id} padding="md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04]">
                      <Building2 className="h-4.5 w-4.5 text-slate-400" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-white">{club.name ?? 'Unnamed club'}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
                        {club.region ? <span>{club.region}</span> : null}
                        {club.league ? <span>· {club.league}</span> : null}
                        {club.clubCode ? <span>· {club.clubCode}</span> : null}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone={STATUS_TONE[club.verificationStatus ?? 'pending'] ?? 'slate'} dot>
                          {(club.verificationStatus ?? 'pending').replace(/_/g, ' ')}
                        </Badge>
                        {club.verifiedAdult ? <Badge tone="emerald">Adult verified</Badge> : null}
                        {club.verifiedYouth ? <Badge tone="emerald">Youth verified</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => review(club.id, 'approved', false)}
                      loading={actionId === club.id}
                      iconLeft={<Check className="h-3.5 w-3.5" />}
                    >
                      Approve adult
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review(club.id, 'approved', true)}
                      disabled={actionId === club.id}
                      iconLeft={<ShieldCheck className="h-3.5 w-3.5" />}
                    >
                      Approve + youth
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => review(club.id, 'rejected', false)}
                      disabled={actionId === club.id}
                      iconLeft={<X className="h-3.5 w-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-[14px] font-semibold text-white">Reviewed clubs</h2>
        {reviewed.length === 0 ? (
          <EmptyState
            compact
            icon={<Building2 className="h-6 w-6" />}
            title="No reviewed clubs yet"
            description="Approved and rejected clubs appear here with their verification state."
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Club</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Region</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Adult</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Youth</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewed.map((club) => (
                    <tr key={club.id} className="border-b border-white/[0.05] last:border-0">
                      <td className="px-4 py-3 text-[12.5px] font-medium text-white">{club.name ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400">{club.region ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[club.verificationStatus ?? 'pending'] ?? 'slate'}>
                          {(club.verificationStatus ?? 'pending').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {club.verifiedAdult ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-slate-600" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {club.verifiedYouth ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-slate-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

