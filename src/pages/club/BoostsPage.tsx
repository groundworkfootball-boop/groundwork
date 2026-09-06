import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { Zap, ShieldCheck, Loader2 } from 'lucide-react';

export const BoostsPage = () => {
  const { success } = useToast();
  const [activeBoost, setActiveBoost] = useState<string | null>('7-day');
  const [processing, setProcessing] = useState(false);

  const handlePurchaseBoost = (pkg: string) => {
    setProcessing(true);
    setTimeout(() => {
      setActiveBoost(pkg);
      setProcessing(false);
      success(`Opportunity listing boosted for ${pkg}!`);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Listing Promotion</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Opportunity Visibility Boosts</h1>
        <p className="text-sm text-slate-400">
          Elevate your trial opportunities at the top of compatible players&apos; match feeds.
        </p>
      </div>

      <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white">Algorithmic Integrity Guarantee</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Visibility boosts contribute exclusively to the documented 5% boost dimension in the deterministic matching engine. Boosts expire automatically and cannot override position, distance, or capability tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: '7-day', duration: '7 Days', price: '£19', impressions: '~400 impressions' },
          { id: '14-day', duration: '14 Days', price: '£35', impressions: '~950 impressions', popular: true },
          { id: '30-day', duration: '30 Days', price: '£65', impressions: '~2,200 impressions' },
        ].map((pkg) => (
          <div
            key={pkg.id}
            className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
              pkg.popular
                ? 'bg-slate-900/90 border-2 border-brand shadow-xl'
                : 'bg-slate-900/70 border border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-lg">{pkg.duration} Boost</h3>
                <Zap className="w-5 h-5 text-brand" />
              </div>
              <p className="text-xs text-slate-400 mb-4">{pkg.impressions}</p>
              <p className="text-3xl font-black text-white mb-6">{pkg.price}</p>
            </div>

            <button
              onClick={() => handlePurchaseBoost(pkg.id)}
              disabled={processing || activeBoost === pkg.id}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeBoost === pkg.id
                  ? 'bg-brand/20 text-brand border border-brand/40 cursor-default'
                  : 'bg-brand hover:bg-brand-hover text-black shadow-md shadow-brand/20'
              }`}
            >
              {processing && activeBoost !== pkg.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : activeBoost === pkg.id ? (
                'Active on Listing'
              ) : (
                'Activate Boost'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
