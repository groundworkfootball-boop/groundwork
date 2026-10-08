import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AboutPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
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

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-brand font-bold text-xs uppercase tracking-widest px-3 py-1 bg-brand/10 border border-brand/20 rounded-full inline-block">
            Our Mission & Origin
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            Democratizing Football Recruitment for Every Level
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            In modern football, talent is everywhere, but scouting infrastructure is broken.
            Groundwork was built to ensure that no player is overlooked simply because scouts never visited their pitch.
          </p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-black uppercase text-white tracking-tight">Our Core Principles</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-brand">1. Deterministic Integrity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We believe matching scores must be pure, mathematically auditable, and rule-based. We will never let generative AI hallucinate a player's worth.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-emerald-400">2. Safeguarding Uncompromised</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minors are protected by design. We enforce parental consent, club background clearance, and append-only audit ledgers.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-amber-400">3. Eliminating Pay-to-Win</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Athletic merit rules. Visibility boosts only offer a transparent, capped 5% bonus and cannot manipulate positional compatibility or tier levels.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-purple-400">4. Community First</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We champion non-league, Sunday league, development academies, and grassroots volunteers who form the heartbeat of the beautiful game.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center py-6">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover transition-all"
          >
            <span>Join the Groundwork Network</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd.</p>
      </footer>
    </div>
  );
};
