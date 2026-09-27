import { z } from 'zod';

/** Shared server-side validation schemas (mirrors client-side validation). */

export const EMAIL_SCHEMA = z.string().trim().email().max(254);
export const NAME_SCHEMA = z.string().trim().min(1).max(120);
export const UID_SCHEMA = z.string().min(4).max(128);
export const POSITION_SCHEMA = z.string().min(2).max(8);
export const REGION_SCHEMA = z.string().trim().min(1).max(80);

export const SKILL_RATING_KEYS = [
  'technical', 'passing', 'dribbling', 'shooting', 'first_touch',
  'defending', 'crossing', 'heading', 'tackling',
];
export const PHYSICAL_ATTRIBUTE_KEYS = ['pace', 'acceleration', 'stamina', 'strength', 'agility'];
export const MENTAL_ATTRIBUTE_KEYS = ['positioning', 'decision_making', 'work_rate', 'teamwork'];

const ratingMap = z.object({}).catchall(z.number().min(0).max(10)).default({});

export const PLAYER_PROFILE_SCHEMA = z.object({
  displayName: NAME_SCHEMA.optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  positions: z.array(POSITION_SCHEMA).min(1).max(5).optional(),
  secondaryPositions: z.array(POSITION_SCHEMA).max(5).optional(),
  dominantFoot: z.enum(['Left', 'Right', 'Both']).optional(),
  heightCm: z.number().min(100).max(220).optional(),
  playingLevel: z.number().min(1).max(10).optional(),
  currentClub: z.string().max(120).optional(),
  previousClubs: z.array(z.string().max(120)).max(10).optional(),
  playingHistory: z.string().max(2000).optional(),
  achievements: z.array(z.string().max(200)).max(20).optional(),
  availability: z.array(z.string().max(40)).max(30).optional(),
  trainingAvailability: z.array(z.string().max(40)).max(30).optional(),
  trialAvailability: z.array(z.string().max(40)).max(30).optional(),
  region: REGION_SCHEMA.optional(),
  preferredRadiusKm: z.number().min(0).max(500).optional(),
  bio: z.string().max(2500).optional(),
  skillRatings: ratingMap.optional(),
  physicalAttributes: ratingMap.optional(),
  mentalAttributes: ratingMap.optional(),
});

export const CLUB_PROFILE_SCHEMA = z.object({
  name: NAME_SCHEMA.optional(),
  clubType: z.string().max(40).optional(),
  league: z.string().max(80).optional(),
  region: REGION_SCHEMA.optional(),
  stadiumLocation: z.string().max(200).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
  contactEmail: EMAIL_SCHEMA.optional(),
  contactPhone: z.string().max(30).optional(),
  recruitmentContact: z.string().max(120).optional(),
  targetPositions: z.array(POSITION_SCHEMA).max(12).optional(),
  targetAgeGroups: z.array(z.string().max(30)).max(12).optional(),
  targetPlayingLevels: z.array(z.number().min(1).max(10)).max(10).optional(),
  preferredRadiusKm: z.number().min(0).max(500).optional(),
  formation: z.string().max(10).optional(),
  playingStyle: z.string().max(200).optional(),
  trainingAvailability: z.array(z.string().max(40)).max(30).optional(),
  trialAvailability: z.array(z.string().max(40)).max(30).optional(),
  squadRequirements: z.string().max(2000).optional(),
});

export const REGISTRATION_EXTRA_SCHEMA = z.object({
  isYouth: z.boolean().default(false),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  guardianName: NAME_SCHEMA.optional(),
  guardianEmail: EMAIL_SCHEMA.optional(),
  relationship: z.string().max(60).optional(),
  positions: z.array(POSITION_SCHEMA).optional(),
  playingLevel: z.number().min(1).max(10).optional(),
  region: REGION_SCHEMA.optional(),
  availability: z.array(z.string().max(40)).optional(),
  clubType: z.string().max(40).optional(),
  league: z.string().max(80).optional(),
  preferredRadiusKm: z.number().min(0).max(500).optional(),
  clubCode: z.string().max(20).optional(),
});

/** Lightweight parsed-call input helper: unwraps and validates request.data. */
export function parseInput<T>(schema: z.ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.';
    const error = new Error(message) as Error & { status?: string };
    error.status = 'invalid-argument';
    throw error;
  }
  return parsed.data;
}