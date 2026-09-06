import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, AlertCircle, Building2, Target, Users, MapPin, Globe, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const LEVELS: Record<number, string> = {
  1: 'Professional / Tier 1',
  2: 'Semi-Pro / Tier 2',
  3: 'Amateur / Tier 3',
  4: 'Grassroots / Tier 4'
};

export const ClubProfilePage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [clubData, setClubData] = useState<any>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'clubs', user.uid));
        if (snap.exists()) {
          setClubData(snap.data());
        } else {
          setFetchError('Club profile not found.');
        }
      } catch (err) {
        console.error('Club load error:', err);
        setFetchError('Failed to load profile. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (fetchError || !clubData) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{fetchError || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-2xl bg-dark-surface border-2 border-dark-border flex items-center justify-center shrink-0 shadow-xl overflow-hidden relative group">
            <Building2 className="w-10 h-10 text-text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center space-x-3">
              <span>{clubData.name || user?.name || 'Club Name'}</span>
              {clubData.verificationStatus === 'approved' && (
                <ShieldCheck className="w-6 h-6 text-green-500" />
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-text-secondary font-medium">
              {clubData.clubType && (
                <span className="px-3 py-1 bg-dark-surface border border-dark-border rounded-full uppercase tracking-wider text-[10px]">
                  {clubData.clubType}
                </span>
              )}
              {clubData.region && (
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>{clubData.region}</span>
                </span>
              )}
              {clubData.league && (
                <span>| {clubData.league}</span>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/club/onboarding"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-sm font-bold text-white hover:border-brand/50 hover:text-brand transition-colors uppercase tracking-widest shrink-0"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recruitment Setup */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold tracking-tight uppercase mb-6 flex items-center space-x-2 border-b border-dark-border pb-4">
                <Target className="w-5 h-5 text-brand" />
                <span>Recruitment Needs</span>
              </h3>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Target Positions</p>
                  {(clubData.targetPositions && clubData.targetPositions.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {clubData.targetPositions.map((pos: string) => (
                        <span key={pos} className="px-3 py-1.5 bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-wider rounded">
                          {pos}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary/50">No target positions set.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Target Playing Levels</p>
                  {(clubData.targetPlayingLevels && clubData.targetPlayingLevels.length > 0) ? (
                    <div className="flex flex-col space-y-2">
                      {clubData.targetPlayingLevels.map((lvl: number) => (
                        <span key={lvl} className="px-3 py-2 bg-dark-bg border border-dark-border text-text-primary text-xs font-bold rounded">
                          {LEVELS[lvl] || `Level ${lvl}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary/50">No playing levels set.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Target Age Groups</p>
                  {(clubData.targetAgeGroups && clubData.targetAgeGroups.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {clubData.targetAgeGroups.map((age: string) => (
                        <span key={age} className="px-3 py-1.5 bg-dark-bg border border-dark-border text-text-primary text-[10px] font-bold uppercase tracking-wider rounded">
                          {age}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary/50">No age groups set.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-bold tracking-tight uppercase mb-6 flex items-center space-x-2 border-b border-dark-border pb-4">
              <Users className="w-5 h-5 text-brand" />
              <span>Squad & Philosophy</span>
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Preferred Formation</p>
                <p className="text-lg font-black text-white">{clubData.formation || 'Not specified'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Playing Style</p>
                {clubData.playingStyle ? (
                  <p className="text-sm text-text-primary bg-dark-bg border border-dark-border rounded-lg p-4 leading-relaxed">
                    {clubData.playingStyle}
                  </p>
                ) : (
                  <p className="text-sm text-text-secondary/50">No playing style defined.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="text-sm font-bold tracking-tight uppercase mb-4">Contact Info</h3>
            
            <div className="space-y-4">
              {clubData.website && (
                <div className="flex items-start space-x-3">
                  <Globe className="w-4 h-4 text-text-secondary mt-0.5" />
                  <a href={clubData.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline break-all">
                    {clubData.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              {clubData.contactEmail && (
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-text-secondary mt-0.5" />
                  <a href={`mailto:${clubData.contactEmail}`} className="text-sm text-white hover:text-brand break-all">
                    {clubData.contactEmail}
                  </a>
                </div>
              )}
              
              {!clubData.website && !clubData.contactEmail && (
                <p className="text-sm text-text-secondary/50">No contact info provided.</p>
              )}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="text-sm font-bold tracking-tight uppercase mb-4">Verification Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Status</span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                  clubData.verificationStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                  clubData.verificationStatus === 'under_review' ? 'bg-brand/10 text-brand' :
                  clubData.verificationStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                  'bg-dark-bg text-text-secondary border border-dark-border'
                }`}>
                  {clubData.verificationStatus ? clubData.verificationStatus.replace('_', ' ') : 'Pending'}
                </span>
              </div>
              
              <Link to="/dashboard/club/verification" className="block w-full py-2 border border-brand text-brand font-bold text-xs text-center rounded hover:bg-brand/10 transition-colors uppercase tracking-wider mt-4">
                Manage Verification
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
