import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Loader2, Save, Building2, Target, Users, ShieldAlert } from 'lucide-react';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const LEVELS = [
  { id: 1, name: 'Professional / Tier 1' },
  { id: 2, name: 'Semi-Pro / Tier 2' },
  { id: 3, name: 'Amateur / Tier 3' },
  { id: 4, name: 'Grassroots / Tier 4' }
];

export const ClubOnboardingPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    clubType: '',
    league: '',
    region: '',
    website: '',
    contactEmail: '',
    targetPositions: [] as string[],
    targetAgeGroups: [] as string[],
    targetPlayingLevels: [] as number[],
    formation: '',
    playingStyle: '',
  });

  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'clubs', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData((prev) => ({
            ...prev,
            name: data.name || user.name || '',
            clubType: data.clubType || '',
            league: data.league || '',
            region: data.region || '',
            website: data.website || '',
            contactEmail: data.contactEmail || user.email || '',
            targetPositions: data.targetPositions || [],
            targetAgeGroups: data.targetAgeGroups || [],
            targetPlayingLevels: data.targetPlayingLevels || [],
            formation: data.formation || '',
            playingStyle: data.playingStyle || '',
          }));
        } else {
          setFormData(prev => ({ ...prev, name: user.name || '', contactEmail: user.email || '' }));
        }
      } catch (err) {
        console.error(err);
        toastError('Failed to load existing profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (field: 'targetPositions' | 'targetAgeGroups', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const toggleNumberItem = (field: 'targetPlayingLevels', value: number) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleSave = async (isFinal = false) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clubs', user.uid), {
        ...formData,
        onboardingComplete: isFinal,
        updatedAt: serverTimestamp(),
      });
      
      success(isFinal ? 'Club onboarding complete!' : 'Progress saved.');
      
      if (isFinal) {
        navigate('/dashboard');
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to save club profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Club Identity', icon: Building2 },
    { num: 2, title: 'Recruitment Needs', icon: Target },
    { num: 3, title: 'Squad Profile', icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Club Onboarding</h2>
        <p className="text-text-secondary text-sm">Set up your club's operational profile to start matching with players.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center mb-12">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          
          return (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors z-10 bg-dark-bg ${isActive ? 'border-brand text-brand' : isCompleted ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-dark-border text-text-secondary'}`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-brand' : 'text-text-secondary'}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-24 sm:w-32 h-1 mx-2 rounded-full transition-colors ${isCompleted ? 'bg-green-500/50' : 'bg-dark-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-xl overflow-hidden p-8 mb-20 relative">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white border-b border-dark-border pb-4 mb-6">1. Club Identity & Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Club Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" placeholder="e.g. London FC" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Club Type</label>
                <select name="clubType" value={formData.clubType} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand appearance-none">
                  <option value="" disabled>Select type...</option>
                  <option value="Professional">Professional</option>
                  <option value="Semi-Professional">Semi-Professional</option>
                  <option value="Amateur">Amateur</option>
                  <option value="Academy">Academy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">League / Division</label>
                <input type="text" name="league" value={formData.league} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" placeholder="e.g. National League" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Region *</label>
                <input type="text" name="region" value={formData.region} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" placeholder="e.g. Greater London" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Official Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" placeholder="https://" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Recruitment Contact Email</label>
                <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" placeholder="scouting@club.com" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white border-b border-dark-border pb-4 mb-6">2. Recruitment Needs</h3>
            
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Target Positions</label>
              <div className="flex flex-wrap gap-3">
                {POSITIONS.map(pos => {
                  const isSelected = formData.targetPositions.includes(pos);
                  return (
                    <button
                      key={pos}
                      onClick={() => toggleArrayItem('targetPositions', pos)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${
                        isSelected ? 'bg-brand text-slate-900 border-brand' : 'bg-dark-bg text-text-secondary border-dark-border hover:border-brand/50 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Target Playing Levels</label>
              <div className="flex flex-col space-y-2">
                {LEVELS.map(level => {
                  const isSelected = formData.targetPlayingLevels.includes(level.id);
                  return (
                    <button
                      key={level.id}
                      onClick={() => toggleNumberItem('targetPlayingLevels', level.id)}
                      className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors border text-left ${
                        isSelected ? 'bg-brand text-slate-900 border-brand' : 'bg-dark-bg text-text-secondary border-dark-border hover:border-brand/50 hover:text-white'
                      }`}
                    >
                      {level.name}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Target Age Groups</label>
              <div className="flex flex-wrap gap-3">
                {['U16', 'U18', 'U21', 'Senior (18-24)', 'Senior (25+)'].map(age => {
                  const isSelected = formData.targetAgeGroups.includes(age);
                  return (
                    <button
                      key={age}
                      onClick={() => toggleArrayItem('targetAgeGroups', age)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${
                        isSelected ? 'bg-brand text-slate-900 border-brand' : 'bg-dark-bg text-text-secondary border-dark-border hover:border-brand/50 hover:text-white'
                      }`}
                    >
                      {age}
                    </button>
                  );
                })}
              </div>
              {formData.targetAgeGroups.some(a => a.startsWith('U')) && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-400">Safeguarding Verification Required</p>
                    <p className="text-xs text-amber-400/80 mt-1">Recruiting youth players (U18) requires manual verification of your club's safeguarding documentation by an administrator.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white border-b border-dark-border pb-4 mb-6">3. Squad Profile & Philosophy</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Preferred Formation</label>
                <select name="formation" value={formData.formation} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand appearance-none">
                  <option value="" disabled>Select formation...</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="3-4-3">3-4-3</option>
                  <option value="5-3-2">5-3-2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Playing Style / Philosophy</label>
              <textarea name="playingStyle" value={formData.playingStyle} onChange={handleChange} rows={5} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand resize-none" placeholder="Describe your club's footballing philosophy (e.g. Possession-based, High press, Counter-attacking)..." />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-dark-border">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-2.5 border border-dark-border text-text-secondary font-bold text-sm rounded-lg hover:bg-dark-bg transition-colors uppercase tracking-widest"
            >
              Back
            </button>
          ) : (
            <div></div> // Spacer
          )}
          
          <button
            onClick={() => handleSave(currentStep === steps.length)}
            disabled={saving || (currentStep === 1 && (!formData.name || !formData.region))}
            className="px-8 py-2.5 bg-brand text-dark-bg font-bold text-sm rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors uppercase tracking-widest"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : currentStep === steps.length ? <Save className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>{currentStep === steps.length ? 'Complete Onboarding' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
