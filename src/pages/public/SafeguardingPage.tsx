import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, UserCheck, AlertOctagon, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SafeguardingPage = () => {
  const { isAuthenticated } = useAuth();

  const safeguards = [
    {
      title: 'Automated Minor Detection',
      desc: 'Player registration dates of birth are checked deterministically at registration. Any applicant under 18 years of age is instantly categorized as a protected youth player.',
      icon: UserCheck,
    },
    {
      title: 'Strict Concealment Default',
      desc: 'All minor profiles default to searchable: false and consentStatus: pending. No youth player data is ever indexed into club search engines without prior guardian validation.',
      icon: Lock,
    },
    {
      title: 'Audited Club Clearance',
      desc: 'Clubs must present verified safeguarding certificates, DBS documentation, and designated safeguarding officer (DSO) credentials to recruit youth players.',
      icon: ShieldCheck,
    },
    {
      title: 'Instant De-Listing on Withdrawal',
      desc: 'Guardians possess unconditional statutory rights to withdraw consent at any instant. Revocation removes the athlete from club search indices with zero delay.',
      icon: AlertOctagon,
    },
    {
      title: 'Immutable Audit Trail',
      desc: 'Every consent grant, renewal, or revocation generates an append-only audit record stamped with timestamp and policy version for statutory governance.',
      icon: CheckCircle2,
    },
    {
      title: 'Zero AI Evaluation on Minors Without Consent',
      desc: 'Artificial intelligence services are programmatically blocked from processing youth footage or metadata unless verified consent status is actively granted.',
      icon: ShieldAlert,
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
          <Link to="/how-it-works" className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors hidden sm:block">
            Engine
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

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 space-y-16">
        {/* Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full inline-block">
            Child Protection & FA Compliance
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            Safeguarding is a System Requirement, Not an Optional Feature
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Groundwork operates with defense-in-depth security to protect youth players. We partner with parents,
            guardians, and accredited football clubs to ensure every child remains secure throughout their pathway.
          </p>
        </div>

        {/* 6 Safeguard Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeguards.map((item) => (
            <div
              key={item.title}
              className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-3 hover:border-emerald-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Defense-in-Depth Technical Guarantee */}
        <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 md:p-12 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">
              Server-Enforced Zero-Trust Security Architecture
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Per the Groundwork architecture specification, youth safeguarding is never enforced merely on the React client.
            Even if an adversarial actor inspects the DOM or issues raw API queries, Firestore Security Rules and Cloud Functions
            enforce mandatory custom claim authorization and cryptographic consent status checks on every single request.
          </p>

          <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border font-mono text-xs text-slate-400 space-y-1">
            <p className="text-brand font-bold">// Mandatory Youth Access Rule</p>
            <p>request.auth.token.role == 'club' &amp;&amp;</p>
            <p>get(/databases/$(database)/documents/clubs/$(request.auth.uid)).data.verifiedYouth == true &amp;&amp;</p>
            <p>resource.data.consentStatus == 'granted';</p>
          </div>
        </div>

        {/* Guardian CTA */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-dark-surface to-dark-surface border border-emerald-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black uppercase text-white">Are You a Parent or Legal Guardian?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Access the Guardian Oversight Portal to inspect your ward's discovery status, review scout communications, or update parental permissions.
            </p>
          </div>
          <Link
            to={isAuthenticated ? '/dashboard/guardian/consent' : '/register'}
            className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 shrink-0 transition-all"
          >
            <span>Open Guardian Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd. Child Safety Compliance Hotline: safeguarding@groundwork.football</p>
      </footer>
    </div>
  );
};
