import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Role } from '../context/AuthContext';

export const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'] as const;

export const REGIONS = [
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
] as const;

export const AVAILABILITY = [
  'Mon Eve',
  'Tue Eve',
  'Wed Eve',
  'Thu Eve',
  'Fri Eve',
  'Sat AM',
  'Sat PM',
  'Sun AM',
  'Sun PM',
] as const;

export const AGE_GROUPS = ['U9', 'U11', 'U13', 'U15', 'U16', 'U18', 'U21', 'Senior'] as const;

export const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'] as const;

export const PLAYING_LEVELS = [
  { value: 1, label: 'Step 1 · National League' },
  { value: 2, label: 'Step 2 · National North/South' },
  { value: 3, label: 'Step 3 · Northern/Southern Premier' },
  { value: 4, label: 'Step 4 · Isthmian / NPL Div 1' },
  { value: 5, label: 'Step 5 · Combined Counties' },
  { value: 6, label: 'Step 6 · Regional feeder' },
  { value: 7, label: 'Grassroots / Sunday league' },
] as const;

export const CLUB_TYPES = ['Professional', 'Semi-professional', 'Amateur', 'Academy', 'Community'] as const;

export const PLAYING_STYLES = ['Possession', 'High press', 'Direct', 'Counter-attack', 'Balanced'] as const;

export interface PlayerOnboardingData {
  displayName: string;
  dob: string;
  dominantFoot: 'Left' | 'Right' | 'Both';
  primaryPosition: string;
  secondaryPosition: string;
  playingLevel: number;
  region: string;
  preferredRadiusKm: number;
  availability: string[];
  currentClub: string;
  bio: string;
}

export interface ClubOnboardingData {
  name: string;
  clubType: string;
  league: string;
  region: string;
  groundName: string;
  preferredRadiusKm: number;
  targetPositions: string[];
  targetAgeGroups: string[];
  targetPlayingLevels: number[];
  formation: string;
  playingStyle: string;
  trainingAvailability: string[];
}

export const EMPTY_PLAYER_DATA: PlayerOnboardingData = {
  displayName: '',
  dob: '',
  dominantFoot: 'Right',
  primaryPosition: 'CM',
  secondaryPosition: '',
  playingLevel: 5,
  region: 'London',
  preferredRadiusKm: 40,
  availability: ['Sat AM'],
  currentClub: '',
  bio: '',
};

export const EMPTY_CLUB_DATA: ClubOnboardingData = {
  name: '',
  clubType: 'Semi-professional',
  league: '',
  region: 'London',
  groundName: '',
  preferredRadiusKm: 50,
  targetPositions: ['CM'],
  targetAgeGroups: ['Senior'],
  targetPlayingLevels: [5],
  formation: '4-3-3',
  playingStyle: 'Balanced',
  trainingAvailability: ['Tue Eve', 'Thu Eve'],
};

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function ageBandFor(age: number | null): string {
  if (age === null) return 'Unknown';
  if (age < 11) return 'U11';
  if (age < 13) return 'U13';
  if (age < 15) return 'U15';
  if (age < 16) return 'U16';
  if (age < 18) return 'U18';
  if (age < 21) return 'U21';
  return 'Senior';
}

/**
 * Deterministic profile completeness — mirrors the server-side weights in
 * functions/src/players/profile.ts so the client can show progress without a
 * round trip. The server remains authoritative.
 */
export function playerCompleteness(input: {
  photoUrl?: string | null;
  positions?: string[];
  playingLevel?: number | null;
  availability?: string[];
  skillRatings?: Record<string, number>;
  physicalAttributes?: Record<string, number>;
  mentalAttributes?: Record<string, number>;
  bio?: string;
  currentClub?: string;
  videoCount?: number;
  region?: string;
}): number {
  const has = (map?: Record<string, number>) =>
    Boolean(map && Object.values(map).some((value) => typeof value === 'number' && value > 0));

  const buckets: Array<[boolean, number]> = [
    [Boolean(input.photoUrl), 15],
    [Boolean(input.positions?.length), 15],
    [Boolean(input.playingLevel), 10],
    [Boolean(input.availability?.length), 10],
    [has(input.skillRatings) || has(input.physicalAttributes) || has(input.mentalAttributes), 20],
    [Boolean(input.bio?.trim()), 10],
    [Boolean(input.videoCount && input.videoCount > 0), 10],
    [Boolean(input.region), 5],
    [Boolean(input.currentClub), 5],
  ];
  return Math.min(
    100,
    buckets.reduce((sum, [ok, weight]) => sum + (ok ? weight : 0), 0),
  );
}

export interface OnboardingState {
  completed: boolean;
  role: Role | null;
  completedAt?: unknown;
  version: number;
}

export const ONBOARDING_VERSION = 1;

export async function getOnboardingState(uid: string): Promise<OnboardingState> {
  const snap = await getDoc(doc(db, 'users', uid));
  const raw = (snap.data()?.onboarding ?? {}) as Partial<OnboardingState>;
  return {
    completed: raw.completed === true,
    role: (raw.role as Role | undefined) ?? null,
    completedAt: raw.completedAt,
    version: typeof raw.version === 'number' ? raw.version : 0,
  };
}

export async function markOnboardingComplete(uid: string, role: Role): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    onboarding: {
      completed: true,
      role,
      version: ONBOARDING_VERSION,
      completedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function saveOnboardingProgress(
  uid: string,
  role: Role,
  step: number,
  totalSteps: number,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    onboarding: {
      completed: false,
      role,
      version: ONBOARDING_VERSION,
      lastStep: step,
      totalSteps,
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}