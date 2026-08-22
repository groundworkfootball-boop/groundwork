import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Loader2, AlertCircle, Plus, X, Save, Users, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';

interface TrialDoc {
  id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
  clubId?: string;
  clubName?: string;
  status?: string;
  createdAt?: { seconds: number };
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Make Monday = 0
  const days: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const TrialManager = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [trials, setTrials] = useState<TrialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Create trial modal
  const [showModal, setShowModal] = useState(false);
  const [savingTrial, setSavingTrial] = useState(false);
  const [newTrial, setNewTrial] = useState({ title: '', date: '', time: '', location: '', notes: '' });

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const field = role === 'club' ? 'clubId' : 'playerId';
        const q = query(
          collection(db, 'trials'),
          where(field, '==', user.uid)
        );
        const snap = await getDocs(q);
        const fetchedTrials = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrialDoc));
        // Sort in memory to avoid requiring a composite index in Firestore
        fetchedTrials.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setTrials(fetchedTrials);
      } catch (err) {
        console.error('Trials error:', err);
        setFetchError('Failed to load trials.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, role]);

  const handleCreateTrial = async () => {
    if (!newTrial.title.trim()) {
      toastError('Please enter a trial title.');
      return;
    }
    setSavingTrial(true);
    try {
      const data: Record<string, unknown> = {
        title: newTrial.title,
        date: newTrial.date,
        time: newTrial.time,
        location: newTrial.location,
        notes: newTrial.notes,
        status: 'scheduled',
        createdAt: serverTimestamp(),
      };
      if (role === 'club') {
        data.clubId = user?.uid;
        data.clubName = user?.name;
      } else {
        data.playerId = user?.uid;
      }

      const ref = await addDoc(collection(db, 'trials'), data);
      setTrials((prev) => [{ id: ref.id, ...newTrial, status: 'scheduled' } as TrialDoc, ...prev]);
      setNewTrial({ title: '', date: '', time: '', location: '', notes: '' });
      setShowModal(false);
      success('Trial created successfully!');
    } catch (err) {
      console.error(err);
      toastError('Failed to create trial.');
    } finally {
      setSavingTrial(false);
    }
  };

  // Calendar nav
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const days = getMonthDays(year, month);

  // Trials for selected day
  const selectedTrials = selectedDay
    ? trials.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
      })
    : [];

  // Days that have trials
  const trialDays = new Set(
    trials
      .filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((t) => new Date(t.date!).getDate()),
  );

  const inputCls = 'w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand transition-colors';

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Trial Manager</h2>
          <p className="text-text-secondary text-sm mt-1">
            {role === 'club' ? 'Manage trial events and invitations.' : 'View and track your trial schedule.'}
          </p>
        </div>
        {role === 'club' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand text-dark-bg font-bold text-sm rounded hover:bg-brand-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Trial</span>
          </button>
        )}
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      <div className="flex flex-1 gap-6 flex-col lg:flex-row">
        {/* Calendar */}
        <div className="flex-1 space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            {/* Month nav */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center border border-dark-border rounded hover:bg-dark-bg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-bold tracking-widest uppercase">{MONTHS[month]} {year}</h3>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center border border-dark-border rounded hover:bg-dark-bg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-text-secondary tracking-widest uppercase py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const hasTrial = day ? trialDays.has(day) : false;
                const isSelected = selectedDay === day && day !== null;

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    className={`h-16 sm:h-20 rounded-lg p-2 relative transition-colors ${
                      day
                        ? `cursor-pointer ${isSelected ? 'bg-dark-surface border border-brand' : 'bg-dark-bg border border-dark-border hover:border-brand/30'}`
                        : 'bg-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-bold ${isToday ? 'text-brand' : 'text-text-primary'}`}>{day}</span>
                        {hasTrial && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day trials */}
          {selectedDay && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
              <h4 className="font-bold uppercase tracking-widest text-sm mb-4">
                {MONTHS[month]} {selectedDay}, {year}
              </h4>
              {selectedTrials.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-4">No trials scheduled for this day.</p>
              ) : (
                <div className="space-y-4">
                  {selectedTrials.map((trial) => (
                    <div key={trial.id} className="bg-dark-bg border border-dark-border rounded-lg p-5">
                      <h5 className="font-bold text-lg mb-3">{trial.title}</h5>
                      <div className="flex items-center space-x-6 text-sm text-text-secondary">
                        {trial.time && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{trial.time}</span>
                          </div>
                        )}
                        {trial.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{trial.location}</span>
                          </div>
                        )}
                      </div>
                      {trial.notes && (
                        <p className="text-sm text-text-secondary mt-3 border-t border-dark-border pt-3">{trial.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: All Trials */}
        <div className="w-full lg:w-80 shrink-0 bg-dark-surface border border-dark-border rounded-xl flex flex-col">
          <div className="p-5 border-b border-dark-border flex justify-between items-center">
            <h3 className="font-bold uppercase tracking-tight">All Trials</h3>
            <span className="text-xs font-black text-brand">{trials.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-brand animate-spin" />
              </div>
            ) : trials.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No trials scheduled yet.</p>
                {role === 'club' && (
                  <p className="text-text-secondary/60 text-xs mt-1">Create a trial to get started.</p>
                )}
                {role === 'player' && (
                  <p className="text-text-secondary/60 text-xs mt-1">
                    Trial invitations from clubs will appear here.
                  </p>
                )}
              </div>
            ) : (
              trials.map((trial) => (
                <div
                  key={trial.id}
                  className="p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-brand/30 cursor-pointer transition-colors"
                  onClick={() => {
                    if (trial.date) {
                      const d = new Date(trial.date);
                      setYear(d.getFullYear());
                      setMonth(d.getMonth());
                      setSelectedDay(d.getDate());
                    }
                  }}
                >
                  <h4 className="font-bold text-sm">{trial.title}</h4>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-text-secondary">
                    {trial.date && <span>{new Date(trial.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {trial.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{trial.location}</span>
                      </span>
                    )}
                  </div>
                  {trial.status && (
                    <span className={`mt-2 inline-block px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-widest ${
                      trial.status === 'scheduled' ? 'border-brand/30 text-brand bg-brand/5' : 'border-dark-border text-text-secondary'
                    }`}>
                      {trial.status}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {role === 'club' && (
            <div className="p-4 border-t border-dark-border">
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-2.5 bg-dark-bg border border-dark-border text-text-primary text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-2 hover:border-brand/50 hover:text-brand transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Trial</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Trial Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h3 className="text-lg font-bold uppercase tracking-tight flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand" />
                <span>Create Trial</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Trial Title *</label>
                <input type="text" value={newTrial.title} onChange={(e) => setNewTrial((p) => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="e.g. U18 Academy Trial Day" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Date</label>
                  <input type="date" value={newTrial.date} onChange={(e) => setNewTrial((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Time</label>
                  <input type="text" value={newTrial.time} onChange={(e) => setNewTrial((p) => ({ ...p, time: e.target.value }))} className={inputCls} placeholder="e.g. 14:00 - 17:00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Location</label>
                <input type="text" value={newTrial.location} onChange={(e) => setNewTrial((p) => ({ ...p, location: e.target.value }))} className={inputCls} placeholder="Training ground, pitch number..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Notes (Internal)</label>
                <textarea value={newTrial.notes} onChange={(e) => setNewTrial((p) => ({ ...p, notes: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder="Tactical focus, requirements..." />
              </div>
            </div>
            <div className="p-6 border-t border-dark-border flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-dark-border text-text-secondary font-bold text-sm rounded hover:bg-dark-bg">
                Cancel
              </button>
              <button
                onClick={handleCreateTrial}
                disabled={savingTrial}
                className="flex items-center space-x-2 px-6 py-2 bg-brand text-dark-bg font-bold text-sm rounded hover:bg-brand-hover disabled:opacity-60"
              >
                {savingTrial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Trial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
