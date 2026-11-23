/** Guardian links an existing youth account to their portal. */
export declare const linkGuardianYouth: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    youthId: string;
    name: string;
    consentStatus: string;
}>, unknown>;
/**
 * In-app consent grant. Mirrors the token flow: transaction updates the youth
 * record and the player projection, writes an immutable audit record, then
 * enqueues match recalculation.
 */
export declare const grantConsentInApp: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
/** Adds a token to a youth account so the emailed portal link resolves. */
export declare const issueConsentToken: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    token: string;
}>, unknown>;
