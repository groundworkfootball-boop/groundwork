import { ChevronLeft, ChevronRight, UserPlus, MapPin, Clock } from 'lucide-react';

export const TrialManager = () => {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight">Trial Manager</h2>
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search trials..." 
            className="w-full bg-dark-surface border border-dark-border rounded px-4 py-2 text-sm focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6">
        {/* Calendar and Trial Details (Left) */}
        <div className="flex-1 space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <button className="w-8 h-8 flex items-center justify-center border border-dark-border rounded hover:bg-dark-bg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-bold tracking-widest uppercase">October 2024</h3>
                <button className="w-8 h-8 flex items-center justify-center border border-dark-border rounded hover:bg-dark-bg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex">
                <button className="px-4 py-1.5 border border-dark-border rounded-l text-xs font-bold uppercase tracking-wider text-text-secondary hover:bg-dark-bg">Month</button>
                <button className="px-4 py-1.5 border border-brand bg-brand/10 text-brand rounded-r text-xs font-bold uppercase tracking-wider">Week</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar Grid (Week View) */}
              <div className="h-32 bg-dark-bg border border-dark-border rounded-lg p-2">
                <span className="text-xs text-text-secondary">14</span>
              </div>
              <div className="h-32 bg-dark-bg border border-dark-border rounded-lg p-2 relative">
                <span className="text-xs text-text-primary font-bold">15</span>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-text-secondary"></div>
              </div>
              <div className="h-32 bg-dark-bg border border-dark-border rounded-lg p-2">
                <span className="text-xs text-text-primary font-bold">16</span>
              </div>
              <div className="h-32 bg-dark-surface border border-brand rounded-lg p-2 relative">
                <span className="text-xs text-brand font-bold">17</span>
                <div className="mt-2 space-y-1">
                  <div className="bg-brand/20 text-brand border border-brand/50 text-[8px] font-bold uppercase px-1 py-0.5 rounded truncate">U18 Academy...</div>
                  <div className="bg-dark-border text-text-secondary text-[8px] font-bold uppercase px-1 py-0.5 rounded truncate">Open Ses...</div>
                </div>
              </div>
              <div className="h-32 bg-dark-bg border border-dark-border rounded-lg p-2">
                <span className="text-xs text-text-primary font-bold">18</span>
              </div>
              <div className="h-32 bg-dark-bg border border-dark-border rounded-lg p-2 relative">
                <span className="text-xs text-text-primary font-bold">19</span>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              </div>
              <div className="h-32 bg-dark-bg border border-dark-border rounded-lg p-2">
                <span className="text-xs text-text-primary font-bold">20</span>
              </div>
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-8 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight mb-3">U18 Academy Trial</h2>
                <div className="flex items-center space-x-6 text-sm text-text-secondary">
                  <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /> <span>14:00 - 17:00</span></div>
                  <div className="flex items-center space-x-2"><MapPin className="w-4 h-4" /> <span>Pitch 4, Training Ground</span></div>
                </div>
              </div>
              <button className="px-6 py-2 bg-brand text-dark-bg font-bold text-xs uppercase tracking-wider rounded hover:bg-brand-hover">
                Edit Details
              </button>
            </div>

            <div className="flex-1 border-t border-dark-border/50 pt-8 mt-4">
              <h4 className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-4 flex items-center space-x-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <span>Post-Trial Notes (Internal)</span>
              </h4>
              <div className="relative">
                <textarea 
                  className="w-full h-32 bg-dark-bg border border-dark-border rounded-lg p-4 text-sm focus:outline-none focus:border-brand resize-none"
                  placeholder="Enter tactical observations, fitness notes, or general feedback..."
                ></textarea>
                <button className="absolute bottom-4 right-4 px-4 py-1.5 border border-dark-border rounded text-[10px] font-bold text-text-secondary uppercase tracking-widest hover:text-brand hover:border-brand transition-colors flex items-center space-x-2">
                  <span>Save Log</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invites Sidebar (Right) */}
        <div className="w-[340px] shrink-0 bg-dark-surface border border-dark-border rounded-xl flex flex-col h-full max-h-[800px]">
          <div className="p-6 border-b border-dark-border">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold tracking-tight uppercase">Invites</h3>
              <div className="text-right">
                <div className="text-2xl font-black text-brand leading-none">12</div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Total</div>
              </div>
            </div>
            
            <div className="flex justify-between border-b border-dark-border">
              <button className="pb-3 px-2 border-b-2 border-brand text-text-primary text-xs font-bold uppercase tracking-wider">All</button>
              <button className="pb-3 px-2 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-xs font-bold uppercase tracking-wider">Accepted</button>
              <button className="pb-3 px-2 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-xs font-bold uppercase tracking-wider">Pending</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Player 1 */}
            <div className="p-3 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-between group hover:border-brand/30 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-dark-surface rounded overflow-hidden">
                  {/* Placeholder for player image */}
                  <div className="w-full h-full bg-dark-border"></div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Liam Carter</h4>
                  <p className="text-xs text-text-secondary">CM • 17 yrs</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="px-2 py-0.5 border border-brand/50 text-brand text-[8px] font-bold uppercase tracking-widest rounded">Accepted</span>
                <span className="w-6 h-6 rounded-full border border-brand flex items-center justify-center text-[10px] font-bold text-brand">84</span>
              </div>
            </div>

            {/* Player 2 */}
            <div className="p-3 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-between group hover:border-brand/30 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-dark-surface rounded overflow-hidden">
                  <div className="w-full h-full bg-dark-border"></div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Noah Bennett</h4>
                  <p className="text-xs text-text-secondary">ST • 18 yrs</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="px-2 py-0.5 border border-amber-500/50 text-amber-500 text-[8px] font-bold uppercase tracking-widest rounded">Pending</span>
                <span className="w-6 h-6 rounded-full border border-dark-border flex items-center justify-center text-[10px] font-bold text-text-secondary">72</span>
              </div>
            </div>

            {/* Player 3 */}
            <div className="p-3 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-between opacity-60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-dark-surface rounded border border-dark-border border-dashed flex items-center justify-center">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Ethan Wright</h4>
                  <p className="text-xs text-text-secondary">CB • 17 yrs</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="px-2 py-0.5 border border-red-500/50 text-red-500 text-[8px] font-bold uppercase tracking-widest rounded">Declined</span>
              </div>
            </div>

            {/* Player 4 */}
            <div className="p-3 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-between group hover:border-brand/30 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-dark-surface rounded border border-dark-border border-dashed flex items-center justify-center">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">James Miller</h4>
                  <p className="text-xs text-text-secondary">RB • 16 yrs</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="px-2 py-0.5 border border-brand/50 text-brand text-[8px] font-bold uppercase tracking-widest rounded">Accepted</span>
                <span className="w-6 h-6 rounded-full border border-brand flex items-center justify-center text-[10px] font-bold text-brand">78</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-dark-border mt-auto">
             <button className="w-full py-3 bg-dark-bg border border-dark-border text-text-primary text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-2 hover:border-brand/50 transition-colors">
               <UserPlus className="w-4 h-4" />
               <span>Add Player</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
