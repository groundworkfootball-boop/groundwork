import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getRememberedAccounts, type RememberedAccount } from '../../lib/sessionStorage';

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password combination is not recognised.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been suspended. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not enabled for this project.';
    case 'auth/invalid-api-key':
      return 'The Firebase configuration is invalid. Check your environment variables.';
    default:
      return 'We could not sign you in. Please try again.';
  }
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [remembered, setRemembered] = useState<RememberedAccount[]>([]);

  useEffect(() => {
    const prefill = (location.state as { prefillEmail?: string } | null)?.prefillEmail;
    const stored = getRememberedAccounts();
    setRemembered(stored);
    if (prefill) setEmail(prefill);
    else if (stored.length > 0) setEmail(stored[0].email);
  }, [location.state]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Enter your email and password to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setFormError(authErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setFormError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle('player');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setFormError(
        code === 'auth/popup-closed-by-user' ? 'Google sign-in was cancelled.' : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const selectAccount = (account: RememberedAccount) => {
    setEmail(account.email);
    setFormError(null);
    passwordRef.current?.focus();
  };

  return (
    <AuthLayout
      title="Sign in to Groundwork"
      subtitle="Access your player dossier, recruitment workspace or administration console."
      footer={
        <>
          New to Groundwork?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {remembered.length > 0 && (
        <div className="mb-6">
          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">Continue as</p>
          <div className="flex flex-wrap gap-2">
            {remembered.slice(0, 3).map((account) => {
              const active = email === account.email;
              return (
                <button
                  key={account.uid}
                  type="button"
                  onClick={() => selectAccount(account)}
                  aria-pressed={active}
                  className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                    active
                      ? 'border-brand/45 bg-brand/[0.08]'
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold uppercase text-brand">
                    {(account.name || account.email).slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[130px] truncate text-[12px] font-medium text-white">
                      {account.name || account.email}
                    </span>
                    <span className="block text-[9.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {account.role}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconLeft={<Mail className="h-4 w-4" />}
          required
        />

        <div className="space-y-2">
          <Input
            ref={passwordRef}
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            iconLeft={<Lock className="h-4 w-4" />}
            iconRight={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="pointer-events-auto rounded p-0.5 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-ink-950 text-brand focus:ring-brand/30"
              />
              Keep me signed in
            </label>
            <Link
              to="/forgot-password"
              className="text-[12.5px] font-medium text-brand transition-colors hover:text-brand-hover hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-[12.5px] leading-relaxed text-rose-200">{formError}</p>
          </div>
        )}

        <Button type="submit" fullWidth loading={isLoading} iconRight={<ArrowRight className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-600">or</span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <Button type="button" variant="secondary" fullWidth loading={googleLoading} onClick={handleGoogle}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80" />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Roles are verified server-side from Firebase custom claims. Signing in never grants elevated access from the
          browser.
        </p>
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-600">
        By signing in you agree to our{' '}
        <Link to="/terms" className="text-slate-400 transition-colors hover:text-slate-200">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-slate-400 transition-colors hover:text-slate-200">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
};

