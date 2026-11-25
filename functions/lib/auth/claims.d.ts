/**
 * Authoritative role + internal-flag assignment.
 * Only a super admin (`isSuperAdmin === true` in custom claims) may grant or
 * revoke admin roles or internal admin flags, preventing privilege escalation.
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
/**
 * Legacy-compatible role claim setter, now strictly locked to super-admins
 * and delegating the same privilege checks and token revocation.
 */
export declare const setUserRoleClaims: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
/**
 * Suspend or reinstate a user across Firebase Auth + Firestore.
 * Revokes refresh tokens and hides player profiles from search immediately.
 */
export declare const adminSuspendUser: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    uid: string;
    disabled: boolean;
}>, unknown>;
