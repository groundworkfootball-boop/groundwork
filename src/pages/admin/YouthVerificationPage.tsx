import { useState, useEffect } from 'react';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { ClubRecord } from '../../app/types';
import { ShieldCheck, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

export const YouthVerificationPage = () => {
  const { success, error: toastError } = useToast();

  const [clubs, setClubs] = useState<ClubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadYouthRequests();
  }, []);

  const loadYouthRequests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'clubs'));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClubRecord, 'id'>) }));
      setClubs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantYouthAuthorization = async (clubId: string, grant: boolean) => {
    setProcessingId(clubId);
    try {
      // 1-year expiry timestamp if granted
      const expiry = grant ? { seconds: Math.floor(Date.now() / 1000) + 86400 * 365 } : null;
      await updateDoc(doc(db, 'clubs', clubId), {
        verifiedYouth: grant,
        youthVerificationExpiresAt: expiry,
        updatedAt: serverTimestamp(),
      });
      setClubs((prev) =>
        prev.map((c) => (c.id === clubId ? { ...c, verifiedYouth: grant, youthVerificationExpiresAt: expiry } : c))
      );
      success(grant ? 'Youth scouting authorization granted for 1 year!' : 'Youth authorization revoked.');
    } catch {
      toastError('Could not update youth verification status.');
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Child Safety Governance</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Youth Recruitment Verification Desk</h1>
          <p className="text-sm text-slate-400">
            Audit club safeguarding policies, FA coaching credentials, and issue time-limited youth scouting authorization.
          </p>
        </div>
        <button
          onClick={loadYouthRequests}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-brand/10 border border-brand/30 rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Youth Protection Access Control</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with Section 19 & 42 of the specification, unverified clubs receive permission errors if attempting to query under-18 profiles. Youth access automatically expires after 365 days unless renewed with updated FA DBS/safeguarding certificates.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Club Name</th>
                <th className="px-4 py-3">Unique Code</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Youth Authorization</th>
                <th className="px-4 py-3">Statutory Expiry</th>
                <th className="px-4 py-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clubs.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{c.name || 'Club'}</td>
                  <td className="px-4 py-3 font-mono text-brand font-bold">{c.clubCode || '—'}</td>
                  <td className="px-4 py-3">{c.region || 'UK'}</td>
                  <td className="px-4 py-3">
                    {c.verifiedYouth ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Authorized</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px] flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        <span>Unauthorized</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.youthVerificationExpiresAt?.seconds
                      ? new Date(c.youthVerificationExpiresAt.seconds * 1000).toLocaleDateString()
                      : 'Not issued'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!c.verifiedYouth ? (
                      <button
                        onClick={() => handleGrantYouthAuthorization(c.id, true)}
                        disabled={processingId === c.id}
                        className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-[11px] shadow-md shadow-brand/20 transition-all disabled:opacity-50"
                      >
                        {processingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Grant Youth License'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantYouthAuthorization(c.id, false)}
                        disabled={processingId === c.id}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[11px] transition-all disabled:opacity-50"
                      >
                        {processingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revoke License'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
