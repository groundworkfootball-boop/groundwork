import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { Activity, CheckCircle2, AlertTriangle, Database, ShieldCheck, RefreshCw, Clock, Rocket, XCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

interface ServiceCheck {
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number | null;
  detail?: string;
}

interface DeploymentCheck {
  name: string;
  command: string;
  status: 'deployed' | 'missing' | 'unknown';
  detail: string;
}

/**
 * Probes whether the deployed Firebase artefacts match this build.
 *
 * Rules and indexes ship separately from the frontend, so pushing new code
 * leaves them stale — which shows up as `permission-denied` and
 * `failed-precondition` on otherwise-valid queries. These probes name the exact
 * command that fixes each gap instead of leaving the operator guessing.
 */
async function runDeploymentChecks(): Promise<DeploymentCheck[]> {
  const results: DeploymentCheck[] = [];

  // 1. Composite index for `where(playerId) + orderBy(matchScore)`.
  try {
    await getDocs(
      query(collection(db, 'matchResults'), where('playerId', '==', '__probe__'), orderBy('matchScore', 'desc'), limit(1)),
    );
    results.push({
      name: 'Composite indexes',
      command: 'npm run deploy:data',
      status: 'deployed',
      detail: 'matchResults index resolved without a failed-precondition fallback.',
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    results.push({
      name: 'Composite indexes',
      command: 'npm run deploy:data',
      status: code === 'failed-precondition' ? 'missing' : 'unknown',
      detail:
        code === 'failed-precondition'
          ? 'Queries are falling back to client-side sorting. Deploy firestore.indexes.json.'
          : `Could not determine (${code || 'unknown'}).`,
    });
  }

  // 2. Guardian read rule on `players` — the rule added most recently.
  try {
    await getDocs(query(collection(db, 'players'), where('guardianEmail', '==', '__probe__'), limit(1)));
    results.push({
      name: 'Guardian read rule',
      command: 'npm run deploy:data',
      status: 'deployed',
      detail: 'players.guardianEmail query permitted by the live ruleset.',
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    results.push({
      name: 'Guardian read rule',
      command: 'npm run deploy:data',
      status: code === 'permission-denied' ? 'missing' : 'unknown',
      detail:
        code === 'permission-denied'
          ? 'The deployed ruleset predates the guardian read rule. The guardian dashboard will report a denial.'
          : `Could not determine (${code || 'unknown'}).`,
    });
  }

  // 3. Spark-plan request queue — client fallback writes `status: 'pending'`.
  try {
    const probeId = `__probe_${Date.now()}`;
    await setDoc(doc(db, 'subscriptionRequests', probeId), {
      clubId: '__probe__',
      plan: 'probe',
      status: 'pending',
      createdAt: new Date(),
    });
    results.push({
      name: 'Client request queues',
      command: 'npm run deploy:data',
      status: 'deployed',
      detail: 'subscriptionRequests accepts a pending client write.',
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    results.push({
      name: 'Client request queues',
      command: 'npm run deploy:data',
      status: code === 'permission-denied' ? 'missing' : 'unknown',
      detail:
        code === 'permission-denied'
          ? 'Payment and boost requests will fail. The deployed ruleset predates the request queues.'
          : `Could not determine (${code || 'unknown'}).`,
    });
  }

  // 4. Admin role claim — absent until Cloud Functions are deployed.
  try {
    const snapshot = await getDoc(doc(db, 'matchingConfigs', 'default'));
    results.push({
      name: 'Matching configuration',
      command: 'npm run deploy:functions',
      status: snapshot.exists() ? 'deployed' : 'missing',
      detail: snapshot.exists()
        ? 'matchingConfigs/default is present.'
        : 'matchingConfigs/default has not been seeded. Deploy functions to seed it.',
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    results.push({
      name: 'Matching configuration',
      command: 'npm run deploy:functions',
      status: code === 'permission-denied' ? 'missing' : 'unknown',
      detail: 'matchingConfigs/default is not readable with the current rules.',
    });
  }

  return results;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ok: boolean; ms: number; error?: string }> {
  const start = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch (err) {
    return {
      ok: false,
      ms: Math.round(performance.now() - start),
      error: (err as { code?: string })?.code ?? 'unknown',
    };
  }
}

export const SystemHealthPage = () => {
  const [checks, setChecks] = useState<ServiceCheck[]>([]);
  const [deployChecks, setDeployChecks] = useState<DeploymentCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Real probes against Firestore. Each measures actual round-trip latency.
      const playersProbe = await timed(() => getCountFromServer(collection(db, 'players')));
      const clubsProbe = await timed(() => getCountFromServer(collection(db, 'clubs')));
      const auditProbe = await timed(() =>
        getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(1))),
      );
      const consentProbe = await timed(() =>
        getCountFromServer(query(collection(db, 'consentAudits'), where('guardianId', '!=', ''))),
      );

      const results: ServiceCheck[] = [
        {
          name: 'Cloud Firestore',
          description: 'Primary datastore — players collection',
          status: playersProbe.ok ? 'operational' : 'down',
          latencyMs: playersProbe.ok ? playersProbe.ms : null,
          detail: playersProbe.error,
        },
        {
          name: 'Clubs collection',
          description: 'Club profiles and verification state',
          status: clubsProbe.ok ? 'operational' : 'down',
          latencyMs: clubsProbe.ok ? clubsProbe.ms : null,
          detail: clubsProbe.error,
        },
        {
          name: 'Audit trail',
          description: 'Append-only administrative log',
          status: auditProbe.ok ? 'operational' : 'degraded',
          latencyMs: auditProbe.ok ? auditProbe.ms : null,
          detail: auditProbe.error,
        },
        {
          name: 'Consent records',
          description: 'Immutable guardian consent trail',
          status: consentProbe.ok ? 'operational' : 'degraded',
          latencyMs: consentProbe.ok ? consentProbe.ms : null,
          detail: consentProbe.error,
        },
      ];

      setChecks(results);
      setDeployChecks(await runDeploymentChecks());
      setLastChecked(new Date());
    } catch (err) {
      console.error(err);
      setError('We could not run the health checks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  if (loading && checks.length === 0) return <DashboardSkeleton />;
  if (error) return <ErrorState description={error} onRetry={runChecks} />;

  const allOperational = checks.every((check) => check.status === 'operational');
  const avgLatency =
    checks.filter((c) => c.latencyMs !== null).reduce((sum, c) => sum + (c.latencyMs ?? 0), 0) /
    Math.max(1, checks.filter((c) => c.latencyMs !== null).length);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="System health"
        description="Live probes against Firestore. Latency is measured client-side on each check."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={runChecks}
            loading={loading}
            iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Run checks
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Overall</p>
          <div className="mt-2 flex items-center gap-2">
            {allOperational ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-[18px] font-bold text-emerald-300">Operational</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <p className="text-[18px] font-bold text-amber-300">Degraded</p>
              </>
            )}
          </div>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Average latency</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{Math.round(avgLatency)}ms</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Last checked</p>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-slate-300">
            <Clock className="h-3.5 w-3.5" />
            {lastChecked ? lastChecked.toLocaleTimeString('en-GB') : '—'}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Service probes"
          description="Measured against your live Firebase project"
          icon={<Activity className="h-4 w-4" />}
        />
        <div className="mt-5 space-y-2.5">
          {checks.map((check) => (
            <div
              key={check.name}
              className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                  <Database className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-white">{check.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">{check.description}</p>
                  {check.detail ? (
                    <p className="mt-1 font-mono text-[10.5px] text-rose-400/80">{check.detail}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {check.latencyMs !== null ? (
                  <span className="gw-numeric text-[11.5px] text-slate-500">{check.latencyMs}ms</span>
                ) : null}
                <Badge
                  tone={
                    check.status === 'operational' ? 'emerald' : check.status === 'degraded' ? 'amber' : 'rose'
                  }
                  dot
                >
                  {check.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Deployment readiness"
          description="Rules and indexes deploy separately from the app — this is where stale ones show up"
          icon={<Rocket className="h-4 w-4" />}
        />
        <div className="mt-5 space-y-2.5">
          {deployChecks.map((check) => {
            const Icon =
              check.status === 'deployed' ? CheckCircle2 : check.status === 'missing' ? XCircle : AlertTriangle;
            const tone =
              check.status === 'deployed'
                ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
                : check.status === 'missing'
                  ? 'border-rose-500/25 bg-rose-500/[0.05]'
                  : 'border-amber-400/20 bg-amber-400/[0.05]';
            const iconTone =
              check.status === 'deployed'
                ? 'text-emerald-400'
                : check.status === 'missing'
                  ? 'text-rose-400'
                  : 'text-amber-400';
            return (
              <div key={check.name} className={`rounded-xl border px-4 py-3 ${tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-white">{check.name}</p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">{check.detail}</p>
                      {check.status === 'missing' ? (
                        <code className="mt-1.5 inline-block rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-slate-200">
                          {check.command}
                        </code>
                      ) : null}
                    </div>
                  </div>
                  <Badge
                    tone={check.status === 'deployed' ? 'emerald' : check.status === 'missing' ? 'rose' : 'amber'}
                  >
                    {check.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Safeguarding controls"
          description="Verified by the security rule test suite"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            'Youth profiles require granted consent',
            'Club youth verification must be unexpired',
            'Match scores are server-write-only',
            'Consent and audit trails are immutable',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3.5 py-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <p className="text-[12px] leading-relaxed text-emerald-100/80">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
