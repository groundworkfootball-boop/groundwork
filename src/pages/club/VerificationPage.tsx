import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, UploadCloud, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VerificationPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [clubData, setClubData] = useState<any>(null);
  
  // Form fields
  const [regNumber, setRegNumber] = useState('');
  const [repName, setRepName] = useState('');
  const [repRole, setRepRole] = useState('');
  const [hasYouth, setHasYouth] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'clubs', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setClubData(data);
          setHasYouth((data.targetAgeGroups || []).some((a: string) => a.startsWith('U')));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSubmitting(true);

    try {
      // In a real app, we'd upload actual files to Firebase Storage here.
      // For this implementation, we update the status in Firestore.
      await updateDoc(doc(db, 'clubs', user.uid), {
        verificationStatus: 'under_review',
        registrationNumber: regNumber,
        authorizedRepName: repName,
        authorizedRepRole: repRole,
        verificationSubmittedAt: serverTimestamp()
      });
      
      setClubData({ ...clubData, verificationStatus: 'under_review' });
      success('Verification documents submitted successfully.');
    } catch (err) {
      console.error(err);
      toastError('Failed to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const status = clubData?.verificationStatus || 'pending';

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-1">Verification Center</h2>
          <p className="text-text-secondary text-sm">Submit your club's operational and safeguarding documents.</p>
        </div>
      </div>

      {status === 'approved' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center mb-8">
          <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-400 mb-2">Club Verified</h3>
          <p className="text-sm text-green-400/80 mb-6">Your club has full access to the Groundwork deterministic search engine.</p>
          <Link to="/dashboard/search" className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500/20 text-green-400 font-bold rounded-lg hover:bg-green-500/30 transition-colors uppercase tracking-widest text-xs">
            <span>Search Players</span>
          </Link>
        </div>
      )}

      {status === 'under_review' && (
        <div className="bg-brand/10 border border-brand/30 rounded-2xl p-8 text-center mb-8">
          <Loader2 className="w-16 h-16 text-brand mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold text-brand mb-2">Verification Under Review</h3>
          <p className="text-sm text-brand/80">Our administration team is currently reviewing your documents. You will be notified once the review is complete.</p>
        </div>
      )}

      {(status === 'pending' || status === 'rejected') && (
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-xl">
          {status === 'rejected' && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3 mb-8">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400">Verification Rejected</p>
                <p className="text-xs text-red-400/80 mt-1">Please review the details and resubmit valid documentation.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Registration Number *</label>
                <input 
                  type="text" 
                  required 
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" 
                  placeholder="FA Affiliation or Company No." 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Authorized Rep Name *</label>
                <input 
                  type="text" 
                  required 
                  value={repName}
                  onChange={e => setRepName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" 
                  placeholder="Full Name" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Rep Role *</label>
                <input 
                  type="text" 
                  required 
                  value={repRole}
                  onChange={e => setRepRole(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand" 
                  placeholder="e.g. Club Secretary, Director" 
                />
              </div>
            </div>

            <div className="border-t border-dark-border pt-6 mt-6">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Upload Documents</label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-dark-border rounded-lg bg-dark-bg border-dashed">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-dark-surface flex items-center justify-center">
                      <FileText className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Club Registration Document</p>
                      <p className="text-xs text-text-secondary">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                  </div>
                  <button type="button" className="px-4 py-2 bg-dark-surface text-text-primary text-xs font-bold uppercase tracking-widest rounded hover:bg-dark-border transition-colors">
                    Upload
                  </button>
                </div>

                {hasYouth && (
                  <div className="flex items-center justify-between p-4 border border-amber-500/30 rounded-lg bg-amber-500/5 border-dashed">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-400">Safeguarding Certificate</p>
                        <p className="text-xs text-amber-400/70">Required for youth recruitment (Max 5MB)</p>
                      </div>
                    </div>
                    <button type="button" className="px-4 py-2 bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest rounded hover:bg-amber-500/30 transition-colors">
                      Upload
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={submitting || !regNumber || !repName || !repRole}
                className="px-8 py-3 bg-brand text-dark-bg font-bold text-sm rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 uppercase tracking-widest transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>Submit Verification</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
