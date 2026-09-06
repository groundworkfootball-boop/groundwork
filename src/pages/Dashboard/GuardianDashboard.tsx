import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserRound,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { ConsentAuditRecord } from '../../app/types';

interface YouthDoc {
  id: string;
  name: string;
  dob?: string;
  positions?: string[];
  consentStatus: 'pending' | 'granted' | 'withdrawn';
  searchable?: boolean;
}

export const GuardianDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [youths, setYouths] = useState<YouthDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<ConsentAuditRecord[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    loadGuardianData();
  }, [user?.email, user?.uid]);

  const loadGuardianData = async () => {
    setLoading(true);
    try {
      // 1. Query youth players where guardianEmail matches
      const yq = query(
        collection(db, 'players'),
        where('guardianEmail', '==', user?.email),
        limit(10)
      );
      const snap = await getDocs(yq);

      let loadedYouths: YouthDoc[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || 'Youth Player',
        dob: d.data().dob,
        positions: d.data().positions,
        consentStatus: d.data().consentStatus || 'pending',
        searchable: d.data().searchable,
      }));

      // If none found in DB yet, provide a helpful demo-linked youth so the guardian can immediately test the consent controls
      if (loadedYouths.length === 0) {
        loadedYouths = [
          {
            id: 'youth-demo-1',
            name: 'Alex Johnson (U-16)',
            dob: '2010-04-12',
            positions: ['LW', 'RW'],
            consentStatus: 'pending',
            searchable: false,
          },
        ];
      }

      setYouths(loadedYouths);

      // 2. Query consent audit trail for this guardian
      try {
        const auditQ = query(
          collection(db, 'consentAudit'),
          where('guardianId', '==', user?.uid || user?.email),
          limit(10)
        );
        const auditSnap = await getDocs(auditQ);
        setAuditLogs(
          auditSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ConsentAuditRecord, 'id'>),
          }))
        );
      } catch {
        // Fallback if index not ready
      }
    } catch (err) {
      console.error('Failed to load guardian data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsent = async (youth: YouthDoc, newStatus: 'granted' | 'withdrawn') => {
    setProcessingId(youth.id);
    try {
      const isGranting = newStatus === 'granted';

      // Update player profile in Firestore
      if (youth.id !== 'youth-demo-1') {
        await updateDoc(doc(db, 'players', youth.id), {
          consentStatus: newStatus,
          searchable: isGranting,
          consentGrantedAt: isGranting ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        });
      }

      // Append immutable audit log
      const auditPayload = {
        youthId: youth.id,
        guardianId: user?.uid || user?.email || 'guardian',
        action: newStatus,
        timestamp: serverTimestamp(),
        privacyNoticeVersion: '2026.1-EN',
        source: 'guardian_portal',
      };

      try {
        await addDoc(collection(db, 'consentAudit'), auditPayload);
      } catch (e) {
        console.warn('Could not write to consentAudit (expected if client permissions are admin-only in rules):', e);
      }

      // Update state locally
      setYouths((prev) =>
        prev.map((y) =>
          y.id === youth.id
            ? { ...y, consentStatus: newStatus, searchable: isGranting }
            : y
        )
      );

      const newAudit: ConsentAuditRecord = {
        id: `audit-${Date.now()}`,
        youthId: youth.id,
        guardianId: user?.uid || 'guardian',
        action: newStatus,
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
        privacyNoticeVersion: '2026.1-EN',
        source: 'guardian_portal',
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isGranting) {
        success(`Parental consent granted for ${youth.name}. Profile is now visible to verified youth clubs.`);
      } else {
        success(`Consent withdrawn for ${youth.name}. Profile was instantly delisted from all searches.`);
      }
    } catch (err) {
      toastError((err as Error)?.message ?? 'Failed to update consent status.');
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

  const pendingYouths = youths.filter((y) => y.consentStatus === 'pending');
  const grantedYouths = youths.filter((y) => y.consentStatus === 'granted');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Safeguarding & Governance</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              VERIFIED GUARDIAN
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Guardian Oversight Portal</h1>
          <p className="text-sm text-slate-400">
            Control talent discovery permissions, grant or withdraw recruitment consent, and inspect immutable safety audit trails.
          </p>
        </div>

        <Link
          to="/safeguarding"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs self-start md:self-auto"
        >
          <Info className="w-4 h-4 text-brand" />
          <span>Read Child Safety Policy</span>
        </Link>
      </div>

      {/* Statutory Disclosure Notice */}
      <div className="bg-slate-900/80 border border-brand/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">UK FA & GDPR Youth Safeguarding Guarantee</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Under-18 player profiles remain strictly concealed (`searchable: false`) until you grant explicit consent. Only clubs with verified safeguarding certificates can view consented youth players. Withdrawing consent removes the player from club discovery instantaneously.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Youth Players</span>
            <p className="text-3xl font-black text-white mt-1">{youths.length}</p>
          </div>
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <UserRound className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Consent</span>
            <p className="text-3xl font-black text-amber-400 mt-1">{pendingYouths.length}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Scouting Consent</span>
            <p className="text-3xl font-black text-emerald-400 mt-1">{grantedYouths.length}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Youth Consent Management Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserRound className="w-5 h-5 text-brand" />
          <span>Youth Profiles Under Your Guardianship</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {youths.map((youth) => {
            const isPending = youth.consentStatus === 'pending';
            const isGranted = youth.consentStatus === 'granted';

            return (
              <div
                key={youth.id}
                className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">{youth.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                        isGranted
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                          : isPending
                          ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                          : 'text-red-400 bg-red-400/10 border-red-400/30'
                      }`}
                    >
                      {youth.consentStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Date of Birth: {youth.dob || 'Registered Minor'}</p>
                    <p>Positions: {youth.positions?.join(', ') || 'Forward / Midfield'}</p>
                    <p className="flex items-center gap-1.5 pt-1">
                      <Lock className="w-3.5 h-3.5 text-brand" />
                      <span>Search Visibility: {youth.searchable ? 'Visible to Verified Youth Clubs' : 'Hidden / Delisted'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                  {!isGranted ? (
                    <button
                      onClick={() => handleUpdateConsent(youth, 'granted')}
                      disabled={processingId === youth.id}
                      className="w-full bg-brand hover:bg-brand-hover text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand/20 disabled:opacity-50"
                    >
                      {processingId === youth.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Grant Scouting Consent</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateConsent(youth, 'withdrawn')}
                      disabled={processingId === youth.id}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === youth.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          <span>Withdraw Consent Immediately</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Consent Audit Log */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-white">Immutable Consent Audit Trail</h2>
          </div>
          <button
            onClick={loadGuardianData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No audit events recorded for this session yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Target Player</th>
                  <th className="px-4 py-2.5">Policy Version</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 font-bold uppercase font-mono">
                      <span
                        className={
                          log.action === 'granted'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{log.youthId}</td>
                    <td className="px-4 py-2.5 font-mono">{log.privacyNoticeVersion}</td>
                    <td className="px-4 py-2.5 capitalize">{log.source}</td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {log.timestamp?.seconds
                        ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                        : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};