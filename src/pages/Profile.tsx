import { useState } from 'react';
import { ChevronLeft, Play, Maximize, MapPin, Eye, Edit2, Save, X, Camera, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Marcus Thorne',
    location: 'North West',
    preferredFoot: 'Right Foot',
    positions: ['RWB', 'LWB'],
    ageGroup: 'U23',
    rating: 94,
    status: 'High Visibility',
    height: 184,
    weight: 78,
    topSpeed: 34.2,
    matchesPerWeek: 2,
    avgMinsPlayed: 88,
    tacticalTendencies: ['Overlapping', 'High Intensity', 'Box-To-Box'],
    experience: [
      { id: 1, period: '2023 - Present', team: 'FC United', league: 'National League North (Step 2)' },
      { id: 2, period: '2021 - 2023', team: 'City Academy', league: 'U18 / U23 Squad' },
    ],
  });

  const [editForm, setEditForm] = useState(profileData);

  const handleSave = () => {
    setProfileData(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'positions' | 'tacticalTendencies', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    setEditForm(prev => ({ ...prev, [field]: array }));
  };
  
  const handleExperienceChange = (id: number, field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addExperience = () => {
    setEditForm(prev => ({
      ...prev,
      experience: [
        { id: Date.now(), period: '', team: '', league: '' },
        ...prev.experience,
      ]
    }));
  };

  const removeExperience = (id: number) => {
    setEditForm(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const canEdit = role === 'player' || role === 'admin';

  const inputClass = "w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand transition-colors";
  
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link to="/opportunities" className="inline-flex items-center space-x-2 text-xs font-bold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </Link>
        
        {canEdit && (
          <div>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm font-bold hover:border-brand/50 hover:text-brand transition-colors w-full sm:w-auto justify-center"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3 w-full sm:w-auto">
                <button 
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm font-bold hover:bg-dark-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-brand text-dark-bg rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                >
                  <Save className="w-4 h-4" />
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
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full">
                <div className="relative group w-32 h-32 bg-dark-bg border-2 border-dark-border rounded-lg overflow-hidden shrink-0 shadow-xl self-center sm:self-auto">
                   <div className="w-full h-full bg-gradient-to-br from-dark-border to-dark-bg flex items-center justify-center">
                      <span className="text-4xl font-black text-text-secondary">{profileData.name.charAt(0)}</span>
                   </div>
                   {isEditing && (
                     <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                       <Camera className="w-8 h-8 text-white mb-1" />
                       <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                     </div>
                   )}
                </div>
                
                <div className="space-y-4 flex-1 w-full">
                  {isEditing ? (
                    <div className="space-y-3 bg-dark-bg/50 p-4 rounded-lg border border-dark-border/50">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Player Name</label>
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`${inputClass} text-lg font-black uppercase tracking-tight py-2`}
                          placeholder="Player Name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Location</label>
                          <input 
                            type="text" 
                            value={editForm.location} 
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className={inputClass}
                            placeholder="Location"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Preferred Foot</label>
                          <input 
                            type="text" 
                            value={editForm.preferredFoot} 
                            onChange={(e) => handleInputChange('preferredFoot', e.target.value)}
                            className={inputClass}
                            placeholder="Preferred Foot"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Positions (comma separated)</label>
                        <input 
                          type="text" 
                          value={editForm.positions.join(', ')} 
                          onChange={(e) => handleArrayInput('positions', e.target.value)}
                          className={inputClass}
                          placeholder="e.g. RWB, LWB, CB"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2 text-center sm:text-left">{profileData.name}</h1>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-text-secondary font-medium tracking-wide mb-4">
                        <span className="flex items-center bg-dark-bg px-3 py-1.5 rounded-full border border-dark-border">
                          <MapPin className="w-4 h-4 mr-2 text-brand" /> {profileData.location}
                        </span>
                        <span className="flex items-center bg-dark-bg px-3 py-1.5 rounded-full border border-dark-border">
                          <svg className="w-4 h-4 mr-2 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 
                          {profileData.preferredFoot}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {profileData.positions.map(pos => (
                          <span key={pos} className="px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-bold text-brand uppercase tracking-wider rounded">{pos}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="hidden sm:flex flex-col items-end space-y-4">
                  <span className="px-2 py-1 bg-brand text-dark-bg text-xs font-bold uppercase tracking-widest rounded">{profileData.ageGroup}</span>
                  <div className="border border-dark-border bg-dark-bg p-4 rounded-xl flex flex-col items-center justify-center shadow-lg">
                    <div className="relative w-20 h-20 mb-2">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3441" strokeWidth="8" />
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#ccff00" strokeWidth="8" strokeDasharray="276" strokeDashoffset={`${276 - (276 * profileData.rating) / 100}`} className="drop-shadow-[0_0_8px_rgba(204,255,0,0.5)] transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-brand leading-none">{profileData.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
                       <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">{profileData.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border">
              <h3 className="text-lg font-bold tracking-tight uppercase">Match Highlights</h3>
              {isEditing ? (
                 <button className="text-xs font-bold text-brand uppercase tracking-wider hover:text-brand-hover flex items-center space-x-1">
                   <Plus className="w-4 h-4" />
                   <span>Add Video</span>
                 </button>
              ) : (
                <button className="text-text-secondary hover:text-text-primary transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="relative aspect-video bg-dark-bg group cursor-pointer border-b border-dark-border overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-dark-surface to-dark-bg"></div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-end z-10">
                <div className="px-4 pb-4 w-full">
                   <div className="h-1.5 w-full bg-white/20 rounded-full mb-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-brand rounded-full"></div>
                   </div>
                   <div className="flex justify-between items-center text-xs font-mono">
                      <span>01:24 / 04:15</span>
                      <div className="flex items-center space-x-4 opacity-70">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-brand rounded-full flex items-center justify-center text-dark-bg transform group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(204,255,0,0.4)] z-10">
                <Play className="w-6 h-6 fill-current ml-1" />
              </div>
            </div>

            <div className="p-4 bg-dark-bg">
               <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center space-x-2">
                 <svg className="w-3 h-3 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                 <span>AI Generated Tags</span>
               </p>
               <div className="flex flex-wrap gap-2">
                 <span className="px-3 py-1.5 bg-dark-surface border border-dark-border text-xs text-text-secondary font-bold uppercase tracking-wider rounded">Defensive Transition</span>
                 <span className="px-3 py-1.5 bg-dark-surface border border-dark-border text-xs text-text-secondary font-bold uppercase tracking-wider rounded">Ball Recovery</span>
                 <span className="px-3 py-1.5 bg-dark-surface border border-dark-border text-xs text-text-secondary font-bold uppercase tracking-wider rounded flex items-center">
                   High Press <div className="w-1.5 h-1.5 rounded-full bg-brand ml-2"></div>
                 </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {!isEditing && role !== 'player' && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
               <button className="w-full py-4 bg-brand text-dark-bg font-bold uppercase tracking-wider rounded mb-4 hover:bg-brand-hover transition-transform active:scale-[0.98] flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span>Invite to Trial</span>
               </button>
               <div className="flex space-x-4">
                  <button className="flex-1 py-3 border border-dark-border bg-dark-bg text-text-secondary text-xs font-bold uppercase tracking-wider rounded hover:border-brand/50 hover:text-brand transition-colors flex items-center justify-center space-x-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span>Shortlist</span>
                  </button>
                  <button className="flex-1 py-3 border border-dark-border bg-dark-bg text-text-secondary text-xs font-bold uppercase tracking-wider rounded hover:border-brand/50 hover:text-brand transition-colors flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Interest</span>
                  </button>
               </div>
            </div>
          )}

          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
             <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center justify-between">
                Tactical Tendencies
             </h3>
             {isEditing ? (
                <div className="space-y-2">
                  <textarea 
                    value={editForm.tacticalTendencies.join(', ')} 
                    onChange={(e) => handleArrayInput('tacticalTendencies', e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="e.g. Overlapping, High Intensity (comma separated)"
                    rows={3}
                  />
                  <p className="text-[10px] text-text-secondary">Separate with commas</p>
                </div>
             ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.tacticalTendencies.map(tendency => (
                    <span key={tendency} className="px-3 py-1.5 border border-dark-border bg-dark-bg text-[10px] font-bold uppercase tracking-wider text-text-primary rounded-md">{tendency}</span>
                  ))}
                </div>
             )}
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
             <h3 className="text-lg font-bold tracking-tight uppercase p-6 border-b border-dark-border">Metrics</h3>
             <div className="grid grid-cols-2 divide-x divide-y divide-dark-border">
                <div className="p-6 text-center bg-dark-bg/30">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Height</p>
                  {isEditing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <input type="number" value={editForm.height} onChange={(e) => handleInputChange('height', Number(e.target.value))} className={`${inputClass} w-20 text-center py-1`} />
                      <span className="text-[10px] text-text-secondary font-bold">CM</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-white">{profileData.height} <span className="text-xs font-normal text-text-secondary">cm</span></p>
                  )}
                </div>
                <div className="p-6 text-center bg-dark-bg/30">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Weight</p>
                  {isEditing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <input type="number" value={editForm.weight} onChange={(e) => handleInputChange('weight', Number(e.target.value))} className={`${inputClass} w-20 text-center py-1`} />
                      <span className="text-[10px] text-text-secondary font-bold">KG</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-white">{profileData.weight} <span className="text-xs font-normal text-text-secondary">kg</span></p>
                  )}
                </div>
                <div className="p-6 text-center border-t border-dark-border bg-dark-bg/30">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Top Speed</p>
                  {isEditing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <input type="number" step="0.1" value={editForm.topSpeed} onChange={(e) => handleInputChange('topSpeed', Number(e.target.value))} className={`${inputClass} w-20 text-center py-1`} />
                      <span className="text-[10px] text-text-secondary font-bold">KM/H</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-white">{profileData.topSpeed} <span className="text-xs font-normal text-text-secondary">km/h</span></p>
                  )}
                </div>
                <div className="p-6 text-center border-t border-dark-border bg-dark-bg/30">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Matches/Wk</p>
                  {isEditing ? (
                    <input type="number" value={editForm.matchesPerWeek} onChange={(e) => handleInputChange('matchesPerWeek', Number(e.target.value))} className={`${inputClass} w-20 text-center py-1 mx-auto`} />
                  ) : (
                    <p className="text-2xl font-black text-white">{profileData.matchesPerWeek}</p>
                  )}
                </div>
             </div>
             <div className="bg-dark-bg p-4 border-t border-dark-border flex justify-between items-center">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Avg Mins Played</p>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input type="number" value={editForm.avgMinsPlayed} onChange={(e) => handleInputChange('avgMinsPlayed', Number(e.target.value))} className={`${inputClass} w-20 text-center py-1`} />
                    <span className="text-[10px] text-text-secondary font-bold">MIN</span>
                  </div>
                ) : (
                  <p className="text-lg font-black text-brand">{profileData.avgMinsPlayed} <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">min</span></p>
                )}
             </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold tracking-tight uppercase">Experience</h3>
               {isEditing && (
                 <button onClick={addExperience} className="text-brand hover:text-brand-hover p-1.5 bg-brand/10 hover:bg-brand/20 rounded transition-colors flex items-center space-x-1">
                   <Plus className="w-4 h-4" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
                 </button>
               )}
             </div>
             
             <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-dark-border">
                {isEditing ? (
                  <div className="space-y-4">
                    {editForm.experience.map((exp) => (
                      <div key={exp.id} className="relative pl-8 bg-dark-bg/50 p-4 border border-dark-border/50 rounded-lg group">
                        <div className="absolute left-[-5px] top-5 w-3 h-3 rounded-full border-2 border-dark-surface bg-brand z-10"></div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex-1">
                            <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Time Period</label>
                            <input 
                              type="text" 
                              value={exp.period} 
                              onChange={(e) => handleExperienceChange(exp.id, 'period', e.target.value)}
                              className={`${inputClass} text-xs py-1.5`}
                              placeholder="e.g. 2023 - Present"
                            />
                          </div>
                          <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-400 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded mt-4 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Team Name</label>
                            <input 
                              type="text" 
                              value={exp.team} 
                              onChange={(e) => handleExperienceChange(exp.id, 'team', e.target.value)}
                              className={`${inputClass} py-1.5`}
                              placeholder="Team Name"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">League / Level</label>
                            <input 
                              type="text" 
                              value={exp.league} 
                              onChange={(e) => handleExperienceChange(exp.id, 'league', e.target.value)}
                              className={`${inputClass} py-1.5`}
                              placeholder="League/Division"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {editForm.experience.length === 0 && (
                      <p className="text-xs text-text-secondary text-center py-4 pl-6">No experience added yet.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profileData.experience.map((exp, index) => (
                      <div key={exp.id} className="relative pl-8">
                         <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ${index === 0 ? 'border-[3px] border-dark-surface bg-brand' : 'bg-dark-border'} z-10 transform -translate-x-1/2`}></div>
                         <p className={`text-[10px] font-bold ${index === 0 ? 'text-brand' : 'text-text-secondary'} tracking-widest uppercase mb-1`}>{exp.period}</p>
                         <h4 className="text-sm font-bold text-text-primary mb-0.5">{exp.team}</h4>
                         <p className="text-xs text-text-secondary">{exp.league}</p>
                      </div>
                    ))}
                    {profileData.experience.length === 0 && (
                      <p className="text-xs text-text-secondary pl-8">No experience listed.</p>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
