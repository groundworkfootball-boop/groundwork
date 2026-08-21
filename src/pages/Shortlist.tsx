import { useEffect, useState } from 'react';
import { Star, Trash2, Loader2, AlertCircle, User, MapPin, StickyNote, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface ShortlistEntry {
  id: string;
  playerId: string;
  playerName?: string;
  playerPosition?: string;
  playerRegion?: string;
  matchScore?: number;
  notes?: string;
  createdAt?: { seconds: number };
}

export const Shortlist = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  const [entries, setEntries] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!user?.uid || role !== 'club') return;
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const q = query(collection(db, 'shortlists'), where('clubId', '==', user.uid));
        const snap = await getDocs(q);
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShortlistEntry)));
      } catch (err) {
        console.error('Shortlist error:', err);
        setFetchError('Failed to load shortlist. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, role]);

  const handleRemove = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, 'shortlists', entryId));
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      success('Player removed from shortlist.');
    } catch (err) {
      console.error(err);
      toastError('Failed to remove player. Please try again.');
    }
  };

  const startEditNotes = (entry: ShortlistEntry) => {
    setEditingNotes(entry.id);
    setNoteText(entry.notes ?? '');
  };

  const saveNotes = async (entryId: string) => {
    try {
      await updateDoc(doc(db, 'shortlists', entryId), {
        notes: noteText,
        updatedAt: serverTimestamp(),
      });
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, notes: noteText } : e)));
      setEditingNotes(null);
      success('Notes saved.');
    } catch (err) {
      console.error(err);
      toastError('Failed to save notes.');
    }
  };

  if (role !== 'club') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center text-text-secondary">
          <p>Shortlists are available for clubs only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Star className="w-7 h-7 text-brand" />
            <span>Shortlist</span>
          </h3>
          <p className="text-text-secondary text-sm mt-1">Players you've saved for recruitment consideration.</p>
        </div>
        <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-bold rounded uppercase tracking-widest">
          {entries.length} Players
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      )}

      {!loading && fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      {!loading && !fetchError && entries.length === 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <Star className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-text-primary mb-2">No players shortlisted yet</h4>
          <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">
            Browse players in the search section and shortlist the ones that match your recruitment needs.
          </p>
          <a
            href="/search"
            className="inline-flex items-center px-6 py-3 bg-brand text-dark-bg font-bold text-sm rounded hover:bg-brand-hover transition-colors uppercase tracking-wider"
          >
            Search Players
          </a>
        </div>
      )}

      {!loading && !fetchError && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-dark-surface border border-dark-border rounded-xl p-6 hover:border-brand/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center">
                    <User className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{entry.playerName ?? 'Player'}</h4>
                    <div className="flex items-center space-x-3 text-xs text-text-secondary mt-1">
                      {entry.playerPosition && (
                        <span className="px-2 py-0.5 bg-brand/10 border border-brand/20 text-brand font-bold rounded uppercase">
                          {entry.playerPosition}
                        </span>
                      )}
                      {entry.playerRegion && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{entry.playerRegion}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {entry.matchScore != null && (
                    <div className="text-right">
                      <p className="text-xl font-black text-brand">{Math.round(entry.matchScore * 100)}%</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest">Match</p>
                    </div>
                  )}
                  <button
                    onClick={() => startEditNotes(entry)}
                    className="p-2 text-text-secondary hover:text-brand border border-dark-border hover:border-brand/50 rounded-lg transition-colors"
                    title="Edit notes"
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="p-2 text-text-secondary hover:text-red-400 border border-dark-border hover:border-red-400/50 rounded-lg transition-colors"
                    title="Remove from shortlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes section */}
              {editingNotes === entry.id ? (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Notes</label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand resize-none"
                    rows={3}
                    placeholder="Add internal notes about this player..."
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => saveNotes(entry.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-brand text-dark-bg font-bold text-xs rounded hover:bg-brand-hover"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setEditingNotes(null)}
                      className="flex items-center space-x-1 px-3 py-1.5 border border-dark-border text-text-secondary font-bold text-xs rounded hover:bg-dark-bg"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                entry.notes && (
                  <div className="mt-3 pt-3 border-t border-dark-border">
                    <p className="text-xs text-text-secondary">
                      <span className="font-bold uppercase tracking-wider">Notes: </span>
                      {entry.notes}
                    </p>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
