import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { KeyRound, Loader2, ArrowRight } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const oobCode = searchParams.get('oobCode') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [codeValid, setCodeValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      setCodeValid(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setAccountEmail(email);
        setCodeValid(true);
      })
      .catch(() => {
        setCodeValid(false);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toastError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      success('Password updated successfully! You can now sign in.');
      navigate('/login');
    } catch (err: unknown) {
      toastError((err as Error)?.message ?? 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black uppercase text-white tracking-tight">Set New Password</h1>
          {accountEmail && (
            <p className="text-xs text-slate-400 mt-1">For account: <span className="text-white font-mono">{accountEmail}</span></p>
          )}
        </div>

        {verifying ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
            <p className="text-xs">Verifying reset token...</p>
          </div>
        ) : !codeValid ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-red-400">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-brand text-black font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-brand-hover"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-slate-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-slate-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand hover:bg-brand-hover text-black font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50 text-sm mt-4"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
