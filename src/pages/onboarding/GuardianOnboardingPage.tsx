import { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db, functions } from '../../lib/firebase';
import { collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { markOnboardingComplete } from '../../lib/onboarding';
import { OnboardingRail, ChoiceTile } from '../../components/onboarding/OnboardingKit';
import { MediaFrame } from '../../components/visual/MediaFrame';

const STEPS = ['Your role', 'Link a player', 'How consent works'];
const PRIVACY_NOTICE_VERSION = '2026.1-EN';

const NOTICE_POINTS = [
  {
    title: 'Nothing is visible until you approve',
    body: 'A youth profile is created hidden. No club — verified or otherwise — can read it while consent is pending.',
  },
  {
    title: 'Only youth-verified clubs, and only while verification is live',
    body: 'Clubs must hold a current safeguarding certificate. When it expires, access disappears automatically.',
  },
  {
    title: 'You can withdraw at any moment',
    body: 'Withdrawal delists the profile immediately, removes match results and queues any uploaded media for deletion.',
  },
  {
    title: 'No AI processing without consent',
    body: 'Youth data is blocked from AI features at enqueue time and again before every provider request.',
  },
  {
    title: 'Every action is written to an immutable audit trail',
    body: 'Grants, withdrawals and re-grants are recorded with a timestamp, notice version and hashed IP.',
  },
];

export const GuardianOnboardingPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [relationship, setRelationship] = useState('Parent');
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const linkChild = async () => {
    setLinkError(null);
    if (!childEmail.trim() || !user?.email) {
      setLinkError('Enter the email your child registered with.');
      return;
    }
    setLinking(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'players'), where('email', '==', childEmail.trim().toLowerCase()), limit(1)),
      );
      if (snap.empty) {
        setLinkError('No player account found with that email. Check the spelling with your child.');
        return;
      }
      const childDoc = snap.docs[0];
      const childData = childDoc.data() as { isYouth?: boolean; name?: string; guardianEmail?: string };

      if (childData.isYouth !== true) {
        setLinkError(
          'That account is registered as an adult player. Ask our team to convert it to a youth profile before linking.',
        );
        return;
      }
      if (childData.guardianEmail && childData.guardianEmail !== user.email) {
        setLinkError('That profile is already linked to a different guardian. Contact support to transfer it.');
        return;
      }

      await updateDoc(doc(db, 'players', childDoc.id), {
        guardianEmail: user.email,
        guardianId: user.uid,
        guardianName: user.name,
        relationship,
        consentStatus: 'pending',
        searchable: false,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        updatedAt: serverTimestamp(),
      });

      // Best-effort consent email; Firestore state above is the source of truth.
      try {
        const sendInvite = httpsCallable(functions, 'sendConsentInvite');
        await sendInvite({ youthId: childDoc.id, guardianEmail: user.email, guardianName: user.name, relationship });
      } catch {
        // The guardian is already signed in and can grant consent in-app.
      }

      setLinkedName((childData.name as string) || 'your player');
      success('Player linked. Consent is pending until you approve it.');
    } catch (err) {
      console.error(err);
      setLinkError('We could not link that account. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const advance = async () => {
    if (step === 2 && !linkedName) {
      setLinkError('Link a player account to continue, or skip and link later from the consent centre.');
      return;
    }
    if (step === 3) {
      if (!acknowledged) {
        toastError('Please confirm you have read the consent notice.');
        return;
      }
      setSaving(true);
      try {
        if (user?.uid && role) await markOnboardingComplete(user.uid, role);
        navigate('/dashboard/guardian/consent', { replace: true });
      } catch {
        toastError('We could not finish setup. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 gw-grid-bg opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-0 gw-aurora" />

      <header className="relative z-20 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Groundwork home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
            </span>
            <span className="font-display text-[14px] font-bold tracking-[0.12em] text-white">GROUNDWORK</span>
          </Link>
          <Link to="/dashboard" className="gw-mono text-slate-500 transition-colors hover:text-slate-200">
            Skip for now
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:px-8 lg:py-14">
        <div className="min-w-0">
          <OnboardingRail step={step} total={3} labels={STEPS} />

          <div key={step} className="gw-stagger mt-8 space-y-6">
            <div>
              <p className="gw-eyebrow">Guardian setup</p>
              <h1 className="gw-display mt-2.5 text-[clamp(1.6rem,3.4vw,2.4rem)] text-white">
                {step === 1
                  ? 'You are in control of what clubs can see'
                  : step === 2
                    ? 'Link the player you are responsible for'
                    : 'Read what you are agreeing to'}
              </h1>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-slate-400">
                {step === 1
                  ? 'Groundwork treats youth safeguarding as a system requirement, not a setting. Your approval is the gate.'
                  : step === 2
                    ? 'The player must already have an account marked as a youth profile. We never take a guardian relationship on trust.'
                    : 'This is the plain-language version. The full policy lives on the safeguarding page.'}
              </p>
            </div>

            {step === 1 ? (
              <div className="grid gap-2.5">
                {[
                  {
                    title: 'Your approval gates visibility',
                    body: 'Clubs see nothing until you grant consent, and lose access the moment you withdraw it.',
                    icon: <Lock className="h-4 w-4" />,
                    tone: 'emerald' as const,
                  },
                  {
                    title: 'Verified clubs only',
                    body: 'Youth access requires a live safeguarding certificate, re-checked on every read.',
                    icon: <ShieldCheck className="h-4 w-4" />,
                    tone: 'sky' as const,
                  },
                  {
                    title: 'You can reverse any decision',
                    body: 'Withdrawal is immediate and audited. Media is queued for deletion.',
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    tone: 'brand' as const,
                  },
                ].map((item, index) => (
                  <ChoiceTile
                    key={item.title}
                    selected={index === 0}
                    onClick={() => undefined}
                    title={item.title}
                    description={item.body}
                    icon={item.icon}
                    tone={item.tone}
                  />
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Player email
                    </label>
                    <input
                      type="email"
                      value={childEmail}
                      onChange={(event) => {
                        setChildEmail(event.target.value);
                        setLinkError(null);
                      }}
                      placeholder="player@example.com"
                      className="h-12 w-full rounded-xl border border-white/[0.10] bg-ink-950/70 px-4 text-[14px] text-white placeholder:text-slate-600 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Relationship
                    </label>
                    <select
                      value={relationship}
                      onChange={(event) => setRelationship(event.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border border-white/[0.10] bg-ink-950/70 px-4 text-[14px] text-white focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25"
                    >
                      {['Parent', 'Legal guardian', 'Carer', 'Other responsible adult'].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {linkError ? (
                  <p className="rounded-lg border border-rose-500/25 bg-rose-500/[0.07] px-3 py-2 text-[12.5px] text-rose-300" role="alert">
                    {linkError}
                  </p>
                ) : null}

                {linkedName ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-100">{linkedName} linked</p>
                      <p className="text-[11.5px] text-emerald-200/75">Consent pending · profile hidden</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={linkChild}
                    disabled={linking}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.09] disabled:opacity-50"
                  >
                    {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {linking ? 'Searching…' : 'Link account'}
                  </button>
                )}

                <p className="text-[11.5px] leading-relaxed text-slate-500">
                  If the player has not registered yet, create their account first, then return here. Accounts flagged as
                  adult players cannot be linked.
                </p>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-2">
                {NOTICE_POINTS.map((point, index) => {
                  const open = expanded === index;
                  return (
                    <div
                      key={point.title}
                      className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.022]"
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : index)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <span className="flex items-center gap-2.5 text-[13px] font-semibold text-white">
                          <span className="gw-mono text-brand">{String(index + 1).padStart(2, '0')}</span>
                          {point.title}
                        </span>
                        {open ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                        )}
                      </button>
                      {open ? (
                        <p className="border-t border-white/[0.06] px-4 py-3 text-[12.5px] leading-relaxed text-slate-400">
                          {point.body}
                        </p>
                      ) : null}
                    </div>
                  );
                })}

                <div className="pt-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.10] bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-ink-950 accent-brand"
                    />
                    <span className="text-[12.5px] leading-relaxed text-slate-300">
                      I have read the consent notice and the safeguarding policy, and I understand I can withdraw consent
                      at any time.
                    </span>
                  </label>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg px-2 py-2 text-[12.5px] font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    Back
                  </button>
                ) : (
                  <span className="gw-mono text-slate-600">Safeguarding enforced server-side</span>
                )}
              </div>
              <button
                type="button"
                onClick={advance}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-[14px] font-semibold text-ink-950 shadow-[0_14px_40px_-16px_rgba(182,255,26,0.7)] transition-colors hover:bg-brand-hover disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {step === 3 ? 'Open consent centre' : 'Continue'}
                {step === 3 ? <Check className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="gw-frame sticky top-24 overflow-hidden rounded-2xl">
            <div className="relative h-[240px] overflow-hidden border-b border-white/[0.07] bg-ink-950">
              <img
                src="/images/player-tunnel.jpg"
                alt="Players on touchline"
                className="h-full w-full object-cover opacity-55"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-transparent" />
              <div className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className="gw-live-dot" />
                <span className="gw-mono text-emerald-300">Guardian gate</span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <p className="text-[12.5px] font-semibold text-white">Consent state machine</p>
              </div>
              <ul className="space-y-2 text-[11.5px]">
                {[
                  ['pending', 'Profile hidden from every club', 'amber'],
                  ['granted', 'Visible to live-verified clubs only', 'emerald'],
                  ['withdrawn', 'Delisted, media queued for deletion', 'rose'],
                ].map(([state, effect, tone]) => (
                  <li key={state} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                    <p
                      className={
                        tone === 'emerald'
                          ? 'gw-mono text-emerald-300'
                          : tone === 'amber'
                            ? 'gw-mono text-amber-300'
                            : 'gw-mono text-rose-300'
                      }
                    >
                      {state}
                    </p>
                    <p className="mt-1 text-slate-400">{effect}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <MediaFrame
                  src="/images/floodlights.jpg"
                  alt="Floodlit stadium barrier"
                  caption="Safeguarding enforced server-side"
                  tag="Audit log"
                />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};