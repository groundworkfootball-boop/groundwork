import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Building2,
  MapPin,
  Target,
  Users,
  ShieldCheck,
  CalendarDays,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import {
  AGE_GROUPS,
  AVAILABILITY,
  CLUB_TYPES,
  EMPTY_CLUB_DATA,
  FORMATIONS,
  PLAYING_LEVELS,
  PLAYING_STYLES,
  POSITIONS,
  REGIONS,
  markOnboardingComplete,
  saveOnboardingProgress,
  type ClubOnboardingData,
} from '../../lib/onboarding';
import {
  ArenaField,
  ArenaInput,
  ArenaSelect,
  ChipToggle,
  ChoiceTile,
  OnboardingComplete,
  OnboardingShell,
  SliderField,
} from '../../components/onboarding/OnboardingKit';
import { CrestIllustration, PitchSlotIllustration, ScoutingRadarIllustration } from '../../components/illustrations/football';

const STEPS = ['Club identity', 'Recruitment targets', 'Operating shape', 'Confirm'];
const TOTAL = STEPS.length;

const CLUB_FIELDS = [
  'name',
  'clubType',
  'league',
  'region',
  'groundName',
  'preferredRadiusKm',
  'targetPositions',
  'targetAgeGroups',
  'targetPlayingLevels',
  'formation',
  'playingStyle',
  'trainingAvailability',
] as const;

