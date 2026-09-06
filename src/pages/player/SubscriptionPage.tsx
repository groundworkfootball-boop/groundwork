import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { Zap, Check, Loader2 } from 'lucide-react';

export const SubscriptionPage = () => {
  const { success } = useToast();
  const [activePlan, setActivePlan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = (plan: 'free' | 'pro') => {
    setLoading(true);
    setTimeout(() => {
      setActivePlan(plan);
      setLoading(false);
      success(plan === 'pro' ? 'Player Pro activated! Enjoy boosted scouting visibility.' : 'Switched to standard free plan.');
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-brand font-bold text-xs uppercase tracking-widest">Player Advancement</span>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-1">Player Memberships & Boosts</h1>
        <p className="text-sm text-slate-400 mt-2">
          Maximize your recruiting reach and unlock detailed match breakdown analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Standard Player</h2>
            <p className="text-xs text-slate-400 mb-6">Complete recruitment essentials for amateur & academy trialists.</p>

            <p className="text-4xl font-black text-white mb-6">£0<span className="text-xs text-slate-400 font-normal"> / forever</span></p>

            <div className="space-y-3 mb-8 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Full Profile & Skill Ratings</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Deterministic Opportunity Feed</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Unlimited Direct Applications</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>1 Highlight Video Clip</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('free')}
            disabled={activePlan === 'free' || loading}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activePlan === 'free' ? 'bg-white/10 text-slate-400 cursor-default' : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            {activePlan === 'free' ? 'Current Plan' : 'Select Free'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-900/90 border-2 border-brand rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-brand/10 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-black text-xs font-black px-4 py-0.5 rounded-full uppercase tracking-wider">
            Scouting Boost
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-white">Player Pro</h2>
              <Zap className="w-5 h-5 text-brand" />
            </div>
            <p className="text-xs text-slate-400 mb-6">Enhanced scouting visibility and AI observable highlight tagging.</p>

            <p className="text-4xl font-black text-white mb-6">£9.99<span className="text-xs text-slate-400 font-normal"> / month</span></p>

            <div className="space-y-3 mb-8 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>+5% Deterministic Search Boost</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Unlimited Match Video Clips</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>AI-Assisted Observable Movement Tagging</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Transparent 6-Weight Score Breakdowns</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Profile View Read Receipts from Scouts</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('pro')}
            disabled={activePlan === 'pro' || loading}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activePlan === 'pro'
                ? 'bg-brand/20 text-brand border border-brand/40 cursor-default'
                : 'bg-brand hover:bg-brand-hover text-black shadow-lg shadow-brand/20'
            }`}
          >
            {loading && activePlan !== 'pro' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : activePlan === 'pro' ? (
              'Active Pro Membership'
            ) : (
              'Upgrade to Player Pro'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
