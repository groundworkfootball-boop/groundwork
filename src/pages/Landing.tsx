import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex flex-col font-sans">
      <header className="px-8 py-6 flex justify-between items-center border-b border-dark-border/50 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-brand font-black text-2xl tracking-tighter uppercase">Groundwork</h1>
        <div className="space-x-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-5 py-2 text-sm font-bold bg-brand text-dark-bg rounded hover:bg-brand-hover transition-colors">
              DASHBOARD
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-brand transition-colors border border-transparent">
                LOGIN
              </Link>
              <Link to="/register" className="px-5 py-2 text-sm font-bold bg-brand text-dark-bg rounded hover:bg-brand-hover transition-colors">
                JOIN NOW
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center space-x-2 px-3 py-1 bg-dark-surface border border-dark-border rounded-full text-xs font-semibold text-brand tracking-wider mb-6">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                <span>RECRUITMENT COMMAND ACTIVE</span>
              </span>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase text-text-primary">
                Get Seen.<br />
                <span className="text-text-secondary">Get Matched.</span><br />
                <span className="text-brand">Get Signed.</span>
              </h2>
            </div>
            
            <p className="text-lg text-text-secondary max-w-md">
              The UK's data-driven football opportunity engine for non-league, grassroots, and development pathways. Stop hoping to be scouted. Start building your data profile.
            </p>

            <Link to="/register" className="inline-flex items-center space-x-2 px-8 py-4 bg-brand text-dark-bg font-bold rounded hover:bg-brand-hover transition-transform hover:scale-105 active:scale-95">
              <span>CREATE YOUR FREE PROFILE</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dark-border/50">
              <div>
                <p className="text-2xl font-bold text-brand">5,000+</p>
                <p className="text-xs text-text-secondary tracking-widest font-bold uppercase mt-1">Players Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand">300+</p>
                <p className="text-xs text-text-secondary tracking-widest font-bold uppercase mt-1">Clubs Recruiting</p>
              </div>
            </div>

            <div className="bg-dark-surface border border-dark-border p-4 rounded-lg flex items-start space-x-3 mt-4">
              <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
              <div>
                <p className="text-xs text-brand font-bold uppercase tracking-wider mb-1">Recent Match Activity</p>
                <p className="text-sm text-text-secondary">Striker (82 Profile Score) signed to Step 4 Club in London.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-transparent to-transparent z-10 hidden lg:block"></div>
            
            {/* Player Intelligence Mockup */}
            <div className="bg-dark-surface border border-dark-border p-8 rounded-xl shadow-2xl relative z-20 overflow-hidden">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">PLAYER INTELLIGENCE</h3>
                  <p className="text-sm text-text-secondary">Live Scouting Profile</p>
                </div>
                <div className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-[10px] text-text-secondary tracking-wider font-mono">
                  ID: GW-9942
                </div>
              </div>

              <div className="flex justify-center mb-10 relative">
                <div className="w-48 h-48 rounded-full border-[12px] border-dark-bg flex items-center justify-center relative">
                   <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="12" />
                     <circle cx="50" cy="50" r="44" fill="none" stroke="#ccff00" strokeWidth="12" strokeDasharray="276" strokeDashoffset="41" className="drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
                   </svg>
                   <div className="text-center z-10">
                     <span className="text-5xl font-black text-brand tracking-tighter">85</span>
                     <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase mt-1">Profile Score</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider text-text-secondary">
                    <span>Physicality</span>
                  </div>
                  <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-[85%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider text-text-secondary">
                    <span>Technical</span>
                  </div>
                  <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-[78%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider text-text-secondary">
                    <span>Tactical</span>
                  </div>
                  <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-[82%]"></div>
                  </div>
                </div>
                <div>
                   <div className="text-xs mb-1 font-bold uppercase tracking-wider text-text-secondary">
                    Matches Analyzed
                  </div>
                  <div className="text-xl font-bold">24</div>
                </div>
              </div>
            </div>
            
            {/* Glow Effect */}
            <div className="absolute -inset-10 bg-brand/5 blur-[100px] rounded-full z-0 pointer-events-none"></div>
          </div>
        </div>

        {/* Pathways Section */}
        <div className="w-full bg-dark-surface/50 border-t border-dark-border py-24 px-8 mt-12 flex flex-col items-center">
           <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-center">Select Your Pathway</h3>
           <p className="text-text-secondary text-center max-w-2xl mb-16">
             Groundwork is tailored to your current stage of development. Choose your track to access specialized recruitment networks.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
             {/* Adult Pathway */}
             <div className="bg-dark-bg border border-dark-border p-8 rounded-xl hover:border-brand/50 transition-colors group">
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-dark-surface border border-dark-border rounded-lg flex items-center justify-center text-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                 </div>
                 <span className="px-3 py-1 border border-dark-border rounded text-xs font-mono text-text-secondary">AGE 18+</span>
               </div>
               <h4 className="text-xl font-bold uppercase tracking-tight mb-2">Adult Pathway</h4>
               <p className="text-sm text-text-secondary mb-8">
                 For non-league players, free agents, and semi-professionals looking to climb the pyramid or secure trials at Step 1-6 clubs.
               </p>
               <ul className="space-y-3 mb-8">
                 <li className="flex items-center space-x-3 text-sm"><CheckCircle2 className="w-4 h-4 text-brand" /><span>Direct messaging with First Team Managers</span></li>
                 <li className="flex items-center space-x-3 text-sm"><CheckCircle2 className="w-4 h-4 text-brand" /><span>Match footage analysis integration</span></li>
                 <li className="flex items-center space-x-3 text-sm"><CheckCircle2 className="w-4 h-4 text-brand" /><span>Non-league salary & contract matching</span></li>
               </ul>
               <Link to="/register" className="block w-full py-3 text-center border border-dark-border rounded hover:bg-dark-surface transition-colors font-semibold text-sm">
                 ENTER ADULT TRACK
               </Link>
             </div>

             {/* Youth Pathway */}
             <div className="bg-dark-bg border border-dark-border p-8 rounded-xl hover:border-brand/50 transition-colors group">
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-dark-surface border border-dark-border rounded-lg flex items-center justify-center text-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                 </div>
                 <span className="px-3 py-1 border border-dark-border rounded text-xs font-mono text-text-secondary">AGE 15-17</span>
               </div>
               <h4 className="text-xl font-bold uppercase tracking-tight mb-2">Youth Pathway</h4>
               <p className="text-sm text-text-secondary mb-8">
                 Designed for grassroots and academy release players seeking scholarship opportunities or U18/U23 developmental squads.
               </p>
               <ul className="space-y-3 mb-8">
                 <li className="flex items-center space-x-3 text-sm"><CheckCircle2 className="w-4 h-4 text-brand" /><span>Academy scout visibility network</span></li>
                 <li className="flex items-center space-x-3 text-sm"><CheckCircle2 className="w-4 h-4 text-brand" /><span>Parent/Guardian account linkage</span></li>
                 <li className="flex items-center space-x-3 text-sm"><CheckCircle2 className="w-4 h-4 text-brand" /><span>Showcase game invitations</span></li>
               </ul>
               <Link to="/register" className="block w-full py-3 text-center border border-dark-border rounded hover:bg-dark-surface transition-colors font-semibold text-sm">
                 ENTER YOUTH TRACK
               </Link>
             </div>
           </div>
        </div>
      </main>

      <footer className="py-12 border-t border-dark-border flex flex-col items-center">
        <h2 className="text-brand font-black text-xl tracking-tighter uppercase mb-4">Groundwork</h2>
        <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">
          © 2024 GROUNDWORK RECRUITMENT COMMAND. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};
