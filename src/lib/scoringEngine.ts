// scoringEngine.ts
// Deterministic Scoring Engine as per GROUNDWORK Tech Spec Section 5

export interface PlayerProfile {
  positions: string[];
  region: string;
  playingLevel: number; // e.g., 1-10 tier system
  skillRatings: Record<string, number>; // 1-10 per attribute
  availability: string[]; // e.g., ['Monday Eve', 'Tuesday Eve']
  hasActiveBoost: boolean;
}

export interface ClubPreferences {
  targetPositions: string[];
  region: string;
  targetLevel: number;
  requiredAvailability: string[];
}

export interface ScoreBreakdown {
  positionMatch: number;
  distanceMatch: number;
  levelMatch: number;
  attributesMatch: number;
  availabilityMatch: number;
  boostMatch: number;
  totalScore: number;
}

const ADJACENT_PAIRS = new Set([
  'RB:RWB', 'RWB:RB',
  'LB:LWB', 'LWB:LB',
  'CM:CDM', 'CDM:CM',
  'CM:CAM', 'CAM:CM',
  'ST:CF', 'CF:ST',
  'RW:RM', 'RM:RW',
  'LW:LM', 'LM:LW',
  'CB:CDM', 'CDM:CB',
]);

// Default weights as per config (Section 5.1 & prompt specs)
export const DEFAULT_WEIGHTS = {
  POSITION: 0.30,
  DISTANCE: 0.15,
  LEVEL: 0.20,
  ATTRIBUTES: 0.20,
  AVAILABILITY: 0.10,
  BOOST: 0.05,
};

export type MatchingWeights = typeof DEFAULT_WEIGHTS;

/**
 * Calculates a deterministic match score between a player and a club's preferences.
 * This is a pure function: no side effects, no randomness, no AI.
 */
export function calculateMatchScore(
  player: PlayerProfile,
  club: ClubPreferences,
  weights: MatchingWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  // 1. Position Compatibility (Default 30%)
  // Exact match = 1.0, Adjacent = 0.5, Incompatible = 0
  let positionScore = 0;
  const hasExactMatch = player.positions.some(p => club.targetPositions.includes(p));
  if (hasExactMatch) {
    positionScore = 1.0;
  } else if (player.positions.length > 0 && club.targetPositions.length > 0) {
    const hasAdjacent = player.positions.some(p =>
      club.targetPositions.some(t => ADJACENT_PAIRS.has(`${p}:${t}`))
    );
    positionScore = hasAdjacent ? 0.5 : 0.0;
  }
  
  // 2. Distance / Region (Default 15%)
  // Exact region match = 1.0, Different region = 0.0
  const distanceScore = player.region === club.region ? 1.0 : 0.0;
  
  // 3. Playing Level (20%)
  // Normalised comparison: closer is better
  const levelDiff = Math.abs(player.playingLevel - club.targetLevel);
  // Max diff assumed to be ~5 tiers
  const levelScore = Math.max(0, 1.0 - (levelDiff / 5));

  // 4. Player Score / Attributes (20%)
  // Average of 1-10 ratings, normalised to 0-1
  const attributeKeys = Object.keys(player.skillRatings);
  let avgRating = 0;
  if (attributeKeys.length > 0) {
    const sum = attributeKeys.reduce((acc, key) => acc + player.skillRatings[key], 0);
    avgRating = (sum / attributeKeys.length) / 10;
  }
  const attributeScore = avgRating;

  // 5. Availability Overlap (10%)
  let availabilityScore = 0;
  if (club.requiredAvailability.length > 0) {
    const overlapCount = player.availability.filter(day => club.requiredAvailability.includes(day)).length;
    availabilityScore = overlapCount / club.requiredAvailability.length;
  } else {
    availabilityScore = 1.0; // If club has no specific requirements, it's a match
  }

  // 6. Visibility / Boost Status (5%)
  const boostScore = player.hasActiveBoost ? 1.0 : 0.0;

  // Calculate Weighted Totals using provided weights
  const breakdown: ScoreBreakdown = {
    positionMatch: positionScore * weights.POSITION,
    distanceMatch: distanceScore * weights.DISTANCE,
    levelMatch: levelScore * weights.LEVEL,
    attributesMatch: attributeScore * weights.ATTRIBUTES,
    availabilityMatch: availabilityScore * weights.AVAILABILITY,
    boostMatch: boostScore * weights.BOOST,
    totalScore: 0,
  };

  const rawSum =
    breakdown.positionMatch +
    breakdown.distanceMatch +
    breakdown.levelMatch +
    breakdown.attributesMatch +
    breakdown.availabilityMatch +
    breakdown.boostMatch;

  // Strict clamp between 0.0 and 1.0, formatted to 3 decimal places
  breakdown.totalScore = Number(Math.max(0, Math.min(1, rawSum)).toFixed(3));

  return breakdown;
}
