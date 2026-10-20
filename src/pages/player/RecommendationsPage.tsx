import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, ChevronRight, X, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { PlayerRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { deriveRecommendations, type SignalRecommendation } from '../../lib/playerSignals';

type Recommendation = SignalRecommendation;

const PRIORITY_TONE = {
  high: 'rose',
  medium: 'amber',
  low: 'slate',
} as const;

const DISMISS_KEY = 'gw:dismissed-recommendations';
const AI_UNAVAILABLE_KEY = 'gw:ai-callable-unavailable';

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function keyOf(rec: Recommendation): string {
  return `${rec.action}::${rec.reason}`.slice(0, 200);
}


export const RecommendationsPage = () => {
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);

    // Always read the player's own profile first — it powers the deterministic
    // fallback and is required for the AI callable anyway.
    let player: PlayerRecord | null = null;
    try {
      const snapshot = await getDoc(doc(db, 'players', user.uid));
      if (snapshot.exists()) {
        player = { id: snapshot.id, ...(snapshot.data() as Omit<PlayerRecord, 'id'>) };
      }
    } catch (err) {
      console.warn('[recommendations] profile read failed', err);
    }

    // Skip the callable for the rest of the session once it is known to be
    // undeployed, so we do not hammer a 404 on every navigation.
    if (sessionStorage.getItem(AI_UNAVAILABLE_KEY) === '1') {
      setRecommendations(deriveRecommendations(player));
      setSource('signals');
      setLoading(false);
      return;
    }

    try {
      const callable = httpsCallable<
        Record<string, never>,
        { recommendations: Recommendation[]; advisoryOnly: boolean; source: string }
      >(functions, 'getPlayerRecommendations');

      const { data } = await callable({});
      const list = data.recommendations ?? [];
      if (list.length > 0) {
        setRecommendations(list);
        setSource(data.source ?? 'generated');
        setLoading(false);
        return;
      }
      // Consent-blocked or empty AI result → fall back to deterministic signals.
      setRecommendations(deriveRecommendations(player));
      setSource(data.source === 'blocked-consent' ? 'blocked-consent' : 'signals');
    } catch (err) {
      // Functions may not be deployed yet. Degrade gracefully to the
      // deterministic signal-based suggestions instead of erroring.
      console.warn('[recommendations] AI callable unavailable, using signals', err);
      try {
        sessionStorage.setItem(AI_UNAVAILABLE_KEY, '1');
      } catch {
        /* storage may be unavailable */
      }
      setRecommendations(deriveRecommendations(player));
      setSource('signals');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = (rec: Recommendation) => {
    const next = [...dismissed, keyOf(rec)];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
  };

  const visible = recommendations.filter((rec) => !dismissed.includes(keyOf(rec)));

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="AI assistance" title="Improvement suggestions" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI assistance"
        title="Improvement suggestions"
        description="Generated only from your own profile signals. Never shared with clubs and never used to score you."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand/[0.06] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div>
          <p className="text-[13px] font-semibold text-brand">Advisory only</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-300">
            These suggestions read your own structured data and propose actions. They do not change your match score —
            only the deterministic engine does that, and only from your profile fields.
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title={recommendations.length === 0 ? 'No suggestions right now' : 'All suggestions addressed'}
          description={
            recommendations.length === 0
              ? 'Your profile signals look complete. Add a new video or update your availability to generate fresh suggestions.'
              : 'You have dismissed every current suggestion. Refresh to check for new ones.'
          }
          action={
            <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
              Check again
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((rec) => (
            <Card key={keyOf(rec)} padding="md" variant="interactive">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-400/10">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-white">{rec.action}</h3>
                      <Badge tone={PRIORITY_TONE[rec.priority]}>{rec.priority}</Badge>
                      <Badge tone="violet">AI-assisted</Badge>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{rec.reason}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to="/dashboard/player/profile-builder"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12px] font-semibold text-ink-950 transition-colors hover:bg-brand-hover"
                  >
                    Take action
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismiss(rec)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
                    aria-label={`Dismiss: ${rec.action}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {source ? (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <AlertCircle className="h-3 w-3" />
          {source === 'cache'
            ? 'Cached result for unchanged signals'
            : source === 'blocked-consent'
              ? 'Blocked — guardian consent required'
              : source === 'signals'
                ? 'Derived from your profile signals'
                : 'Freshly generated'}
        </p>
      ) : null}
    </div>
  );
};



