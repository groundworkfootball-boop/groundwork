import { useState } from 'react';
import { Save, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../../lib/toast';

export const SettingsPage = () => {
  const { success } = useToast();
  const [platformName, setPlatformName] = useState('GROUNDWORK Football Recruitment OS');
  const [supportEmail, setSupportEmail] = useState('safeguarding@groundwork.football');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [youthAutoDelist, setYouthAutoDelist] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('Platform system configuration updated.');
    }, 500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Platform System Settings</h1>
        <p className="text-sm text-slate-400">Manage global recruitment rules, support dispatch, and emergency controls.</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Platform Commercial Title</label>
          <input
            type="text"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Designated Child Safeguarding Contact</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Instant Delisting on Consent Revocation</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enforce immediate database-level query delisting if guardian withdraws consent.</p>
          </div>
          <button
            type="button"
            onClick={() => setYouthAutoDelist(!youthAutoDelist)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              youthAutoDelist ? 'bg-brand' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                youthAutoDelist ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Emergency Maintenance Mode</h3>
            <p className="text-xs text-slate-400 mt-0.5">Restricts public registration during scheduled database upgrades.</p>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              maintenanceMode ? 'bg-brand' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                maintenanceMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand hover:bg-brand-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save System Parameters</span>
        </button>
      </form>
    </div>
  );
};
