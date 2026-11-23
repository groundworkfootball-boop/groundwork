import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { Clock, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { BOOST_PACKAGES, purchaseBoost } from '../../lib/services/paymentService';
import { cn } from '../../components/ui/cn';
import { TrophyIllustration } from '../../components/illustrations/football';

interface BoostRow {
  id: string;
  packageId?: string;
  status?: string;
  endsAtMs?: number;
}

export const BoostsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [boosts, setBoosts] = useState<BoostRow[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Boosts are owner-scoped by document id; query by the club id field.
        const snap = await getDocs(
          query(collection(db, 'boosts'), where('clubId', '==', user.uid), limit(20)),
        ).catch(() => null);
        if (cancelled) return;
        const rows = (snap?.docs ?? []).map((entry) => {
          const data = entry.data() as Record<string, unknown>;
          return {
            id: entry.id,
            packageId: data.packageId as string | undefined,
            status: data.status as string | undefined,
            endsAtMs: typeof data.endsAtMs === 'number' ? data.endsAtMs : undefined,
          };
        });
        setBoosts(rows.filter((row) => row.status === 'active'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') success('Boost payment confirmed. It activates once Stripe confirms the webhook.');
    if (status === 'cancelled') info('Checkout cancelled. No charge was made.');
  }, [searchParams, success, info]);

  const handlePurchase = async (packageId: string) => {
    if (!user?.uid) return;
    setBusy(packageId);
    try {
      const result = await purchaseBoost(user.uid, packageId);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      info(result.message);
    } catch (err) {
      console.error(err);
      toastError('We could not start the boost checkout.');
    } finally {
      setBusy(null);
    }
  };

  const activePackages = new Set(boosts.map((boost) => boost.packageId));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Listing promotion"
        title="Visibility boosts"
        description="Elevate your listings within compatible players' feeds. One documented dimension, automatic expiry, no hidden effects."
      />

      {boosts.length > 0 ? (
        <Card variant="flat">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white">
                  {boosts.length} active boost{boosts.length > 1 ? 's' : ''}
                </p>
                <p className="text-[11.5px] text-slate-500">
                  {boosts.map((boost) => boost.packageId).filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <Badge tone="brand" dot>
              Live
            </Badge>
          </div>
        </Card>
      ) : null}

      <div className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div className="space-y-1">
            <h2 className="text-[13px] font-bold text-white">Algorithmic integrity guarantee</h2>
            <p className="text-[12px] leading-relaxed text-slate-300">
              Visibility boosts contribute exclusively to the documented 5% boost dimension. They expire automatically
              and cannot override position, distance, level or attribute scores.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BOOST_PACKAGES.map((pkg) => {
          const isActive = activePackages.has(pkg.id);
          return (
            <div
              key={pkg.id}
              className={cn(
                'flex flex-col rounded-2xl border p-5 transition-colors',
                pkg.popular ? 'border-brand/40 bg-brand/[0.06]' : 'gw-tilt-hover border-white/[0.08] bg-white/[0.025]',
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">{pkg.duration} boost</h3>
                <Zap className={cn('h-4 w-4', pkg.popular ? 'text-brand' : 'text-slate-500')} />
              </div>
              <p className="mt-1 text-[11.5px] text-slate-500">{pkg.impressions}</p>
              <p className="gw-numeric mt-4 text-[28px] font-bold leading-none text-white">{pkg.price}</p>
              <Button
                className="mt-5"
                fullWidth
                variant={isActive ? 'secondary' : pkg.popular ? 'primary' : 'outline'}
                disabled={isActive}
                loading={busy === pkg.id}
                onClick={() => handlePurchase(pkg.id)}
              >
                {isActive ? 'Active on listing' : 'Activate boost'}
              </Button>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : boosts.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="No active boosts"
          description="Boosts run for a fixed window and then expire automatically. Nothing renews silently."
          action={
            <div className="flex justify-center">
              <TrophyIllustration className="max-h-40" />
            </div>
          }
        />
      ) : null}
    </div>
  );
};