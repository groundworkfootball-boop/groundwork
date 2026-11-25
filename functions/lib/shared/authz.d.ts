import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import type { Role } from './types.js';
export interface AuthedRequest {
    auth?: {
        uid: string;
        token: Record<string, unknown>;
    } | null;
    data: unknown;
}
export type AdminSubRole = 'isSuperAdmin' | 'isModerator' | 'isSafeguardingAdmin' | 'isFinanceAdmin';
/** Returns the authenticated uid or throws unauthenticated. */
export declare function requireUid(req: Pick<CallableRequest, 'auth'>): string;
/**
 * Resolve the authoritative role for a uid.
 * Custom claims are authoritative; Firestore `users` is only consulted as a
 * fallback for non-privileged roles (`player`, `guardian`, `club`) and to
 * verify the account has not been disabled or suspended.
 */
export declare function resolveRole(uid: string, token?: Record<string, unknown>): Promise<Role | null>;
/** Throws unless the current user has the expected role and is active. */
export declare function requireRole(req: Pick<CallableRequest, 'auth'>, role: Role): Promise<string>;
/**
 * Throws unless the current user holds authoritative `admin` custom claims
 * and satisfies at least one allowed sub-role (with `isSuperAdmin` always allowed).
 */
export declare function requireAdmin(req: Pick<CallableRequest, 'auth'>, allowedSubRoles?: AdminSubRole[]): Promise<string>;
/** Throws unless the caller holds `isSuperAdmin === true` in custom claims. */
export declare function requireSuperAdmin(req: Pick<CallableRequest, 'auth'>): Promise<string>;
/** Require admin using only the auth token (no extra Firestore read). */
export declare function requireAdminToken(req: Pick<CallableRequest, 'auth'>): string;
/** Verify a club belongs to the current user. */
export declare function requireClubOwner(req: Pick<CallableRequest, 'auth'>, clubId: string): Promise<string>;
export { HttpsError };
/** Whether a youth profile may be processed (has explicit guardian consent). */
export declare function hasYouthConsent(youthId: string): Promise<boolean>;
/** Whether a club is youth-verified and not expired right now. */
export declare function isYouthVerifiedNow(clubId: string): Promise<{
    verified: boolean;
    reason?: string;
}>;
