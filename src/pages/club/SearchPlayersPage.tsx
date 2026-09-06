import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Send, Loader2, AlertCircle, User, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface PlayerDoc {
  id: string;
  name?: string;
  positions?: string[];
  region?: string;
  playingLevel?: number;
  profileComplete?: number;
}

interface OpportunityDoc {
  id: string;
  title: string;
  position?: string;
  status: string;
}

export const SearchPlayersPage = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  
  // Invite Modal State
  const [invitingPlayer, setInvitingPlayer] = useState<PlayerDoc | null>(null);
  const [clubOpps, setClubOpps] = useState<OpportunityDoc[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<string>('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [clubName, setClubName] = useState<string>('Club');

  useEffect(() => {
    if (!user?.uid || role !== 'club') return;
    
    const loadData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch club name
        const clubSnap = await getDoc(doc(db, 'clubs', user.uid));
        if (clubSnap.exists()) {
          setClubName(clubSnap.data().name || user.name || 'Club');
        }

        // Fetch searchable adult players
        const playersQuery = query(
          collection(db, 'players'),
          where('searchable', '==', true),
          where('isYouth', '==', false)
        );
        const pSnap = await getDocs(playersQuery);
        setPlayers(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlayerDoc)));

        // Fetch club's active opportunities for invites
        const oppsQuery = query(
          collection(db, 'opportunities'),
          where('clubId', '==', user.uid),
          where('status', '==', 'active')
        );
        const oppsSnap = await getDocs(oppsQuery);
        setClubOpps(oppsSnap.docs.map(d => ({ id: d.id, ...d.data() } as OpportunityDoc)));

      } catch (err) {
        console.error('Search error:', err);
        setFetchError('Failed to load players. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.uid, role]);

  const handleShortlist = async (player: PlayerDoc) => {
    if (!user?.uid) return;
    try {
      // Check if already shortlisted
      const q = query(collection(db, 'shortlists'), where('clubId', '==', user.uid), where('playerId', '==', player.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toastError('Player is already in your shortlist.');
        return;
      }
      
      await addDoc(collection(db, 'shortlists'), {
        clubId: user.uid,
        playerId: player.id,
        playerName: player.name || 'Player',
        playerPosition: player.positions?.[0] || '',
        playerRegion: player.region || '',
        createdAt: serverTimestamp(),
      });
      success('Player added to shortlist!');
    } catch (err) {
      console.error(err);
      toastError('Failed to shortlist player.');
    }
  };

  const handleSendInvite = async () => {
    if (!invitingPlayer || !selectedOpp || !user?.uid) return;
    setSendingInvite(true);
    try {
      const opp = clubOpps.find(o => o.id === selectedOpp);
      if (!opp) throw new Error('Opportunity not found');

      // Check for duplicate application/invite
      const q = query(
        collection(db, 'applications'),
        where('playerId', '==', invitingPlayer.id),
        where('opportunityId', '==', selectedOpp)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        toastError('This player already has an application or invite for this opportunity.');
        setInvitingPlayer(null);
        return;
      }

      await addDoc(collection(db, 'applications'), {
        playerId: invitingPlayer.id,
        playerName: invitingPlayer.name || 'Player',
        clubId: user.uid,
        clubName: clubName,
        opportunityId: selectedOpp,
        opportunityTitle: opp.title,
        status: 'trial_invited',
        message: inviteMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      success('Invitation sent successfully!');
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

  const filteredPlayers = players.filter(p => {
    const matchesSearch = !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPos = !positionFilter || (p.positions && p.positions.some(pos => pos.toLowerCase().includes(positionFilter.toLowerCase())));
    return matchesSearch && matchesPos;
  });

  if (role !== 'club') {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center text-text-secondary">
          <p>Player search is available for clubs only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Player Database</h2>
          <p className="text-text-secondary text-sm mt-1">Discover and recruit top talent for your club.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-dark-surface border border-dark-border rounded-lg px-9 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full sm:w-40 bg-dark-surface border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors appearance-none"
          >
            <option value="">All Positions</option>
            <option value="ST">Striker</option>
            <option value="LW">Left Wing</option>
            <option value="RW">Right Wing</option>
            <option value="CAM">Attacking Mid</option>
            <option value="CM">Center Mid</option>
            <option value="CDM">Defensive Mid</option>
            <option value="LB">Left Back</option>
            <option value="RB">Right Back</option>
            <option value="CB">Center Back</option>
            <option value="GK">Goalkeeper</option>
          </select>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-16 text-center shadow-sm">
          <User className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-white mb-2">No players found</h4>
          <p className="text-text-secondary text-sm">
            {searchTerm || positionFilter ? 'Try adjusting your search filters.' : 'No searchable players available right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-brand/40 transition-all flex flex-col group">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center">
                    <User className="w-6 h-6 text-text-secondary" />
                  </div>
                  {player.profileComplete && player.profileComplete === 1 && (
                    <span className="flex items-center space-x-1 text-[10px] text-brand font-bold uppercase tracking-widest bg-brand/10 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{player.name || 'Anonymous Player'}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {player.positions?.map(pos => (
                    <span key={pos} className="px-2 py-0.5 bg-dark-bg border border-dark-border text-[10px] font-bold text-text-secondary uppercase tracking-widest rounded">
                      {pos}
                    </span>
                  ))}
                </div>
                
                <div className="space-y-2 text-sm text-text-secondary">
                  {player.region && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{player.region}</span>
                    </div>
                  )}
                  {player.playingLevel && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 shrink-0" />
                      <span className="truncate">Step {player.playingLevel} Level</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-dark-bg/50 border-t border-dark-border grid grid-cols-2 gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleShortlist(player)}
                  className="w-full py-2 border border-dark-border text-text-secondary hover:text-white font-bold text-xs uppercase tracking-widest rounded transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => setInvitingPlayer(player)}
                  className="w-full py-2 bg-brand text-dark-bg font-bold text-xs uppercase tracking-widest rounded hover:bg-brand-hover transition-colors"
                >
                  Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {invitingPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-white">Invite Player</h3>
                <p className="text-xs text-text-secondary mt-0.5">Invite {invitingPlayer.name} to a trial.</p>
              </div>
              <button onClick={() => setInvitingPlayer(null)} className="text-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Select Opportunity *</label>
                {clubOpps.length === 0 ? (
                  <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-lg">
                    <p className="text-sm text-amber-400">You don't have any active opportunities to invite this player to.</p>
                  </div>
                ) : (
                  <select
                    value={selectedOpp}
                    onChange={(e) => setSelectedOpp(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="" disabled>Choose an active opportunity...</option>
                    {clubOpps.map(opp => (
                      <option key={opp.id} value={opp.id}>{opp.title}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {clubOpps.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Message (Optional)</label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand resize-none"
                    rows={4}
                    placeholder="Add a personalized message to the player..."
                  />
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-dark-border flex justify-end space-x-3 bg-dark-bg/30">
              <button
                onClick={() => setInvitingPlayer(null)}
                className="px-5 py-2.5 border border-dark-border text-text-secondary font-bold text-sm rounded-lg hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sendingInvite || !selectedOpp}
                className="px-6 py-2.5 bg-brand text-dark-bg font-bold text-sm rounded-lg hover:bg-brand-hover disabled:opacity-60 flex items-center space-x-2 transition-colors"
              >
                {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Invite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
