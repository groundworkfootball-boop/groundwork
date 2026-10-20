import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { CreditCard, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

interface SubscriptionRow {
  id: string;
  userId?: string;
  customerName?: string;
  tier?: string;
  status?: string;
  priceMonthly?: number;
  currency?: string;
  currentPeriodEnd?: { seconds: number };
}

const STATUS_TONE = {
  active: 'emerald',
  trialing: 'sky',
  past_due: 'amber',
  unpaid: 'rose',
  canceled: 'slate',
  cancelled: 'slate',
  incomplete: 'amber',
} as const;

function formatPrice(amount?: number, currency = 'gbp'): string {
  if (typeof amount !== 'number') return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatDate(seconds?: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, 'subscriptions'));
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<SubscriptionRow, 'id'>),
      }));
      rows.sort((a, b) => (a.customerName ?? '').localeCompare(b.customerName ?? ''));
      setSubscriptions(rows);
    } catch (err) {
      console.error(err);
      setError('We could not load subscriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byTier = useMemo(() => {
    const map = new Map<string, { count: number; mrr: number }>();
    for (const row of subscriptions) {
      if (row.status !== 'active' && row.status !== 'trialing') continue;
      const tier = row.tier ?? 'unknown';
      const current = map.get(tier) ?? { count: 0, mrr: 0 };
      current.count += 1;
      current.mrr += row.priceMonthly ?? 0;
      map.set(tier, current);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [subscriptions]);

  const activeCount = subscriptions.filter(
    (row) => row.status === 'active' || row.status === 'trialing',
  ).length;
  const mrr = subscriptions
    .filter((row) => row.status === 'active')
    .reduce((sum, row) => sum + (row.priceMonthly ?? 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Finance" title="Subscriptions" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Subscriptions"
        description="Stripe is authoritative for subscription state. Clients cannot write these records."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Active subscriptions</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">{activeCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Monthly recurring</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{formatPrice(mrr)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total records</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-slate-300">{subscriptions.length}</p>
        </Card>
      </div>

      {byTier.length > 0 && (
        <div>
          <h2 className="mb-3 text-[14px] font-semibold text-white">By plan</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byTier.map(([tier, data]) => (
              <Card key={tier} padding="sm">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold capitalize text-white">{tier}</p>
                  <Badge tone="brand">{data.count}</Badge>
                </div>
                <p className="mt-2 text-[11.5px] text-slate-500">
                  {formatPrice(data.mrr)} monthly recurring
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="No subscriptions yet"
          description="Club and player subscriptions appear here once Stripe confirms checkout."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Monthly</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Renews</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3 text-[12.5px] font-medium text-white">
                      {row.customerName ?? row.userId?.slice(0, 12) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] capitalize text-slate-400">{row.tier ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[(row.status ?? 'incomplete') as keyof typeof STATUS_TONE] ?? 'slate'}>
                        {(row.status ?? 'incomplete').replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-white">
                      {formatPrice(row.priceMonthly, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-500">
                      {formatDate(row.currentPeriodEnd?.seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

