import { useEffect, useState } from 'react';
import { FileText, ChevronRight, Loader2, AlertCircle, Clock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ApplicationDoc {
  id: string;
  playerId: string;
  clubId: string;
  opportunityId?: string;
  opportunityTitle?: string;
  clubName?: string;
  playerName?: string;
  status: string;
  message?: string;
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  viewed: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  shortlisted: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  trial_invited: 'text-brand bg-brand/10 border-brand/30',
  accepted: 'text-green-400 bg-green-400/10 border-green-400/30',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const CLUB_STATUS_OPTIONS = ['viewed', 'shortlisted', 'trial_invited', 'accepted', 'rejected'];

function formatDate(ts?: { seconds: number }): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const Applications = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const field = role === 'club' ? 'clubId' : 'playerId';
        const q = query(
          collection(db, 'applications'),
          where(field, '==', user.uid)
        );
        const snap = await getDocs(q);
        const fetchedApps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ApplicationDoc));
        // Sort in memory to avoid requiring a composite index in Firestore
        fetchedApps.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setApplications(fetchedApps);
      } catch (err) {
        console.error('Applications error:', err);
        setFetchError('Failed to load applications. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, role]);

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)),
      );
      success(`Application status updated to "${newStatus.replace('_', ' ')}".`);
    } catch (err) {
      console.error(err);
      toastError('Failed to update status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const title = role === 'club' ? 'Incoming Applications' : 'My Applications';
  const subtitle = role === 'club'
    ? 'Applications submitted to your opportunities.'
    : 'Track your applications to club opportunities.';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <FileText className="w-7 h-7 text-brand" />
            <span>{title}</span>
          </h3>
          <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
        </div>
        <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-bold rounded uppercase tracking-widest">
          {applications.length} Total
        </span>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      {!fetchError && applications.length === 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-text-primary mb-2">No applications yet</h4>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            {role === 'club'
              ? 'Applications to your posted opportunities will appear here.'
              : 'Browse opportunities and apply to get started.'}
          </p>
          {role === 'player' && (
            <a
              href="/opportunities"
              className="inline-block mt-4 px-4 py-2 bg-brand text-dark-bg font-bold text-xs rounded uppercase tracking-wider hover:bg-brand-hover"
            >
              Browse Opportunities
            </a>
          )}
        </div>
      )}

      {applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-brand/30 transition-colors"
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">
                        {role === 'club' ? (app.playerName ?? 'Player') : (app.opportunityTitle ?? 'Opportunity')}
                      </h4>
                      <p className="text-xs text-text-secondary truncate">
                        {role === 'club' ? `via ${app.opportunityTitle ?? 'your opportunity'}` : (app.clubName ?? 'Club')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-text-secondary flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(app.createdAt)}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${STATUS_STYLES[app.status] ?? 'text-text-secondary border-dark-border'}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-dark-border pt-4 space-y-4">
                    {app.message && (
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Message</p>
                        <p className="text-sm text-text-primary bg-dark-bg border border-dark-border rounded-lg p-3 leading-relaxed">
                          {app.message}
                        </p>
                      </div>
                    )}

                    {role === 'club' && (
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {CLUB_STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(app.id, s)}
                              className={`px-3 py-1.5 border rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                                app.status === s
                                  ? (STATUS_STYLES[s] ?? 'bg-brand/10 border-brand/30 text-brand')
                                  : 'border-dark-border text-text-secondary hover:border-brand/30 hover:text-brand'
                              }`}
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
