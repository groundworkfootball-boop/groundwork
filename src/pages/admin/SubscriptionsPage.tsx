import { useState } from 'react';
import { CreditCard, Check } from 'lucide-react';

export const SubscriptionsPage = () => {
  const [plans] = useState([
    {
      id: 'club-pro',
      name: 'Club Pro',
      price: '£49/mo',
      activeSubscribers: 38,
      category: 'Club Recruitment',
    },
    {
      id: 'elite-academy',
      name: 'Elite Academy',
      price: '£149/mo',
      activeSubscribers: 12,
      category: 'Pro Academies',
    },
    {
      id: 'player-pro',
      name: 'Player Pro',
      price: '£9.99/mo',
      activeSubscribers: 140,
      category: 'Player Advancement',
    },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Plan Management</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Active Platform Subscriptions</h1>
        <p className="text-sm text-slate-400">
          Supervise club recurring billing plans and player advancement tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.id} className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">{p.category}</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{p.name}</h2>
            <p className="text-2xl font-black text-white font-mono mb-4">{p.price}</p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Active Subscribers:</span>
              <span className="text-base font-bold text-brand font-mono">{p.activeSubscribers}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
