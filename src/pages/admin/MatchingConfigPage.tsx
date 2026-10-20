import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { AlertCircle, Save, RefreshCw, Info, Sliders, History } from 'lucide-react';
import { functions } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { ErrorState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

interface Weights {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
}

interface ConfigVersion extends Weights {
  id: string;
  version: number;
  createdAt?: { seconds: number };
}

const DIMENSIONS: Array<{ key: keyof Weights; label: string; description: string }> = [
  { key: 'positionWeight', label: 'Position compatibility', description: 'Exact match 1.0, adjacent 0.5, incompatible 0' },
  { key: 'levelWeight', label: 'Playing level', description: 'Normalised distance from the club target tier' },
  { key: 'attributesWeight', label: 'Attributes', description: 'Weighted average of skill, physical and mental ratings' },
  { key: 'distanceWeight', label: 'Distance / region', description: 'Deterministic decay against preferred radius' },
  { key: 'availabilityWeight', label: 'Availability overlap', description: 'Overlap between player and club slots' },
  { key: 'boostWeight', label: 'Active boost', description: 'Flat bonus while a boost is active' },
];

const DEFAULT_PCT: Record<keyof Weights, number> = {
  positionWeight: 30,
  levelWeight: 20,
  attributesWeight: 20,
  distanceWeight: 15,
  availabilityWeight: 10,
  boostWeight: 5,
};

export const MatchingConfigPage = () => {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [history, setHistory] = useState<ConfigVersion[]>([]);
  const [pct, setPct] = useState<Record<keyof Weights, number>>(DEFAULT_PCT);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const callable = httpsCallable<
        Record<string, never>,
        { active: (Weights & { version: number }) | null; versions: ConfigVersion[] }
      >(functions, 'getMatchingConfigState');

      const { data } = await callable({});
      if (data.active) {
        setVersion(data.active.version ?? 1);
        setPct({
          positionWeight: Math.round((data.active.positionWeight ?? 0.3) * 100),
          levelWeight: Math.round((data.active.levelWeight ?? 0.2) * 100),
          attributesWeight: Math.round((data.active.attributesWeight ?? 0.2) * 100),
          distanceWeight: Math.round((data.active.distanceWeight ?? 0.15) * 100),
          availabilityWeight: Math.round((data.active.availabilityWeight ?? 0.1) * 100),
          boostWeight: Math.round((data.active.boostWeight ?? 0.05) * 100),
        });
      }
      setHistory(data.versions ?? []);
    } catch (err) {
      console.error(err);
      setError('We could not load the matching configuration. Admin access is required.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = Object.values(pct).reduce((sum, value) => sum + value, 0);
  const isValid = total === 100;

  const save = async () => {
    if (!isValid) {
      toastError(`Weights must total 100%. Current total: ${total}%.`);
      return;
    }
    setSaving(true);
    try {
      const callable = httpsCallable<
        Weights & { recalculate: boolean },
        { ok?: boolean; version?: number; error?: string }
      >(functions, 'updateMatchingConfig');

      const { data } = await callable({
        positionWeight: pct.positionWeight / 100,
        levelWeight: pct.levelWeight / 100,
        attributesWeight: pct.attributesWeight / 100,
        distanceWeight: pct.distanceWeight / 100,
        availabilityWeight: pct.availabilityWeight / 100,
        boostWeight: pct.boostWeight / 100,
        recalculate: true,
      });

      if (data.error) {
        toastError(data.error);
        return;
      }

      success(`Configuration saved as version ${data.version}. Recalculation queued.`);
      await load();
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'Could not save the configuration.';
      toastError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader eyebrow="Matching" title="Matching configuration" />
        <Card padding="lg">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Matching"
        title="Matching configuration"
        description="Weights are versioned. Historical match results keep the version they were scored under."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Reload
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand/[0.06] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div>
          <p className="text-[13px] font-semibold text-brand">Deterministic only</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-300">
            These weights drive the pure scoring function. AI has no access to this configuration and cannot influence
            any score.
          </p>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader
          title={`Active configuration · v${version}`}
          description="Adjust the six weighted dimensions"
          icon={<Sliders className="h-4 w-4" />}
          action={
            <Badge tone={isValid ? 'emerald' : 'rose'} dot>
              {total}% total
            </Badge>
          }
        />

        <div className="mt-6 space-y-5">
          {DIMENSIONS.map((dimension) => (
            <div key={dimension.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <label htmlFor={dimension.key} className="text-[13px] font-medium text-white">
                    {dimension.label}
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">{dimension.description}</p>
                </div>
                <span className="gw-numeric shrink-0 text-[13px] font-semibold text-brand">
                  {pct[dimension.key]}%
                </span>
              </div>
              <input
                id={dimension.key}
                type="range"
                min={0}
                max={60}
                step={1}
                value={pct[dimension.key]}
                onChange={(e) =>
                  setPct((prev) => ({ ...prev, [dimension.key]: Number(e.target.value) }))
                }
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.10] accent-brand"
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Progress value={total} max={100} tone={isValid ? 'emerald' : 'rose'} label="Total weight" showValue />
        </div>

        {!isValid ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-[12.5px] leading-relaxed text-rose-200">
              Weights must total exactly 100%. Current total is {total}%.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button onClick={save} loading={saving} disabled={!isValid} iconLeft={<Save className="h-4 w-4" />}>
            Save as version {version + 1}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Version history"
          description="Immutable record of every configuration change"
          icon={<History className="h-4 w-4" />}
        />
        <div className="mt-5">
          {history.length === 0 ? (
            <p className="text-[12.5px] text-slate-500">No previous versions recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-[12.5px] font-medium text-white">Version {entry.version}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {entry.createdAt?.seconds
                        ? new Date(entry.createdAt.seconds * 1000).toLocaleString('en-GB')
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone="brand">P {Math.round((entry.positionWeight ?? 0) * 100)}</Badge>
                    <Badge tone="emerald">L {Math.round((entry.levelWeight ?? 0) * 100)}</Badge>
                    <Badge tone="violet">A {Math.round((entry.attributesWeight ?? 0) * 100)}</Badge>
                    <Badge tone="sky">D {Math.round((entry.distanceWeight ?? 0) * 100)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};
