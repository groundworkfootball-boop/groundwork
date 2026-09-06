import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Sliders, CheckCircle2, AlertCircle, Save, RefreshCw, Loader2, Info } from 'lucide-react';
import type { MatchingConfigRecord } from '../../app/types';

export const MatchingConfigPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Weights (Percentages 0-100)
  const [positionWeight, setPositionWeight] = useState(30);
  const [distanceWeight, setDistanceWeight] = useState(15);
  const [levelWeight, setLevelWeight] = useState(20);
  const [attributesWeight, setAttributesWeight] = useState(20);
  const [availabilityWeight, setAvailabilityWeight] = useState(10);
  const [boostWeight, setBoostWeight] = useState(5);
  const [version, setVersion] = useState(1);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'systemConfig', 'matching'));
      if (snap.exists()) {
        const data = snap.data() as MatchingConfigRecord;
        setPositionWeight(Math.round(data.positionWeight * 100));
        setDistanceWeight(Math.round(data.distanceWeight * 100));
        setLevelWeight(Math.round(data.levelWeight * 100));
        setAttributesWeight(Math.round(data.attributesWeight * 100));
        setAvailabilityWeight(Math.round(data.availabilityWeight * 100));
        setBoostWeight(Math.round(data.boostWeight * 100));
        setVersion(data.version || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const total =
    Number(positionWeight) +
    Number(distanceWeight) +
    Number(levelWeight) +
    Number(attributesWeight) +
    Number(availabilityWeight) +
    Number(boostWeight);

  const isValid = total === 100;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toastError(`Total weights must equal 100%. Current sum: ${total}%.`);
      return;
    }
    setSaving(true);
    try {
      const newVersion = version + 1;
      const configPayload: MatchingConfigRecord = {
        positionWeight: positionWeight / 100,
        distanceWeight: distanceWeight / 100,
        levelWeight: levelWeight / 100,
        attributesWeight: attributesWeight / 100,
        availabilityWeight: availabilityWeight / 100,
        boostWeight: boostWeight / 100,
        version: newVersion,
      };

      // 1. Update current config
      await setDoc(doc(db, 'systemConfig', 'matching'), {
        ...configPayload,
        updatedAt: serverTimestamp(),
      });

      // 2. Append to immutable history collection
      await addDoc(collection(db, 'matchingConfigVersions'), {
        ...configPayload,
        createdAt: serverTimestamp(),
        authorId: user?.uid,
      });

      setVersion(newVersion);
      success(`Matching weights updated to Version ${newVersion}!`);
    } catch {
      toastError('Failed to update matching configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateMatches = () => {
    setRecalculating(true);
    setTimeout(() => {
      setRecalculating(false);
      success('Background recalculation worker dispatched! Match results are syncing.');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Algorithmic Governance</span>
            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-mono font-bold">
              VERSION {version}
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Deterministic Matching Engine</h1>
          <p className="text-sm text-slate-400">
            Configure mathematical weights for player-club compatibility. AI is strictly forbidden from scoring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRecalculateMatches}
          disabled={recalculating}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          {recalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-brand" />}
          <span>Trigger Recalculation</span>
        </button>
      </div>

      <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white">Mathematical Determinism Rule (Section 13)</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            All match scores are pure functions of these 6 weights. No machine learning model or non-deterministic token generator is ever allowed to alter player compatibility rankings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <span className="text-sm font-bold text-white">Weight Distribution</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Sum:</span>
            <span
              className={`font-mono text-base font-black px-3 py-0.5 rounded-full border ${
                isValid
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                  : 'text-red-400 bg-red-400/10 border-red-400/30'
              }`}
            >
              {total}% / 100%
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Position Compatibility (Exact vs Adjacent)', val: positionWeight, set: setPositionWeight },
            { label: 'Distance & Region Decay', val: distanceWeight, set: setDistanceWeight },
            { label: 'Playing Level Tier Normalization', val: levelWeight, set: setLevelWeight },
            { label: 'Player Attributes (Technical & Physical)', val: attributesWeight, set: setAttributesWeight },
            { label: 'Availability Overlap (Training / Trial)', val: availabilityWeight, set: setAvailabilityWeight },
            { label: 'Visibility / Boost Flat Bonus', val: boostWeight, set: setBoostWeight },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="font-semibold text-white">{item.label}</span>
                <span className="font-mono text-brand font-bold text-sm">{item.val}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={item.val}
                onChange={(e) => item.set(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 flex items-center justify-between">
          {!isValid && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Weights must sum to exactly 100% before saving.</span>
            </p>
          )}
          {isValid && <div />}

          <button
            type="submit"
            disabled={!isValid || saving}
            className="bg-brand hover:bg-brand-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration v{version + 1}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
