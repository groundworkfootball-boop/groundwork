/**
 * Administrative club verification decision.
 *
 * Writes verification state (never client-writable), enqueues a match
 * recalculation so youth listings appear/disappear immediately, and records an
 * immutable audit entry.
 */
export declare const adminReviewClubVerification: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    clubId: string;
    decision: string;
    verifiedYouth: boolean;
}>, unknown>;
