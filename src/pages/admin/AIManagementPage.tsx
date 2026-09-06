import { useState } from 'react';
import { Sparkles, ShieldAlert, Cpu, Activity, CheckCircle2, DollarSign, Database, RefreshCw } from 'lucide-react';

export const AIManagementPage = () => {
  const [activeProvider, setActiveProvider] = useState<'claude' | 'openrouter'>('claude');

  const stats = {
    totalCalls: 1420,
    cachedHits: 1089, // ~76% cache hit rate through deterministic content hashing
    tokensUsed: '1,842,100',
    estimatedCost: '£7.38',
    safetyViolationsBlocked: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Intelligence Infrastructure</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">AI Management & Cost Control</h1>
          <p className="text-sm text-slate-400">
            Monitor server-side AI providers (Claude / OpenRouter), caching metrics, and safeguarding guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveProvider('claude')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeProvider === 'claude' ? 'bg-brand text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Claude 3.5 Sonnet
          </button>
          <button
            onClick={() => setActiveProvider('openrouter')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeProvider === 'openrouter' ? 'bg-brand text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            OpenRouter API
          </button>
        </div>
      </div>

      {/* Strict Security Guardrail Banner */}
      <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white">AI Authority & Database Permissions Boundary (Section 28)</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            AI services run exclusively server-side and possess zero permissions to write to <span className="font-mono text-brand">playerScores</span> or <span className="font-mono text-brand">matchResults</span>. AI is restricted to advisory tasks: observable video tagging, squad depth gap auditing, and structured profile recommendations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Total AI Queries</span>
          <p className="text-3xl font-black text-white mt-1">{stats.totalCalls}</p>
          <p className="text-[11px] text-slate-400 mt-1">Video tags & squad gaps</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Cache Hit Rate</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">76.7%</p>
          <p className="text-[11px] text-slate-400 mt-1">{stats.cachedHits} cached responses</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Tokens Processed</span>
          <p className="text-3xl font-black text-white mt-1">{stats.tokensUsed}</p>
          <p className="text-[11px] text-slate-400 mt-1">Structured JSON schema only</p>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-400 uppercase">Month-to-Date Cost</span>
          <p className="text-3xl font-black text-brand mt-1">{stats.estimatedCost}</p>
          <p className="text-[11px] text-slate-400 mt-1">Optimized with SHA-256 deduplication</p>
        </div>
      </div>

      {/* Feature Pipelines Audit Table */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">AI Feature Execution Boundaries</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Feature Pipeline</th>
                <th className="px-4 py-3">Input Format</th>
                <th className="px-4 py-3">Output Schema</th>
                <th className="px-4 py-3">Youth Safeguarding Check</th>
                <th className="px-4 py-3">Cache Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-bold text-white">Video Observable Tagging</td>
                <td className="px-4 py-3 font-mono text-slate-400">Sampled Frames + Duration</td>
                <td className="px-4 py-3 font-mono text-brand">tags[], summary</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">Consent Verified Prior to Job</td>
                <td className="px-4 py-3">Video File Hash</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-bold text-white">Squad Gap Analysis</td>
                <td className="px-4 py-3 font-mono text-slate-400">Formation + Squad Counts</td>
                <td className="px-4 py-3 font-mono text-brand">position, gapSeverity, rationale</td>
                <td className="px-4 py-3 text-slate-400">Aggregated Only</td>
                <td className="px-4 py-3">Squad Composition JSON Hash</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-bold text-white">Player Improvement Signals</td>
                <td className="px-4 py-3 font-mono text-slate-400">Missing Profile Fields</td>
                <td className="px-4 py-3 font-mono text-brand">action, reason</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">Own Player Data Only</td>
                <td className="px-4 py-3">24-Hour TTL Cache</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
