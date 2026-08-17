import { Users, FileText, Star, BrainCircuit, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ClubDashboard = () => {
  const { user } = useAuth();
  // Mock data representing AI Squad Gap Analysis from Section 6.1
  const squadGaps = [
    {
      position: 'LWB',
      severity: 'Critical',
      rationale: 'Current starting LWB is out for 6 weeks, and the youth backup lacks Step 2 experience required for target promotion.',
      searchQuery: '?pos=LWB&level=2'
    },
    {
      position: 'CDM',
      severity: 'Moderate',
      rationale: 'Squad averages 2.1 goals conceded per game; lack of a dedicated holding midfielder leaves centerbacks exposed.',
      searchQuery: '?pos=CDM&role=holding'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-3xl font-black tracking-tight uppercase">{user?.name || 'Club'} Command</h3>
          <p className="text-text-secondary text-sm mt-1">Manage squad, scout players, and analyze gaps.</p>
        </div>
        <button className="px-6 py-3 bg-brand text-dark-bg font-bold uppercase tracking-wider rounded hover:bg-brand-hover transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(204,255,0,0.2)]">
          Post Opportunity
        </button>
      </div>
      
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black">2</span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Active Listings</h4>
        </div>
        
        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand/10 text-brand rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black">48</span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">New Applicants</h4>
        </div>
        
        <div className="bg-dark-surface p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black">14</span>
          </div>
          <h4 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Shortlisted</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Squad Gaps (AI) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none"></div>
            <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center z-10 relative">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold tracking-tight uppercase">AI Squad Gap Analysis</h4>
              </div>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest rounded">Updated Today</span>
            </div>
            <div className="p-6 relative z-10">
              <p className="text-sm text-text-secondary mb-6">Based on your current squad roster and target promotion objective, Claude AI has identified the following recruitment priorities.</p>
              
              <div className="space-y-4">
                {squadGaps.map((gap, i) => (
                  <div key={i} className="bg-dark-bg border border-dark-border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl font-black text-white">{gap.position}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${gap.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                          {gap.severity}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{gap.rationale}</p>
                    </div>
                    <Link to={`/opportunities${gap.searchQuery}`} className="shrink-0 flex items-center justify-center space-x-2 px-4 py-2 bg-dark-surface border border-dark-border text-sm font-bold text-white rounded hover:border-brand/50 hover:text-brand transition-colors group-hover:bg-brand/5">
                      <span>Find {gap.position}s</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center">
              <h4 className="font-bold tracking-tight uppercase">Recent Applicants</h4>
              <span className="text-sm text-brand cursor-pointer hover:underline">View All</span>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-text-secondary text-sm">
                No recent applications to review.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Safeguarding Status */}
        <div className="space-y-8">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg relative overflow-hidden">
             <div className="flex items-start justify-between mb-4 relative z-10">
               <div className="flex items-center space-x-2">
                 <ShieldAlert className="w-5 h-5 text-brand" />
                 <h4 className="font-bold tracking-tight uppercase">Safeguarding</h4>
               </div>
               <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
             </div>
             
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-text-secondary">Adult Verification</span>
                 <span className="text-xs font-bold text-brand">Verified</span>
               </div>
               <div className="flex items-center justify-between mb-6">
                 <span className="text-xs text-text-secondary">Youth Verification</span>
                 <span className="text-xs font-bold text-brand">Active</span>
               </div>
               
               <div className="bg-dark-bg border border-dark-border rounded p-4">
                 <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Renewal Due</p>
                 <p className="text-sm font-bold text-white">12 Oct 2027</p>
               </div>
               
               <p className="text-xs text-text-secondary mt-4">
                 Your club is authorised to view youth profiles (U18). All access is strictly audited per the GROUNDWORK safeguarding protocol.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
