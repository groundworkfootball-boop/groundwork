import { Link } from 'react-router-dom';
import { Target, Star, Video, Bell, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PlayersPage = () => {
  const { isAuthenticated } = useAuth();

  const playerFeatures = [
    {
      title: 'Digital Scouting Dossier',
      desc: 'Showcase your attributes, dominant foot, playing tier, physical metrics, and achievements in a clean verified format that club scouts respect.',
      icon: Target,
    },
    {
      title: 'Personalized Opportunity Feed',
      desc: 'Discover active club recruitment trials tailored deterministically to your positions, travel radius, and verified playing tier.',
      icon: Star,
    },
    {
      title: 'Video Vault & AI Highlights',
      desc: 'Upload high-definition match clips. Assistive AI automatically tags observable physical sequences to help scouts find your highlights instantly.',
      icon: Video,
    },
    {
      title: 'Real-time Trial Alerts',
      desc: 'Receive direct in-app and email notifications the instant a club shortlists your dossier or issues a formal trial invitation.',
      icon: Bell,
    },
    {
      title: 'Statutory Safeguarding Protection',
      desc: 'Minors under 18 benefit from encrypted guardian oversight and strict club verification checks to ensure a secure recruitment journey.',
      icon: ShieldCheck,
    },
    {
      title: 'Search Visibility Boosts',
      desc: 'Accelerate your pathway with optional visibility boosts that place your verified dossier directly in front of scouts in your region.',
      icon: Zap,
    },
  ];

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

      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-brand font-bold text-xs uppercase tracking-widest px-3 py-1 bg-brand/10 border border-brand/20 rounded-full inline-block">
            Athlete Opportunity Pathway
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            Stop Waiting to Be Scouted. Put Your Data on the Map.
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            The direct route for grassroots, Sunday league, and academy footballers looking to break into non-league,
            semi-pro, and professional clubs across the UK.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.25)]"
            >
              <span>Build Your Free Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playerFeatures.map((feat) => (
            <div
              key={feat.title}
              className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-3 hover:border-brand/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd. Player Opportunity Pathway.</p>
      </footer>
    </div>
  );
};
