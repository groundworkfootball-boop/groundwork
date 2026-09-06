import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Star, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SavedOpportunity {
  id: string;
  title: string;
  clubName?: string;
  position?: string;
  region?: string;
}

export const ShortlistsPage = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'opportunities'), where('status', '==', 'active'));
        const snap = await getDocs(q);
        setSaved(
          snap.docs.slice(0, 4).map((d) => ({
            id: d.id,
            title: d.data().title || 'Trial Opportunity',
            clubName: d.data().clubName || 'Regional Club',
            position: d.data().position,
            region: d.data().region,
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Bookmarked Talent Calls</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Saved Clubs & Opportunities</h1>
        <p className="text-sm text-slate-400">Review trials and academy vacancies you have saved for application.</p>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        {saved.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Star className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No saved opportunities yet.</p>
            <p className="text-xs text-slate-500 mt-1">Browse compatible matches and bookmark them for later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/25 transition-all flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.title}</span>
                    <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-xs font-mono font-bold">
                      {item.position || 'Any'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.clubName} • {item.region || 'UK'}
                  </p>
                </div>

                <Link
                  to="/dashboard/opportunities"
                  className="bg-brand hover:bg-brand-hover text-black font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition-all shadow-md shadow-brand/10"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
