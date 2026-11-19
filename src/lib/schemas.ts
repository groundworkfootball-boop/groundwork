/**
 * GROUNDWORK — Shared Zod Validation Schemas
 * 
 * Used by React Hook Form for client-side validation
 * and Cloud Functions for server-side validation.
 */

import { z } from 'zod';

// ─── Constants ───────────────────────────────────────────────────────────────

export const POSITIONS = [
  'GK', 'RB', 'RWB', 'CB', 'LB', 'LWB',
  'CDM', 'CM', 'CAM', 'RM', 'LM',
  'RW', 'LW', 'CF', 'ST',
] as const;

export const PLAYING_LEVELS = [
  { value: 1, label: 'Sunday League / Social' },
  { value: 2, label: 'Recreational / Pub League' },
  { value: 3, label: 'Local / County League' },
  { value: 4, label: 'Regional / Amateur' },
  { value: 5, label: 'Semi-Professional' },
  { value: 6, label: 'Academy / Development' },
  { value: 7, label: 'Professional Reserve / Youth' },
  { value: 8, label: 'Professional Lower Division' },
  { value: 9, label: 'Professional Championship / League One' },
  { value: 10, label: 'Professional Premier / International' },
] as const;

export const REGIONS = [
  'London', 'South East', 'South West', 'East of England',
  'West Midlands', 'East Midlands', 'Yorkshire & Humber',
  'North West', 'North East', 'Scotland', 'Wales',
  'Northern Ireland', 'Republic of Ireland', 'International',
] as const;

export const AVAILABILITY_SLOTS = [
  'Monday Morning', 'Monday Afternoon', 'Monday Evening',
  'Tuesday Morning', 'Tuesday Afternoon', 'Tuesday Evening',
  'Wednesday Morning', 'Wednesday Afternoon', 'Wednesday Evening',
  'Thursday Morning', 'Thursday Afternoon', 'Thursday Evening',
  'Friday Morning', 'Friday Afternoon', 'Friday Evening',
  'Saturday Morning', 'Saturday Afternoon', 'Saturday Evening',
  'Sunday Morning', 'Sunday Afternoon', 'Sunday Evening',
  'Weekdays', 'Weekends', 'Evenings Only', 'Flexible',
] as const;

export const AGE_BANDS = [
  'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16',
  'U17', 'U18', 'U21', 'U23', 'Senior', 'Veterans',
] as const;

export const CLUB_TYPES = [
  'Professional', 'Semi-Professional', 'Amateur', 'Academy',
  'Grassroots', 'Sunday League', 'University', 'Community',
] as const;

export const FORMATIONS = [
  '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3',
  '4-1-4-1', '5-3-2', '5-4-1', '4-4-1-1', '4-5-1',
  '4-1-2-1-2', '3-4-1-2',
] as const;

export const DOMINANT_FEET = ['Left', 'Right', 'Both'] as const;

// ─── Player Registration ─────────────────────────────────────────────────────

export const playerRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  dob: z.string().min(1, 'Date of birth is required'),
  primaryPosition: z.enum(POSITIONS, { message: 'Select a position' }),
  secondaryPosition: z.enum(POSITIONS).optional().nullable(),
  playingLevel: z.number().min(1).max(10),
  region: z.enum(REGIONS, { message: 'Select a region' }),
  availability: z.array(z.string()).min(1, 'Select at least one availability slot'),
  // Guardian fields (conditional for youth)
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianRelationship: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type PlayerRegistrationData = z.infer<typeof playerRegistrationSchema>;

// ─── Club Registration ───────────────────────────────────────────────────────

