import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { getRememberedAccounts, type RememberedAccount } from '../../lib/sessionStorage';

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase Console.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API Key. Please check your .env configuration.';
    default:
      return `Login failed (${code || 'Unknown error'}). Please try again.`;
  }
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);

  useEffect(() => {
    // Check if prefill was passed via state or if a remembered account exists
    const prefill = (location.state as { prefillEmail?: string })?.prefillEmail;
    const stored = getRememberedAccounts();
    setRememberedAccounts(stored);

    if (prefill) {
      setEmail(prefill);
    } else if (stored.length > 0 && !email) {
      setEmail(stored[0].email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      success('Welcome back to Groundwork!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      error(getAuthErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle('player');
      success('Signed in with Google.');
      navigate('/dashboard');
    } catch (err) {
      error((err as Error)?.message ?? 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRemembered = (acc: RememberedAccount) => {
    setEmail(acc.email);
  };

  const inputClass =
    'w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder-text-secondary/50 text-sm';

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-brand/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-surface border border-dark-border p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group">
            <h1 className="text-brand font-black text-3xl tracking-tighter uppercase group-hover:scale-105 transition-transform">
              Groundwork
            </h1>
          </Link>
          <p className="text-text-secondary text-xs mt-1 font-bold tracking-widest uppercase">
            Recruitment Command Active
          </p>
        </div>

        {/* Remembered Accounts Quick-Switch Chips */}
        {rememberedAccounts.length > 0 && (
          <div className="mb-6 p-3 bg-dark-bg/80 border border-dark-border rounded-2xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              <UserCheck className="w-3.5 h-3.5 text-brand" />
              <span>Remembered on this device</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {rememberedAccounts.map((acc) => {
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={acc.uid}
                    type="button"
                    onClick={() => handleSelectRemembered(acc)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-brand/10 border-brand text-brand ring-1 ring-brand/30'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px] font-black">
                      {acc.name ? acc.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="truncate max-w-[120px]">{acc.name || acc.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="e.g. scout@club.com or player@talent.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-brand hover:underline font-semibold">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Remember account checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-brand w-4 h-4"
              />
              <span>Remember this account on device</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">Session Storage Active</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand text-dark-bg font-black py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.25)] text-sm uppercase tracking-wider"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full border border-white/10 bg-white/5 text-white font-semibold py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-xs"
          >
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Continue with Google</span>
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-text-secondary border-t border-dark-border pt-4">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-brand hover:underline font-bold">
            Create Profile
          </Link>
        </div>
      </div>
    </div>
  );
};
