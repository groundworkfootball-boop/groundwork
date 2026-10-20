import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Sparkles, RefreshCw, ShieldCheck, Zap, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Stat } from '../../components/ui/Stat';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

interface UsageRow {
  id: string;
  purpose?: string;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  cached?: boolean;
  timestamp?: { seconds: number };
}

export const AIManagementPage = () => {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'aiUsage'), limit(500)));
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<UsageRow, 'id'>),
      }));
      rows.sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));
      setUsage(rows);
    } catch (err) {
      console.error(err);
      setError('We could not load AI usage. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const calls = usage.length;
    const cached = usage.filter((row) => row.cached).length;
    const promptTokens = usage.reduce((sum, row) => sum + (row.promptTokens ?? 0), 0);
    const completionTokens = usage.reduce((sum, row) => sum + (row.completionTokens ?? 0), 0);
    const cost = usage.reduce((sum, row) => sum + (row.costUsd ?? 0), 0);
    return {
      calls,
      cached,
      cacheRate: calls > 0 ? Math.round((cached / calls) * 100) : 0,
      promptTokens,
      completionTokens,
      cost,
    };
  }, [usage]);

  const byPurpose = useMemo(() => {
    const map = new Map<string, { calls: number; cost: number }>();
    for (const row of usage) {
      const key = row.purpose ?? 'unknown';
      const current = map.get(key) ?? { calls: 0, cost: 0 };
      current.calls += 1;
      current.cost += row.costUsd ?? 0;
      map.set(key, current);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].calls - a[1].calls);
  }, [usage]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="AI management"
        description="Advisory-only AI usage, caching and cost. AI never writes match scores or rankings."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
        <div>
          <p className="text-[13px] font-semibold text-violet-100">Hard boundary enforced</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-violet-200/80">
            Firestore rules deny all client and function writes to <code className="font-mono text-[11.5px]">matchResults</code>{' '}
            and <code className="font-mono text-[11.5px]">playerScores</code>. AI output is stored only in{' '}
            <code className="font-mono text-[11.5px]">aiResults</code> and is always reviewable by the user.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total calls"
          value={totals.calls}
          icon={<Sparkles className="h-4 w-4" />}
          tone="violet"
          hint="Recorded in aiUsage"
        />
        <Stat
          label="Cache hit rate"
          value={`${totals.cacheRate}%`}
          icon={<Database className="h-4 w-4" />}
          tone={totals.cacheRate >= 50 ? 'emerald' : 'amber'}
          hint={`${totals.cached} cached`}
        />
        <Stat
          label="Tokens"
          value={(totals.promptTokens + totals.completionTokens).toLocaleString('en-GB')}
          icon={<Zap className="h-4 w-4" />}
          tone="sky"
          hint={`${totals.promptTokens.toLocaleString('en-GB')} in`}
        />
        <Stat
          label="Estimated cost"
          value={`$${totals.cost.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="brand"
          hint="Provider-reported"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Usage by feature"
            description="Where AI spend is going"
            icon={<Sparkles className="h-4 w-4" />}
          />
          <div className="mt-5">
            {byPurpose.length === 0 ? (
              <EmptyState
                compact
                icon={<Sparkles className="h-6 w-6" />}
                title="No AI usage recorded"
                description="Calls appear here once a feature invokes the provider."
              />
            ) : (
              <ul className="space-y-2.5">
                {byPurpose.map(([purpose, data]) => (
                  <li
                    key={purpose}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium capitalize text-white">
                        {purpose.replace(/-/g, ' ')}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{data.calls} calls</p>
                    </div>
                    <Badge tone="slate">${data.cost.toFixed(3)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent calls"
            description="Provider, model and cache state"
            icon={<Database className="h-4 w-4" />}
          />
          <div className="mt-5">
            {usage.length === 0 ? (
              <EmptyState
                compact
                icon={<Database className="h-6 w-6" />}
                title="No calls yet"
                description="Each provider request is logged with tokens and estimated cost."
              />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {usage.slice(0, 8).map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium capitalize text-white">
                        {row.purpose?.replace(/-/g, ' ') ?? 'unknown'}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-slate-500">
                        {row.provider ?? '—'} · {row.model ?? '—'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {row.cached ? <Badge tone="emerald">cached</Badge> : <Badge tone="slate">live</Badge>}
                      <span className="gw-numeric text-[11px] text-slate-500">
                        ${(row.costUsd ?? 0).toFixed(3)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Guardrails"
          description="Applied to every AI feature"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            'Versioned system prompts with structured JSON output',
            'Content hashing and 30-day result caching',
            'Per-user rate limiting and token caps',
            'Youth data blocked without granted consent',
            'No write access to scores, rankings or weights',
            'Every call logged with provider, model and cost',
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5"
            >
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
              <p className="text-[12px] leading-relaxed text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