export const clubRegistrationSchema = z.object({
  name: z.string().min(2, 'Club name is required').max(150),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  clubType: z.enum(CLUB_TYPES, { message: 'Select a club type' }),
  league: z.string().min(1, 'League name is required'),
  region: z.enum(REGIONS, { message: 'Select a region' }),
  preferredRadiusKm: z.number().min(1).max(500).default(50),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ClubRegistrationData = z.infer<typeof clubRegistrationSchema>;

// ─── Guardian Registration ───────────────────────────────────────────────────

export const guardianRegistrationSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  relationship: z.string().min(1, 'Relationship is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type GuardianRegistrationData = z.infer<typeof guardianRegistrationSchema>;

// ─── Player Profile ──────────────────────────────────────────────────────────

export const playerProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
  dob: z.string().optional(),
  positions: z.array(z.enum(POSITIONS)).min(1, 'Select at least one position'),
  dominantFoot: z.enum(DOMINANT_FEET).optional(),
  height: z.number().min(100).max(250).optional().nullable(),
  playingLevel: z.number().min(1).max(10),
  currentClub: z.string().max(100).optional().or(z.literal('')),
  previousClubs: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  region: z.enum(REGIONS),
  availability: z.array(z.string()).min(1),
  trainingAvailability: z.array(z.string()).optional(),
  trialAvailability: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional().or(z.literal('')),
  skillRatings: z.object({
    technical: z.number().min(1).max(10).optional(),
    passing: z.number().min(1).max(10).optional(),
    dribbling: z.number().min(1).max(10).optional(),
    shooting: z.number().min(1).max(10).optional(),
    first_touch: z.number().min(1).max(10).optional(),
    defending: z.number().min(1).max(10).optional(),
    crossing: z.number().min(1).max(10).optional(),
    heading: z.number().min(1).max(10).optional(),
    tackling: z.number().min(1).max(10).optional(),
  }).optional(),
  physicalAttributes: z.object({
    pace: z.number().min(1).max(10).optional(),
    acceleration: z.number().min(1).max(10).optional(),
    stamina: z.number().min(1).max(10).optional(),
    strength: z.number().min(1).max(10).optional(),
    agility: z.number().min(1).max(10).optional(),
  }).optional(),
  mentalAttributes: z.object({
    positioning: z.number().min(1).max(10).optional(),
    decision_making: z.number().min(1).max(10).optional(),
    work_rate: z.number().min(1).max(10).optional(),
    teamwork: z.number().min(1).max(10).optional(),
  }).optional(),
});

export type PlayerProfileData = z.infer<typeof playerProfileSchema>;

// ─── Club Profile ────────────────────────────────────────────────────────────

export const clubProfileSchema = z.object({
  name: z.string().min(2).max(150),
  clubType: z.enum(CLUB_TYPES),
  league: z.string().min(1),
  region: z.enum(REGIONS),
  city: z.string().max(100).optional().or(z.literal('')),
  stadiumLocation: z.string().max(200).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().or(z.literal('')),
  targetPositions: z.array(z.enum(POSITIONS)),
  targetAgeGroups: z.array(z.enum(AGE_BANDS)),
  targetPlayingLevels: z.array(z.number().min(1).max(10)),
  preferredRadiusKm: z.number().min(1).max(500),
  formation: z.enum(FORMATIONS).optional(),
  playingStyle: z.string().max(500).optional().or(z.literal('')),
  squadRequirements: z.string().max(1000).optional().or(z.literal('')),
});

export type ClubProfileData = z.infer<typeof clubProfileSchema>;

// ─── Matching Config ─────────────────────────────────────────────────────────

export const matchingConfigSchema = z.object({
  positionWeight: z.number().min(0).max(1),
  distanceWeight: z.number().min(0).max(1),
  levelWeight: z.number().min(0).max(1),
  attributesWeight: z.number().min(0).max(1),
  availabilityWeight: z.number().min(0).max(1),
  boostWeight: z.number().min(0).max(1),
}).refine(
  (data) => {
    const total = data.positionWeight + data.distanceWeight + data.levelWeight +
      data.attributesWeight + data.availabilityWeight + data.boostWeight;
    return Math.abs(total - 1.0) < 0.001;
  },
  { message: 'Weights must total 100%' }
);

export type MatchingConfigData = z.infer<typeof matchingConfigSchema>;

// ─── Application ─────────────────────────────────────────────────────────────

export const applicationSchema = z.object({
  opportunityId: z.string().optional(),
  clubId: z.string().min(1),
  message: z.string().max(2000).optional().or(z.literal('')),
  positionAppliedFor: z.enum(POSITIONS).optional(),
});

export type ApplicationData = z.infer<typeof applicationSchema>;

// ─── Trial ───────────────────────────────────────────────────────────────────

export const trialSchema = z.object({
  title: z.string().min(2).max(200),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(2).max(300),
  position: z.enum(POSITIONS).optional(),
  ageGroup: z.enum(AGE_BANDS).optional(),
  playingLevel: z.number().min(1).max(10).optional(),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  capacity: z.number().min(1).max(200).optional(),
});

export type TrialData = z.infer<typeof trialSchema>;

// ─── Shortlist ───────────────────────────────────────────────────────────────

export const shortlistSchema = z.object({
  name: z.string().min(1, 'Shortlist name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
});

export type ShortlistData = z.infer<typeof shortlistSchema>;

// ─── Squad Member ────────────────────────────────────────────────────────────

export const squadMemberSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.enum(POSITIONS),
  secondaryPosition: z.enum(POSITIONS).optional().nullable(),
  squadNumber: z.number().min(1).max(99).optional().nullable(),
  age: z.number().min(5).max(70).optional().nullable(),
  playingLevel: z.number().min(1).max(10).optional().nullable(),
  status: z.enum(['active', 'injured', 'trialist', 'reserve']),
});

