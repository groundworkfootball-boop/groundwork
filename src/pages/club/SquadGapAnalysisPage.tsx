import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Sparkles, ArrowRight, RefreshCw, Users, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db, functions } from '../../lib/firebase';
import type { SquadMemberRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

interface Gap {
  position: string;
  severity: 'low' | 'medium' | 'high';
  note: string;
}

interface AnalysisResult {
  gaps: Gap[];
  summary: string;
  advisoryOnly: boolean;
  squadSize?: number;
}

const SEVERITY_TONE = {
  high: 'rose',
  medium: 'amber',
  low: 'slate',
} as const;

const SEVERITY_LABEL = {
  high: 'Critical',
  medium: 'Moderate',
  low: 'Minor',
} as const;

export const SquadGapAnalysisPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [formation, setFormation] = useState('4-3-3');
  const [members, setMembers] = useState<SquadMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSquad = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(
        query(collection(db, 'squadMembers'), where('clubId', '==', user.uid)),
      );
      setMembers(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<SquadMemberRecord, 'id'>),
        })),
      );
    } catch (err) {
      console.error(err);
      setError('We could not load your squad. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadSquad();
  }, [loadSquad]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Server-side AI analysis. Reads only this club's squad and returns
      // advisory output — it never writes to match or score data.
      const callable = httpsCallable<{ clubId: string }, AnalysisResult>(
        functions,
        'analyzeSquadGaps',
      );
      const { data } = await callable({ clubId: user!.uid });
      setResult(data);
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'Squad analysis failed. Please try again.';
      toastError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Squad" title="Squad gap analysis" />
        <CardSkeleton rows={4} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={loadSquad} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Squad"
        title="Squad gap analysis"
        description="AI identifies where your squad is thin. The deterministic engine then finds the players."
        actions={
          <Button
            onClick={runAnalysis}
            loading={analyzing}
            iconLeft={<Sparkles className="h-4 w-4" />}
          >
            Run analysis
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
        <div>
          <p className="text-[13px] font-semibold text-violet-100">Advisory only</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-violet-200/80">
            AI reads your structured squad data and identifies coverage gaps. It never creates a player match score —
            selecting a gap takes you to the deterministic search.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Squad size</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{members.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gaps identified</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">{result?.gaps.length ?? 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Critical</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-rose-300">
            {result?.gaps.filter((gap) => gap.severity === 'high').length ?? 0}
          </p>
        </Card>
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <Select label="Formation" value={formation} onChange={(e) => setFormation(e.target.value)}>
              {['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="secondary"
            onClick={loadSquad}
            iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
            className="sm:mb-0"
          >
            Reload squad
          </Button>
        </div>
      </Card>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No squad members yet"
          description="Add players to your squad roster before running gap analysis."
          action={
            <Button onClick={() => navigate('/dashboard/club/squad')} size="sm">
              Manage squad
            </Button>
          }
        />
      ) : !result ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No analysis yet"
          description="Run the analysis to identify where your squad needs reinforcement."
          action={
            <Button onClick={runAnalysis} loading={analyzing} size="sm" iconLeft={<Sparkles className="h-3.5 w-3.5" />}>
              Run analysis
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title="Coverage gaps"
            description={result.summary || 'Advisory output from your squad composition'}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <div className="mt-5">
            {result.gaps.length === 0 ? (
              <EmptyState
                compact
                icon={<Users className="h-6 w-6" />}
                title="No gaps detected"
                description="Your squad covers every position in this formation."
              />
            ) : (
              <ul className="space-y-2.5">
                {result.gaps.map((gap) => (
                  <li
                    key={gap.position}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-[11px] font-bold text-white">
                        {gap.position}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={SEVERITY_TONE[gap.severity]} dot>
                            {SEVERITY_LABEL[gap.severity]}
                          </Badge>
                          <Badge tone="violet">AI-assisted</Badge>
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{gap.note}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/dashboard/search?position=${gap.position}`)}
                      iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                      className="shrink-0"
                    >
                      Find players
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
