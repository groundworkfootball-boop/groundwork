import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Save, ShieldCheck, Loader2 } from 'lucide-react';
import type { ClubRecord } from '../../app/types';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubName, setClubName] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [stadiumLocation, setStadiumLocation] = useState('');
  const [safeguardingOfficer, setSafeguardingOfficer] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'clubs', user.uid));
        if (snap.exists()) {
          const data = snap.data() as ClubRecord;
          setClubName(data.name || user.name || '');
          setWebsite(data.website || '');
          setContactEmail(data.contactEmail || user.email || '');
          setContactPhone(data.contactPhone || '');
          setStadiumLocation(data.stadiumLocation || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, user?.name, user?.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clubs', user!.uid), {
        name: clubName,
        website,
        contactEmail,
        contactPhone,
        stadiumLocation,
        safeguardingOfficer,
        updatedAt: serverTimestamp(),
      });
      success('Club profile and operations settings updated!');
    } catch (err) {
      toastError('Failed to update settings.');
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Club Operational Settings</h1>
        <p className="text-sm text-slate-400">Manage contact information, ground locations, and designated safeguarding officers.</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Club Official Name</label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Official Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourclub.co.uk"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Recruitment Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contact Phone Number</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+44 7000 000000"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Stadium / Training Ground Address</label>
          <input
            type="text"
            value={stadiumLocation}
            onChange={(e) => setStadiumLocation(e.target.value)}
            placeholder="e.g. Sports Ground, London Road, N1 2AB"
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div className="pt-4 border-t border-white/10">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>Designated Safeguarding Officer</span>
          </label>
          <input
            type="text"
            value={safeguardingOfficer}
            onChange={(e) => setSafeguardingOfficer(e.target.value)}
            placeholder="Name & FA Certificate Reference Number"
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
          />
          <p className="text-xs text-slate-500 mt-1">Required for clubs seeking youth trial scouting authorization.</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand hover:bg-brand-hover text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
};
