import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Zap, ShieldCheck, Info, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { BOOST_PACKAGES, getPlayerBoost, purchaseBoost, requestPlayerPro, type ActiveBoost } from '../../lib/services/paymentService';
import { cn } from '../../components/ui/cn';

const PRO_FEATURES = [
  'Documented +5% boost dimension in scoring',
  'Unlimited match video clips',
  'AI-assisted observable movement tagging',
  'Transparent six-dimension score breakdowns',
  'Profile view read receipts from scouts',
];

const FREE_FEATURES = [
  'Full profile and skill ratings',
  'Deterministic opportunity feed',
  'Unlimited direct applications',
  'One highlight video clip',
];

export const SubscriptionPage = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [boost, setBoost] = useState<ActiveBoost | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      setBoost(await getPlayerBoost(user.uid));
    } catch (err) {
      console.error(err);
      setError('We could not load your membership state. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') success('Payment confirmed. Activation follows the Stripe webhook.');
    if (status === 'cancelled') info('Checkout cancelled. No charge was made.');
  }, [searchParams, success, info]);

  const boostActive = boost?.boostStatus === 'active';

  const handlePro = async () => {
    if (!user?.uid) return;
    setBusy('pro');
    try {
      const result = await requestPlayerPro(user.uid);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      info(result.message);
    } catch (err) {
      console.error(err);
      toastError('We could not start checkout. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleBoost = async (packageId: string) => {
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

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Player advancement"
        title="Plan & visibility"
        description="Boosts change exactly one documented dimension — the 5% visibility weight. They can never rewrite position, level or attribute scores."
      />

      {boostActive ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/[0.07] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/12 text-brand">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-white">Visibility boost active</p>
              <p className="text-[11.5px] text-brand/80">
                {boost?.packageId ?? 'Boost'} · expires automatically
              </p>
            </div>
          </div>
          <Badge tone="brand" dot>
            Live
          </Badge>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-semibold text-white">Standard player</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
                Complete recruitment essentials for amateur and academy trialists.
              </p>
            </div>
            <Badge tone="slate">Included</Badge>
          </div>

          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="gw-numeric text-[32px] font-bold leading-none text-white">£0</span>
            <span className="text-[12px] text-slate-500">/ forever</span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[12.5px] text-slate-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                {feature}
              </li>
            ))}
          </ul>

          <Button className="mt-6" fullWidth variant="secondary" disabled>
            Current baseline
          </Button>
        </Card>

        <Card className="border-brand/30 bg-brand/[0.04]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                Player Pro
                <Zap className="h-3.5 w-3.5 text-brand" />
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
                Enhanced scouting visibility plus AI observable-only clip tagging.
              </p>
            </div>
            <Badge tone="brand">Boost</Badge>
          </div>

          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="gw-numeric text-[32px] font-bold leading-none text-white">£9.99</span>
            <span className="text-[12px] text-slate-500">/ month</span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[12.5px] text-slate-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                {feature}
              </li>
            ))}
          </ul>

          <Button className="mt-6" fullWidth loading={busy === 'pro'} onClick={handlePro}>
            Upgrade to Player Pro
          </Button>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white">One-off visibility boosts</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-400">Expires automatically. Never affects other dimensions.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {BOOST_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                'flex flex-col rounded-2xl border p-5 transition-colors',
                pkg.popular ? 'border-brand/40 bg-brand/[0.06]' : 'gw-tilt-hover border-white/[0.08] bg-white/[0.025]',
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-semibold text-white">{pkg.duration}</h3>
                <Zap className={cn('h-4 w-4', pkg.popular ? 'text-brand' : 'text-slate-500')} />
              </div>
              <p className="mt-1 text-[11.5px] text-slate-500">{pkg.impressions}</p>
              <p className="gw-numeric mt-3 text-[24px] font-bold leading-none text-white">{pkg.price}</p>
              <Button
                className="mt-4"
                fullWidth
                size="sm"
                variant={pkg.popular ? 'primary' : 'secondary'}
                loading={busy === pkg.id}
                onClick={() => handleBoost(pkg.id)}
              >
                Activate
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Card variant="flat">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-brand">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="text-[12.5px] leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-200">Algorithmic integrity guarantee</p>
            <p className="mt-1">
              A boost contributes only to the documented 5% boost dimension. It cannot override position, distance or
              level. When it expires the engine drops it on the next recalculation.
            </p>
          </div>
        </div>
      </Card>

      <Card variant="flat">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-sky-300">
            <Info className="h-4 w-4" />
          </span>
          <div className="flex-1 text-[12.5px] leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-200">Checkout availability</p>
            <p className="mt-1 flex items-start gap-1.5">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
              On the free Firebase plan, Cloud Functions are unavailable. Boosts and Pro are then queued as requests for
              an admin to activate. No entitlement is granted client-side.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};