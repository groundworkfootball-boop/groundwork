import { Eye, BarChart2, CheckCircle2, ChevronRight, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PlayerDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner Alert */}
      <div className="bg-dark-surface border border-brand/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-brand" />
          <div>
            <p className="font-bold text-sm">New Trial Invitation!</p>
            <p className="text-xs text-text-secondary">North City FC has invited you to an open trial this Saturday.</p>
          </div>
        </div>
        <Link to="/trial-manager" className="px-4 py-2 bg-brand text-dark-bg text-xs font-bold rounded hover:bg-brand-hover transition-colors">
          VIEW DETAILS
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Profile Score */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-surface border border-dark-border p-4 rounded-lg flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">Profile Views</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-text-secondary">This Week</p>
              </div>
              <Eye className="w-5 h-5 text-brand opacity-50" />
            </div>
            
            <div className="bg-dark-surface border border-dark-border p-4 rounded-lg flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">Regional Rank</p>
                <p className="text-sm font-bold mt-1">Top 15%</p>
                <p className="text-[10px] text-text-secondary mt-1">Wingers in North West</p>
              </div>
              <BarChart2 className="w-5 h-5 text-brand opacity-50" />
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-8 flex flex-col items-center">
            <h3 className="text-lg font-bold tracking-tight mb-8 uppercase text-text-secondary">Profile Score</h3>
            
            <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#ccff00" strokeWidth="8" strokeDasharray="276" strokeDashoffset="49" className="drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-brand">82</span>
                <span className="text-xs text-text-secondary font-bold">/ 100</span>
              </div>
            </div>

            <div className="px-3 py-1 bg-dark-bg border border-dark-border rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">High Visibility</span>
            </div>
          </div>
        </div>

        {/* Right Column: Opportunities & Pathway */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight uppercase">Active Opportunities</h3>
              <Link to="/opportunities" className="text-xs text-brand font-bold uppercase tracking-wider hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Step 4 Club', role: 'Looking for Wide Midfielders', match: 92, icon: '⚽' },
                { name: 'National League South', role: 'Trial Day Invites Open', match: 85, icon: '🏟️' },
                { name: 'Step 5 Alliance', role: 'Urgently seeking wing depth', match: 78, icon: '🛡️' },
              ].map((opp, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded-lg group hover:border-brand/50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded bg-dark-surface border border-dark-border flex items-center justify-center text-xl opacity-80">
                      {opp.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{opp.name}</h4>
                      <p className="text-xs text-text-secondary">{opp.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-black text-brand">{opp.match}%</p>
                      <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">Match</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-brand transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight uppercase flex items-center space-x-2">
                  <span className="text-brand text-xl">🏆</span>
                  <span>Pro Pathway</span>
                </h3>
                <p className="text-sm text-text-secondary mt-2 max-w-md">
                  Complete these steps to boost your Profile Score above 90.
                </p>
              </div>
              <div className="opacity-20 text-brand">
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </div>
            </div>

            <ul className="space-y-4 mb-6">
              <li className="flex items-center space-x-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-brand" />
                <span className="text-text-secondary line-through">Upload recent match footage (min. 3 clips)</span>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-dark-border"></div>
                <span>Confirm availability for upcoming weekend</span>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-dark-border"></div>
                <span>Complete tactical self-assessment</span>
              </li>
            </ul>

            <button className="px-6 py-2 border border-brand text-brand font-bold text-xs rounded hover:bg-brand/10 transition-colors uppercase tracking-wider">
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
