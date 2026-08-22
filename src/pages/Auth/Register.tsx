import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { ArrowRight, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [role, setRole] = useState<Role>('player');
  const [step, setStep] = useState(1);
  const [isYouth, setIsYouth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');

  // Guardian fields
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [relationship, setRelationship] = useState('Parent');

  const calculateAge = (dobStr: string): number | null => {
    if (!dobStr) return null;
    const today = new Date();
    const birth = new Date(dobStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && role === 'player') {
      const age = calculateAge(dob);
      if (age !== null && age < 18) {
        setIsYouth(true);
        setStep(3);
      } else {
        setIsYouth(false);
        handleSubmit(false);
      }
    } else {
      handleSubmit(false);
    }
  };

  const handleSubmit = async (withGuardian: boolean) => {
    setIsLoading(true);
    try {
      const extra: Record<string, unknown> = { isYouth };
      if (isYouth) {
        extra.dob = dob;
        extra.guardianName = guardianName;
        extra.guardianEmail = guardianEmail;
        extra.relationship = relationship;
      }
      await register(email, password, role, name, withGuardian || isYouth ? extra : undefined);
      success('Account created! Check your email for a verification link.');
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Registration failed. Please try again.';
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        toastError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        toastError('Password must be at least 6 characters.');
      } else if (code === 'auth/operation-not-allowed') {
        toastError('Email/password sign-up is not enabled in Firebase Console.');
      } else if (code === 'auth/invalid-api-key') {
        toastError('Invalid Firebase API Key. Please check your .env configuration.');
      } else {
        toastError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(true);
  };

  const inputClass =
    'w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-text-secondary/50';

  const totalSteps = role === 'player' ? 3 : 2;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden pb-20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-block">
            <h1 className="text-brand font-black text-3xl tracking-tighter uppercase">Groundwork</h1>
          </Link>
          <p className="text-text-secondary text-sm mt-2 font-medium tracking-wide">
            {step === 3 ? 'GUARDIAN CONSENT REQUIRED' : 'CREATE YOUR PROFILE'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex mb-8 space-x-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                step > i ? 'bg-brand' : 'bg-dark-border'
              }`}
            />
          ))}
        </div>

        <form onSubmit={step === 3 ? handleFinalSubmit : handleNext} className="space-y-6">
          {/* STEP 1: Choose role */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-text-primary mb-4 text-center uppercase tracking-widest">
                Select your account type
              </label>

              {(['player', 'club'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full p-4 rounded-xl border flex items-start space-x-4 text-left transition-all ${
                    role === r ? 'bg-brand/5 border-brand' : 'border-dark-border hover:border-text-secondary/30'
                  }`}
                >
                  <div
                    className={`mt-1 rounded-full p-0.5 border shrink-0 ${role === r ? 'border-brand' : 'border-text-secondary'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${role === r ? 'bg-brand' : 'bg-transparent'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold uppercase tracking-tight ${role === r ? 'text-brand' : 'text-text-primary'}`}>
                      {r === 'player' ? 'Player Pathway' : 'Club Command'}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {r === 'player'
                        ? 'Create a data profile, apply for trials, and get scouted.'
                        : 'Post opportunities, scout players, and manage trials.'}
                    </p>
                  </div>
                </button>
              ))}

              <button
                type="submit"
                className="w-full mt-6 bg-text-primary text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-white/90 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: Account details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  {role === 'club' ? 'Club Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder={role === 'club' ? 'Club name' : 'Your full name'}
                  required
                />
              </div>

              {role === 'player' && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={inputClass}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-[10px] text-text-secondary mt-1">Players under 18 require guardian consent.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="Enter email"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Create a strong password (min. 6 chars)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{role === 'player' ? 'CONTINUE' : 'CREATE ACCOUNT'}</span>
                    {role === 'player' ? <ArrowRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </>
                )}
              </button>

              <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-sm text-text-secondary hover:text-text-primary">
                ← Back to Role Selection
              </button>
            </div>
          )}

          {/* STEP 3: Guardian consent (youth only) */}
          {step === 3 && isYouth && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-brand/10 border border-brand/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Youth Safeguarding Protocol</h4>
                    <p className="text-xs text-text-secondary">
                      Because you are under 18, a parent or legal guardian must provide consent before your profile
                      becomes visible to verified clubs. A consent email will be sent to your guardian.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Guardian's Full Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className={inputClass}
                  placeholder="Guardian's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Guardian's Email Address
                </label>
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className={inputClass}
                  placeholder="Guardian's email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className={inputClass}
                >
                  <option value="Parent">Parent</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Carer">Carer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(204,255,0,0.3)]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>CREATE YOUTH ACCOUNT</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                ← Back to Details
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:underline font-semibold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
