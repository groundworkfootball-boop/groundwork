import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Bell, Loader2 } from 'lucide-react';

interface NotificationDoc {
  id: string;
  title: string;
  body?: string;
  createdAt?: { seconds: number };
  read?: boolean;
}

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          limit(20)
        );
        const snap = await getDocs(q);
        setNotifs(
          snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title || 'Recruitment Alert',
            body: d.data().body,
            createdAt: d.data().createdAt,
            read: d.data().read,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Player Notifications</h1>
        <p className="text-sm text-slate-400">Updates on trial invites, shortlisted status, and club communications.</p>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        {notifs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No new notifications.</p>
            <p className="text-xs text-slate-500 mt-1">You&apos;ll be notified when clubs review your profile or invite you to trials.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                <Bell className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{n.title}</h3>
                  {n.body && <p className="text-xs text-slate-300 mt-0.5">{n.body}</p>}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
