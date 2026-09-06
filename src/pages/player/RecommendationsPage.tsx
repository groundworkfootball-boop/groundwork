import { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronRight, X, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecommendationsPage = () => {
  const [recs, setRecs] = useState([
    {
      id: '1',
      title: 'Declare Preferred Foot & Height',
      reason: 'Physical profile details increase recruiter filter discovery by 35%.',
      link: '/dashboard/profile',
      actionText: 'Update Physical Attributes',
    },
    {
      id: '2',
      title: 'Log Weekly Training Availability',
      reason: 'Local clubs use availability overlap (10% weight) when prioritizing trial invites.',
      link: '/dashboard/profile',
      actionText: 'Set Availability',
    },
    {
      id: '3',
      title: 'Upload Match Clip in Attacking Third',
      reason: 'Position-specific footage allows automated observable tagging for scouts.',
      link: '/dashboard/videos',
      actionText: 'Upload Highlight Clip',
    },
  ]);

  const handleDismiss = (id: string) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Profile Optimization</span>
          <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-mono font-bold">
            STRUCTURED SIGNALS
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">AI Improvement Suggestions</h1>
        <p className="text-sm text-slate-400">
          Tailored recommendations generated solely from your profile completeness data. Never shared with clubs.
        </p>
      </div>

      <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white">Private & Safe Advice</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            These suggestions evaluate gaps in your availability, attributes, and video assets to help you rank higher in clubs&apos; deterministic search results.
          </p>
        </div>
      </div>

      {recs.length === 0 ? (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-brand mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Profile Fully Optimized!</h3>
          <p className="text-xs text-slate-500">You have addressed all current improvement signals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative hover:border-brand/30 transition-all"
            >
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <h3 className="font-bold text-white text-base">{rec.title}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to={rec.link}
                  className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-brand/10"
                >
                  <span>{rec.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleDismiss(rec.id)}
                  className="p-2 text-slate-500 hover:text-slate-300 rounded-xl"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
