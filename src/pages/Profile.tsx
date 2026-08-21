import { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Eye, EyeOff, Edit2, Save, X, Camera, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface ExperienceEntry {
  id: number;
  period: string;
  team: string;
  league: string;
}

interface PlayerProfileData {
  name?: string;
  location?: string;
  preferredFoot?: string;
  positions?: string[];
  ageGroup?: string;
  height?: number;
  weight?: number;
  topSpeed?: number;
  matchesPerWeek?: number;
  avgMinsPlayed?: number;
  tacticalTendencies?: string[];
  experience?: ExperienceEntry[];
  searchable?: boolean;
  isYouth?: boolean;
  consentStatus?: string;
  [key: string]: unknown;
}

function computeCompleteness(data: PlayerProfileData): number {
  let score = 0;
  if (data.name) score += 10;
  if (data.location) score += 5;
  if (data.positions?.length) score += 20;
  if (data.preferredFoot) score += 5;
  if (data.height) score += 5;
  if (data.weight) score += 5;
  if (data.experience?.length) score += 15;
  if (data.tacticalTendencies?.length) score += 10;
  if (data.topSpeed) score += 5;
  if (data.matchesPerWeek) score += 5;
  if (data.avgMinsPlayed) score += 5;
  if (data.ageGroup) score += 5;
  if (data.searchable !== undefined) score += 5;
  return Math.min(score / 100, 1);
}

export const Profile = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<PlayerProfileData>({});
  const [editForm, setEditForm] = useState<PlayerProfileData>({});

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const collection = role === 'club' ? 'clubs' : 'players';
        const snap = await getDoc(doc(db, collection, user.uid));
        const data: PlayerProfileData = snap.exists() ? (snap.data() as PlayerProfileData) : { name: user.name };
        setProfileData(data);
        setEditForm(data);
      } catch (err) {
        console.error('Profile load error:', err);
        setFetchError('Failed to load profile. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, role]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const collection = role === 'club' ? 'clubs' : 'players';
      const completeness = computeCompleteness(editForm);
      const dataToSave = { ...editForm, profileComplete: completeness, updatedAt: serverTimestamp() };
      await setDoc(doc(db, collection, user.uid), dataToSave, { merge: true });
      setProfileData(dataToSave);
      setIsEditing(false);
      success('Profile saved successfully!');
    } catch (err) {
      console.error('Profile save error:', err);
      toastError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profileData);
    setIsEditing(false);
  };

  const handleInput = (field: string, value: string | number | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'positions' | 'tacticalTendencies', value: string) => {
    const arr = value.split(',').map((s) => s.trim()).filter(Boolean);
    setEditForm((prev) => ({ ...prev, [field]: arr }));
  };

  const handleExpChange = (id: number, field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      experience: (prev.experience ?? []).map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const addExp = () =>
    setEditForm((prev) => ({
      ...prev,
      experience: [{ id: Date.now(), period: '', team: '', league: '' }, ...(prev.experience ?? [])],
    }));

  const removeExp = (id: number) =>
    setEditForm((prev) => ({
      ...prev,
      experience: (prev.experience ?? []).filter((e) => e.id !== id),
    }));

  const canEdit = role === 'player' || role === 'admin';
  const inputCls =
    'w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand transition-colors';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? editForm : profileData;
  const completeness = Math.round(computeCompleteness(profileData) * 100);
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (circumference * completeness) / 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-bold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {canEdit && (
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm font-bold hover:border-brand/50 hover:text-brand transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm font-bold hover:bg-dark-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand text-dark-bg rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors shadow-[0_0_15px_rgba(204,255,0,0.3)] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full">
                {/* Avatar */}
                <div className="relative group w-28 h-28 bg-dark-bg border-2 border-dark-border rounded-lg overflow-hidden shrink-0 shadow-xl self-center sm:self-auto">
                  <div className="w-full h-full bg-gradient-to-br from-dark-border to-dark-bg flex items-center justify-center">
                    <span className="text-4xl font-black text-text-secondary">
                      {(displayData.name || user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-8 h-8 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                    </div>
                  )}
                </div>

                {/* Name & Info */}
                <div className="space-y-3 flex-1 w-full">
                  {isEditing ? (
                    <div className="space-y-3 bg-dark-bg/50 p-4 rounded-lg border border-dark-border/50">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Name</label>
                        <input type="text" value={displayData.name ?? ''} onChange={(e) => handleInput('name', e.target.value)} className={`${inputCls} text-lg font-black uppercase`} placeholder="Your name" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Location</label>
                          <input type="text" value={displayData.location ?? ''} onChange={(e) => handleInput('location', e.target.value)} className={inputCls} placeholder="Region" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Preferred Foot</label>
                          <select value={displayData.preferredFoot ?? ''} onChange={(e) => handleInput('preferredFoot', e.target.value)} className={inputCls}>
                            <option value="">Select</option>
                            <option>Right Foot</option>
                            <option>Left Foot</option>
                            <option>Both Feet</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Positions (comma-separated)</label>
                        <input type="text" value={(displayData.positions ?? []).join(', ')} onChange={(e) => handleArrayInput('positions', e.target.value)} className={inputCls} placeholder="e.g. CM, CDM, ST" />
                      </div>
                      {role === 'player' && (
                        <div className="flex items-center justify-between py-2 border-t border-dark-border/50 mt-2">
                          <div>
                            <p className="text-sm font-bold">Profile Visibility</p>
                            <p className="text-xs text-text-secondary">Allow clubs to discover your profile</p>
                          </div>
                          <button
                            onClick={() => handleInput('searchable', !displayData.searchable)}
                            disabled={displayData.isYouth && displayData.consentStatus !== 'granted'}
                            className={`relative w-12 h-6 rounded-full transition-colors ${displayData.searchable ? 'bg-brand' : 'bg-dark-border'} disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${displayData.searchable ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        {displayData.name || user?.name || 'Complete Your Profile'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                        {displayData.location && (
                          <span className="flex items-center bg-dark-bg px-3 py-1.5 rounded-full border border-dark-border">
                            <MapPin className="w-4 h-4 mr-2 text-brand" />
                            {displayData.location}
                          </span>
                        )}
                        {displayData.preferredFoot && (
                          <span className="bg-dark-bg px-3 py-1.5 rounded-full border border-dark-border">
                            {displayData.preferredFoot}
                          </span>
                        )}
                        <span className={`flex items-center px-3 py-1.5 rounded-full border ${displayData.searchable ? 'border-brand/30 text-brand' : 'border-dark-border text-text-secondary'}`}>
                          {displayData.searchable ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                          {displayData.searchable ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      {(displayData.positions ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(displayData.positions ?? []).map((pos) => (
                            <span key={pos} className="px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-bold text-brand uppercase tracking-wider rounded">
                              {pos}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Profile score circle */}
              {!isEditing && (
                <div className="hidden sm:flex flex-col items-center shrink-0">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="8" />
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#ccff00" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="drop-shadow-[0_0_8px_rgba(204,255,0,0.5)] transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-brand">{completeness}</span>
                      <span className="text-[8px] text-text-secondary font-bold">%</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-1">Complete</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <h3 className="text-sm font-bold tracking-tight uppercase p-5 border-b border-dark-border">Physical Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-dark-border">
              {[
                { label: 'Height', key: 'height', unit: 'cm' },
                { label: 'Weight', key: 'weight', unit: 'kg' },
                { label: 'Top Speed', key: 'topSpeed', unit: 'km/h' },
                { label: 'Matches/Wk', key: 'matchesPerWeek', unit: '' },
              ].map(({ label, key, unit }) => (
                <div key={key} className="p-5 text-center bg-dark-bg/20">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">{label}</p>
                  {isEditing ? (
                    <div className="flex items-center justify-center space-x-1">
                      <input type="number" step={key === 'topSpeed' ? 0.1 : 1} value={(displayData[key] as number) ?? ''} onChange={(e) => handleInput(key, Number(e.target.value))} className={`${inputCls} w-20 text-center py-1`} />
                      {unit && <span className="text-[10px] text-text-secondary font-bold">{unit}</span>}
                    </div>
                  ) : (
                    <p className="text-xl font-black text-white">
                      {(displayData[key] as number) ? `${displayData[key]} ${unit}` : <span className="text-text-secondary/40">—</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Tendencies */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="text-sm font-bold tracking-tight uppercase mb-4">Tactical Tendencies</h3>
            {isEditing ? (
              <div>
                <textarea
                  value={(displayData.tacticalTendencies ?? []).join(', ')}
                  onChange={(e) => handleArrayInput('tacticalTendencies', e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="e.g. Overlapping, High Intensity (comma separated)"
                  rows={3}
                />
                <p className="text-[10px] text-text-secondary mt-1">Separate with commas</p>
              </div>
            ) : (displayData.tacticalTendencies ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(displayData.tacticalTendencies ?? []).map((t) => (
                  <span key={t} className="px-3 py-1.5 border border-dark-border bg-dark-bg text-[10px] font-bold uppercase tracking-wider text-text-primary rounded-md">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No tactical tendencies listed.{canEdit && ' Edit profile to add.'}</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Experience */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold tracking-tight uppercase">Experience</h3>
              {isEditing && (
                <button onClick={addExp} className="flex items-center space-x-1 text-brand hover:text-brand-hover p-1.5 bg-brand/10 hover:bg-brand/20 rounded transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {(editForm.experience ?? []).map((exp) => (
                  <div key={exp.id} className="bg-dark-bg/50 p-4 border border-dark-border/50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Period</label>
                        <input type="text" value={exp.period} onChange={(e) => handleExpChange(exp.id, 'period', e.target.value)} className={`${inputCls} text-xs py-1.5`} placeholder="e.g. 2023 - Present" />
                      </div>
                      <button onClick={() => removeExp(exp.id)} className="text-red-500 hover:text-red-400 p-1.5 bg-red-500/10 rounded mt-4 ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Team</label>
                        <input type="text" value={exp.team} onChange={(e) => handleExpChange(exp.id, 'team', e.target.value)} className={`${inputCls} py-1.5`} placeholder="Team name" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">League / Level</label>
                        <input type="text" value={exp.league} onChange={(e) => handleExpChange(exp.id, 'league', e.target.value)} className={`${inputCls} py-1.5`} placeholder="League/Division" />
                      </div>
                    </div>
                  </div>
                ))}
                {(editForm.experience ?? []).length === 0 && (
                  <p className="text-xs text-text-secondary text-center py-4">No experience added yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-5 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-dark-border">
                {(profileData.experience ?? []).length > 0 ? (
                  (profileData.experience ?? []).map((exp, idx) => (
                    <div key={exp.id} className="relative pl-8">
                      <div className={`absolute left-[5px] top-1.5 w-3 h-3 rounded-full z-10 ${idx === 0 ? 'border-2 border-dark-surface bg-brand' : 'bg-dark-border'}`} />
                      <p className={`text-[10px] font-bold ${idx === 0 ? 'text-brand' : 'text-text-secondary'} tracking-widest uppercase mb-1`}>{exp.period}</p>
                      <h4 className="text-sm font-bold mb-0.5">{exp.team}</h4>
                      <p className="text-xs text-text-secondary">{exp.league}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-text-secondary text-sm pl-8">No experience listed.{canEdit && ' Edit profile to add.'}</p>
                )}
              </div>
            )}
          </div>

          {/* Profile completeness */}
          {!isEditing && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
              <h3 className="text-sm font-bold tracking-tight uppercase mb-4">Profile Completeness</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Overall</span>
                <span className="text-sm font-black text-brand">{completeness}%</span>
              </div>
              <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${completeness}%` }} />
              </div>
              {completeness < 100 && canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 py-2 border border-brand text-brand font-bold text-xs rounded hover:bg-brand/10 transition-colors uppercase tracking-wider"
                >
                  Complete Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
