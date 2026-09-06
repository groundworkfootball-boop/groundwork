import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { PlayerRecord } from '../../app/types';
import { Save, Lock, Eye, EyeOff, Download, Trash2, Loader2 } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchable, setSearchable] = useState(true);
  const [region, setRegion] = useState('London');
  const [displayName, setDisplayName] = useState('');
  const [isYouth, setIsYouth] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'players', user.uid));
        if (snap.exists()) {
          const data = snap.data() as PlayerRecord;
          setSearchable(data.searchable ?? true);
          setRegion(data.region || 'London');
          setDisplayName(data.displayName || data.name || user.name || '');
          setIsYouth(!!data.isYouth);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'players', user!.uid), {
        searchable,
        region,
        displayName,
        updatedAt: serverTimestamp(),
      });
      success('Settings saved successfully.');
    } catch (err) {
      toastError('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleGDPRExport = async () => {
    setExporting(true);
    try {
      await addDoc(collection(db, 'gdprRequests'), {
        userId: user!.uid,
        userEmail: user!.email,
        type: 'export',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      success('Data export requested! You will receive your complete JSON export via email.');
    } catch {
      toastError('Could not process GDPR export request.');
    } finally {
      setExporting(false);
    }
  };

  const handleGDPRDelete = async () => {
    if (!window.confirm('Are you sure you want to request permanent account deletion under GDPR? This will queue your profile, videos, and applications for secure erasure.')) {
      return;
    }
    setDeleting(true);
    try {
      await addDoc(collection(db, 'gdprRequests'), {
        userId: user!.uid,
        userEmail: user!.email,
        type: 'delete',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      success('Deletion request logged. Admin compliance team will process within statutory limits.');
    } catch {
      toastError('Could not submit deletion request.');
    } finally {
      setDeleting(false);
    }
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
      <div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Player Privacy & Settings</h1>
        <p className="text-sm text-slate-400">Manage discovery visibility, personal preferences, and statutory data rights.</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Public Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Primary Scouting Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          >
            <option value="London">London & Greater London</option>
            <option value="North West">North West (Manchester / Liverpool)</option>
            <option value="Midlands">Midlands (Birmingham / Leicester)</option>
            <option value="South East">South East</option>
            <option value="Yorkshire">Yorkshire</option>
            <option value="Other">Other / Nationwide</option>
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {searchable ? <Eye className="w-4 h-4 text-brand" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              <span>Search Visibility</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isYouth
                ? 'Subject to valid guardian consent. Turning off immediately delists your profile from club queries.'
                : 'Control whether verified clubs can discover and view your profile in candidate searches.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchable(!searchable)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              searchable ? 'bg-brand' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                searchable ? 'translate-x-6' : 'translate-x-0'
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
          <span>Save Preferences</span>
        </button>
      </form>

      {/* GDPR Data Management Section */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand" />
            <span>GDPR Data Management & Rights</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            As a registered player, you retain full rights over your personal data under UK GDPR & FA Safeguarding regulations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">Export Personal Data</h3>
              <p className="text-xs text-slate-400 mt-1">Download a copy of your football profile, matches, video tags, and application history.</p>
            </div>
            <button
              onClick={handleGDPRExport}
              disabled={exporting}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 self-start"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Requesting...' : 'Request Data Export'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-sm font-bold text-red-400">Right to be Forgotten</h3>
              <p className="text-xs text-slate-400 mt-1">Queue your account for permanent erasure. Statutory audit records are retained per child protection law.</p>
            </div>
            <button
              onClick={handleGDPRDelete}
              disabled={deleting}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 self-start"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Logging...' : 'Request Account Deletion'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
