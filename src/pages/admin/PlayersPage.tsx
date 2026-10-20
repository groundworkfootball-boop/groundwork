import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { Users, Eye, EyeOff, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import type { PlayerRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

export const PlayersPage = () => {
  const { success, error: toastError } = useToast();

  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, 'players'));
      setPlayers(
        snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<PlayerRecord, 'id'>) })),
      );
    } catch (err) {
      console.error(err);
      setError('We could not load players. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const toggleVisibility = async (player: PlayerRecord) => {
    setActionId(player.id);
    try {
      const callable = httpsCallable<
        { playerId: string; searchable: boolean },
        { ok: boolean; searchable: boolean }
      >(functions, 'adminSetPlayerVisibility');

      await callable({ playerId: player.id, searchable: !player.searchable });
      success(player.searchable ? 'Player hidden from search.' : 'Player made searchable.');
      await loadPlayers();
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'Could not update player visibility.';
      toastError(message);
    } finally {
      setActionId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players;
    return players.filter(
      (player) =>
        (player.name ?? '').toLowerCase().includes(term) ||
        (player.email ?? '').toLowerCase().includes(term) ||
        (player.region ?? '').toLowerCase().includes(term),
    );
  }, [players, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Administration" title="Players" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={loadPlayers} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Players"
        description="Visibility is server-owned. Youth profiles can never be made searchable without granted consent."
        actions={
          <Button variant="secondary" size="sm" onClick={loadPlayers} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total players</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-white">{players.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Youth profiles</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-amber-300">
            {players.filter((p) => p.isYouth).length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Searchable</p>
          <p className="gw-numeric mt-2 text-[24px] font-bold text-emerald-300">
            {players.filter((p) => p.searchable).length}
          </p>
        </Card>
      </div>

      <Card padding="sm">
        <Input
          placeholder="Search by name, email or region"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search className="h-4 w-4" />}
          aria-label="Search players"
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No players found"
          description={search ? 'No player matches that search.' : 'Registered players will appear here.'}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Player</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Region</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Consent</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Visible</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player) => (
                  <tr key={player.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-[12.5px] font-medium text-white">{player.name ?? '—'}</p>
                      <p className="text-[11px] text-slate-500">{player.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400">{player.region ?? '—'}</td>
                    <td className="px-4 py-3">
                      {player.isYouth ? (
                        <Badge tone="amber" icon={<ShieldCheck className="h-3 w-3" />}>Youth</Badge>
                      ) : (
                        <Badge tone="slate">Adult</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          player.consentStatus === 'granted'
                            ? 'emerald'
                            : player.consentStatus === 'withdrawn'
                              ? 'rose'
                              : player.isYouth
                                ? 'amber'
                                : 'slate'
                        }
                      >
                        {player.consentStatus ?? 'n/a'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {player.searchable ? (
                        <Eye className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleVisibility(player)}
                        loading={actionId === player.id}
                        disabled={player.isYouth && player.consentStatus !== 'granted' && !player.searchable}
                      >
                        {player.searchable ? 'Hide' : 'Show'}
                      </Button>
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
