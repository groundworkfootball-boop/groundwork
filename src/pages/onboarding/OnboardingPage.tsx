import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CalendarDays, MapPin, Target, Timer, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import {
  AVAILABILITY,
  EMPTY_PLAYER_DATA,
  PLAYING_LEVELS,
  POSITIONS,
  REGIONS,
  ageBandFor,
  calculateAge,
  markOnboardingComplete,
  playerCompleteness,
  saveOnboardingProgress,
  type PlayerOnboardingData,
} from '../../lib/onboarding';
import {
  ArenaField,
  ArenaInput,
  ArenaSelect,
  ArenaTextarea,
  ChipToggle,
  ChoiceTile,
  OnboardingComplete,
  OnboardingShell,
  SliderField,
} from '../../components/onboarding/OnboardingKit';
import { MediaFrame } from '../../components/visual/MediaFrame';

const STEPS = ['Identity', 'Playing profile', 'Availability', 'Story'];
const TOTAL = STEPS.length;

/**
 * First-run guided setup. Rendered from the dashboard gate as well as its own
 * route so a half-finished profile can be resumed at any point.
 */
export const OnboardingPage = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [checklist, setChecklist] = useState<Array<{ label: string; done: boolean }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<PlayerOnboardingData>(EMPTY_PLAYER_DATA);
  const [isYouth, setIsYouth] = useState(false);

  const patch = <K extends keyof PlayerOnboardingData>(key: K, value: PlayerOnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'players', user.uid));
        if (cancelled) return;
        const raw = snap.exists() ? snap.data() : {};
        setData({
          displayName: (raw.displayName as string) ?? (raw.name as string) ?? user.name ?? '',
          dob: (raw.dob as string) ?? '',
          dominantFoot: (raw.dominantFoot as PlayerOnboardingData['dominantFoot']) ?? 'Right',
          primaryPosition: (raw.primaryPosition as string) ?? (raw.positions as string[])?.[0] ?? 'CM',
          secondaryPosition: (raw.secondaryPosition as string) ?? (raw.positions as string[])?.[1] ?? '',
          playingLevel: typeof raw.playingLevel === 'number' ? raw.playingLevel : 5,
          region: (raw.region as string) ?? 'London',
          preferredRadiusKm: typeof raw.preferredRadiusKm === 'number' ? raw.preferredRadiusKm : 40,
          availability:
            Array.isArray(raw.availability) && raw.availability.length ? (raw.availability as string[]) : ['Sat AM'],
          currentClub: (raw.currentClub as string) ?? '',
          bio: (raw.bio as string) ?? '',
        });
        setIsYouth(raw.isYouth === true);
      } catch {
        // Keep local defaults; the user can still complete setup.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.name]);

  const age = useMemo(() => calculateAge(data.dob), [data.dob]);
  const band = useMemo(() => ageBandFor(age), [age]);
  const completeness = useMemo(
    () =>
      playerCompleteness({
        positions: [data.primaryPosition, data.secondaryPosition].filter(Boolean),
        playingLevel: data.playingLevel,
        availability: data.availability,
        bio: data.bio,
        currentClub: data.currentClub,
        region: data.region,
      }),
    [data],
  );

  const validate = (current: number): boolean => {
    const next: Record<string, string> = {};
    if (current === 1) {
      if (data.displayName.trim().length < 2) next.displayName = 'Enter the name clubs will see.';
      if (!data.dob) next.dob = 'A date of birth is required to place you in the right age band.';
      else if (age === null) next.dob = 'That date of birth is not valid.';
    }
    if (current === 2 && !data.primaryPosition) next.primaryPosition = 'Choose your primary position.';
    if (current === 3 && data.availability.length === 0) next.availability = 'Select at least one slot.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const persist = async () => {
    if (!user?.uid) return;
    const positions = [data.primaryPosition, data.secondaryPosition].filter(Boolean);
    // Only client-writable fields. `searchable` / `consentStatus` are server-owned
    // so this write can never expose a youth profile.
    await updateDoc(doc(db, 'players', user.uid), {
      displayName: data.displayName.trim(),
      name: data.displayName.trim(),
      dob: data.dob,
      age,
      ageBand: band,
      dominantFoot: data.dominantFoot,
      positions,
      primaryPosition: data.primaryPosition,
      secondaryPosition: data.secondaryPosition || null,
      playingLevel: data.playingLevel,
      region: data.region,
      preferredRadiusKm: data.preferredRadiusKm,
      availability: data.availability,
      currentClub: data.currentClub.trim() || null,
      bio: data.bio.trim(),
      profileCompleteness: completeness,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    });
  };

  const advance = async () => {
    if (!validate(step)) return;

    if (step < TOTAL) {
      const next = step + 1;
      setStep(next);
      if (user?.uid && role) saveOnboardingProgress(user.uid, role, next, TOTAL).catch(() => undefined);
      return;
    }

    setSaving(true);
    try {
      await persist();
            if (user?.uid && role) await markOnboardingComplete(user.uid, role);
      setChecklist([
        { label: 'Identity and age band recorded', done: true },
        { label: `Primary position: ${data.primaryPosition}`, done: true },
        { label: `${data.availability.length} availability slot(s) published`, done: data.availability.length > 0 },
        { label: isYouth ? 'Guardian consent pending' : 'Ready for deterministic scoring', done: true },
      ]);
      setDone(true);
      success('Profile saved. Your dossier is live.');
    } catch (err) {
      console.error(err);
      const code = (err as { code?: string })?.code ?? '';
      toastError(
        code === 'permission-denied'
          ? 'Your profile could not be published because the deployed security rules are older than this build. An administrator needs to deploy them.'
          : 'We could not save your profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <span className="gw-mono animate-pulse text-slate-500">Loading your dossier…</span>
      </div>
    );
  }

  if (done) {
    return (
      <OnboardingComplete
        title="Your dossier is live"
        summary={
          isYouth
            ? 'Your profile stays hidden until a guardian approves consent. Keep editing freely in the meantime.'
            : 'Clubs can now find you through the deterministic engine — every score is itemised and explainable.'
        }
        checklist={checklist}
        primaryHref="/dashboard"
        primaryLabel="Open dashboard"
        secondaryHref={isYouth ? '/dashboard/guardian/consent' : '/dashboard/player/profile-builder'}
        secondaryLabel={isYouth ? 'Consent centre' : 'Add skill ratings'}
      />
    );
  }

  return (
    <OnboardingShell
      step={step}
      total={TOTAL}
      labels={STEPS}
      eyebrow={isYouth ? 'Youth pathway · consent gated' : 'Player setup'}
      title={
        step === 1
          ? 'Who are clubs looking at?'
          : step === 2
            ? `Where do you play, ${data.displayName.split(' ')[0] || 'player'}?`
            : step === 3
              ? 'When can you train and play?'
              : 'Finish the dossier'
      }
      description={
        step === 1
          ? 'Your name and date of birth set your age band. Under 18 routes through guardian consent before any club can see you.'
          : step === 2
            ? 'Position and level drive 50% of every match score. Get these right and the engine stops wasting your time.'
            : step === 3
              ? 'Availability is 10% of the score and often the difference between a trial invite and silence.'
              : 'Add a short story so scouts meet a person, not a spreadsheet.'
      }
      onBack={step > 1 ? () => setStep((prev) => Math.max(1, prev - 1)) : undefined}
      onNext={advance}
      nextLabel={step === TOTAL ? 'Publish dossier' : 'Continue'}
      nextDisabled={saving}
      saving={saving}
      footerNote={`Completeness ${completeness}%`}
      aside={
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="gw-mono text-slate-500">Dossier status</p>
              <p className="mt-1 text-[13px] font-semibold text-white">{data.displayName || 'Unnamed player'}</p>
            </div>
            <span className="gw-mono rounded border border-brand/30 bg-brand/10 px-2 py-1 text-brand">{band}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="gw-rail h-full transition-[width] duration-500" style={{ width: `${completeness}%` }} />
          </div>
          <dl className="space-y-1.5 pt-1 text-[12px]">
            {[
              ['Position', data.primaryPosition + (data.secondaryPosition ? ` / ${data.secondaryPosition}` : '')],
              ['Level', PLAYING_LEVELS.find((entry) => entry.value === data.playingLevel)?.label.split('·')[0].trim() ?? '—'],
              ['Region', data.region],
              ['Radius', `${data.preferredRadiusKm} km`],
              ['Slots', `${data.availability.length} selected`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="truncate font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
          {isYouth ? (
            <p className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-2.5 text-[11.5px] leading-relaxed text-amber-200/85">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Hidden until a guardian grants consent.
            </p>
          ) : null}
        </div>
      }
    >
      {step === 1 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Display name" error={errors.displayName} hint="This is what scouts see.">
              <ArenaInput
                value={data.displayName}
                onChange={(event) => patch('displayName', event.target.value)}
                placeholder="Alex Morgan"
                autoComplete="name"
                invalid={Boolean(errors.displayName)}
              />
            </ArenaField>
            <ArenaField
              label="Date of birth"
              error={errors.dob}
              hint={age !== null ? `Age ${age} · ${band}` : 'Used only for age banding.'}
            >
              <ArenaInput
                type="date"
                value={data.dob}
                onChange={(event) => patch('dob', event.target.value)}
                invalid={Boolean(errors.dob)}
              />
            </ArenaField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Dominant foot">
              <ArenaSelect
                value={data.dominantFoot}
                onChange={(event) => patch('dominantFoot', event.target.value as PlayerOnboardingData['dominantFoot'])}
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both</option>
              </ArenaSelect>
            </ArenaField>
            <ArenaField label="Region">
              <ArenaSelect value={data.region} onChange={(event) => patch('region', event.target.value)}>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </ArenaSelect>
            </ArenaField>
          </div>

          <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-[12px] leading-relaxed text-slate-400">
            We never show your exact date of birth to clubs — only your age band.
          </p>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Primary position" error={errors.primaryPosition}>
              <div className="grid grid-cols-5 gap-1.5">
                {POSITIONS.map((position) => (
                  <ChipToggle
                    key={position}
                    active={data.primaryPosition === position}
                    onClick={() => patch('primaryPosition', position)}
                  >
                    {position}
                  </ChipToggle>
                ))}
              </div>
            </ArenaField>

            <ArenaField label="Secondary position" hint="Optional. Adjacent positions score 0.5, not 0.">
              <div className="grid grid-cols-5 gap-1.5">
                {POSITIONS.filter((position) => position !== data.primaryPosition).map((position) => (
                  <ChipToggle
                    key={position}
                    active={data.secondaryPosition === position}
                    onClick={() => patch('secondaryPosition', data.secondaryPosition === position ? '' : position)}
                  >
                    {position}
                  </ChipToggle>
                ))}
              </div>
            </ArenaField>
          </div>

          <ArenaField label="Playing level">
            <div className="grid gap-2 sm:grid-cols-2">
              {PLAYING_LEVELS.map((level) => (
                <ChoiceTile
                  key={level.value}
                  compact
                  selected={data.playingLevel === level.value}
                  onClick={() => patch('playingLevel', level.value)}
                  title={level.label.split('·')[0].trim()}
                  description={level.label.split('·')[1]?.trim()}
                  icon={<Target className="h-4 w-4" />}
                />
              ))}
            </div>
          </ArenaField>

          <SliderField
            label="Travel radius"
            value={data.preferredRadiusKm}
            min={10}
            max={150}
            step={5}
            suffix=" km"
            onChange={(value) => patch('preferredRadiusKm', value)}
            hint="Clubs outside this radius score zero on the distance dimension."
          />

          <MediaFrame
            src="/images/match-action.jpg"
            alt="Football pitch touchline"
            caption="Position compatibility drives 30% of your match score"
            tag="Rule engine"
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <ArenaField label="Availability" error={errors.availability} hint="Select every slot you can commit to.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AVAILABILITY.map((slot) => (
                <ChoiceTile
                  key={slot}
                  compact
                  selected={data.availability.includes(slot)}
                  onClick={() =>
                    patch(
                      'availability',
                      data.availability.includes(slot)
                        ? data.availability.filter((entry) => entry !== slot)
                        : [...data.availability, slot],
                    )
                  }
                  title={slot}
                  icon={<Timer className="h-3.5 w-3.5" />}
                />
              ))}
            </div>
          </ArenaField>

          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Current club" hint="Optional">
              <ArenaInput
                value={data.currentClub}
                onChange={(event) => patch('currentClub', event.target.value)}
                placeholder="Riverside FC"
              />
            </ArenaField>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="flex items-center gap-2 text-[12px] text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                {data.availability.length} slot(s) selected
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-[12px] text-slate-400">
                <CalendarDays className="h-3.5 w-3.5 text-brand" />
                Availability drives 10% of your score
              </p>
            </div>
          </div>
        </>
      ) : null}

      {step === TOTAL ? (
        <>
          <ArenaField
            label="Your story"
            hint="What should a scout know before they watch your clips?"
          >
            <ArenaTextarea
              value={data.bio}
              onChange={(event) => patch('bio', event.target.value)}
              placeholder="Two-footed central midfielder, comfortable receiving under pressure. Captained my county side for two seasons and I'm looking for a Step 4 club within 40 minutes of home."
              maxLength={600}
            />
          </ArenaField>
          <p className="gw-mono text-right text-slate-600">{data.bio.length} / 600</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Target className="h-4 w-4" />, label: 'Position', value: data.primaryPosition },
              { icon: <Users className="h-4 w-4" />, label: 'Band', value: band },
              { icon: <Timer className="h-4 w-4" />, label: 'Slots', value: `${data.availability.length}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                <span className="text-brand">{item.icon}</span>
                <p className="gw-mono mt-2 text-slate-500">{item.label}</p>
                <p className="text-[13px] font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <MediaFrame
            src="/images/player-training.jpg"
            alt="Football match action"
            caption="Complete dossiers appear first to verified clubs"
            tag="Profile strength"
          />
        </>
      ) : null}
    </OnboardingShell>
      );
    };