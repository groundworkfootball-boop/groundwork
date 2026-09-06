import type { MatchConfig } from '../shared/types';

export interface MatchPlayer {
  uid: string;
  positions?: string[];
  region?: string;
  playingLevel?: number;
  availability?: string[];
  trainingAvailability?: string[];
  trialAvailability?: string[];
  profileComplete?: number;
  boostsActive?: boolean;
  searchable?: boolean;
  isYouth?: boolean;
}

export interface MatchClub {
  uid: string;
  region?: string;
  targetPositions?: string[];
  targetPlayingLevels?: number[];
}

export interface MatchResult {
  matchScore: number;
  scoreBreakdown: Record<string, number>;
}

const DEFAULT_CONFIG: MatchConfig = {
  positionWeight: 0.3,
  distanceWeight: 0.15,
  levelWeight: 0.2,
  attributesWeight: 0.2,
  availabilityWeight: 0.1,
  boostWeight: 0.05,
  version: 1,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function calculateMatchResult(player: MatchPlayer, club: MatchClub, config: MatchConfig = DEFAULT_CONFIG): MatchResult {
  const positionScore = player.positions?.some((position) => club.targetPositions?.includes(position)) ? 1 : 0;
  const distanceScore = !player.region || !club.region ? 0.5 : player.region === club.region ? 1 : 0.35;
  const levelScore = clamp(1 - Math.abs((player.playingLevel ?? 0) - average(club.targetPlayingLevels ?? [player.playingLevel ?? 0])) / 10);
  const attributeScore = clamp((player.profileComplete ?? 0) / 100);
  const availabilityPool = [...new Set([...(player.availability ?? []), ...(player.trainingAvailability ?? []), ...(player.trialAvailability ?? [])])];
  const availabilityScore = clamp(availabilityPool.length / 10);
  const boostScore = player.boostsActive ? 1 : 0;

  const matchScore = clamp(
    positionScore * config.positionWeight +
      distanceScore * config.distanceWeight +
      levelScore * config.levelWeight +
      attributeScore * config.attributesWeight +
      availabilityScore * config.availabilityWeight +
      boostScore * config.boostWeight,
  );

  return {
    matchScore,
    scoreBreakdown: {
      positionScore,
      distanceScore,
      levelScore,
      attributeScore,
      availabilityScore,
      boostScore,
    },
  };
}
