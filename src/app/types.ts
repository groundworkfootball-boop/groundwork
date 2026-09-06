export type Role = 'player' | 'guardian' | 'club' | 'admin';

export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'suspended';

export type ConsentStatus = 'pending' | 'granted' | 'withdrawn';

export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';

export type ApplicationStatus = 'draft' | 'submitted' | 'viewed' | 'shortlisted' | 'trial_invited' | 'rejected' | 'withdrawn' | 'accepted';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface TimestampLike {
  seconds?: number;
  nanoseconds?: number;
}

export interface BaseRecord {
  id: string;
  createdAt?: TimestampLike | null;
  updatedAt?: TimestampLike | null;
}

export interface PlayerRecord extends BaseRecord {
  uid: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: Role;
  positions?: string[];
  region?: string;
  searchable?: boolean;
  isYouth?: boolean;
  dob?: string;
  age?: number;
  ageBand?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  consentStatus?: ConsentStatus;
  consentGrantedAt?: TimestampLike | null;
  profileComplete?: number;
  profileCompleteness?: number;
  playingLevel?: number;
  height?: number;
  dominantFoot?: 'Left' | 'Right' | 'Both';
  availability?: string[];
  trainingAvailability?: string[];
  trialAvailability?: string[];
  skillRatings?: Record<string, number>;
  physicalAttributes?: Record<string, number>;
  bio?: string;
  currentClub?: string;
  previousClubs?: string[];
  achievements?: string[];
  photoUrl?: string;
  videoCount?: number;
  boostsActive?: boolean;
  boostExpiresAt?: TimestampLike | null;
  affiliatedClubCode?: string;
  affiliatedClubId?: string;
}

export interface ClubRecord extends BaseRecord {
  uid: string;
  name?: string;
  clubCode?: string; // Unique club code, e.g. GW-ARS-4821
  region?: string;
  city?: string;
  stadiumLocation?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  verificationStatus?: VerificationStatus;
  verifiedAdult?: boolean;
  verifiedYouth?: boolean;
  youthVerificationExpiresAt?: TimestampLike | null;
  targetPositions?: string[];
  targetAgeGroups?: string[];
  targetPlayingLevels?: number[];
  preferredRadiusKm?: number;
  formation?: string;
  playingStyle?: string;
  squadRequirements?: string;
  subscriptionTier?: 'free' | 'standard' | 'premium';
  subscriptionStatus?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'inactive';
}

export interface GuardianRecord extends BaseRecord {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  linkedYouthIds?: string[];
}

export interface ClubInviteRecord extends BaseRecord {
  clubId: string;
  clubName: string;
  clubCode: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  inviteeName?: string;
  role: 'player' | 'coach' | 'scout' | 'trialist';
  channel: 'whatsapp' | 'email' | 'sms' | 'link' | 'qr' | 'social';
  status: InviteStatus;
  acceptedByUid?: string;
  acceptedAt?: TimestampLike | null;
  expiresAt?: TimestampLike | null;
  notes?: string;
}

export interface SquadMemberRecord extends BaseRecord {
  clubId: string;
  playerId?: string;
  name: string;
  position: string;
  secondaryPosition?: string;
  squadNumber?: number;
  age?: number;
  playingLevel?: number;
  status: 'active' | 'injured' | 'trialist' | 'reserve';
  joinedAt?: TimestampLike | null;
  joinedViaCode?: string;
}

export interface VideoRecord extends BaseRecord {
  playerId: string;
  playerName?: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  processingStatus: ProcessingStatus;
  isYouth?: boolean;
  published: boolean;
  aiTags?: string[];
  aiSummary?: string;
  acceptedTags?: string[];
}

export interface MatchResultRecord extends BaseRecord {
  clubId: string;
  playerId: string;
  matchScore: number;
  scoreBreakdown?: {
    positionMatch: number;
    distanceMatch: number;
    levelMatch: number;
    attributesMatch: number;
    availabilityMatch: number;
    boostMatch: number;
    totalScore: number;
  };
  position?: string;
  ageBand?: string;
  region?: string;
  searchable?: boolean;
  configVersion?: number;
  scoredAt?: TimestampLike | null;
}

export interface ConsentAuditRecord extends BaseRecord {
  youthId: string;
  guardianId: string;
  action: 'granted' | 'withdrawn' | 're-granted';
  timestamp: TimestampLike | null;
  hashedIp?: string;
  privacyNoticeVersion: string;
  source: string;
}

export interface ModerationReportRecord extends BaseRecord {
  reporterId: string;
  targetId: string;
  targetType: 'player' | 'video' | 'club' | 'message';
  reason: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
}

export interface GDPRRequestRecord extends BaseRecord {
  userId: string;
  userEmail: string;
  type: 'export' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  processedAt?: TimestampLike | null;
}

export interface MatchingConfigRecord {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
  version: number;
  updatedAt?: TimestampLike | null;
}
