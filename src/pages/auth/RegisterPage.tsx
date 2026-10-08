import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { ArrowRight, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const REGIONS = ['London', 'South East', 'South West', 'Midlands', 'North West', 'North East', 'Yorkshire', 'Wales', 'Scotland'];
const AVAILABILITY_SLOTS = ['Tuesday Eve', 'Thursday Eve', 'Saturday Morning', 'Sunday Day'];

export const RegisterPage = () => {
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

  // Player football fields
  const [primaryPosition, setPrimaryPosition] = useState('CM');
  const [secondaryPosition, setSecondaryPosition] = useState('CAM');
  const [playingLevel, setPlayingLevel] = useState(5);
  const [region, setRegion] = useState('London');
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(['Saturday Morning']);

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

  const toggleAvailability = (slot: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
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
      const extra: Record<string, unknown> = {
        isYouth,
        region,
      };

      if (role === 'player') {
        extra.dob = dob;
        extra.primaryPosition = primaryPosition;
        extra.secondaryPosition = secondaryPosition;
        extra.positions = [primaryPosition, secondaryPosition].filter(Boolean);
        extra.playingLevel = Number(playingLevel);
        extra.availability = selectedAvailability;
      }

      if (isYouth) {
        extra.guardianName = guardianName;
        extra.guardianEmail = guardianEmail;
        extra.relationship = relationship;
      }

      await register(email.trim(), password, role, name.trim(), withGuardian || isYouth ? extra : undefined);
      success('Account created successfully! Session remembered.');
      navigate('/dashboard');
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
    'w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-text-secondary/50 text-sm transition-all';

  const totalSteps = role === 'player' ? 3 : 2;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-dark-surface border border-dark-border p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in duration-300">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group">
            <h1 className="text-brand font-black text-3xl tracking-tighter uppercase group-hover:scale-105 transition-transform">
              Groundwork
            </h1>
          </Link>
          <p className="text-text-secondary text-xs mt-1 font-bold tracking-widest uppercase">
            {step === 3 ? 'GUARDIAN SAFEGUARDING CONSENT' : 'CREATE YOUR FOOTBALL PROFILE'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex mb-8 space-x-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step > i ? 'bg-brand shadow-[0_0_8px_rgba(204,255,0,0.5)]' : 'bg-dark-border'
              }`}
            />
          ))}
        </div>

        <form onSubmit={step === 3 ? handleFinalSubmit : handleNext} className="space-y-5">
          {/* STEP 1: Choose role */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <label className="block text-xs font-black text-slate-300 mb-3 text-center uppercase tracking-widest">
                Select your account role
              </label>

              {(['player', 'guardian', 'club'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full p-4 rounded-2xl border flex items-start space-x-4 text-left transition-all ${
                    role === r
                      ? 'bg-brand/10 border-brand shadow-[0_0_15px_rgba(204,255,0,0.15)] ring-1 ring-brand/30'
                      : 'border-dark-border hover:border-slate-500 bg-white/5'
                  }`}
                >
                  <div
                    className={`mt-1 rounded-full p-0.5 border shrink-0 ${
                      role === r ? 'border-brand' : 'border-slate-500'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${role === r ? 'bg-brand' : 'bg-transparent'}`} />
                  </div>
                  <div>
                    <h4
                      className={`font-black uppercase tracking-tight text-sm ${
                        role === r ? 'text-brand' : 'text-white'
                      }`}
                    >
                      {r === 'player'
                        ? 'Player Pathway'
                        : r === 'guardian'
                        ? 'Guardian Oversight Portal'
                        : 'Club Recruitment Command'}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {r === 'player'
                        ? 'Build an auditable football dossier, apply for trials, and match deterministically.'
                        : r === 'guardian'
                        ? 'Manage statutory consent, oversee youth privacy, and safeguard minors.'
                        : 'Scout verified players, run squad gap analysis, and organize trials.'}
                    </p>
                  </div>
                </button>
              ))}

              <button
                type="submit"
                className="w-full mt-6 bg-brand text-dark-bg font-black py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.01] active:scale-[0.99] text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.25)]"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: Account details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  {role === 'club' ? 'Club Name' : role === 'guardian' ? 'Guardian Name' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder={
                    role === 'club' ? 'e.g. London Athletic FC' : role === 'guardian' ? 'Parent / Guardian name' : 'Your full name'
                  }
                  required
                />
              </div>

              {role === 'player' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={inputClass}
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                        Region *
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className={inputClass}
                      >
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                        Primary Pos
                      </label>
                      <select
                        value={primaryPosition}
                        onChange={(e) => setPrimaryPosition(e.target.value)}
                        className={inputClass}
                      >
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                        Secondary Pos
                      </label>
                      <select
                        value={secondaryPosition}
                        onChange={(e) => setSecondaryPosition(e.target.value)}
                        className={inputClass}
                      >
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-text-secondary tracking-widest uppercase">
                        Self-Assessed Playing Tier
                      </label>
                      <span className="text-xs font-mono font-bold text-brand">Tier {playingLevel} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={playingLevel}
                      onChange={(e) => setPlayingLevel(Number(e.target.value))}
                      className="w-full accent-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                      Availability
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_SLOTS.map((slot) => {
                        const active = selectedAvailability.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleAvailability(slot)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              active
                                ? 'bg-brand/10 border-brand text-brand'
                                : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {role === 'guardian' && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-200">
                  Guardian accounts manage youth consent and statutory oversight. You will be able to link and approve
                  your child's youth profile after registration.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Password *
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
                className="w-full mt-4 bg-brand text-dark-bg font-black py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.25)]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{role === 'player' ? 'CONTINUE REGISTRATION' : 'CREATE ACCOUNT'}</span>
                    {role === 'player' ? <ArrowRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs text-text-secondary hover:text-white"
              >
                ← Back to Role Selection
              </button>
            </div>
          )}

          {/* STEP 3: Guardian consent (youth players under 18) */}
          {step === 3 && isYouth && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-300 mb-1">
                      Statutory Youth Safeguarding Notice
                    </h4>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      You are registering as a youth player (under 18). Per statutory safeguarding rules, your profile
                      will remain strictly non-searchable until your parent or legal guardian provides verified digital
                      consent.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Guardian's Full Name *
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className={inputClass}
                  placeholder="Parent or legal guardian name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Guardian's Email Address *
                </label>
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className={inputClass}
                  placeholder="parent.guardian@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">
                  Relationship *
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
                className="w-full mt-4 bg-brand text-dark-bg font-black py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.3)] text-sm uppercase tracking-wider"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>CREATE YOUTH ACCOUNT & NOTIFY GUARDIAN</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 text-xs text-text-secondary hover:text-white"
              >
                ← Back to Details
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 text-center text-xs text-text-secondary border-t border-dark-border pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
