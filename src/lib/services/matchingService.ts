import type { MatchResultRecord, PlayerRecord, ClubRecord } from '../../app/types';

export interface MatchConfig {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
  version: number;
}

export interface MatchBreakdown {
  positionScore: number;
  distanceScore: number;
  levelScore: number;
  attributeScore: number;
  availabilityScore: number;
  boostScore: number;
  score: number;
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
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPositionScore(player: PlayerRecord, club: ClubRecord): number {
  const playerPositions = player.positions ?? [];
  const targetPositions = club.targetPositions ?? [];
  if (playerPositions.length === 0 || targetPositions.length === 0) return 0;
  if (playerPositions.some((position) => targetPositions.includes(position))) return 1;
  const adjacentPairs = new Set(['RB:RWB', 'RWB:RB', 'LB:LWB', 'LWB:LB', 'CM:CDM', 'CDM:CM', 'CM:CAM', 'CAM:CM', 'ST:CF', 'CF:ST', 'RW:RM', 'RM:RW', 'LW:LM', 'LM:LW']);
  return playerPositions.some((position) => targetPositions.some((target) => adjacentPairs.has(`${position}:${target}`))) ? 0.5 : 0;
}

function getDistanceScore(player: PlayerRecord, club: ClubRecord): number {
  if (!player.region || !club.region) return 0.5;
  return player.region === club.region ? 1 : 0.35;
}

function getLevelScore(player: PlayerRecord, club: ClubRecord): number {
  const playerLevel = player.playingLevel ?? 0;
  const targetLevel = average(club.targetPlayingLevels ?? [playerLevel]);
  const diff = Math.abs(playerLevel - targetLevel);
  return clamp(1 - diff / 10);
}

function getAttributeScore(player: PlayerRecord): number {
  const values = [player.profileComplete ?? 0, player.profileCompleteness ?? 0].filter((value) => value > 0);
  if (values.length) return clamp(average(values) / 100);
  return 0.5;
}

function getAvailabilityScore(player: PlayerRecord): number {
  const availability = player.availability ?? [];
  const training = player.trainingAvailability ?? [];
  const trial = player.trialAvailability ?? [];
  const pool = [...new Set([...availability, ...training, ...trial])];
  if (!pool.length) return 0;
  return clamp(pool.length / 10);
}

function getBoostScore(player: PlayerRecord): number {
  return player.boostsActive ? 1 : 0;
}

export function calculateMatchScore(player: PlayerRecord, club: ClubRecord, config: MatchConfig = DEFAULT_CONFIG): MatchBreakdown {
  const positionScore = getPositionScore(player, club);
  const distanceScore = getDistanceScore(player, club);
  const levelScore = getLevelScore(player, club);
  const attributeScore = getAttributeScore(player);
  const availabilityScore = getAvailabilityScore(player);
  const boostScore = getBoostScore(player);

  const score = clamp(
    positionScore * config.positionWeight +
      distanceScore * config.distanceWeight +
      levelScore * config.levelWeight +
      attributeScore * config.attributesWeight +
      availabilityScore * config.availabilityWeight +
      boostScore * config.boostWeight,
  );

  return {
    positionScore,
    distanceScore,
    levelScore,
    attributeScore,
    availabilityScore,
    boostScore,
    score,
  };
}

export function buildMatchResult(player: PlayerRecord, club: ClubRecord, config: MatchConfig = DEFAULT_CONFIG): MatchResultRecord {
  const breakdown = calculateMatchScore(player, club, config);

  return {
    id: `${club.uid}_${player.uid}`,
    clubId: club.uid,
    playerId: player.uid,
    matchScore: breakdown.score,
    scoreBreakdown: {
      positionScore: breakdown.positionScore,
      distanceScore: breakdown.distanceScore,
      levelScore: breakdown.levelScore,
      attributeScore: breakdown.attributeScore,
      availabilityScore: breakdown.availabilityScore,
      boostScore: breakdown.boostScore,
    },
    position: player.positions?.[0] ?? 'unknown',
    ageBand: player.isYouth ? 'youth' : 'adult',
    region: player.region ?? club.region ?? 'unknown',
    searchable: player.searchable ?? false,
  };
}
