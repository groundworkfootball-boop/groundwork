import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const { sendReset } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await sendReset(email);
      setSent(true);
      success('Password reset email sent. Check your inbox.');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/user-not-found') {
        // Security: don't reveal if email exists
        setSent(true);
      } else {
        error('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder-text-secondary/50';

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link to="/landing">
            <h1 className="text-brand font-black text-3xl tracking-tighter uppercase">Groundwork</h1>
          </Link>
          <p className="text-text-secondary text-sm mt-2 font-medium tracking-wide">RESET YOUR PASSWORD</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-brand mx-auto" />
            <h3 className="text-lg font-bold text-white">Check Your Email</h3>
            <p className="text-text-secondary text-sm">
              If an account exists for <strong className="text-white">{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-brand font-bold hover:underline text-sm mt-4"
            >
              <span>← Back to Login</span>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-text-secondary text-sm mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>SEND RESET LINK</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-text-secondary">
              <Link to="/login" className="text-brand hover:underline font-semibold">
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
