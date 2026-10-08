import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  UserPlus,
  Lock,
} from 'lucide-react';

interface YouthConsentItem {
  id: string;
  name: string;
  dob?: string;
  consentStatus: 'pending' | 'granted' | 'withdrawn';
  email?: string;
}

export const ConsentPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [youths, setYouths] = useState<YouthConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Link youth state
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!user?.email && !user?.uid) return;
    loadYouths();
  }, [user?.email, user?.uid]);

  const loadYouths = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'players'),
        where('guardianEmail', '==', user?.email || ''),
      );
      const snap = await getDocs(q);
      const list: YouthConsentItem[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || 'Youth Player',
        dob: d.data().dob,
        consentStatus: d.data().consentStatus || 'pending',
        email: d.data().email,
      }));
      setYouths(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkYouth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childEmail.trim() || !user?.email) return;
    setLinking(true);
    try {
      const q = query(
        collection(db, 'players'),
        where('email', '==', childEmail.trim().toLowerCase()),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toastError(`No player account found with email "${childEmail}". Check spelling with your child.`);
        return;
      }

      const pDoc = snap.docs[0];
      await updateDoc(doc(db, 'players', pDoc.id), {
        guardianEmail: user.email,
        guardianId: user.uid,
        guardianName: user.name,
        isYouth: true,
        updatedAt: serverTimestamp(),
      });

      success(`Successfully linked ${pDoc.data().name || 'player'} to your guardian portal!`);
      setChildEmail('');
      setShowLinkForm(false);
      await loadYouths();
    } catch (err) {
      toastError('Failed to link youth account.');
    } finally {
      setLinking(false);
    }
  };

  const handleToggleConsent = async (item: YouthConsentItem, newStatus: 'granted' | 'withdrawn') => {
    if (newStatus === 'granted' && !agreedToTerms) {
      toastError('Please confirm the statutory child safeguarding notice checkbox below before granting consent.');
      return;
    }
    setProcessingId(item.id);
    try {
      const isGranting = newStatus === 'granted';

      // Real write to Firestore players document
      await updateDoc(doc(db, 'players', item.id), {
        consentStatus: newStatus,
        searchable: isGranting,
        consentGrantedAt: isGranting ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      // Write immutable append-only record to consentAudit
      await addDoc(collection(db, 'consentAudit'), {
        youthId: item.id,
        guardianId: user?.uid || user?.email,
        action: newStatus,
        timestamp: serverTimestamp(),
        privacyNoticeVersion: '2026.1-EN',
        source: 'guardian_consent_center',
      });

      setYouths((prev) =>
        prev.map((y) => (y.id === item.id ? { ...y, consentStatus: newStatus } : y)),
      );

      if (isGranting) {
        success(`Consent granted for ${item.name}! Profile is now visible to verified youth clubs.`);
      } else {
        success(`Consent withdrawn for ${item.name}. Profile was instantly delisted from all searches.`);
      }
    } catch (err) {
      toastError((err as Error)?.message ?? 'Failed to update consent.');
    } finally {
      setProcessingId(null);
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
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-brand font-bold text-xs uppercase tracking-widest">
            Statutory Safeguarding Portal
          </span>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-1">
            Guardian Consent Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Provide explicit verified parental authorization for youth players under 18 years of age.
          </p>
        </div>
        <button
          onClick={() => setShowLinkForm((p) => !p)}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2 self-start"
        >
          <UserPlus className="w-4 h-4 text-brand" />
          <span>Link Child's Account</span>
        </button>
      </div>

      {/* Link Account Form */}
      {showLinkForm && (
        <form
          onSubmit={handleLinkYouth}
          className="p-6 bg-slate-900 border border-brand/30 rounded-3xl space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Link Child's Registered Player Account
          </h3>
          <p className="text-xs text-slate-400">
            Enter the email address your child used to create their player account on Groundwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={childEmail}
              onChange={(e) => setChildEmail(e.target.value)}
              placeholder="child.player@example.com"
              className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand"
              required
            />
            <button
              type="submit"
              disabled={linking}
              className="px-6 py-2.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Link Account</span>
            </button>
          </div>
        </form>
      )}

      {/* Legal & Governance Notice */}
      <div className="bg-slate-900/90 border border-brand/30 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand/10 border border-brand/30 rounded-2xl text-brand shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">
              Plain-Language Privacy Notice for Legal Guardians (Version 2026.1-EN)
            </h2>
            <p>
              By granting recruitment consent, you authorize Groundwork to display your ward's football dossier
              (positions, age band, attributes, training availability, and match clips) <strong>strictly</strong> to verified football
              clubs that hold authenticated safeguarding clearance.
            </p>
            <p>
              Your child's direct contact details (email, phone number, home address) remain strictly hidden. You retain
              the statutory right to revoke consent at any moment. Upon revocation, the profile is immediately delisted
              from club search engines.
            </p>
          </div>
        </div>
      </div>

      {/* Youth List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Linked Minor Profiles ({youths.length})
        </h2>

        {youths.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-12 text-center">
            <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Youth Players Linked Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              No registered minor accounts are associated with your guardian email ({user?.email}). Click below to link your child's player profile.
            </p>
            <button
              onClick={() => setShowLinkForm(true)}
              className="px-6 py-2.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-hover transition-all"
            >
              Link Player Profile
            </button>
          </div>
        ) : (
          youths.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">{item.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    {item.dob && <span>DOB: {item.dob}</span>}
                    {item.email && <span className="font-mono">{item.email}</span>}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border self-start sm:self-auto ${
                    item.consentStatus === 'granted'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : item.consentStatus === 'withdrawn'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  Status: {item.consentStatus}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {item.consentStatus !== 'granted' ? (
                  <button
                    onClick={() => handleToggleConsent(item, 'granted')}
                    disabled={processingId === item.id || !agreedToTerms}
                    className="flex-1 py-3 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Authorize & Grant Discovery Consent</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleConsent(item, 'withdrawn')}
                    disabled={processingId === item.id}
                    className="flex-1 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                    <span>Withdraw Consent & Instant Delist</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Checkbox */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-start gap-3">
        <input
          type="checkbox"
          id="statutory-agree"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 w-4 h-4 accent-brand rounded cursor-pointer"
        />
        <label htmlFor="statutory-agree" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
          I certify under statutory parental oversight regulations that I am the verified parent or legal guardian of the
          minor player listed above, and I authorize Groundwork to process their athletic data strictly according to the child safeguarding guidelines.
        </label>
      </div>
    </div>
  );
};
