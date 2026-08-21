import { useEffect, useState } from 'react';
import { Settings, Save, Loader2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface MatchingConfig {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
  version: number;
  updatedAt?: unknown;
}

const DEFAULT_CONFIG: MatchingConfig = {
  positionWeight: 0.30,
  distanceWeight: 0.15,
  levelWeight: 0.20,
  attributesWeight: 0.20,
  availabilityWeight: 0.10,
  boostWeight: 0.05,
  version: 1,
};

const WEIGHT_LABELS: { key: keyof MatchingConfig; label: string; description: string }[] = [
  { key: 'positionWeight', label: 'Position Compatibility', description: 'Weight given to position match between player and club requirement.' },
  { key: 'distanceWeight', label: 'Distance / Region', description: 'Weight given to geographic proximity and regional match.' },
  { key: 'levelWeight', label: 'Playing Level', description: 'Weight given to matching player\'s current level with club\'s target level.' },
  { key: 'attributesWeight', label: 'Player Attributes', description: 'Weight given to player\'s self-reported skill ratings.' },
  { key: 'availabilityWeight', label: 'Availability Overlap', description: 'Weight given to matching training/match availability.' },
  { key: 'boostWeight', label: 'Visibility Boost', description: 'Flat boost applied when a player has an active boost enabled.' },
];

export const SystemConfig = () => {
  const { success, error: toastError, warning } = useToast();
  const [config, setConfig] = useState<MatchingConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const snap = await getDoc(doc(db, 'systemConfig', 'matching'));
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...(snap.data() as MatchingConfig) });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error('Config load error:', err);
      setFetchError('Failed to load configuration. Admin permissions required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    // Validate weights sum to 1.0
    const sum = WEIGHT_LABELS.reduce((acc, { key }) => acc + (config[key] as number), 0);
    const roundedSum = Math.round(sum * 100) / 100;

    if (Math.abs(roundedSum - 1.0) > 0.001) {
      toastError(`Weights must sum to 1.0. Current sum: ${roundedSum.toFixed(3)}`);
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'systemConfig', 'matching'), {
        ...config,
        version: (config.version ?? 0) + 1,
        updatedAt: serverTimestamp(),
      });
      setConfig((prev) => ({ ...prev, version: (prev.version ?? 0) + 1 }));
      success('Matching configuration saved. Version incremented.');
    } catch (err) {
      console.error('Config save error:', err);
      toastError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    warning('Weights reset to defaults. Click Save to apply.');
  };

  const handleWeightChange = (key: keyof MatchingConfig, value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      setConfig((prev) => ({ ...prev, [key]: parsed }));
    }
  };

  const currentSum = WEIGHT_LABELS.reduce((acc, { key }) => acc + (config[key] as number), 0);
  const roundedSum = Math.round(currentSum * 100) / 100;
  const isValidSum = Math.abs(roundedSum - 1.0) <= 0.001;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Settings className="w-7 h-7 text-brand" />
            <span>System Configuration</span>
          </h3>
          <p className="text-text-secondary text-sm mt-1">Configure matching engine weights and platform settings.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <span className="font-medium">Version:</span>
          <span className="font-black text-brand">{config.version ?? 1}</span>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      {/* Matching Engine Weights */}
      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-dark-border flex items-center space-x-2">
          <Info className="w-4 h-4 text-brand" />
          <h4 className="font-bold uppercase tracking-tight">Matching Engine Weights</h4>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-dark-bg/50 border border-dark-border/50 rounded-lg p-4 text-xs text-text-secondary">
            <p className="font-bold text-white mb-1">Configuration Rules</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>All weights must be between 0 and 1</li>
              <li>Weights must sum exactly to 1.0 before saving</li>
              <li>Each save increments the configuration version</li>
              <li>Changing weights will affect all new match calculations</li>
            </ul>
          </div>

          {WEIGHT_LABELS.map(({ key, label, description }) => {
            const value = config[key] as number;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-sm font-bold text-text-primary">{label}</label>
                    <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={value.toFixed(2)}
                      onChange={(e) => handleWeightChange(key, e.target.value)}
                      className="w-20 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-brand"
                    />
                    <span className="text-sm font-bold text-text-secondary w-12 text-right">
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Sum indicator */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${isValidSum ? 'border-brand/30 bg-brand/5' : 'border-red-400/30 bg-red-400/5'}`}>
            <span className="text-sm font-bold">Total Weight Sum</span>
            <span className={`text-lg font-black ${isValidSum ? 'text-brand' : 'text-red-400'}`}>
              {roundedSum.toFixed(3)}
              {isValidSum ? ' ✓' : ' ✗ (must be 1.000)'}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dark-border flex justify-between items-center">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 border border-dark-border text-text-secondary font-bold text-sm rounded hover:border-brand/50 hover:text-brand transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValidSum}
            className="flex items-center space-x-2 px-6 py-2 bg-brand text-dark-bg font-bold text-sm rounded hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* External Services */}
      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h4 className="font-bold uppercase tracking-tight">External Service Status</h4>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: 'Claude AI (Anthropic)', status: 'Not Configured', hint: 'Set CLAUDE_API_KEY in Firebase Functions config.' },
            { label: 'Stripe Payments', status: 'Not Configured', hint: 'Set STRIPE_SECRET_KEY in Firebase Functions config.' },
            { label: 'Firebase App Check', status: 'Not Configured', hint: 'Enable App Check in Firebase Console for production.' },
          ].map(({ label, status, hint }) => (
            <div key={label} className="flex items-start justify-between p-4 bg-dark-bg border border-dark-border rounded-lg">
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-text-secondary mt-1">{hint}</p>
              </div>
              <span className="text-xs font-bold text-text-secondary border border-dark-border px-2 py-0.5 rounded whitespace-nowrap ml-4">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
