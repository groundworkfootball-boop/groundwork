import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { ShieldCheck, ShieldAlert, Check, X, RefreshCw, CalendarClock } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import type { ClubRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

function formatExpiry(value: unknown): string {
  if (!value) return '—';
  const seconds =
    typeof value === 'object' && value !== null && 'seconds' in value
      ? Number((value as { seconds: number }).seconds)
      : Number.NaN;
  if (Number.isNaN(seconds)) return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const YouthVerificationPage = () => {
  const { success, error: toastError } = useToast();

  const [clubs, setClubs] = useState<ClubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
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
    void load();
  }, [load]);

  const setYouthAccess = async (clubId: string, grant: boolean) => {
    setProcessingId(clubId);
    try {
      // Server writes verifiedYouth + expiry, enqueues match recalculation and
      // writes an immutable audit record.
      const callable = httpsCallable<
        {
          clubId: string;
          decision: 'approved' | 'rejected';
          grantYouthVerification: boolean;
          youthVerificationExpiresAtMs?: number;
        },
        { ok: boolean }
      >(functions, 'adminReviewClubVerification');

      await callable({
        clubId,
        decision: 'approved',
        grantYouthVerification: grant,
        youthVerificationExpiresAtMs: grant ? Date.now() + 365 * 24 * 60 * 60 * 1000 : undefined,
      });

      success(grant ? 'Youth scouting access granted for 12 months.' : 'Youth scouting access revoked.');
      await load();
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'Could not update youth verification.';
      toastError(message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Safeguarding" title="Youth verification" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  const youthVerified = clubs.filter((c) => c.verifiedYouth);
  const eligible = clubs.filter((c) => !c.verifiedYouth && c.verificationStatus === 'approved');
  const ineligible = clubs.filter((c) => !c.verifiedYouth && c.verificationStatus !== 'approved');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safeguarding"
        title="Youth verification"
        description="Youth access requires approved club verification plus safeguarding documentation. Grants expire after 12 months."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-[13px] font-semibold text-emerald-100">Safeguarding invariant</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-200/80">
            A youth profile is only readable by a club when consent is granted, the profile is searchable, and the
            club&apos;s youth verification is live and unexpired. This is enforced in Firestore rules and Cloud
            Functions — not in the interface.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Youth verified</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">{youthVerified.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Eligible to grant</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{eligible.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Not yet verified</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-slate-300">{ineligible.length}</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-[14px] font-semibold text-white">Clubs with youth access</h2>
        {youthVerified.length === 0 ? (
          <EmptyState
            compact
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No clubs hold youth access"
            description="Grant access only after reviewing safeguarding certification."
          />
        ) : (
          <div className="space-y-3">
            {youthVerified.map((club) => (
              <Card key={club.id} padding="md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-white">{club.name ?? 'Unnamed club'}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
                      {club.region ? <span>{club.region}</span> : null}
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Expires {formatExpiry(club.youthVerificationExpiresAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="emerald" dot>Youth verified</Badge>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setYouthAccess(club.id, false)}
                      loading={processingId === club.id}
                      iconLeft={<X className="h-3.5 w-3.5" />}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-[14px] font-semibold text-white">Eligible clubs</h2>
        {eligible.length === 0 ? (
          <EmptyState
            compact
            icon={<ShieldAlert className="h-6 w-6" />}
            title="No eligible clubs"
            description="A club must first pass adult verification before youth access can be granted."
          />
        ) : (
          <div className="space-y-3">
            {eligible.map((club) => (
              <Card key={club.id} padding="md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-white">{club.name ?? 'Unnamed club'}</p>
                    <p className="mt-0.5 text-[11.5px] text-slate-500">
                      {club.region ?? '—'} · adult verified
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setYouthAccess(club.id, true)}
                    loading={processingId === club.id}
                    iconLeft={<Check className="h-3.5 w-3.5" />}
                  >
                    Grant youth access
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
