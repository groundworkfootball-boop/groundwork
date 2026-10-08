import { MatchConfig } from './types.js';
/** Reads the active matching config; falls back to defaults, never throws. */
export declare function getActiveMatchConfig(): Promise<MatchConfig>;
/** Forces the next read to hit Firestore (used after admin config changes). */
export declare function invalidateConfigCache(): void;
/** Ensure the six weights sum to exactly 1.0 (small drift tolerated). */
export declare function normalizeWeights(config: MatchConfig): number;
/** Validate that weights are sane and sum to 1.0 (±0.0001). */
export declare function validateWeightsSum(candidate: Record<string, number | undefined>): boolean;
/** Deletes the TTL-expired match result markers when a player is no longer eligible. */
export declare const MATCH_RESULT_MAX_TTL_DAYS = 30;
