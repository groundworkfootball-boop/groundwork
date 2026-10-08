import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Building2, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PricingPage = () => {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const playerPlans = [
    {
      name: 'Grassroots Free',
      price: '£0',
      period: 'forever free',
      description: 'Core scouting profile for amateur and development players.',
      features: [
        'Complete athletic dossier & attribute ratings',
        'Deterministic club opportunity matching',
        'Up to 3 match highlight video clips',
        'Apply to unlimited open club trials',
        'Statutory youth safeguarding protections',
      ],
      cta: 'Get Started Free',
      href: '/register',
      popular: false,
    },
    {
      name: 'Player PRO Boost',
      price: billingCycle === 'monthly' ? '£9.99' : '£7.99',
      period: 'per month',
      description: 'Maximum visibility and AI insights for serious athletes.',
      features: [
        'Everything in Grassroots Free',
        'Up to 10 high-definition video clips',
        'Automated AI observable action tagging',
        'AI player improvement recommendations',
        '5% deterministic search visibility boost bonus',
        'Profile view analytics & club scout tracking',
        'Priority trial notification alerts',
      ],
      cta: 'Upgrade to Player PRO',
      href: isAuthenticated ? '/dashboard/subscription' : '/register',
      popular: true,
    },
  ];

  const clubPlans = [
    {
      name: 'Grassroots Club',
      price: '£0',
      period: 'free forever',
      description: 'Essential recruitment tools for local amateur teams.',
      features: [
        'Post up to 2 active trial opportunities',
        'Deterministic player search (basic filters)',
        'Club code player invitation system',
        'Basic squad roster management',
      ],
      cta: 'Register Club Free',
      href: '/register',
      popular: false,
    },
    {
      name: 'Standard Recruitment',
      price: billingCycle === 'monthly' ? '£49' : '£39',
      period: 'per month',
      description: 'For non-league, semi-pro, and academy development clubs.',
      features: [
        'Unlimited active trial postings',
        'Advanced player search with match score ranking',
        'Verified youth recruitment clearance access',
        'AI Squad Gap Analysis (formation fit)',
        'Player shortlisting & private recruitment notes',
        'Direct inquiry messaging & trial invitations',
        'Candidate application status tracking',
      ],
      cta: 'Start 14-Day Club Trial',
      href: isAuthenticated ? '/dashboard/club/subscription' : '/register',
      popular: true,
    },
    {
      name: 'Elite Academy / Pro',
      price: billingCycle === 'monthly' ? '£149' : '£119',
      period: 'per month',
      description: 'Comprehensive scouting command center for professional clubs.',
      features: [
        'Everything in Standard Recruitment',
        'Multi-scout staff seats & collaborative notes',
        'Priority scouting search boost distribution',
        'Detailed tactical fit breakdown explanations',
        'Exportable scout reports & recruitment logs',
        'Dedicated safeguarding compliance manager',
        'Priority phone & Slack technical support',
      ],
      cta: 'Contact Scouting Sales',
      href: '/contact',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'Does purchasing a boost manipulate the player matching score unfairly?',
      a: 'No. Groundwork enforces strict deterministic matching principles. Visibility boosts provide a transparent, auditable bonus (maximum 5% weight dimension) and do not falsify or artificially inflate positional, attribute, or level scores.',
    },
    {
      q: 'How does club youth recruitment verification work?',
      a: 'Clubs that recruit players under 18 must submit club safeguarding documentation and coach accreditation for manual administrator review before youth player records become accessible in search results.',
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes. All subscriptions are managed securely via Stripe. You can cancel at any time directly through your dashboard with no cancellation fees.',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
      {/* Navigation Header */}
      <header className="px-6 lg:px-12 py-5 flex justify-between items-center border-b border-dark-border bg-dark-bg/90 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-black text-xl tracking-tight uppercase text-white">Groundwork</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/safeguarding" className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors hidden sm:block">
            Safeguarding
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 space-y-20">
        {/* Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-brand font-bold text-xs uppercase tracking-widest px-3 py-1 bg-brand/10 border border-brand/20 rounded-full inline-block">
            Transparent Pricing Structure
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            Plans Built for Grassroots to Elite Clubs
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Groundwork connects talent with clubs using deterministic rule-based intelligence. No hidden agency cuts. No locked-in contracts.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1 bg-dark-surface border border-dark-border rounded-2xl mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                billingCycle === 'monthly' ? 'bg-brand text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-brand text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual (Save 20%)</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">20% Off</span>
            </button>
          </div>
        </div>

        {/* Player Pathway Plans */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-brand" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">For Players & Athletes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {playerPlans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-dark-surface border rounded-3xl p-8 flex flex-col justify-between space-y-6 relative ${
                  plan.popular ? 'border-brand ring-1 ring-brand/30 shadow-[0_0_30px_rgba(204,255,0,0.1)]' : 'border-dark-border'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 right-8 bg-brand text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-black uppercase text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={plan.href}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-center transition-all ${
                    plan.popular
                      ? 'bg-brand text-slate-950 hover:bg-brand-hover shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Club Recruitment Plans */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">For Football Clubs & Academies</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clubPlans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-dark-surface border rounded-3xl p-8 flex flex-col justify-between space-y-6 relative ${
                  plan.popular ? 'border-amber-400 ring-1 ring-amber-400/30 shadow-[0_0_30px_rgba(251,191,36,0.1)]' : 'border-dark-border'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 right-8 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                    Recommended
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-black uppercase text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={plan.href}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-center transition-all ${
                    plan.popular
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 md:p-12 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-brand" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 rounded-2xl bg-dark-bg border border-dark-border space-y-2">
                <h3 className="text-xs font-bold uppercase text-white">{faq.q}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd. Protected by UK Child Safeguarding Frameworks.</p>
      </footer>
    </div>
  );
};
