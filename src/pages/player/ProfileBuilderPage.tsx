import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { PlayerRecord } from '../../app/types';
import { ArrowRight, ArrowLeft, Check, CheckCircle2, Loader2 } from 'lucide-react';

export const ProfileBuilderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [primaryPos, setPrimaryPos] = useState('CM');
  const [secondaryPos, setSecondaryPos] = useState('CAM');
  const [playingLevel, setPlayingLevel] = useState(5);
  const [dominantFoot, setDominantFoot] = useState<'Left' | 'Right' | 'Both'>('Right');
  const [height, setHeight] = useState(180);
  const [skills, setSkills] = useState({
    passing: 7,
    dribbling: 7,
    shooting: 6,
    defending: 5,
    first_touch: 8,
    pace: 7,
    stamina: 8,
  });
  const [availability, setAvailability] = useState<string[]>(['Saturday', 'Tuesday Eve']);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'players', user.uid));
        if (snap.exists()) {
          const data = snap.data() as PlayerRecord;
          if (data.positions?.[0]) setPrimaryPos(data.positions[0]);
          if (data.positions?.[1]) setSecondaryPos(data.positions[1]);
          if (data.playingLevel) setPlayingLevel(data.playingLevel);
          if (data.dominantFoot) setDominantFoot(data.dominantFoot);
          if (data.height) setHeight(data.height);
          if (data.skillRatings) setSkills((prev) => ({ ...prev, ...data.skillRatings }));
          if (data.availability) setAvailability(data.availability);
          if (data.bio) setBio(data.bio);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const toggleAvailability = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const positions = [primaryPos, secondaryPos].filter(Boolean);
      // Deterministic profile completeness calculation
      let comp = 30; // base registered
      if (positions.length > 0) comp += 25;
      if (Object.keys(skills).length >= 5) comp += 20;
      if (availability.length > 0) comp += 15;
      if (bio.trim().length > 15) comp += 10;
      comp = Math.min(100, comp);

      await updateDoc(doc(db, 'players', user!.uid), {
        positions,
        playingLevel: Number(playingLevel),
        dominantFoot,
        height: Number(height),
        skillRatings: skills,
        availability,
        bio,
        profileCompleteness: comp,
        updatedAt: serverTimestamp(),
      });

      success('Profile successfully completed and synchronized!');
      navigate('/dashboard');
    } catch (err) {
      toastError('Failed to save profile builder data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const days = ['Monday Eve', 'Tuesday Eve', 'Wednesday Eve', 'Thursday Eve', 'Friday Eve', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      <div className="text-center">
        <span className="text-brand font-bold text-xs uppercase tracking-widest">Guided Onboarding</span>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-1">Player Profile Builder</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete your technical ratings and availability to optimize deterministic matching accuracy.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center justify-between px-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? 'bg-brand text-black shadow-lg shadow-brand/20'
                  : step > s
                  ? 'bg-brand/20 text-brand border border-brand/30'
                  : 'bg-white/5 text-slate-500 border border-white/10'
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              {s === 1 ? 'Positions' : s === 2 ? 'Physical' : s === 3 ? 'Skills' : 'Schedule'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Step 1: Positions & Level */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Positional Alignment</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Primary Position</label>
                <select
                  value={primaryPos}
                  onChange={(e) => setPrimaryPos(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand"
                >
                  {['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Secondary Position</label>
                <select
                  value={secondaryPos}
                  onChange={(e) => setSecondaryPos(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand"
                >
                  <option value="">None</option>
                  {['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Self-Assessed Playing Tier</label>
                <span className="font-mono text-brand font-bold text-sm">Tier {playingLevel} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={playingLevel}
                onChange={(e) => setPlayingLevel(Number(e.target.value))}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Tier 1 (Sunday League / Grassroots)</span>
                <span>Tier 5 (Academy / Semi-Pro)</span>
                <span>Tier 10 (Elite Professional)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Physical & Foot */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Physical & Anthropometric Profile</h2>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dominant Foot</label>
              <div className="grid grid-cols-3 gap-3">
                {['Right', 'Left', 'Both'].map((foot) => (
                  <button
                    key={foot}
                    type="button"
                    onClick={() => setDominantFoot(foot as typeof dominantFoot)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      dominantFoot === foot
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    {foot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Height (cm)</label>
                <span className="font-mono text-brand font-bold text-sm">{height} cm</span>
              </div>
              <input
                type="range"
                min={140}
                max={210}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Player Bio & Career Summary</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share your playing style, previous clubs, achievements, and aspirations..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        )}

        {/* Step 3: Technical Ratings */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Technical & Physical Attribute Ratings</h2>
            <p className="text-xs text-slate-400">
              Ratings are normalized (1-10) to contribute to your deterministic attribute compatibility with clubs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(skills).map(([key, val]) => (
                <div key={key} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-bold text-white capitalize">{key.replace('_', ' ')}</span>
                    <span className="font-mono text-brand font-bold">{val} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={val}
                    onChange={(e) =>
                      setSkills({ ...skills, [key]: Number(e.target.value) })
                    }
                    className="w-full accent-brand"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Weekly Training & Trial Availability</h2>
            <p className="text-xs text-slate-400">
              Select time slots you can commit to for training sessions and match trials.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {days.map((d) => {
                const active = availability.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleAvailability(d)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      active
                        ? 'border-brand bg-brand/10 text-brand shadow-md shadow-brand/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <span>{d}</span>
                    {active && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nav Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 px-5 rounded-xl text-xs flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-brand hover:bg-brand-hover text-black font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand/20"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="bg-brand hover:bg-brand-hover text-black font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save & Complete Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
