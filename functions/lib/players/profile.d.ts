export interface PlayerProfileLike {
    photoUrl?: string;
    positions?: string[];
    availability?: string[];
    playingLevel?: number;
    skillRatings?: Record<string, number>;
    physicalAttributes?: Record<string, number>;
    mentalAttributes?: Record<string, number>;
    playingHistory?: string;
    bio?: string;
    videoCount?: number;
    region?: string;
    currentClub?: string;
    previousClubs?: string[];
}
/**
 * Deterministic profile completeness (0-100). AI is never involved.
 * Weights deliberately mirror the product spec's priority ordering.
 */
export declare function computeProfileCompleteness(profile: PlayerProfileLike): number;
declare const PROFILE_FIELDS: Set<string>;
/** Player updates their own profile. Server recomputes completeness + enqueues recalc. */
export declare const updatePlayerProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    profileCompleteness: number;
}>, unknown>;
/** Server-side profile completeness recalculation trigger (defense in depth). */
export declare function recalcCompletenessForPlayer(uid: string): Promise<number>;
export { PROFILE_FIELDS };
