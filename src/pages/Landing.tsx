import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Target,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex flex-col font-sans">
      {/* Top Header */}
      <header className="px-6 lg:px-12 py-5 flex justify-between items-center border-b border-dark-border/60 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(204,255,0,0.2)]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-brand font-black text-2xl tracking-tighter uppercase leading-none">Groundwork</h1>
            <span className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold">Football Recruitment OS</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link to="/clubs" className="hover:text-white transition-colors">For Clubs</Link>
          <Link to="/players" className="hover:text-white transition-colors">For Players</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link to="/safeguarding" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400/90">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Safeguarding</span>
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 text-xs font-black bg-brand text-dark-bg rounded-xl hover:bg-brand-hover transition-transform hover:scale-105 shadow-[0_0_15px_rgba(204,255,0,0.25)] uppercase tracking-wider"
            >
              WORKSPACE DASHBOARD
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-wider"
              >
                LOGIN
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-xs font-black bg-brand text-dark-bg rounded-xl hover:bg-brand-hover transition-transform hover:scale-105 shadow-[0_0_15px_rgba(204,255,0,0.25)] uppercase tracking-wider"
              >
                CREATE PROFILE
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <div className="w-full max-w-7xl px-6 lg:px-12 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-dark-surface border border-brand/30 rounded-full text-xs font-bold text-brand tracking-wider mb-6 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                <span className="uppercase">UK Non-League & Academy Opportunity Engine</span>
              </span>
              <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase text-text-primary">
                Get Seen.<br />
                <span className="text-text-secondary">Get Matched.</span><br />
                <span className="text-brand">Get Signed.</span>
              </h2>
            </div>

            <p className="text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed">
              The UK's verified data-driven football recruitment network. Connecting grassroots, Sunday league,
              and academy talent with non-league, semi-pro, and professional clubs through pure deterministic compatibility.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-brand text-dark-bg font-black rounded-2xl hover:bg-brand-hover transition-transform hover:scale-105 active:scale-95 text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.3)]"
              >
                <span>CREATE ATHLETIC DOSSIER</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center space-x-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all text-sm uppercase tracking-wider"
              >
                <span>Explore The Engine</span>
              </Link>
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-dark-border/50">
              <div>
                <p className="text-3xl font-black text-brand tracking-tight">100%</p>
                <p className="text-[10px] text-text-secondary tracking-widest font-bold uppercase mt-1">Deterministic Pure Score</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white tracking-tight">Step 1-7</p>
                <p className="text-[10px] text-text-secondary tracking-widest font-bold uppercase mt-1">Pyramid Pathways</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400 tracking-tight">FA DBS</p>
                <p className="text-[10px] text-text-secondary tracking-widest font-bold uppercase mt-1">Child Safeguarding</p>
              </div>
            </div>
          </div>

          {/* Dossier Mockup Card */}
          <div className="relative">
            <div className="bg-dark-surface border border-dark-border p-8 rounded-3xl shadow-2xl relative z-20 overflow-hidden space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase text-brand font-bold tracking-widest">
                    Audited Talent Record
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase mt-0.5">
                    Player Intelligence
                  </h3>
                </div>
                <div className="px-3 py-1 bg-dark-bg border border-dark-border rounded-xl text-xs text-brand font-mono font-bold">
                  VERIFIED PROFILE
                </div>
              </div>

              {/* Radial Compatibility Ring */}
              <div className="flex justify-center relative">
                <div className="w-48 h-48 rounded-full border-[12px] border-dark-bg flex items-center justify-center relative shadow-inner">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1c2638" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#ccff00"
                      strokeWidth="10"
                      strokeDasharray="264"
                      strokeDashoffset="38"
                      className="drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <span className="text-5xl font-black text-brand tracking-tighter">88%</span>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-0.5">
                      Club Match Fit
                    </p>
                  </div>
                </div>
              </div>

              {/* Attributes Progress */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-dark-bg/80 rounded-2xl border border-dark-border space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Positional Fit</span>
                    <span className="text-brand font-mono">100%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-dark-bg/80 rounded-2xl border border-dark-border space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Level / Tier</span>
                    <span className="text-brand font-mono">92%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-[92%]"></div>
                  </div>
                </div>

                <div className="p-3 bg-dark-bg/80 rounded-2xl border border-dark-border space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Availability</span>
                    <span className="text-brand font-mono">85%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-[85%]"></div>
                  </div>
                </div>

                <div className="p-3 bg-dark-bg/80 rounded-2xl border border-dark-border space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Travel Radius</span>
                    <span className="text-brand font-mono">90%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-[90%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -inset-10 bg-brand/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
          </div>
        </div>

        {/* Pathways Overview */}
        <div className="w-full bg-dark-surface/40 border-t border-dark-border py-20 px-6 lg:px-12 flex flex-col items-center">
          <div className="text-center max-w-2xl mb-12 space-y-3">
            <span className="text-xs font-bold uppercase text-brand tracking-widest">Targeted Platforms</span>
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Recruitment Paths for All Ecosystem Actors
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary">
              Whether you are an adult player, aspiring youth, guardian, or football club staff: Groundwork delivers dedicated tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
            {/* Adult Players */}
            <div className="bg-dark-surface border border-dark-border p-8 rounded-3xl space-y-5 hover:border-brand/40 transition-colors">
              <div className="w-12 h-12 bg-dark-bg border border-dark-border rounded-2xl flex items-center justify-center text-brand">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Ages 18+</span>
                <h4 className="text-lg font-black uppercase text-white mt-1">Adult Players</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Connect with non-league, semi-pro, and grassroots first teams. Build your data dossier, apply directly for trials, and upload video footage.
              </p>
              <Link to="/players" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline uppercase tracking-wider">
                <span>Explore Player Pathway</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Youth & Guardians */}
            <div className="bg-dark-surface border border-dark-border p-8 rounded-3xl space-y-5 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 bg-dark-bg border border-dark-border rounded-2xl flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Under 18 Protection</span>
                <h4 className="text-lg font-black uppercase text-white mt-1">Youth &amp; Guardians</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Statutory safeguarding controls. Minors remain hidden until parental consent is verified. Only clubs with certified clearance can scout youth athletes.
              </p>
              <Link to="/safeguarding" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline uppercase tracking-wider">
                <span>Safeguarding Protocol</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Football Clubs */}
            <div className="bg-dark-surface border border-dark-border p-8 rounded-3xl space-y-5 hover:border-amber-400/40 transition-colors">
              <div className="w-12 h-12 bg-dark-bg border border-dark-border rounded-2xl flex items-center justify-center text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Step 1-7 &amp; Academies</span>
                <h4 className="text-lg font-black uppercase text-white mt-1">Club Recruitment</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Publish open trials, filter candidates with deterministic scoring, run AI Squad Gap Analysis, and manage shortlists with private staff notes.
              </p>
              <Link to="/clubs" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline uppercase tracking-wider">
                <span>Club Command Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Comprehensive Footer */}
      <footer className="border-t border-dark-border/80 bg-dark-bg/95 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="text-brand font-black uppercase tracking-tight text-base">Groundwork</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The UK's verified data-driven football recruitment network. Pure deterministic opportunity matching.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold uppercase tracking-wider text-white text-[11px]">Platform</h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link to="/players" className="hover:text-white">For Players</Link></li>
              <li><Link to="/clubs" className="hover:text-white">For Clubs</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing &amp; Boosts</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold uppercase tracking-wider text-white text-[11px]">Safeguarding &amp; Trust</h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/safeguarding" className="hover:text-white">Child Protection Charter</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy &amp; GDPR</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold uppercase tracking-wider text-white text-[11px]">Company</h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/about" className="hover:text-white">About Groundwork</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 Groundwork Football Technologies Ltd. All Rights Reserved.</p>
          <p className="font-mono">Groundwork OS v2.4 • FA DBS Verified</p>
        </div>
      </footer>
    </div>
  );
};
