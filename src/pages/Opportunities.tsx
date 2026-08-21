import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Info, Loader2, AlertCircle, Target, Send, X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { calculateMatchScore, type PlayerProfile, type ClubPreferences } from '../lib/scoringEngine';

interface OpportunityDoc {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  position?: string;
  region?: string;
  description?: string;
  type?: string;
  status: string;
  createdAt?: { seconds: number };
}

interface PlayerProfileData {
  positions?: string[];
  region?: string;
  playingLevel?: number;
  attributes?: Record<string, number>;
  availability?: string[];
  hasActiveBoost?: boolean;
  [key: string]: unknown;
}

interface ClubOppWithScore extends OpportunityDoc {
  score: number;
  breakdown: ReturnType<typeof calculateMatchScore>;
}

export const Opportunities = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'newest'>('match');
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  // Apply modal
  const [applyingTo, setApplyingTo] = useState<OpportunityDoc | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Load player profile for scoring
        if (role === 'player') {
          const playerSnap = await getDoc(doc(db, 'players', user.uid));
          if (playerSnap.exists()) {
            setPlayerProfile(playerSnap.data() as PlayerProfileData);
          }
        }

        // Load active opportunities
        const oppsQuery = query(collection(db, 'opportunities'), where('status', '==', 'active'));
        const oppsSnap = await getDocs(oppsQuery);
        setOpportunities(oppsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc)));
      } catch (err) {
        console.error('Opportunities error:', err);
        setFetchError('Failed to load opportunities. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, role]);

  // Build a PlayerProfile from Firestore data for scoring engine
  const enginePlayer: PlayerProfile = useMemo(() => ({
    positions: playerProfile?.positions ?? [],
    region: (playerProfile?.region as string) ?? '',
    playingLevel: (playerProfile?.playingLevel as number) ?? 1,
    skillRatings: (playerProfile?.attributes as Record<string, number>) ?? {},
    availability: (playerProfile?.availability as string[]) ?? [],
    hasActiveBoost: (playerProfile?.hasActiveBoost as boolean) ?? false,
  }), [playerProfile]);

  const matchedOpportunities: ClubOppWithScore[] = useMemo(() => {
    return opportunities
      .filter((opp) => {
        const term = searchTerm.toLowerCase();
        return !term || opp.title.toLowerCase().includes(term) || opp.clubName?.toLowerCase().includes(term) || opp.position?.toLowerCase().includes(term);
      })
      .map((opp) => {
        // Build minimal ClubPreferences for scoring
        const clubPrefs: ClubPreferences = {
          targetPositions: opp.position ? [opp.position] : [],
          region: opp.region ?? '',
          targetLevel: 4, // Default, clubs should set this
          requiredAvailability: [],
        };
        const breakdown = calculateMatchScore(enginePlayer, clubPrefs);
        return { ...opp, score: breakdown.totalScore, breakdown };
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.score - a.score;
        // newest: by createdAt
        return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
      });
  }, [opportunities, searchTerm, sortBy, enginePlayer]);

  const handleApply = async () => {
    if (!applyingTo || !user?.uid) return;
    setSubmitting(true);
    try {
      // Check for duplicate application
      const existingQ = query(
        collection(db, 'applications'),
        where('playerId', '==', user.uid),
        where('opportunityId', '==', applyingTo.id),
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        toastError('You have already applied to this opportunity.');
        setApplyingTo(null);
        return;
      }

      await addDoc(collection(db, 'applications'), {
        playerId: user.uid,
        playerName: user.name,
        clubId: applyingTo.clubId,
        clubName: applyingTo.clubName,
        opportunityId: applyingTo.id,
        opportunityTitle: applyingTo.title,
        status: 'submitted',
        message: applyMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      success('Application submitted successfully!');
      setApplyingTo(null);
      setApplyMessage('');
    } catch (err) {
      console.error('Apply error:', err);
      toastError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-black uppercase tracking-tight">
            {role === 'club' ? 'My Opportunities' : 'Active Opportunities'}
          </h2>
          <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-[10px] text-brand font-bold uppercase tracking-widest rounded shadow-[0_0_10px_rgba(204,255,0,0.2)]">
            {matchedOpportunities.length} {role === 'player' ? 'MATCHES' : 'TOTAL'}
          </span>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clubs, positions..."
            className="w-full bg-dark-surface border border-dark-border rounded-lg px-9 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg lg:sticky lg:top-6">
            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-text-secondary" />
                <h3 className="font-bold tracking-wider uppercase text-sm">Sort Options</h3>
              </div>
              <button onClick={() => setSortBy('match')} className="text-[10px] text-brand font-bold uppercase tracking-widest hover:underline">
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {[
                { value: 'match' as const, label: 'Best Match' },
                { value: 'newest' as const, label: 'Newest First' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-3 cursor-pointer group">
                  <input type="radio" name="sort" checked={sortBy === value} onChange={() => setSortBy(value)} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${sortBy === value ? 'border-brand bg-brand/10' : 'border-dark-border group-hover:border-text-secondary'}`}>
                    {sortBy === value && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <span className={`text-sm font-bold uppercase tracking-wider ${sortBy === value ? 'text-white' : 'text-text-secondary'}`}>{label}</span>
                </label>
              ))}
            </div>

            {role === 'player' && (
              <div className="mt-6 bg-dark-bg/50 border border-dark-border/50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Matches are scored deterministically: Position 30%, Level 20%, Attributes 20%, Region 15%, Availability 10%, Boost 5%.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opportunity List */}
        <div className="flex-1 space-y-6">
          {matchedOpportunities.length === 0 && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center shadow-lg">
              <Target className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-text-primary mb-2">No opportunities found</h4>
              <p className="text-text-secondary text-sm">
                {searchTerm ? 'No opportunities match your search.' : 'No active opportunities available yet.'}
              </p>
            </div>
          )}

          {matchedOpportunities.map((opp) => {
            const scorePercentage = Math.round(opp.score * 100);
            const isHighMatch = role === 'player' && scorePercentage >= 70;
            const isShowingBreakdown = showBreakdown === opp.id;

            return (
              <div
                key={opp.id}
                className={`bg-dark-surface border transition-all duration-300 p-6 rounded-xl relative overflow-hidden group shadow-lg ${isHighMatch ? 'border-brand/50 hover:border-brand' : 'border-dark-border hover:border-text-secondary/50'}`}
              >
                {isHighMatch && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
                )}

                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex space-x-6 items-start w-full">
                    {/* Score circle (only for players) */}
                    {role === 'player' && (
                      <div
                        className="relative w-20 h-20 shrink-0 cursor-pointer group/score"
                        onClick={() => setShowBreakdown(isShowingBreakdown ? null : opp.id)}
                      >
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r="44" fill="none"
                            stroke={isHighMatch ? '#ccff00' : '#f59e0b'}
                            strokeWidth="8"
                            strokeDasharray="276"
                            strokeDashoffset={276 - (276 * scorePercentage) / 100}
                            className={`transition-all duration-1000 ${isHighMatch ? 'drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]' : ''}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface/80 rounded-full opacity-0 group-hover/score:opacity-100 transition-opacity">
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest text-center px-1">View<br/>Stats</span>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center group-hover/score:opacity-0 transition-opacity">
                          <span className={`text-xl font-black leading-none ${isHighMatch ? 'text-brand' : 'text-amber-500'}`}>{scorePercentage}</span>
                          <span className="text-[8px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">Match</span>
                        </div>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {opp.type && (
                          <span className="px-2 py-0.5 bg-dark-bg border border-dark-border text-[10px] font-bold text-text-secondary uppercase tracking-widest rounded">
                            {opp.type.replace('_', ' ')}
                          </span>
                        )}
                        {opp.region && (
                          <span className="px-2 py-0.5 bg-dark-bg border border-dark-border text-[10px] font-bold text-text-secondary uppercase tracking-widest rounded">
                            {opp.region}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1 text-white">{opp.title}</h3>
                      {opp.clubName && (
                        <p className="text-sm text-text-secondary mb-2">{opp.clubName}</p>
                      )}
                      {opp.position && (
                        <p className="text-sm text-text-secondary">
                          Seeking: <span className="text-brand font-bold bg-brand/10 px-2 py-0.5 rounded">{opp.position}</span>
                        </p>
                      )}
                      {opp.description && (
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2">{opp.description}</p>
                      )}
                    </div>
                  </div>

                  {role === 'player' && (
                    <div className="space-y-3 w-full md:w-48 shrink-0">
                      <button
                        onClick={() => setApplyingTo(opp)}
                        className="w-full py-3 bg-brand text-dark-bg font-bold text-xs uppercase tracking-widest rounded hover:bg-brand-hover transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Score Breakdown */}
                {isShowingBreakdown && role === 'player' && (
                  <div className="mt-6 pt-6 border-t border-dark-border animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center">
                      <SlidersHorizontal className="w-4 h-4 mr-2 text-brand" />
                      Match Breakdown (Deterministic)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {[
                        { label: 'Position', value: opp.breakdown.positionMatch },
                        { label: 'Level', value: opp.breakdown.levelMatch },
                        { label: 'Attributes', value: opp.breakdown.attributesMatch },
                        { label: 'Region', value: opp.breakdown.distanceMatch },
                        { label: 'Availability', value: opp.breakdown.availabilityMatch },
                        { label: 'Boost', value: opp.breakdown.boostMatch },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                          <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">{label}</p>
                          <p className="text-lg font-black text-white">{Math.round(value * 100)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Apply Modal */}
      {applyingTo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Apply for Opportunity</h3>
                <p className="text-xs text-text-secondary mt-0.5">{applyingTo.title}</p>
              </div>
              <button onClick={() => setApplyingTo(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <p className="text-sm font-bold">{applyingTo.title}</p>
                {applyingTo.clubName && <p className="text-xs text-text-secondary">{applyingTo.clubName}</p>}
                {applyingTo.position && (
                  <p className="text-xs text-text-secondary mt-1">Position: <span className="text-brand">{applyingTo.position}</span></p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Message (Optional)</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand resize-none"
                  rows={4}
                  placeholder="Introduce yourself to the club..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-dark-border flex justify-end space-x-3">
              <button onClick={() => setApplyingTo(null)} className="px-4 py-2 border border-dark-border text-text-secondary font-bold text-sm rounded hover:bg-dark-bg">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="px-6 py-2 bg-brand text-dark-bg font-bold text-sm rounded hover:bg-brand-hover disabled:opacity-60 flex items-center space-x-2"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
