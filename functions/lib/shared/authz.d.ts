import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import type { Role } from './types.js';
export interface AuthedRequest {
    auth?: {
        uid: string;
        token: Record<string, unknown>;
    } | null;
    data: unknown;
}
/** Resolve the authoritative role for a uid from the users collection + claims. */
export declare function resolveRole(uid: string): Promise<Role | null>;
/** Returns the authenticated uid or throws permission-denied. */
export declare function requireUid(req: Pick<CallableRequest, 'auth'>): string;
/** Throws unless the current user has the expected role. */
export declare function requireRole(req: Pick<CallableRequest, 'auth'>, role: Role): Promise<string>;
/** Throws unless the current user is an admin (with optional sub-roles). */
export declare function requireAdmin(req: Pick<CallableRequest, 'auth'>, allowedSubRoles?: string[]): Promise<string>;
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
