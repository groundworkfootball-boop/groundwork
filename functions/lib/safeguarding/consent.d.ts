export declare const PRIVACY_NOTICE_VERSION = "1.0";
/**
 * (Re)send the guardian consent invitation email for a youth profile.
 * Callable by the youth profile owner, the linked guardian, or a safeguarding admin.
 */
export declare const sendConsentInvite: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    alreadyGranted: boolean;
}>, unknown>;
/**
 * Guardian grants consent using the emailed token. Public portal — the caller
 * does NOT need to be signed in; the token itself is the authorization credential.
 */
export declare const grantConsent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    youthId: string;
}>, unknown>;
/**
 * Guardian or safeguarding admin withdraws consent.
 * Delist immediately server-side: searchable=false, match results removed.
 */
export declare const withdrawConsent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
export declare const reGrantConsent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
/** Queue all videos belonging to a youth for deletion (consent withdrawal). */
export declare function queueYouthMediaDeletion(youthId: string): Promise<void>;
/**
 * Defense-in-depth trigger attached to every youthProfiles write: if a
 * malicious client (or mismatched trigger) flips consent state directly, this
 * reconciles the players document, match results, and media visibility.
 */
export declare const onConsentChange: import("firebase-functions").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    youthId: string;
}>>;
