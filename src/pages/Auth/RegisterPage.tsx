import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { generateClubCode } from '../../lib/clubCode';
import { ArrowRight, CheckCircle2, ShieldAlert, Loader2, Sparkles, Building2, User, Heart } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const queryClubCode = searchParams.get('clubCode') ?? '';
  const queryRole = (searchParams.get('role') as Role) ?? 'player';

  const [role, setRole] = useState<Role>(queryRole === 'club' || queryRole === 'guardian' ? queryRole : 'player');
  const [step, setStep] = useState(1);
  const [isYouth, setIsYouth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [clubCode, setClubCode] = useState(queryClubCode);

  // Club specific
  const [league, setLeague] = useState('');
  const [region, setRegion] = useState('London');

  // Guardian fields for youth
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [relationship, setRelationship] = useState('Parent');

  useEffect(() => {
    if (queryClubCode) {
      setClubCode(queryClubCode);
    }
  }, [queryClubCode]);

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
      const extra: Record<string, unknown> = {
        isYouth,
        region,
      };

      if (role === 'club') {
        extra.clubName = clubName || name;
        extra.league = league;
        extra.clubCode = generateClubCode(clubName || name);
      }

      if (role === 'player') {
        if (clubCode.trim()) {
          extra.affiliatedClubCode = clubCode.trim().toUpperCase();
        }
        if (withGuardian || isYouth) {
          extra.dob = dob;
          extra.guardianName = guardianName;
          extra.guardianEmail = guardianEmail;
          extra.relationship = relationship;
          extra.consentStatus = 'pending';
          extra.searchable = false;
        } else {
          extra.dob = dob;
          extra.searchable = true;
        }
      }

      await register(email, password, role, role === 'club' ? (clubName || name) : name, extra);
      success('Account created successfully! Welcome to GROUNDWORK.');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Registration failed. Please try again.';
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        toastError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        toastError('Password must be at least 6 characters.');
      } else {
        toastError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-slate-500';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/90 border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className="text-brand font-black text-3xl tracking-tight uppercase">Groundwork</h1>
          </Link>
          <p className="text-slate-400 text-xs mt-1.5 font-semibold tracking-widest uppercase">
            Create Your Account
          </p>

          {clubCode && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-xs text-brand font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Joining with Club Code: {clubCode}</span>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, ...(role === 'player' && isYouth ? [3] : [])].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-brand text-black shadow-lg shadow-brand/25'
                    : step > s
                    ? 'bg-brand/20 text-brand border border-brand/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className="text-xs font-medium text-slate-400">
                {s === 1 ? 'Role' : s === 2 ? 'Details' : 'Safeguarding'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'player', label: 'Player', desc: 'Adult or youth footballers seeking clubs', icon: User },
                { id: 'club', label: 'Football Club', desc: 'Recruiters, scouts, and managers', icon: Building2 },
                { id: 'guardian', label: 'Guardian', desc: 'Parents managing youth players', icon: Heart },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id as Role)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    role === item.id
                      ? 'border-brand bg-brand/10 text-white shadow-lg shadow-brand/10'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <item.icon className={`w-6 h-6 mb-2 ${role === item.id ? 'text-brand' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.label}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full mt-6 bg-brand hover:bg-brand-hover text-black font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                {role === 'club' ? 'Club / Representative Name' : 'Full Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder={role === 'club' ? 'e.g. Camden United' : 'e.g. Marcus Cole'}
                required
              />
            </div>

            {role === 'club' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                    League / Tier
                  </label>
                  <input
                    type="text"
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. National League South"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={inputClass}
                  >
                    <option value="London">London</option>
                    <option value="North West">North West</option>
                    <option value="Midlands">Midlands</option>
                    <option value="South East">South East</option>
                    <option value="Yorkshire">Yorkshire</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {role === 'player' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                      Club Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={clubCode}
                      onChange={(e) => setClubCode(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. GW-ARS-4821"
                    />
                  </div>
                </div>

                {dob && calculateAge(dob) !== null && (calculateAge(dob)! < 18) && (
                  <div className="p-3 bg-brand/10 border border-brand/30 rounded-xl text-xs text-brand flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Under-18 player detected. Parental consent workflow will apply on the next step.</span>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-brand hover:bg-brand-hover text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{role === 'player' && calculateAge(dob) !== null && calculateAge(dob)! < 18 ? 'Continue to Safeguarding' : 'Complete Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Youth Safeguarding (if under 18) */}
        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-4">
            <div className="p-4 bg-brand/10 border border-brand/30 rounded-2xl">
              <div className="flex items-center gap-2 text-brand font-bold text-sm mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Safeguarding Protocol Required</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As an under-18 player, your profile starts in private mode (`searchable: false`). A parent or guardian must verify your account before club discovery is enabled.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Guardian Full Name
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
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Guardian Email Address
              </label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className={inputClass}
                placeholder="guardian@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={inputClass}
              >
                <option value="Parent">Parent</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Authorized Carer">Authorized Carer</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-brand hover:bg-brand-hover text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Submit & Request Consent</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