export type SquadMemberData = z.infer<typeof squadMemberSchema>;

// ─── Opportunity ─────────────────────────────────────────────────────────────

export const opportunitySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(3000),
  position: z.enum(POSITIONS),
  ageGroup: z.enum(AGE_BANDS).optional(),
  playingLevel: z.number().min(1).max(10),
  location: z.string().min(2).max(300),
  deadline: z.string().optional(),
  type: z.enum(['open_recruitment', 'trial', 'academy', 'scholarship', 'loan', 'transfer']),
  isYouthOpportunity: z.boolean().default(false),
});

export type OpportunityData = z.infer<typeof opportunitySchema>;

// ─── Consent ─────────────────────────────────────────────────────────────────

export const consentGrantSchema = z.object({
  youthId: z.string().min(1),
  guardianName: z.string().min(2),
  relationship: z.string().min(1),
  privacyNoticeAccepted: z.literal(true, {
    message: 'You must accept the privacy notice',
  }),
  dataUsageAccepted: z.literal(true, {
    message: 'You must accept the data usage terms',
  }),
  youthSafetyAccepted: z.literal(true, {
    message: 'You must accept the youth safety terms',
  }),
});

export type ConsentGrantData = z.infer<typeof consentGrantSchema>;

// ─── Moderation Report ───────────────────────────────────────────────────────

export const moderationReportSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(['player', 'video', 'club', 'message', 'application', 'other']),
  reason: z.string().min(10, 'Please provide more detail').max(2000),
  category: z.enum([
    'inappropriate_content',
    'harassment',
    'spam',
    'fake_profile',
    'safeguarding_concern',
    'other',
  ]),
});

export type ModerationReportData = z.infer<typeof moderationReportSchema>;

// ─── GDPR Request ────────────────────────────────────────────────────────────

export const gdprRequestSchema = z.object({
  type: z.enum(['export', 'delete']),
  reason: z.string().max(1000).optional().or(z.literal('')),
  confirmDeletion: z.boolean().optional(),
}).refine(
  (data) => data.type !== 'delete' || data.confirmDeletion === true,
  { message: 'You must confirm the deletion', path: ['confirmDeletion'] }
);

export type GDPRRequestData = z.infer<typeof gdprRequestSchema>;

// ─── Video ───────────────────────────────────────────────────────────────────

export const videoMetadataSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  position: z.enum(POSITIONS).optional(),
  tags: z.array(z.string()).max(20).optional(),
});

export type VideoMetadataData = z.infer<typeof videoMetadataSchema>;

// ─── Notification Settings ───────────────────────────────────────────────────

export const notificationSettingsSchema = z.object({
  emailApplications: z.boolean().default(true),
  emailShortlists: z.boolean().default(true),
  emailTrials: z.boolean().default(true),
  emailRecommendations: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  pushApplications: z.boolean().default(true),
  pushMessages: z.boolean().default(true),
});

export type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;

// ─── Contact Form ────────────────────────────────────────────────────────────

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(3, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  type: z.enum(['general', 'support', 'partnership', 'safeguarding', 'bug_report']),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
