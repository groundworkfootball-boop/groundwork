import { useState, useMemo } from 'react';
import { Search, CheckCircle2, SlidersHorizontal, Info } from 'lucide-react';
import { calculateMatchScore } from '../lib/scoringEngine';
import { DUMMY_CLUBS, CURRENT_PLAYER_MOCK } from '../lib/dummyData';

export const Opportunities = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'level' | 'newest'>('match');
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  const matchedClubs = useMemo(() => {
    return DUMMY_CLUBS.map(club => {
      const scoreBreakdown = calculateMatchScore(CURRENT_PLAYER_MOCK, club.preferences);
      return {
        ...club,
        score: scoreBreakdown.totalScore,
        breakdown: scoreBreakdown
      };
    }).filter(club => 
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.seekingPosition.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      if (sortBy === 'match') return b.score - a.score;
      if (sortBy === 'level') return b.level - a.level;
      return 0;
    });
  }, [searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-black uppercase tracking-tight">Active Opportunities</h2>
          <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-[10px] text-brand font-bold uppercase tracking-widest rounded shadow-[0_0_10px_rgba(204,255,0,0.2)]">
            {matchedClubs.length} MATCHES
          </span>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clubs, positions..." 
            className="w-full bg-dark-surface border border-dark-border rounded-lg px-9 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors shadow-lg"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg sticky top-6">
            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-text-secondary" />
                <h3 className="font-bold tracking-wider uppercase text-sm">Engine Params</h3>
              </div>
              <button 
                onClick={() => setSortBy('match')}
                className="text-[10px] text-brand font-bold uppercase tracking-widest hover:underline"
              >
                Reset
              </button>
            </div>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-4">Sort Priority</h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="sort" 
                      checked={sortBy === 'match'} 
                      onChange={() => setSortBy('match')}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${sortBy === 'match' ? 'border-brand bg-brand/10' : 'border-dark-border group-hover:border-text-secondary'}`}>
                      {sortBy === 'match' && <div className="w-2 h-2 rounded-full bg-brand"></div>}
                    </div>
                    <span className={`text-sm font-bold uppercase tracking-wider ${sortBy === 'match' ? 'text-white' : 'text-text-secondary'}`}>Deterministic Match</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="sort" 
                      checked={sortBy === 'level'} 
                      onChange={() => setSortBy('level')}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${sortBy === 'level' ? 'border-brand bg-brand/10' : 'border-dark-border group-hover:border-text-secondary'}`}>
                      {sortBy === 'level' && <div className="w-2 h-2 rounded-full bg-brand"></div>}
                    </div>
                    <span className={`text-sm font-bold uppercase tracking-wider ${sortBy === 'level' ? 'text-white' : 'text-text-secondary'}`}>Target Level</span>
                  </label>
                </div>
              </div>

              <div className="bg-dark-bg/50 border border-dark-border/50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Matches are scored deterministically based on your profile (Position 30%, Level 20%, Attributes 20%, Region 15%, Availability 10%, Boost 5%).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity List */}
        <div className="flex-1 space-y-6">
          {matchedClubs.length === 0 ? (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center shadow-lg">
               <p className="text-text-secondary font-medium">No opportunities matching your criteria.</p>
            </div>
          ) : (
            matchedClubs.map((club) => {
              const scorePercentage = Math.round(club.score * 100);
              const isHighMatch = scorePercentage >= 80;
              const isShowingBreakdown = showBreakdown === club.id;

              return (
                <div key={club.id} className={`bg-dark-surface border transition-all duration-300 p-6 rounded-xl relative overflow-hidden group shadow-lg ${isHighMatch ? 'border-brand/50 hover:border-brand' : 'border-dark-border hover:border-text-secondary/50'}`}>
                  {isHighMatch && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>}
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex space-x-6 items-start w-full">
                      {/* Score Circle */}
                      <div 
                        className="relative w-20 h-20 shrink-0 cursor-pointer group/score"
                        onClick={() => setShowBreakdown(isShowingBreakdown ? null : club.id)}
                      >
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="8" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="44" 
                            fill="none" 
                            stroke={isHighMatch ? "#ccff00" : "#f59e0b"} 
                            strokeWidth="8" 
                            strokeDasharray="276" 
                            strokeDashoffset={276 - (276 * scorePercentage) / 100} 
                            className={`transition-all duration-1000 ${isHighMatch ? 'drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]' : ''}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface/80 rounded-full opacity-0 group-hover/score:opacity-100 transition-opacity">
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest text-center px-1">View<br/>Stats</span>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center group-hover/score:opacity-0 transition-opacity">
                          <span className={`text-xl font-black leading-none ${isHighMatch ? 'text-brand' : 'text-amber-500'}`}>{scorePercentage}</span>
                          <span className="text-[8px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">Match</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-dark-bg border border-dark-border text-[10px] font-bold text-text-secondary uppercase tracking-widest rounded shadow-sm">STEP {club.level}</span>
                          <span className="px-2 py-0.5 bg-dark-bg border border-dark-border text-[10px] font-bold text-text-secondary uppercase tracking-widest rounded flex items-center shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1" /> {club.region}</span>
                          {club.urgent && (
                            <span className="px-2 py-0.5 bg-brand/10 border border-brand/30 text-[10px] font-black text-brand uppercase tracking-widest rounded shadow-sm">Urgent Need</span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1 text-white">{club.name}</h3>
                        <p className="text-sm text-text-secondary mb-4">Seeking: <span className="text-brand font-bold bg-brand/10 px-2 py-0.5 rounded">{club.seekingPosition}</span></p>
                        <div className="flex flex-wrap gap-2">
                          {club.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 border border-dark-border bg-dark-bg text-[10px] font-bold text-text-secondary uppercase tracking-widest rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 w-full md:w-48 shrink-0">
                      <button className="w-full py-3 bg-brand text-dark-bg font-bold text-xs uppercase tracking-widest rounded hover:bg-brand-hover transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                        Express Interest
                      </button>
                      <button className="w-full py-3 border border-dark-border bg-dark-bg text-text-secondary font-bold text-xs uppercase tracking-widest rounded hover:border-text-secondary hover:text-text-primary transition-colors">
                        Save to Shortlist
                      </button>
                    </div>
                  </div>

                  {/* Deterministic Score Breakdown Panel */}
                  {isShowingBreakdown && (
                    <div className="mt-6 pt-6 border-t border-dark-border animate-in slide-in-from-top-2 duration-300">
                       <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center">
                         <SlidersHorizontal className="w-4 h-4 mr-2 text-brand" />
                         Match Breakdown (Deterministic)
                       </h4>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                         <div className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                           <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Position</p>
                           <p className="text-lg font-black text-white">{Math.round(club.breakdown.positionMatch * 100)}%</p>
                         </div>
                         <div className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                           <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Level</p>
                           <p className="text-lg font-black text-white">{Math.round(club.breakdown.levelMatch * 100)}%</p>
                         </div>
                         <div className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                           <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Attributes</p>
                           <p className="text-lg font-black text-white">{Math.round(club.breakdown.attributesMatch * 100)}%</p>
                         </div>
                         <div className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                           <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Region</p>
                           <p className="text-lg font-black text-white">{Math.round(club.breakdown.distanceMatch * 100)}%</p>
                         </div>
                         <div className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                           <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Availability</p>
                           <p className="text-lg font-black text-white">{Math.round(club.breakdown.availabilityMatch * 100)}%</p>
                         </div>
                         <div className="bg-dark-bg p-3 rounded border border-dark-border text-center">
                           <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Boost</p>
                           <p className="text-lg font-black text-brand">{Math.round(club.breakdown.boostMatch * 100)}%</p>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
