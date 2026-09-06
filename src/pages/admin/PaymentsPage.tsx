import { useState } from 'react';
import { DollarSign, CreditCard, CheckCircle2, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from '../../lib/toast';

export const PaymentsPage = () => {
  const { success } = useToast();

  const [transactions] = useState([
    {
      id: 'ch_3M4j182k9',
      customer: 'Camden United FC',
      amount: '£49.00',
      type: 'Club Pro Subscription',
      status: 'succeeded',
      date: 'Today, 14:22',
    },
    {
      id: 'ch_3M4j091m4',
      customer: 'Marcus Cole',
      amount: '£9.99',
      type: 'Player Pro Membership',
      status: 'succeeded',
      date: 'Today, 11:05',
    },
    {
      id: 'ch_3M4i983a1',
      customer: 'North London Elite',
      amount: '£35.00',
      type: '14-Day Opportunity Boost',
      status: 'succeeded',
      date: 'Yesterday, 18:40',
    },
    {
      id: 'ch_3M4i882f0',
      customer: 'Westway Academy FC',
      amount: '£149.00',
      type: 'Elite Academy Subscription',
      status: 'succeeded',
      date: '24 Feb, 09:15',
    },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Financial Operations</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Payments & Revenue Ledger</h1>
          <p className="text-sm text-slate-400">
            Stripe webhook event logs, customer subscription charges, and visibility boost transactions.
          </p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Monthly Recurring Revenue</span>
          <p className="text-3xl font-black text-brand mt-1">£3,420</p>
          <p className="text-[11px] text-slate-400 mt-1">+18% this month</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Subscriptions</span>
          <p className="text-3xl font-black text-white mt-1">54</p>
          <p className="text-[11px] text-slate-400 mt-1">Clubs & Player Pro</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Visibility Boosts</span>
          <p className="text-3xl font-black text-white mt-1">£620</p>
          <p className="text-[11px] text-slate-400 mt-1">1-time listing promotions</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Dispute Rate</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">0.0%</p>
          <p className="text-[11px] text-slate-400 mt-1">Fully reconciled</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Stripe Webhook Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Charge ID</th>
                <th className="px-4 py-3">Customer / Club</th>
                <th className="px-4 py-3">Product / Tier</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Recorded Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-brand font-bold">{tx.id}</td>
                  <td className="px-4 py-3 font-bold text-white">{tx.customer}</td>
                  <td className="px-4 py-3 text-slate-300">{tx.type}</td>
                  <td className="px-4 py-3 font-mono font-bold text-white">{tx.amount}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30">
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
