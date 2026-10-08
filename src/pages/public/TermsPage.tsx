import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TermsPage = () => {
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

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-brand font-bold text-xs uppercase tracking-widest px-3 py-1 bg-brand/10 border border-brand/20 rounded-full inline-block">
            Legal Terms & Platform Service Agreement
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">Effective Date: January 1, 2026</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 space-y-8 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">1. Platform Scope & Purpose</h2>
            <p>
              Groundwork provides a data-driven recruitment platform connecting adult footballers, youth athletes, legal
              guardians, and verified football clubs. Groundwork is not an intermediary, licensed FIFA agent, or employer, and does
              not guarantee contract signings or trial acceptances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">2. Verification & Acceptable Use</h2>
            <p>
              Football clubs wishing to recruit must submit authentic credentials, club affiliation details, and safeguarding
              certifications. Any club attempting to solicit unverified minors or bypass guardian consent workflows will face immediate
              suspension and statutory reporting to UK child safeguarding authorities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">3. Commercial Subscriptions & Boosts</h2>
            <p>
              Paid subscription tiers and visibility boosts are billed via Stripe. Visibility boosts are strictly limited to
              algorithmic search ranking exposure and do not alter underlying match compatibility calculations or athletic evaluations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">4. User Uploaded Content</h2>
            <p>
              By uploading match highlight footage, users affirm that they own or hold necessary permissions for the clip. Users agree
              not to publish content containing defamatory material, music copyright infringements, or footage violating minor privacy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">5. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of England and Wales. The courts of England
              and Wales have exclusive jurisdiction to resolve any dispute arising from this agreement.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd.</p>
      </footer>
    </div>
  );
};
