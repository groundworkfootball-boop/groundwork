import { Link } from 'react-router-dom';
import { Building2, Search, Users, CalendarCheck, ShieldCheck, Zap, ArrowRight, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ClubsPage = () => {
  const { isAuthenticated } = useAuth();

  const clubFeatures = [
    {
      title: 'Deterministic Roster Search',
      desc: 'Filter thousands of verified candidates by position, level, age group, dominant foot, availability, and pure match score without wading through spam emails.',
      icon: Search,
    },
    {
      title: 'Squad & Gap Analysis',
      desc: 'Map your active squad roster by formation. AI assistive models analyze positional depth deficits and immediately query matching players in your region.',
      icon: Users,
    },
    {
      title: 'Trials & Event Manager',
      desc: 'Publish upcoming open and closed trials. Send direct trial invitations to players, monitor RSVPs, and track candidate evaluations seamlessly.',
      icon: CalendarCheck,
    },
    {
      title: 'Club Code Onboarding',
      desc: 'Generate unique club invite codes (e.g. GW-LON-8891). Players can affiliate with your club instantly with 1-click WhatsApp and email sharing.',
      icon: Share2,
    },
    {
      title: 'Verified Safeguarding Access',
      desc: 'Gain authorized access to consented youth players under 18 with streamlined DBS and safeguarding accreditation verification.',
      icon: ShieldCheck,
    },
    {
      title: 'Private Staff Dossiers',
      desc: 'Record confidential scouting notes, performance remarks, and contract discussions that are strictly shielded from the candidate.',
      icon: Building2,
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
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full inline-block">
            Club Recruitment Command
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            The Modern Recruitment Operating System for Football Clubs
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            From National League and step 4-7 clubs to elite academies: streamline candidate discovery,
            eliminate agent fees, and sign players with verified data.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.25)]"
            >
              <span>Register Your Club</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              View Club Plans
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubFeatures.map((feat) => (
            <div
              key={feat.title}
              className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-3 hover:border-amber-400/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd. Club Recruitment Command.</p>
      </footer>
    </div>
  );
};
