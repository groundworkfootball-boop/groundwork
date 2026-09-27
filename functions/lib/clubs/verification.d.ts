/**
 * Club updates its own profile. Verification / trust fields are stripped so a
 * club can never self-assign `verifiedYouth`, `verifiedAdult`, etc.
 */
export declare const updateClubProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    scoringChanged: boolean;
}>, unknown>;
export interface VerificationSubmission {
    documents?: Record<string, string>;
    notes?: string;
}
/**
 * Club submits verification documents for review. Moves verificationStatus to
 * `under_review` and records an immutable submission entry for admins.
 */
export declare const submitVerification: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    requestId: string;
}>, unknown>;
export interface VerificationReview {
    requestId: string;
    decision: 'approved' | 'rejected';
    rejectReason?: string;
    /** Grant youth verification on approval (with expiry epoch millis). */
    grantYouthVerification?: boolean;
    youthVerificationExpiresAtMs?: number;
}
/** Admin approves or rejects a club verification request. */
export declare const reviewVerification: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    clubId: string;
    decision: "approved" | "rejected";
}>, unknown>;
/** Admin suspends or reinstates a club (suspension removes it from matching). */
export declare const suspendClub: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    clubId: string;
    suspended: boolean;
}>, unknown>;
/**
 * Expire youth verifications whose expiry has passed. Runs on a schedule so an
 * expired club immediately loses access to youth players.
 */
export declare const expireYouthVerifications: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    expired: number;
}>, unknown>;
