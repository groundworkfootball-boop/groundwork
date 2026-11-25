import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Send,
  Loader2,
  User,
  X,
  CheckCircle2,
  Eye,
  Video,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  limit,
  orderBy,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Progress } from '../../components/ui/Progress';
import { calculateMatchScore } from '../../lib/scoringEngine';

interface PlayerDoc {
  id: string;
  name?: string;
  displayName?: string;
  positions?: string[];
  region?: string;
  ageBand?: string;
  playingLevel?: number;
  availability?: string[];
  skillRatings?: Record<string, number>;
  profileCompleteness?: number;
  profileComplete?: number;
  videoCount?: number;
  verified?: boolean;
  isYouth?: boolean;
  consentStatus?: string;
  boostsActive?: boolean;
  updatedAtMs?: number;
  matchScore?: number;
}

interface OpportunityDoc {
  id: string;
  title: string;
  position?: string;
  status: string;
}

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const REGIONS = [
  'London',
  'South East',
  'South West',
  'East of England',
  'Midlands',
  'North West',
  'North East',
  'Yorkshire',
  'Wales',
  'Scotland',
  'Northern Ireland',
];
const AGE_BANDS = ['U16', 'U18', 'U21', 'Senior'];
const PAGE_SIZE = 12;

export const SearchPlayersPage = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams] = useSearchParams();

  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastCursor, setLastCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState(searchParams.get('position') || '');
  const [regionFilter, setRegionFilter] = useState('');
  const [ageBandFilter, setAgeBandFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [minCompleteness, setMinCompleteness] = useState<number>(0);
  const [onlyWithVideo, setOnlyWithVideo] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'completeness' | 'recent'>('match');

  const [invitingPlayer, setInvitingPlayer] = useState<PlayerDoc | null>(null);
  const [clubOpps, setClubOpps] = useState<OpportunityDoc[]>([]);
  const [selectedOpp, setSelectedOpp] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [clubData, setClubData] = useState<Record<string, unknown>>({});

  const loadPlayers = useCallback(
    async (cursor?: QueryDocumentSnapshot<DocumentData> | null) => {
      if (!user?.uid || role !== 'club') return;
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      setFetchError(null);

      try {
        const clubSnap = await getDoc(doc(db, 'clubs', user.uid));
        const cData = clubSnap.exists() ? clubSnap.data() : {};
        setClubData(cData);

        const isYouthVerified =
          cData.verifiedYouth === true &&
          cData.verificationStatus === 'approved' &&
          (!cData.youthVerificationExpiresAt?.seconds ||
            cData.youthVerificationExpiresAt.seconds * 1000 > Date.now());

        // Prefer precomputed matchResults when available; fall back to cursor-paginated
        // eligible player snapshots so clubs always get deterministic, safeguarding-safe results.
        const matchConstraints = [
          where('clubId', '==', user.uid),
          where('searchable', '==', true),
          orderBy('matchScore', 'desc'),
          ...(cursor ? [startAfter(cursor)] : []),
          limit(PAGE_SIZE),
        ];

        const matchSnap = await getDocs(query(collection(db, 'matchResults'), ...matchConstraints)).catch(() => null);

        if (matchSnap && !matchSnap.empty) {
          const rows: PlayerDoc[] = [];
          for (const d of matchSnap.docs) {
            const m = d.data();
            const snapshot = (m.playerSnapshot ?? {}) as Record<string, unknown>;
            const isYouth = m.isYouth === true || snapshot.isYouth === true;
            if (isYouth && !isYouthVerified) continue;
            rows.push({
              id: String(m.playerId),
              name: (snapshot.displayName as string) || (m.playerName as string) || 'Player',
              displayName: (snapshot.displayName as string) || (m.playerName as string) || 'Player',
              positions: (snapshot.positions as string[]) || (m.position ? [String(m.position)] : []),
              region: (snapshot.region as string) || (m.region as string),
              ageBand: (snapshot.ageBand as string) || (m.ageBand as string),
              playingLevel: snapshot.playingLevel as number | undefined,
              profileCompleteness: snapshot.profileCompleteness as number | undefined,
              videoCount: snapshot.videoCount as number | undefined,
              verified: Boolean(snapshot.verified),
              matchScore: typeof m.matchScore === 'number' ? m.matchScore : undefined,
            });
          }
          setPlayers((prev) => (cursor ? [...prev, ...rows] : rows));
          setLastCursor(matchSnap.docs[matchSnap.docs.length - 1] ?? null);
          setHasMore(matchSnap.docs.length === PAGE_SIZE);
        } else {
          // Paginated eligible adult players (plus consented youth only when club youth verification is live)
          const adultQuery = query(
            collection(db, 'players'),
            where('searchable', '==', true),
            where('isYouth', '==', false),
            ...(cursor ? [startAfter(cursor)] : []),
            limit(PAGE_SIZE),
          );
          const pSnap = await getDocs(adultQuery);
          let combined = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PlayerDoc));

          if (isYouthVerified && !cursor) {
            const ySnap = await getDocs(
              query(
                collection(db, 'players'),
                where('searchable', '==', true),
                where('isYouth', '==', true),
                where('consentStatus', '==', 'granted'),
                limit(PAGE_SIZE),
              ),
            );
            combined = [...combined, ...ySnap.docs.map((d) => ({ id: d.id, ...d.data() } as PlayerDoc))];
          }

          setPlayers((prev) => (cursor ? [...prev, ...combined] : combined));
          setLastCursor(pSnap.docs[pSnap.docs.length - 1] ?? null);
          setHasMore(pSnap.docs.length === PAGE_SIZE);
        }

        if (!cursor) {
          const oppsSnap = await getDocs(
            query(collection(db, 'opportunities'), where('clubId', '==', user.uid), where('status', '==', 'active')),
          );
          setClubOpps(oppsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc)));
        }
      } catch (err) {
        console.error('Search error:', err);
        setFetchError('Failed to load eligible players. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user?.uid, role],
  );

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const scoredPlayers = useMemo(() => {
    const targetPositions = Array.isArray(clubData.targetPositions) && clubData.targetPositions.length
      ? (clubData.targetPositions as string[])
      : ['CM'];
    const targetLevel = Array.isArray(clubData.targetPlayingLevels) && clubData.targetPlayingLevels.length
      ? Number(clubData.targetPlayingLevels[0])
      : 5;
    const clubRegion = (clubData.region as string) || 'London';

    return players.map((p) => {
      if (typeof p.matchScore === 'number') {
        return { ...p, computedMatch: p.matchScore };
      }
      const res = calculateMatchScore(
        {
          positions: p.positions || [],
          region: p.region || 'London',
          playingLevel: p.playingLevel || 5,
          skillRatings: p.skillRatings ?? {},
          availability: p.availability || [],
          hasActiveBoost: Boolean(p.boostsActive),
        },
        {
          targetPositions,
          region: clubRegion,
          targetLevel,
          requiredAvailability: Array.isArray(clubData.trainingAvailability)
            ? (clubData.trainingAvailability as string[])
            : [],
        },
      );
      return { ...p, computedMatch: res.totalScore };
    });
  }, [players, clubData]);

  const filteredPlayers = useMemo(() => {
    const filtered = scoredPlayers.filter((p) => {
      const displayName = (p.displayName || p.name || '').toLowerCase();
      const matchesSearch = !searchTerm || displayName.includes(searchTerm.toLowerCase());
      const matchesPos = !positionFilter || (p.positions ?? []).includes(positionFilter);
      const matchesRegion = !regionFilter || p.region === regionFilter;
      const matchesAgeBand = !ageBandFilter || p.ageBand === ageBandFilter;
      const matchesLevel = !levelFilter || String(p.playingLevel ?? '') === levelFilter;
      const completeness = p.profileCompleteness ?? p.profileComplete ?? 0;
      const matchesCompleteness = completeness >= minCompleteness;
      const matchesVideo = !onlyWithVideo || (p.videoCount ?? 0) > 0;
      return (
        matchesSearch &&
        matchesPos &&
        matchesRegion &&
        matchesAgeBand &&
        matchesLevel &&
        matchesCompleteness &&
        matchesVideo
      );
    });

    filtered.sort((a, b) => {
      if (sortBy === 'completeness') {
        return (b.profileCompleteness ?? 0) - (a.profileCompleteness ?? 0);
      }
      if (sortBy === 'recent') {
        return (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0);
      }
      return (b.computedMatch ?? 0) - (a.computedMatch ?? 0);
    });

    return filtered;
  }, [scoredPlayers, searchTerm, positionFilter, regionFilter, ageBandFilter, levelFilter, minCompleteness, onlyWithVideo, sortBy]);

  const handleShortlist = async (player: PlayerDoc) => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, 'shortlists'), where('clubId', '==', user.uid), where('playerId', '==', player.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toastError('Player is already in your shortlist.');
        return;
      }

      await addDoc(collection(db, 'shortlists'), {
        clubId: user.uid,
        playerId: player.id,
        playerName: player.displayName || player.name || 'Player',
        playerPosition: player.positions?.[0] || '',
        playerRegion: player.region || '',
        createdAt: serverTimestamp(),
      });
      success('Player added to shortlist.');
    } catch (err) {
      console.error(err);
      toastError('Failed to shortlist player.');
    }
  };

  const handleSendInvite = async () => {
    if (!invitingPlayer || !selectedOpp || !user?.uid) return;
    setSendingInvite(true);
    try {
      const opp = clubOpps.find((o) => o.id === selectedOpp);
      if (!opp) throw new Error('Opportunity not found');

      const q = query(
        collection(db, 'applications'),
        where('playerId', '==', invitingPlayer.id),
        where('opportunityId', '==', selectedOpp),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        toastError('This player already has an application or invite for this opportunity.');
        setInvitingPlayer(null);
        return;
      }

      await addDoc(collection(db, 'applications'), {
        playerId: invitingPlayer.id,
        playerName: invitingPlayer.displayName || invitingPlayer.name || 'Player',
        clubId: user.uid,
        clubName: (clubData.name as string) || user.name || 'Club',
        opportunityId: selectedOpp,
        opportunityTitle: opp.title,
        status: 'trial_invited',
        message: inviteMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      success('Trial invitation sent.');
      setInvitingPlayer(null);
      setInviteMessage('');
      setSelectedOpp('');
    } catch (err) {
      console.error(err);
      toastError('Failed to send invite.');
    } finally {
      setSendingInvite(false);
    }
  };

  if (role !== 'club') {
    return (
      <EmptyState
        icon={<User className="h-6 w-6" />}
        title="Club access only"
        description="Player discovery is scoped to verified football clubs."
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Recruitment search"
        title="Player database"
        description="Deterministic match scoring with server-enforced youth safeguarding and cursor pagination."
        actions={
          <Badge tone={clubData.verifiedYouth ? 'emerald' : 'sky'} dot>
            {clubData.verifiedYouth ? 'Adult + Youth Access' : 'Adult Access'}
          </Badge>
        }
      />

      <Card padding="sm" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search player name…"
              className="w-full rounded-xl border border-white/[0.10] bg-ink-950 py-2.5 pl-9 pr-3 text-[13px] text-white focus:border-brand focus:outline-none"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            aria-label="Filter by position"
            className="rounded-xl border border-white/[0.10] bg-ink-950 px-3 py-2.5 text-[13px] text-white focus:border-brand focus:outline-none"
          >
            <option value="">All positions</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="Filter by region"
            className="rounded-xl border border-white/[0.10] bg-ink-950 px-3 py-2.5 text-[13px] text-white focus:border-brand focus:outline-none"
          >
            <option value="">All regions</option>
            {REGIONS.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </span>
          <select
            value={ageBandFilter}
            onChange={(e) => setAgeBandFilter(e.target.value)}
            aria-label="Filter by age band"
            className="rounded-lg border border-white/[0.08] bg-ink-950 px-2.5 py-1.5 text-[12px] text-slate-200"
          >
            <option value="">All ages</option>
            {AGE_BANDS.map((band) => (
              <option key={band} value={band}>
                {band}
              </option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            aria-label="Filter by playing level"
            className="rounded-lg border border-white/[0.08] bg-ink-950 px-2.5 py-1.5 text-[12px] text-slate-200"
          >
            <option value="">All steps</option>
            {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
              <option key={lvl} value={String(lvl)}>
                Step {lvl}
              </option>
            ))}
          </select>
          <select
            value={String(minCompleteness)}
            onChange={(e) => setMinCompleteness(Number(e.target.value))}
            aria-label="Minimum completeness"
            className="rounded-lg border border-white/[0.08] bg-ink-950 px-2.5 py-1.5 text-[12px] text-slate-200"
          >
            <option value="0">Any completeness</option>
            <option value="50">50%+ completeness</option>
            <option value="80">80%+ completeness</option>
          </select>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-ink-950 px-2.5 py-1.5 text-[12px] text-slate-200">
            <input
              type="checkbox"
              checked={onlyWithVideo}
              onChange={(e) => setOnlyWithVideo(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-ink-950 text-brand"
            />
            <Video className="h-3.5 w-3.5 text-slate-400" /> Has video
          </label>

          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'completeness' | 'recent')}
              aria-label="Sort results"
              className="rounded-lg border border-white/[0.08] bg-ink-950 px-2.5 py-1.5 text-[12px] text-slate-200"
            >
              <option value="match">Sort: Match score</option>
              <option value="completeness">Sort: Completeness</option>
              <option value="recent">Sort: Recent activity</option>
            </select>
          </div>
        </div>
      </Card>

      {fetchError ? (
        <ErrorState description={fetchError} onRetry={() => void loadPlayers()} />
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="No matching players"
          description="Try broadening your position, region, or completeness filters."
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map((player) => {
              const scorePct = Math.round((player.computedMatch ?? 0) * 100);
              const completeness = player.profileCompleteness ?? player.profileComplete ?? 0;
              return (
                <Card key={player.id} padding="md" className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10">
                          <span className="gw-numeric text-[14px] font-bold text-brand">{scorePct}%</span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/dashboard/club/player/${player.id}`}
                            className="block truncate text-[15px] font-semibold text-white hover:text-brand"
                          >
                            {player.displayName || player.name || 'Player'}
                          </Link>
                          <p className="text-[11.5px] text-slate-500">
                            {(player.positions ?? []).join(' · ') || 'Position unset'}
                            {player.ageBand ? ` · ${player.ageBand}` : ''}
                          </p>
                        </div>
                      </div>
                      {player.verified ? (
                        <Badge tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>
                          Verified
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2 text-[12px] text-slate-400">
                      {player.region ? (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {player.region}
                        </p>
                      ) : null}
                      {player.playingLevel ? (
                        <p className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-slate-500" />
                          Step {player.playingLevel}
                        </p>
                      ) : null}
                      <div>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span>Profile completeness</span>
                          <span className="gw-numeric text-slate-300">{completeness}%</span>
                        </div>
                        <Progress value={completeness} size="sm" tone={completeness >= 80 ? 'emerald' : 'brand'} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                    <Link
                      to={`/dashboard/club/player/${player.id}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.08]"
                    >
                      <Eye className="h-3.5 w-3.5 text-brand" />
                      View dossier &amp; breakdown
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleShortlist(player)}>
                        Shortlist
                      </Button>
                      <Button size="sm" onClick={() => setInvitingPlayer(player)}>
                        Invite
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" loading={loadingMore} onClick={() => void loadPlayers(lastCursor)}>
                Load more players
              </Button>
            </div>
          ) : null}
        </>
      )}

      {invitingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.10] bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
              <div>
                <h3 className="text-[16px] font-bold text-white">Invite player</h3>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  Invite {invitingPlayer.displayName || invitingPlayer.name} to an active opportunity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInvitingPlayer(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Select opportunity
                </label>
                {clubOpps.length === 0 ? (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] text-amber-200">
                    Publish an active opportunity first before sending trial invitations.
                  </p>
                ) : (
                  <select
                    value={selectedOpp}
                    onChange={(e) => setSelectedOpp(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.10] bg-ink-950 px-3 py-2.5 text-[13px] text-white"
                  >
                    <option value="" disabled>
                      Choose an active opportunity…
                    </option>
                    {clubOpps.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {clubOpps.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Message (optional)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    placeholder="Trial date, pitch details, or instructions…"
                    className="w-full resize-none rounded-xl border border-white/[0.10] bg-ink-950 px-3 py-2.5 text-[13px] text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-white/[0.07] bg-ink-950/60 p-4">
              <Button variant="ghost" size="sm" onClick={() => setInvitingPlayer(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={sendingInvite}
                disabled={!selectedOpp}
                onClick={handleSendInvite}
                iconLeft={<Send className="h-3.5 w-3.5" />}
              >
                Send invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
