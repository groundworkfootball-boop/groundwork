import { Link } from 'react-router-dom';
import { CheckCircle2, Zap, ArrowRight, BrainCircuit, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HowItWorksPage = () => {
  const { isAuthenticated } = useAuth();

  const steps = [
    {
      step: '01',
      title: 'Build Verified Athletic Dossier',
      desc: 'Athletes specify verified primary/secondary positions, self-assessed tier (1-10), dominant foot, weekly training availability slots, and upload match highlights.',
    },
    {
      step: '02',
      title: 'Deterministic Match Scoring',
      desc: 'Clubs establish roster requirements and target formation. The pure mathematical scoring engine calculates compatibility across 6 auditable dimensions without AI bias.',
    },
    {
      step: '03',
      title: 'Transparent Compatibility Breakdown',
      desc: 'Players and clubs inspect the exact algorithmic weighting contribution (Position 30%, Level 20%, Attributes 20%, Distance 15%, Availability 10%, Boost 5%).',
    },
    {
      step: '04',
      title: 'Direct Trial Invitations & Signings',
      desc: 'Clubs invite shortlisted candidates to scheduled training trials. Candidates accept invites and progress directly from grassroots to semi-pro and academy contracts.',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
      {/* Top Header */}
      <header className="px-6 lg:px-12 py-5 flex justify-between items-center border-b border-dark-border bg-dark-bg/90 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-black text-xl tracking-tight uppercase text-white">Groundwork</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link to="/safeguarding" className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors hidden sm:block">
            Safeguarding
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-4 py-2 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl">
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-brand font-bold text-xs uppercase tracking-widest px-3 py-1 bg-brand/10 border border-brand/20 rounded-full inline-block">
            Architectural Blueprint
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            How The Groundwork Engine Works
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            A dual-intelligence platform separating deterministic rule-based matching calculations from assistive generative AI.
          </p>
        </div>

        {/* The Two Intelligence Systems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* System 1 */}
          <div className="bg-dark-surface border border-brand/40 rounded-3xl p-8 space-y-5 relative overflow-hidden shadow-[0_0_30px_rgba(204,255,0,0.06)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center font-black">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-brand font-bold tracking-widest">Core Engine</span>
                <h2 className="text-xl font-black uppercase text-white tracking-tight">System 1: Deterministic Matching</h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Calculates player-club compatibility scores, search rankings, and transparency breakdowns.
              Strictly pure mathematical execution with zero LLM hallucination, randomness, or black-box drift.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-400 pt-2 border-t border-dark-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Positional compatibility weighting (Exact match = 1.0, adjacent = 0.5)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Playing level normalization against club tier targets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Weekly training & trial availability overlap calculation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Deterministic decay function for travel distance radius</span>
              </li>
            </ul>
          </div>

          {/* System 2 */}
          <div className="bg-dark-surface border border-purple-500/40 rounded-3xl p-8 space-y-5 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.06)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold tracking-widest">Assistive AI</span>
                <h2 className="text-xl font-black uppercase text-white tracking-tight">System 2: AI Assistance</h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Provides assistive workflow productivity tools for coaches and athletes.
              Strictly prohibited from writing or modifying player match scores, search rankings, or club decisions.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-400 pt-2 border-t border-dark-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>AI Squad Gap Analysis to identify roster deficits by formation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Observable video tagging (dominant foot, third of pitch, framing)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Player profile completeness optimization recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Strictly blocked on youth players without statutory consent</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4-Step Pathway */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase text-white tracking-tight">The 4-Step Opportunity Pathway</h2>
            <p className="text-xs text-slate-400 mt-1">From initial profile creation to signed trial offer.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => (
              <div key={st.step} className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-3 relative">
                <span className="text-3xl font-black text-brand/20 font-mono absolute top-4 right-4">{st.step}</span>
                <h3 className="text-sm font-black uppercase text-white tracking-wide">{st.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd. Deterministic Recruitment OS.</p>
      </footer>
    </div>
  );
};
