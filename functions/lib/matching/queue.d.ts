import { MatchPlayer, MatchClub } from './calculateMatchResult.js';
export type MatchJobType = 'player' | 'club';
export interface MatchJob {
    jobType: MatchJobType;
    playerId?: string;
    clubId?: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    attempts: number;
    createdAt?: unknown;
    error?: string;
}
/** Enqueue a scoring recalculation. Deduplicates identical pending jobs. */
export declare function enqueueMatchJob(jobType: MatchJobType, id: string): Promise<void>;
/**
 * Score ONE player against ONE club and store the match result.
 * Youth players are only scored against verified, non-expired clubs.
 */
export declare function scorePair(playerDoc: MatchPlayer, playerUpdatedAtMs: number, clubDoc: MatchClub & {
    verifiedYouth?: boolean;
    youthVerificationExpiresAt?: unknown;
}): Promise<void>;
/** Recompute one player against every eligible club (player profile change). */
export declare function recalcPlayer(playerId: string): Promise<{
    scored: number;
}>;
/** Recompute every player against a single club (club profile change / config change). */
export declare function recalcClub(clubId: string): Promise<{
    scored: number;
}>;
/** Remove all match results for a player (consent withdrawal, deletion). */
export declare function removePlayerMatchResults(playerId: string): Promise<void>;
/** Full sweep used after a matching config version change. */
export declare function recalcAll(): Promise<{
    scored: number;
}>;
