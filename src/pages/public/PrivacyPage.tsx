import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PrivacyPage = () => {
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
            GDPR & UK DPA 2018 Statutory Notice
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            Privacy Policy & Data Protection Charter
          </h1>
          <p className="text-xs text-slate-400">Effective Date: January 1, 2026 • Policy Version 2026.1-EN</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 space-y-8 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">1. Scope & Data Controller</h2>
            <p>
              Groundwork Football Technologies Ltd is the data controller for personal and athletic performance data
              processed through the Groundwork recruitment ecosystem under the UK General Data Protection Regulation (UK GDPR)
              and Data Protection Act 2018.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">2. Minor Player Data & Guardian Consent</h2>
            <p>
              Pursuant to statutory child safeguarding mandates, Groundwork will never process or expose identifiable data
              belonging to an individual under 18 years of age without explicit, digitally audited authorization from their
              verified legal parent or guardian.
            </p>
            <p>
              Upon consent revocation by a guardian, minor profiles are instantly removed from discovery indices, associated
              generative AI processing jobs are aborted, and footage is queued for permanent purging.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">3. Public vs Private Athletic Data</h2>
            <p>
              <strong>Public Athletic Dossier:</strong> Display name, preferred positions, self-assessed tier, regional travel radius,
              match video highlights, and confirmed observable AI tags.
            </p>
            <p>
              <strong>Private Confidential Fields:</strong> Direct contact phone number, exact residential address, billing details,
              internal club recruitment scout notes, and statutory parental consent audit identifiers. Private club notes are strictly
              shielded and inaccessible to athletes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">4. Your Statutory GDPR Rights</h2>
            <p>Under statutory provisions, you retain unconditional rights to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Request a portable machine-readable export of all stored personal records.</li>
              <li>Request immediate and permanent erasure of discoverable profile data.</li>
              <li>Rectify inaccurate technical and athletic ratings.</li>
              <li>Inspect statutory consent audit records logged during your platform usage.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">5. Exercise Your Data Rights</h2>
            <p>
              To initiate a statutory GDPR data export or permanent profile deletion request, visit your workspace Settings or
              dispatch an official request directly to our Data Protection Officer at: <strong>privacy@groundwork.football</strong>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd. Registered with UK ICO.</p>
      </footer>
    </div>
  );
};
