import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db, functions } from '../../lib/firebase';
import type { PlayerRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Progress } from '../../components/ui/Progress';
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

const SKILL_KEYS = [
  { key: 'technical', label: 'Technical' },
  { key: 'passing', label: 'Passing' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'firstTouch', label: 'First touch' },
  { key: 'defending', label: 'Defending' },
  { key: 'crossing', label: 'Crossing' },
  { key: 'heading', label: 'Heading' },
  { key: 'tackling', label: 'Tackling' },
];

const PHYSICAL_KEYS = [
  { key: 'pace', label: 'Pace' },
  { key: 'acceleration', label: 'Acceleration' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
];

const MENTAL_KEYS = [
  { key: 'positioning', label: 'Positioning' },
  { key: 'decisionMaking', label: 'Decision making' },
  { key: 'workRate', label: 'Work rate' },
  { key: 'teamwork', label: 'Teamwork' },
];

const STEPS = ['Positions', 'Physical', 'Attributes', 'Availability'];

export const ProfileBuilderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState(0);

  const [primaryPosition, setPrimaryPosition] = useState('CM');
  const [secondaryPosition, setSecondaryPosition] = useState('');
  const [playingLevel, setPlayingLevel] = useState(5);
  const [dominantFoot, setDominantFoot] = useState<'Left' | 'Right' | 'Both'>('Right');
  const [heightCm, setHeightCm] = useState(178);
  const [region, setRegion] = useState('London');
  const [availability, setAvailability] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [currentClub, setCurrentClub] = useState('');
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [physical, setPhysical] = useState<Record<string, number>>({});
  const [mental, setMental] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const snapshot = await getDoc(doc(db, 'players', user.uid));
      if (snapshot.exists()) {
        const data = snapshot.data() as PlayerRecord;
        if (data.positions?.[0]) setPrimaryPosition(data.positions[0]);
        if (data.positions?.[1]) setSecondaryPosition(data.positions[1]);
        if (data.playingLevel) setPlayingLevel(data.playingLevel);
        if (data.dominantFoot) setDominantFoot(data.dominantFoot);
        if (data.height) setHeightCm(data.height);
        if (data.region) setRegion(data.region);
        if (data.availability) setAvailability(data.availability);
        if (data.bio) setBio(data.bio);
        if (data.currentClub) setCurrentClub(data.currentClub);
        if (data.skillRatings) setSkills(data.skillRatings);
        if (data.physicalAttributes) setPhysical(data.physicalAttributes);
        if (data.mentalAttributes) setMental(data.mentalAttributes);
        setCompleteness(data.profileCompleteness ?? data.profileComplete ?? 0);
      }
    } catch (err) {
      console.error(err);
      toastError('Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleAvailability = (slot: string) => {
    setAvailability((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  };

  const setRating = (
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
    key: string,
    value: number,
  ) => {
    setter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setFormError(null);

    if (!primaryPosition) {
      setFormError('Choose a primary position.');
      return;
    }
    if (availability.length === 0) {
      setFormError('Select at least one availability slot.');
      return;
    }

    setSaving(true);
    try {
      // Server recomputes profileCompleteness deterministically and enqueues
      // match recalculation. The client never writes protected fields.
      const updateProfile = httpsCallable<
        Record<string, unknown>,
        { ok: boolean; profileCompleteness: number }
      >(functions, 'updatePlayerProfile');

      const { data } = await updateProfile({
        positions: [primaryPosition, secondaryPosition].filter(Boolean),
        playingLevel,
        dominantFoot,
        heightCm,
        region,
        availability,
        bio: bio.trim(),
        currentClub: currentClub.trim() || undefined,
        skillRatings: skills,
        physicalAttributes: physical,
        mentalAttributes: mental,
      });

      setCompleteness(data.profileCompleteness);
      success(`Profile saved — ${data.profileCompleteness}% complete.`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'We could not save your profile. Please try again.';
      setFormError(message);
      toastError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand" />
      </div>
    );
  }

  const renderRatingGroup = (
    title: string,
    keys: Array<{ key: string; label: string }>,
    values: Record<string, number>,
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  ) => (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-400">{title}</h3>
      <div className="space-y-3">
        {keys.map((item) => {
          const value = values[item.key] ?? 5;
          return (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor={`rating-${item.key}`} className="text-[12.5px] text-slate-300">
                  {item.label}
                </label>
                <span className="gw-numeric text-[12px] font-semibold text-brand">{value}/10</span>
              </div>
              <input
                id={`rating-${item.key}`}
                type="range"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) => setRating(setter, item.key, Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.10] accent-brand"
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Profile builder"
        title="Build your dossier"
        description="Structured data is what the matching engine scores. Completeness is calculated server-side."
      />

      <Card padding="md">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const isDone = step > number;
            const isCurrent = step === number;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    isDone && 'bg-brand text-ink-950',
                    isCurrent && 'border border-brand/50 bg-brand/15 text-brand',
                    !isDone && !isCurrent && 'border border-white/[0.12] bg-white/[0.04] text-slate-500',
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : number}
                </span>
                <span className={cn('hidden text-[11.5px] font-medium sm:block', isCurrent ? 'text-white' : 'text-slate-500')}>
                  {label}
                </span>
                {index < STEPS.length - 1 ? <span className="h-px flex-1 bg-white/[0.08]" /> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Progress value={completeness} label="Current completeness" showValue tone="brand" />
        </div>
      </Card>

      <Card padding="lg">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Primary position" value={primaryPosition} onChange={(e) => setPrimaryPosition(e.target.value)}>
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
              <Select label="Playing level" value={playingLevel} onChange={(e) => setPlayingLevel(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <option key={level} value={level}>
                    Level {level}
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
            <Input
              label="Current club"
              placeholder="e.g. Riverside Athletic"
              value={currentClub}
              onChange={(e) => setCurrentClub(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Dominant foot"
                value={dominantFoot}
                onChange={(e) => setDominantFoot(e.target.value as 'Left' | 'Right' | 'Both')}
              >
                {['Right', 'Left', 'Both'].map((foot) => (
                  <option key={foot} value={foot}>
                    {foot}
                  </option>
                ))}
              </Select>
              <Input
                label="Height (cm)"
                type="number"
                min={100}
                max={220}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
              />
            </div>
            {renderRatingGroup('Physical attributes', PHYSICAL_KEYS, physical, setPhysical)}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {renderRatingGroup('Technical', SKILL_KEYS, skills, setSkills)}
            {renderRatingGroup('Mental & playing', MENTAL_KEYS, mental, setMental)}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
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

            <Textarea
              label="Bio"
              placeholder="A short paragraph about your game, pathway and what you are looking for."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={2500}
              rows={5}
            />
          </div>
        )}

        {formError ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-[12.5px] leading-relaxed text-rose-200">{formError}</p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          {step < STEPS.length ? (
            <Button onClick={() => setStep((s) => s + 1)} iconRight={<ArrowRight className="h-4 w-4" />}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSave} loading={saving} iconRight={<Check className="h-4 w-4" />}>
              Save profile
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
