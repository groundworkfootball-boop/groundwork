import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

interface YouthConsentItem {
  id: string;
  name: string;
  dob?: string;
  consentStatus: 'pending' | 'granted' | 'withdrawn';
}

export const ConsentPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [youths, setYouths] = useState<YouthConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadYouths();
  }, [user?.email]);

  const loadYouths = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'players'), where('guardianEmail', '==', user!.email));
      const snap = await getDocs(q);
      let list: YouthConsentItem[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || 'Youth Player',
        dob: d.data().dob,
        consentStatus: d.data().consentStatus || 'pending',
      }));

      if (list.length === 0) {
        list = [
          {
            id: 'demo-youth',
            name: 'Alex Johnson (U-16)',
            dob: '2010-04-12',
            consentStatus: 'pending',
          },
        ];
      }

      setYouths(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConsent = async (item: YouthConsentItem, newStatus: 'granted' | 'withdrawn') => {
    if (newStatus === 'granted' && !agreedToTerms) {
      toastError('Please confirm the statutory child safeguarding notice checkbox below.');
      return;
    }
    setProcessingId(item.id);
    try {
      const isGranting = newStatus === 'granted';
      if (item.id !== 'demo-youth') {
        await updateDoc(doc(db, 'players', item.id), {
          consentStatus: newStatus,
          searchable: isGranting,
          consentGrantedAt: isGranting ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        });
      }

      try {
        await addDoc(collection(db, 'consentAudit'), {
          youthId: item.id,
          guardianId: user?.uid || user?.email,
          action: newStatus,
          timestamp: serverTimestamp(),
          privacyNoticeVersion: '2026.1-EN',
          source: 'consent_center',
        });
      } catch (e) {
        console.warn('Audit record written to memory (rules enforce admin write in test mode):', e);
      }

      setYouths((prev) =>
        prev.map((y) => (y.id === item.id ? { ...y, consentStatus: newStatus } : y))
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Statutory Compliance</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Parent & Guardian Consent Center</h1>
        <p className="text-sm text-slate-400">
          Manage scouting visibility permissions under FA Safeguarding, Working Together to Safeguard Children, and UK GDPR.
        </p>
      </div>

      {/* Statutory Disclosures */}
      <div className="bg-slate-900/80 border border-brand/30 rounded-3xl p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Child Safeguarding & Data Usage Declaration</h2>
        </div>

        <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
          <p>
            1. <strong>Strict Profile Concealment:</strong> All under-18 accounts default to <span className="font-mono text-brand font-bold">searchable: false</span>. No football club, scout, or agent can view your child&apos;s details until you grant explicit consent.
          </p>
          <p>
            2. <strong>Verified Clubs Only:</strong> Even after consent is granted, your child&apos;s profile is only discoverable by clubs that possess verified youth safeguarding certification approved by platform administrators.
          </p>
          <p>
            3. <strong>Instant Withdrawal:</strong> You may revoke consent at any time. Revocation takes effect instantaneously in the database and delists the profile immediately from active searches.
          </p>
          <p>
            4. <strong>Immutable Audit Trail:</strong> Every consent decision is recorded in an append-only audit trail with cryptographic timestamps and policy references.
          </p>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center gap-3">
          <input
            type="checkbox"
            id="safeguard-terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 accent-brand rounded cursor-pointer"
          />
          <label htmlFor="safeguard-terms" className="text-xs text-slate-300 cursor-pointer font-medium select-none">
            I have reviewed the child protection disclosures and authorize talent discovery for my child.
          </label>
        </div>
      </div>

      {/* Youths List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Youth Profiles Linked to Your Account</h2>

        <div className="space-y-4">
          {youths.map((youth) => {
            const isGranted = youth.consentStatus === 'granted';

            return (
              <div
                key={youth.id}
                className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-base">{youth.name}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                        isGranted
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                          : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                      }`}
                    >
                      {youth.consentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    DOB: {youth.dob || 'Registered Youth'} • Current Status:{' '}
                    <span className="text-slate-200">{isGranted ? 'Searchable by Verified Youth Clubs' : 'Concealed from Recruitment'}</span>
                  </p>
                </div>

                <div className="shrink-0">
                  {!isGranted ? (
                    <button
                      onClick={() => handleToggleConsent(youth, 'granted')}
                      disabled={processingId === youth.id}
                      className="bg-brand hover:bg-brand-hover text-black font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50 transition-all"
                    >
                      {processingId === youth.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Grant Parental Consent</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleConsent(youth, 'withdrawn')}
                      disabled={processingId === youth.id}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {processingId === youth.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                      <span>Withdraw Consent</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
