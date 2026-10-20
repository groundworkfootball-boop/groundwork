import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { RefreshCw, Receipt, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

interface PaymentRow {
  id: string;
  userId?: string;
  customerName?: string;
  amount?: number;
  currency?: string;
  description?: string;
  status?: string;
  createdAt?: { seconds: number };
}

const STATUS_TONE = {
  succeeded: 'emerald',
  paid: 'emerald',
  pending: 'amber',
  failed: 'rose',
  refunded: 'slate',
} as const;

function formatAmount(amount?: number, currency = 'gbp'): string {
  if (typeof amount !== 'number') return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(seconds?: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const PaymentsPage = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'payments'), limit(100)));
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<PaymentRow, 'id'>),
      }));
      rows.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setPayments(rows);
    } catch (err) {
      console.error(err);
      setError('We could not load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter(
      (row) =>
        (row.customerName ?? '').toLowerCase().includes(term) ||
        (row.description ?? '').toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term),
    );
  }, [payments, search]);

  const totalVolume = useMemo(
    () =>
      payments
        .filter((row) => row.status === 'succeeded' || row.status === 'paid')
        .reduce((sum, row) => sum + (row.amount ?? 0), 0),
    [payments],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Finance" title="Payments" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Stripe is authoritative. Records are written only by the verified webhook handler."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Transactions</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{payments.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Settled volume</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">{formatAmount(totalVolume)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Failed</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-rose-300">
            {payments.filter((row) => row.status === 'failed').length}
          </p>
        </Card>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Search by customer, description or payment ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
          aria-label="Search payments"
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No payments recorded"
          description={
            search
              ? 'No payment matches that search.'
              : 'Completed Stripe checkouts appear here once the webhook processes them.'
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Description</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.id.slice(0, 14)}</td>
                    <td className="px-4 py-3 text-[12.5px] font-medium text-white">{row.customerName ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400">{row.description ?? '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-white">
                      {formatAmount(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[(row.status ?? 'pending') as keyof typeof STATUS_TONE] ?? 'slate'}>
                        {row.status ?? 'pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-500">{formatDate(row.createdAt?.seconds)}</td>
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