export const ClubOnboardingFlow = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [checklist, setChecklist] = useState<Array<{ label: string; done: boolean }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<ClubOnboardingData>(EMPTY_CLUB_DATA);

  const patch = <K extends keyof ClubOnboardingData>(key: K, value: ClubOnboardingData[K]) => {
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
        const snap = await getDoc(doc(db, 'clubs', user.uid));
        if (cancelled) return;
        const raw = snap.exists() ? snap.data() : {};
        setData({
          name: (raw.name as string) ?? user.name ?? '',
          clubType: (raw.clubType as string) ?? 'Semi-professional',
          league: (raw.league as string) ?? '',
          region: (raw.region as string) ?? 'London',
          groundName: (raw.groundName as string) ?? '',
          preferredRadiusKm: typeof raw.preferredRadiusKm === 'number' ? raw.preferredRadiusKm : 50,
          targetPositions: Array.isArray(raw.targetPositions) && raw.targetPositions.length ? (raw.targetPositions as string[]) : ['CM'],
          targetAgeGroups: Array.isArray(raw.targetAgeGroups) && raw.targetAgeGroups.length ? (raw.targetAgeGroups as string[]) : ['Senior'],
          targetPlayingLevels:
            Array.isArray(raw.targetPlayingLevels) && raw.targetPlayingLevels.length
              ? (raw.targetPlayingLevels as number[])
              : [5],
          formation: (raw.formation as string) ?? '4-3-3',
          playingStyle: (raw.playingStyle as string) ?? 'Balanced',
          trainingAvailability:
            Array.isArray(raw.trainingAvailability) && raw.trainingAvailability.length
              ? (raw.trainingAvailability as string[])
              : ['Tue Eve', 'Thu Eve'],
        });
      } catch {
        // Local defaults remain usable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.name]);

  const readiness = useMemo(() => {
    const checks = [
      data.name.trim().length >= 2,
      Boolean(data.league.trim()),
      data.targetPositions.length > 0,
      data.targetAgeGroups.length > 0,
      data.targetPlayingLevels.length > 0,
      data.trainingAvailability.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data]);

  const validate = (current: number): boolean => {
    const next: Record<string, string> = {};
    if (current === 1) {
      if (data.name.trim().length < 2) next.name = 'Enter your club’s official name.';
      if (!data.league.trim()) next.league = 'Which league or division do you operate in?';
    }
    if (current === 2) {
      if (data.targetPositions.length === 0) next.targetPositions = 'Select at least one target position.';
      if (data.targetAgeGroups.length === 0) next.targetAgeGroups = 'Select at least one age group.';
      if (data.targetPlayingLevels.length === 0) next.targetPlayingLevels = 'Select at least one playing level.';
    }
    if (current === 3 && data.trainingAvailability.length === 0) {
      next.trainingAvailability = 'Select the slots you train or trial.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const persist = async () => {
    if (!user?.uid) return;
    const payload: Record<string, unknown> = {};
    for (const key of CLUB_FIELDS) {
      payload[key] = key === 'name' ? data.name.trim() : data[key];
    }
    // Verification and subscription fields are server-owned; this write can
    // only ever touch the recruitment profile.
    await updateDoc(doc(db, 'clubs', user.uid), {
      ...payload,
      onboardingComplete: true,
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
        { label: `${data.name || 'Club'} identity recorded`, done: true },
        { label: `${data.targetPositions.length} target position(s) configured`, done: true },
        { label: `${data.preferredRadiusKm}km recruitment radius set`, done: true },
        { label: 'Verification documents still required', done: false },
      ]);
      setDone(true);
      success('Club profile saved. Submit verification to unlock search.');
    } catch (err) {
      console.error(err);
      toastError('We could not save your club profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleArray = (key: 'targetPositions' | 'targetAgeGroups' | 'trainingAvailability', value: string) => {
    const current = data[key];
    patch(key, current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  };

  const toggleLevel = (value: number) => {
    const current = data.targetPlayingLevels;
    patch(
      'targetPlayingLevels',
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <span className="gw-mono animate-pulse text-slate-500">Loading club record…</span>
      </div>
    );
  }

  if (done) {
    return (
      <OnboardingComplete
        title="Recruitment profile ready"
        summary="Your targets are set. Submit verification documents next — club search only unlocks for verified adult recruitment, and youth access needs separate safeguarding clearance."
        checklist={checklist}
        primaryHref="/dashboard/club/verification"
        primaryLabel="Submit verification"
        secondaryHref="/dashboard"
        secondaryLabel="Go to dashboard"
      />
    );
  }

  return (
    <OnboardingShell
      step={step}
      total={TOTAL}
      labels={STEPS}
      eyebrow="Club setup"
      title={
        step === 1
          ? 'Set up your recruitment identity'
          : step === 2
            ? 'Who are you recruiting?'
            : step === 3
              ? 'How does your club operate?'
              : 'Confirm and publish'
      }
      description={
        step === 1
          ? 'Clubs search by league, region and radius. Accurate details mean sharper match scores.'
          : step === 2
            ? 'Target positions, age groups and levels define how the deterministic engine scores every player for you.'
            : step === 3
              ? 'Formation and training slots feed both the match engine and AI squad gap analysis.'
              : 'Review your setup. You can change any of this later from the club profile page.'
      }
      onBack={step > 1 ? () => setStep((prev) => Math.max(1, prev - 1)) : undefined}
      onNext={advance}
      nextLabel={step === TOTAL ? 'Publish profile' : 'Continue'}
      nextDisabled={saving}
      saving={saving}
      footerNote={`Readiness ${readiness}%`}
      aside={
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="gw-mono text-slate-500">Club record</p>
              <p className="mt-1 text-[13px] font-semibold text-white">{data.name || 'Unnamed club'}</p>
            </div>
            <span className="gw-mono rounded border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-sky-300">
              {data.formation}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="gw-rail h-full transition-[width] duration-500" style={{ width: `${readiness}%` }} />
          </div>
          <dl className="space-y-1.5 pt-1 text-[12px]">
            {[
              ['League', data.league || 'Not set'],
              ['Type', data.clubType],
              ['Region', data.region],
              ['Radius', `${data.preferredRadiusKm} km`],
              ['Targets', `${data.targetPositions.length} positions`],
              ['Age groups', data.targetAgeGroups.join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="truncate font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-2.5 text-[11.5px] leading-relaxed text-amber-200/85">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Search stays locked until an admin approves your verification.
          </p>
        </div>
      }
    >
      {step === 1 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Club name" error={errors.name}>
              <ArenaInput
                value={data.name}
                onChange={(event) => patch('name', event.target.value)}
                placeholder="Riverside Athletic FC"
                invalid={Boolean(errors.name)}
              />
            </ArenaField>
            <ArenaField label="League / division" error={errors.league}>
              <ArenaInput
                value={data.league}
                onChange={(event) => patch('league', event.target.value)}
                placeholder="Isthmian League Division One South"
                invalid={Boolean(errors.league)}
              />
            </ArenaField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Club type">
              <ArenaSelect value={data.clubType} onChange={(event) => patch('clubType', event.target.value)}>
                {CLUB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
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

          <ArenaField label="Ground / training base" hint="Optional but improves local relevance.">
            <ArenaInput
              value={data.groundName}
              onChange={(event) => patch('groundName', event.target.value)}
              placeholder="Riverside Park, TW9"
            />
          </ArenaField>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <CrestIllustration className="max-h-40" />
            <PitchSlotIllustration className="self-center" />
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <ArenaField label="Target positions" error={errors.targetPositions}>
            <div className="grid grid-cols-5 gap-1.5">
              {POSITIONS.map((position) => (
                <ChipToggle
                  key={position}
                  active={data.targetPositions.includes(position)}
                  onClick={() => toggleArray('targetPositions', position)}
                >
                  {position}
                </ChipToggle>
              ))}
            </div>
          </ArenaField>

          <ArenaField label="Target age groups" error={errors.targetAgeGroups}>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
              {AGE_GROUPS.map((group) => (
                <ChipToggle
                  key={group}
                  tone={group.startsWith('U') ? 'sky' : 'brand'}
                  active={data.targetAgeGroups.includes(group)}
                  onClick={() => toggleArray('targetAgeGroups', group)}
                >
                  {group}
                </ChipToggle>
              ))}
            </div>
            {data.targetAgeGroups.some((group) => group.startsWith('U')) ? (
              <p className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] p-2.5 text-[11.5px] leading-relaxed text-emerald-200/85">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Youth age groups require separate safeguarding verification and live expiry.
              </p>
            ) : null}
          </ArenaField>

          <ArenaField label="Target playing levels" error={errors.targetPlayingLevels}>
            <div className="grid gap-2 sm:grid-cols-2">
              {PLAYING_LEVELS.map((level) => (
                <ChoiceTile
                  key={level.value}
                  compact
                  selected={data.targetPlayingLevels.includes(level.value)}
                  onClick={() => toggleLevel(level.value)}
                  title={level.label.split('·')[0].trim()}
                  description={level.label.split('·')[1]?.trim()}
                  icon={<Target className="h-4 w-4" />}
                />
              ))}
            </div>
          </ArenaField>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <ScoutingRadarIllustration />
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ArenaField label="Preferred formation">
              <ArenaSelect value={data.formation} onChange={(event) => patch('formation', event.target.value)}>
                {FORMATIONS.map((formation) => (
                  <option key={formation} value={formation}>
                    {formation}
                  </option>
                ))}
              </ArenaSelect>
            </ArenaField>
            <ArenaField label="Playing style">
              <ArenaSelect value={data.playingStyle} onChange={(event) => patch('playingStyle', event.target.value)}>
                {PLAYING_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </ArenaSelect>
            </ArenaField>
          </div>

          <ArenaField label="Training & trial slots" error={errors.trainingAvailability}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AVAILABILITY.map((slot) => (
                <ChoiceTile
                  key={slot}
                  compact
                  selected={data.trainingAvailability.includes(slot)}
                  onClick={() => toggleArray('trainingAvailability', slot)}
                  title={slot}
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                />
              ))}
            </div>
          </ArenaField>

          <SliderField
            label="Recruitment radius"
            value={data.preferredRadiusKm}
            min={10}
            max={200}
            step={5}
            suffix=" km"
            onChange={(value) => patch('preferredRadiusKm', value)}
            hint="Players beyond this radius score zero on the distance dimension."
          />
        </>
      ) : null}

      {step === TOTAL ? (
        <div className="space-y-3">
          {[
            { icon: <Building2 className="h-4 w-4" />, label: 'Club', value: data.name || '—' },
            { icon: <Trophy className="h-4 w-4" />, label: 'League', value: data.league || '—' },
            { icon: <MapPin className="h-4 w-4" />, label: 'Region', value: data.region },
            { icon: <Users className="h-4 w-4" />, label: 'Age groups', value: data.targetAgeGroups.join(', ') || '—' },
            { icon: <Target className="h-4 w-4" />, label: 'Positions', value: data.targetPositions.join(', ') || '—' },
            {
              icon: <ShieldCheck className="h-4 w-4" />,
              label: 'Levels',
              value: data.targetPlayingLevels
                .map((level) => PLAYING_LEVELS.find((entry) => entry.value === level)?.label.split('·')[0].trim())
                .join(', ') || '—',
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3"
            >
              <span className="flex items-center gap-2.5 text-slate-400">
                <span className="text-brand">{row.icon}</span>
                <span className="gw-mono">{row.label}</span>
              </span>
              <span className="truncate text-[13px] font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </OnboardingShell>
  );
};