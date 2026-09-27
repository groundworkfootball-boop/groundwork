import { MatchConfig } from '../shared/types.js';
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
/** Weighted attribute average (skills + physical + mental) clamped to 0-1. */
export declare function computeAttributeScore(player: MatchPlayer): number;
export declare function computePositionScore(player: MatchPlayer, club: MatchClub): number;
/** Deterministic distance decay based on club preferred radius (km). */
export declare function computeDistanceScore(player: MatchPlayer, club: MatchClub): number;
export declare function computeLevelScore(player: MatchPlayer, club: MatchClub): number;
export declare function computeAvailabilityScore(player: MatchPlayer, club: MatchClub): number;
export declare function computeBoostScore(player: MatchPlayer): number;
/**
 * Deterministic match score. Identical inputs ALWAYS produce identical outputs.
 * This is the ONLY sanctioned source of match scores — AI never reads or writes it.
 */
export declare function calculateMatchScore(player: MatchPlayer, club: MatchClub, config?: MatchConfig): ScoreBreakdown;
/** Rounds a score to a stable, comparable precision. */
export declare function roundScore(score: number): number;
