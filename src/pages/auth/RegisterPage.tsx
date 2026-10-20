import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Users,
  Building2,
  UserRound,
  AlertCircle,
  Mail,
  Lock,
  User,
  CalendarDays,
} from 'lucide-react';
import { useAuth, type Role } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { cn } from '../../components/ui/cn';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const REGIONS = [
  'London',
  'South East',
  'South West',
  'East of England',
  'Midlands',
  'North West',
  'North East',
  'Yorkshire',
  'Wales',
  'Scotland',
  'Northern Ireland',
];
const AVAILABILITY = ['Mon Eve', 'Tue Eve', 'Wed Eve', 'Thu Eve', 'Fri Eve', 'Sat AM', 'Sat PM', 'Sun AM', 'Sun PM'];
const LEVELS = [
  { value: 1, label: 'Step 1 — National League' },
  { value: 2, label: 'Step 2 — National League North/South' },
  { value: 3, label: 'Step 3 — Northern/Southern Premier' },
  { value: 4, label: 'Step 4 — Isthmian/Northern Div 1' },
  { value: 5, label: 'Step 5 — Combined Counties etc.' },
  { value: 6, label: 'Step 6 — Regional feeder' },
  { value: 7, label: 'Grassroots / Sunday league' },
];

const ROLE_OPTIONS: Array<{ value: Role; title: string; body: string; icon: typeof Users }> = [
  {
    value: 'player',
    title: 'Player',
    body: 'Build a dossier and get matched with clubs.',
    icon: UserRound,
  },
  {
    value: 'guardian',
    title: 'Parent / guardian',
    body: 'Manage a youth profile and consent.',
    icon: ShieldCheck,
  },
  {
    value: 'club',
    title: 'Club',
    body: 'Search, shortlist and recruit verified talent.',
    icon: Building2,
  },
];

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with that email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password — at least 8 characters.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/operation-not-allowed':
      return 'Email sign-up is not enabled for this project.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'We could not create your account. Please try again.';
  }
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [role, setRole] = useState<Role>('player');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');

  const [primaryPosition, setPrimaryPosition] = useState('CM');
  const [secondaryPosition, setSecondaryPosition] = useState('');
  const [playingLevel, setPlayingLevel] = useState(5);
  const [region, setRegion] = useState('London');
  const [availability, setAvailability] = useState<string[]>(['Sat AM']);

  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Parent');

  const [clubName, setClubName] = useState('');
  const [clubRegion, setClubRegion] = useState('London');

  const age = useMemo(() => calculateAge(dob), [dob]);
  const isYouth = role === 'player' && age !== null && age < 18;

  const toggleAvailability = (slot: string) => {
    setAvailability((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  };

  const validateStepOne = (): string | null => {
    if (!name.trim()) return 'Enter your full name.';
    if (!email.trim()) return 'Enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 8) return 'Your password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Your passwords do not match.';
    return null;
  };

  const handleNext = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (step === 1) {
      const issue = validateStepOne();
      if (issue) {
        setFormError(issue);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2 && role === 'player') {
      if (!dob) {
        setFormError('Enter your date of birth so we can route your account correctly.');
        return;
      }
      if (age !== null && age < 13) {
        setFormError('Players must be at least 13 years old to register.');
        return;
      }
      if (isYouth) {
        setStep(3);
        return;
      }
    }

    void handleSubmit();
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setFormError(null);
    setIsLoading(true);

    try {
      const extra: Record<string, unknown> = {};

      if (role === 'player') {
        Object.assign(extra, {
          dob,
          age,
          isYouth,
          positions: [primaryPosition, secondaryPosition].filter(Boolean),
          primaryPosition,
          secondaryPosition: secondaryPosition || null,
          playingLevel,
          region,
          availability,
          ...(isYouth
            ? {
                guardianName,
                guardianEmail,
                guardianRelationship,
                consentStatus: 'pending',
                searchable: false,
              }
            : {}),
        });
      }

      if (role === 'club') {
        Object.assign(extra, { clubName: clubName.trim() || name.trim(), region: clubRegion });
      }

      await register(email.trim(), password, role, name.trim(), extra);

      if (isYouth) {
        success('Account created. We have emailed your guardian for consent.');
      } else {
        success('Account created. Check your inbox to verify your email.');
      }

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const message = authErrorMessage(code);
      setFormError(message);
      toastError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = role === 'player' ? ['Account', 'Football', ...(isYouth ? ['Guardian'] : [])] : ['Account', 'Details'];

  return (
    <AuthLayout
      title="Create your Groundwork account"
      subtitle="Choose how you will use the platform. You can add more detail once you are signed in."
      badge="Free to start"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {stepLabels.map((label, index) => {
          const number = index + 1;
          const isDone = step > number;
          const isCurrent = step === number;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                  isDone && 'bg-brand text-ink-950',
                  isCurrent && 'border border-brand/50 bg-brand/15 text-brand',
                  !isDone && !isCurrent && 'border border-white/[0.12] bg-white/[0.04] text-slate-500',
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : number}
              </span>
              <span
                className={cn(
                  'hidden text-[11.5px] font-medium sm:block',
                  isCurrent ? 'text-white' : 'text-slate-500',
                )}
              >
                {label}
              </span>
              {index < stepLabels.length - 1 && <span className="h-px flex-1 bg-white/[0.08]" />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleNext} className="space-y-4" noValidate>
        {step === 1 && (
          <>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-slate-300">I am a</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLE_OPTIONS.map((option) => {
                  const selected = role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-all',
                        selected
                          ? 'border-brand/50 bg-brand/[0.08]'
                          : 'border-white/[0.10] bg-white/[0.03] hover:border-white/[0.2]',
                      )}
                    >
                      <option.icon className={cn('h-4 w-4', selected ? 'text-brand' : 'text-slate-400')} />
                      <span className="mt-2 block text-[12.5px] font-semibold text-white">{option.title}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500">{option.body}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Input
              label={role === 'club' ? 'Your name' : 'Full name'}
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              iconLeft={<User className="h-4 w-4" />}
              autoComplete="name"
              required
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              iconLeft={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconLeft={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                iconLeft={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                required
              />
            </div>
          </>
        )}

        {step === 2 && role === 'player' && (
          <>
            <Input
              label="Date of birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              iconLeft={<CalendarDays className="h-4 w-4" />}
              hint="Under-18 accounts are routed to guardian consent automatically."
              required
            />

            {isYouth && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3.5 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-[12px] leading-relaxed text-emerald-100/90">
                  You are under 18. Your profile will stay hidden and unsearchable until a parent or guardian grants
                  consent. You will add their details in the next step.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Primary position"
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value)}
              >
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </Select>
              <Select
                label="Secondary position"
                value={secondaryPosition}
                onChange={(e) => setSecondaryPosition(e.target.value)}
              >
                <option value="">None</option>
                {POSITIONS.filter((p) => p !== primaryPosition).map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Playing level"
                value={playingLevel}
                onChange={(e) => setPlayingLevel(Number(e.target.value))}
              >
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
              <Select label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-slate-300">Availability</legend>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABILITY.map((slot) => {
                  const selected = availability.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleAvailability(slot)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
                        selected
                          ? 'border-brand/50 bg-brand/15 text-brand'
                          : 'border-white/[0.10] bg-white/[0.03] text-slate-400 hover:border-white/[0.2]',
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {step === 2 && role === 'club' && (
          <>
            <Input
              label="Club name"
              placeholder="Riverside Athletic FC"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              iconLeft={<Building2 className="h-4 w-4" />}
              required
            />
            <Select label="Region" value={clubRegion} onChange={(e) => setClubRegion(e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-[12px] leading-relaxed text-amber-100/90">
                Club accounts start unverified. You can search adult players immediately, but youth recruitment
                requires safeguarding documentation and manual admin approval.
              </p>
            </div>
          </>
        )}

        {step === 2 && role === 'guardian' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3.5 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-[12px] leading-relaxed text-emerald-100/90">
              After creating your account you will be able to link a youth player and review every consent request
              they receive.
            </p>
          </div>
        )}

        {step === 3 && isYouth && (
          <>
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3.5 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-[12px] leading-relaxed text-emerald-100/90">
                We will email your guardian a secure, time-limited consent link. Your profile stays hidden until they
                approve it.
              </p>
            </div>
            <Input
              label="Guardian full name"
              placeholder="Jordan Morgan"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              iconLeft={<User className="h-4 w-4" />}
              required
            />
            <Input
              label="Guardian email"
              type="email"
              placeholder="guardian@example.com"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              iconLeft={<Mail className="h-4 w-4" />}
              required
            />
            <Select
              label="Relationship"
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
            >
              {['Parent', 'Legal guardian', 'Carer', 'Other'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </>
        )}

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-[12.5px] leading-relaxed text-rose-200">{formError}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {step > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormError(null);
                setStep((s) => s - 1);
              }}
              iconLeft={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            iconRight={step === stepLabels.length ? undefined : <ArrowRight className="h-4 w-4" />}
          >
            {step === stepLabels.length ? 'Create account' : 'Continue'}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-slate-600">
        By creating an account you agree to our{' '}
        <Link to="/terms" className="text-slate-400 hover:text-slate-200">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-slate-400 hover:text-slate-200">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
};
