import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Check, CreditCard, ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import {
  CLUB_PLANS,
  openBillingPortal,
  startClubSubscription,
  type PlanDefinition,
} from '../../lib/services/paymentService';
import { cn } from '../../components/ui/cn';

interface ClubBillingState {
  tier: 'free' | 'standard' | 'premium';
  status: string;
  renewsAt?: string | null;
}

export const SubscriptionPage = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billing, setBilling] = useState<ClubBillingState>({ tier: 'free', status: 'inactive' });

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db, 'clubs', user.uid));
      const data = snap.exists() ? snap.data() : {};
      const tier = (data.subscriptionTier as ClubBillingState['tier']) ?? 'free';
      setBilling({
        tier: ['free', 'standard', 'premium'].includes(tier) ? tier : 'free',
        status: (data.subscriptionStatus as string) ?? 'inactive',
        renewsAt:
          typeof data.subscriptionCurrentPeriodEndMs === 'number'
            ? new Date(data.subscriptionCurrentPeriodEndMs).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : null,
      });
    } catch (err) {
      console.error(err);
      setError('We could not load your billing state. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      success('Payment confirmed. Your plan activates once Stripe confirms the webhook.');
      void load();
    }
    if (status === 'cancelled') info('Checkout cancelled. No charge was made.');
  }, [searchParams, success, info, load]);

  const handleSelect = async (plan: PlanDefinition) => {
    if (!user?.uid || plan.id === 'free') return;
    setBusyPlan(plan.id);
    try {
      const result = await startClubSubscription(user.uid, plan.id as 'standard' | 'premium');
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      info(result.message);
      void load();
    } catch (err) {
      console.error(err);
      toastError('We could not start checkout. Please try again in a moment.');
    } finally {
      setBusyPlan(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const url = await openBillingPortal();
      if (url) window.location.href = url;
      else info('No billing account yet. Start a plan first.');
    } catch (err) {
      console.error(err);
      toastError('We could not open the billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Club account"
        title="Recruitment plans"
        description="Stripe is authoritative for payment state — a plan change only takes effect once the webhook confirms it."
        actions={
          billing.tier !== 'free' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePortal}
              loading={portalLoading}
              iconLeft={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Manage billing
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <p className="gw-mono text-slate-500">Current plan</p>
              <p className="text-[15px] font-semibold capitalize text-white">
                {billing.tier === 'free' ? 'Free Scout' : billing.tier}
              </p>
            </div>
          </div>
          <Badge
            tone={billing.status === 'active' ? 'emerald' : billing.status === 'past_due' ? 'amber' : 'slate'}
            dot
          >
            {billing.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        {billing.renewsAt ? (
          <p className="mt-3 text-[12px] text-slate-500">Current period ends {billing.renewsAt}</p>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {CLUB_PLANS.map((plan) => {
          const isCurrent = plan.id === billing.tier;
          const isBusy = busyPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-colors',
                isCurrent ? 'border-brand/40 bg-brand/[0.06]' : 'gw-tilt-hover border-white/[0.08] bg-white/[0.025]',
              )}
            >
              {plan.popular ? (
                <span className="absolute -top-2.5 left-6 rounded-full border border-brand/40 bg-ink-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand">
                  Most popular
                </span>
              ) : null}

              <h3 className="text-[15px] font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 min-h-[36px] text-[12.5px] leading-relaxed text-slate-400">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="gw-numeric text-[32px] font-bold leading-none text-white">{plan.price}</span>
                <span className="text-[12px] text-slate-500">/ {plan.period}</span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-slate-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6"
                fullWidth
                variant={isCurrent ? 'secondary' : plan.popular ? 'primary' : 'outline'}
                disabled={isCurrent || plan.id === 'free'}
                loading={isBusy}
                onClick={() => handleSelect(plan)}
              >
                {isCurrent ? 'Current plan' : plan.id === 'free' ? 'Included' : 'Choose plan'}
              </Button>
            </div>
          );
        })}
      </div>

      <Card variant="flat">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-brand">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="text-[12.5px] leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-200">Payment integrity</p>
            <p className="mt-1">
              Prices resolve server-side from a catalogue key. The browser never sends an amount, and duplicate Stripe
              webhooks are ignored via an idempotency claim on the event ID.
            </p>
          </div>
        </div>
      </Card>

      <Card variant="flat">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-sky-300">
            <Info className="h-4 w-4" />
          </span>
          <div className="text-[12.5px] leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-200">Running on the free Firebase plan?</p>
            <p className="mt-1">
              Cloud Functions require Blaze. Until they are deployed, plan selection records a request for a finance
              admin to activate — the client never grants itself an entitlement.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};