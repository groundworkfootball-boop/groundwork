import {
  MatchConfig,
  DEFAULT_MATCH_CONFIG,
  areAdjacentPositions,
  ALL_ATTRIBUTE_KEYS,
} from '../shared/types.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DETERMINISTIC MATCHING ENGINE (SYSTEM 1)
 * ─────────────────────────────────────────────────────────────────────────────
 * CRITICAL GUARANTEES:
 *   • Pure function — no side effects, no randomness, no time dependence.
 *   • No AI / LLM / external service involvement of any kind.
 *   • Reproducible: identical inputs ALWAYS produce identical outputs.
 * AI MUST NEVER call, wrap, or influence this module.
 */

export interface MatchPlayer {
  uid: string;
  positions?: string[];
  region?: string;
  playingLevel?: number;
  availability?: string[];
  trainingAvailability?: string[];
  trialAvailability?: string[];
  skillRatings?: Record<string, number>;
  physicalAttributes?: Record<string, number>;
  mentalAttributes?: Record<string, number>;
  profileCompleteness?: number;
  boostsActive?: boolean;
  searchable?: boolean;
  isYouth?: boolean;
}

export interface MatchClub {
  uid: string;
  region?: string;
  preferredRadiusKm?: number;
  targetPositions?: string[];
  targetPlayingLevels?: number[];
  targetAgeBand?: string;
  trainingAvailability?: string[];
  trialAvailability?: string[];
}

export interface ScoreBreakdown {
  positionScore: number;
  distanceScore: number;
  levelScore: number;
  attributeScore: number;
  availabilityScore: number;
  boostScore: number;
  score: number;
  configVersion: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function completenessAsScore(player: MatchPlayer): number {
  const raw = player.profileCompleteness;
  if (raw === undefined || raw === null || Number.isNaN(raw)) return 0.5;
  return clamp01(raw / 100);
}

/** Weighted attribute average (skills + physical + mental) clamped to 0-1. */
export function computeAttributeScore(player: MatchPlayer): number {
  const sources: number[] = [];
  const collect = (map?: Record<string, number>) => {
    if (!map) return;
    for (const key of ALL_ATTRIBUTE_KEYS) {
      const v = map[key];
      if (typeof v === 'number' && !Number.isNaN(v)) sources.push(clamp01(v / 10));
    }
  };
  collect(player.skillRatings);
  collect(player.physicalAttributes);
  collect(player.mentalAttributes);
  if (!sources.length) return completenessAsScore(player);
  return clamp01(average(sources));
}

export function computePositionScore(player: MatchPlayer, club: MatchClub): number {
  const playerPositions = (player.positions ?? []).filter(Boolean);
  const targetPositions = (club.targetPositions ?? []).filter(Boolean);
  if (!playerPositions.length || !targetPositions.length) return 0;

  if (playerPositions.some((p) => targetPositions.includes(p))) return 1;
  if (playerPositions.some((p) => targetPositions.some((t) => areAdjacentPositions(p, t)))) return 0.5;
  return 0;
}

/** Deterministic distance decay based on club preferred radius (km). */
export function computeDistanceScore(player: MatchPlayer, club: MatchClub): number {
  if (!player.region || !club.region) return 0.4;
  if (player.region === club.region) return 1;

  const radius = club.preferredRadiusKm;
  if (typeof radius !== 'number' || radius <= 0) return 0.35;
  return clamp01(0.85 - (radius / 500));
}

export function computeLevelScore(player: MatchPlayer, club: MatchClub): number {
  const playerLevel = player.playingLevel ?? 0;
  const targets = (club.targetPlayingLevels ?? []).filter((v) => typeof v === 'number');
  const targetLevel = average(targets.length ? targets : [playerLevel]);
  if (targetLevel <= 0) return 0.5;
  const diff = Math.abs(playerLevel - targetLevel);
  return clamp01(1 - diff / 10);
}

export function computeAvailabilityScore(player: MatchPlayer, club: MatchClub): number {
  const playerSlots = new Set([
    ...(player.availability ?? []),
    ...(player.trainingAvailability ?? []),
    ...(player.trialAvailability ?? []),
  ]);
  const clubSlots = new Set([
    ...(club.trainingAvailability ?? []),
    ...(club.trialAvailability ?? []),
  ]);

  if (!playerSlots.size) return 0;
  if (clubSlots.size === 0) {
    return playerSlots.size >= 2 ? 1 : 0.5;
  }
  const overlap = [...playerSlots].filter((slot) => clubSlots.has(slot)).length;
  return clamp01(overlap / Math.max(1, clubSlots.size));
}

export function computeBoostScore(player: MatchPlayer): number {
  return player.boostsActive ? 1 : 0;
}

/**
 * Deterministic match score. Identical inputs ALWAYS produce identical outputs.
 * This is the ONLY sanctioned source of match scores — AI never reads or writes it.
 */
export function calculateMatchScore(
  player: MatchPlayer,
  club: MatchClub,
  config: MatchConfig = DEFAULT_MATCH_CONFIG,
): ScoreBreakdown {
  const positionScore = computePositionScore(player, club);
  const distanceScore = computeDistanceScore(player, club);
  const levelScore = computeLevelScore(player, club);
  const attributeScore = computeAttributeScore(player);
  const availabilityScore = computeAvailabilityScore(player, club);
  const boostScore = computeBoostScore(player);

  const score = clamp01(
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
    configVersion: config.version,
  };
}

/** Rounds a score to a stable, comparable precision. */
export function roundScore(score: number): number {
  return Math.round(score * 10000) / 10000;
}
