import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { Check, Loader2 } from 'lucide-react';

export const SubscriptionPage = () => {
  const { success } = useToast();
  const [currentTier, setCurrentTier] = useState<'free' | 'standard' | 'premium'>('standard');
  const [billing, setBilling] = useState(false);

  const handleSelectPlan = (tier: 'free' | 'standard' | 'premium') => {
    setBilling(true);
    setTimeout(() => {
      setCurrentTier(tier);
      setBilling(false);
      success(`Updated club recruitment subscription to ${tier.toUpperCase()} tier!`);
    }, 600);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Scout',
      price: '£0',
      period: 'forever',
      description: 'Baseline platform access for grassroot scouts and community clubs.',
      features: [
        '3 Active Opportunity Listings',
        'Adult Player Search & Discovery',
        'Basic Deterministic Match Scores',
        'Direct Candidate Inquiries',
      ],
    },
    {
      id: 'standard',
      name: 'Club Pro',
      price: '£49',
      period: 'per month',
      description: 'Ideal for semi-pro and academy teams building dedicated recruitment pipelines.',
      features: [
        'Unlimited Opportunity Listings',
        'Youth Scouting Access (Requires Cert)',
        'Full 6-Weight Deterministic Breakdowns',
        'AI Squad Gap Analysis',
        'Priority Trial Scheduling System',
        'Unique Club Code & Multi-Platform Invites',
      ],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Elite Academy',
      price: '£149',
      period: 'per month',
      description: 'Full-spectrum recruitment suite for professional academies and multi-team setups.',
      features: [
        'Everything in Club Pro',
        'Continuous Deterministic Recalculation',
        'Multi-Staff Scout Accounts',
        'Listing Visibility Boosts Included',
        'Advanced Recruitment Conversion Funnel',
        'Dedicated Safeguarding Compliance Officer',
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-brand font-bold text-xs uppercase tracking-widest">Pricing & Subscriptions</span>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-1">Club Recruitment Plans</h1>
        <p className="text-sm text-slate-400 mt-2">
          Transparent subscriptions built for clubs at every tier of the football pyramid.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              p.popular
                ? 'bg-slate-900/90 border-2 border-brand shadow-2xl shadow-brand/10'
                : 'bg-slate-900/70 border border-white/10'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-black text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-white mb-1">{p.name}</h2>
              <p className="text-xs text-slate-400 mb-6">{p.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">{p.price}</span>
                <span className="text-xs text-slate-400">/{p.period}</span>
              </div>

              <div className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-brand shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSelectPlan(p.id as typeof currentTier)}
              disabled={billing || currentTier === p.id}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                currentTier === p.id
                  ? 'bg-white/10 text-slate-400 cursor-default'
                  : p.popular
                  ? 'bg-brand hover:bg-brand-hover text-black shadow-lg shadow-brand/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {billing && currentTier !== p.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === p.id ? (
                'Current Plan'
              ) : (
                'Upgrade Plan'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
