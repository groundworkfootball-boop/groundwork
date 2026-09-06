import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Mail, CheckCircle2, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

export const VerifyEmailPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!auth.currentUser) {
      toastError('Please sign in first to resend verification.');
      return;
    }
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      success('Verification email resent! Please check your inbox.');
    } catch (err: unknown) {
      toastError((err as Error)?.message ?? 'Failed to resend email. Please try again in a few minutes.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-black uppercase text-white tracking-tight">Verify Your Email</h1>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 mb-4">GROUNDWORK ACCOUNT SECURITY</p>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          We sent a verification link to{' '}
          <span className="text-brand font-mono font-bold">{user?.email || 'your registered email'}</span>.
          Please click the link in your email to unlock all platform recruitment features.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-brand" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          {sent && (
            <p className="text-xs text-brand flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Link sent! Check spam/junk if not visible within 2 minutes.</span>
            </p>
          )}

          <Link
            to="/dashboard"
            className="w-full bg-brand hover:bg-brand-hover text-black font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand/20 mt-4 inline-flex"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
