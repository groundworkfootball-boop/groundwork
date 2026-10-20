/**
 * Authoritative role + internal-flag assignment. Only a super admin may grant
 * or revoke admin-level flags, so a moderator cannot escalate themselves.
 */
export declare const adminSetUserRole: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    claims: Record<string, unknown>;
}>, unknown>;
/** Reads authoritative claims for a user so the admin UI never trusts Firestore. */
export declare const adminGetUserClaims: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    uid: string;
    role: string;
    flags: {
        [k: string]: boolean;
    };
    disabled: boolean;
}>, unknown>;
export declare const setUserRoleClaims: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
