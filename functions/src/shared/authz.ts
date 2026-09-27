import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { adminDb } from './firebaseAdmin.js';
import type { Role } from './types.js';

export interface AuthedRequest {
  auth?: {
    uid: string;
    token: Record<string, unknown>;
  } | null;
  data: unknown;
}

/** Resolve the authoritative role for a uid from the users collection + claims. */
export async function resolveRole(uid: string): Promise<Role | null> {
  const snap = await adminDb.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const role = snap.data()?.role as Role | undefined;
  return typeof role === 'string' ? role : null;
}

/** Returns the authenticated uid or throws permission-denied. */
export function requireUid(req: Pick<CallableRequest, 'auth'>): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  return uid;
}

/** Throws unless the current user has the expected role. */
export async function requireRole(req: Pick<CallableRequest, 'auth'>, role: Role): Promise<string> {
  const uid = requireUid(req);
  const actual = await resolveRole(uid);
  if (actual !== role) {
    throw new HttpsError('permission-denied', `This action requires the ${role} role.`);
  }
  return uid;
}

/** Throws unless the current user is an admin (with optional sub-roles). */
export async function requireAdmin(
  req: Pick<CallableRequest, 'auth'>,
  allowedSubRoles: string[] = ['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin', 'isFinanceAdmin'],
): Promise<string> {
  const uid = requireUid(req);
  const actual = await resolveRole(uid);
  if (actual !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  if (allowedSubRoles.length) {
    const token = req.auth?.token ?? {};
    const hasSubRole = allowedSubRoles.some((key) => token[key] === true);
    if (!hasSubRole) {
      // A plain admin without any sub-role flag is still allowed by default.
      const hasAnyFlag = allowedSubRoles.some((key) => token[key] === true);
      if (hasAnyFlag && !hasSubRole) {
        throw new HttpsError('permission-denied', 'Insufficient admin privileges.');
      }
    }
  }
  return uid;
}

/** Require admin using only the auth token (no extra Firestore read). */
export function requireAdminToken(req: Pick<CallableRequest, 'auth'>): string {
  const uid = requireUid(req);
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return uid;
}

/** Verify a club belongs to the current user. */
export async function requireClubOwner(req: Pick<CallableRequest, 'auth'>, clubId: string): Promise<string> {
  const uid = await requireRole(req, 'club');
  if (clubId !== uid) {
    throw new HttpsError('permission-denied', 'You do not own this club.');
  }
  return uid;
}

export { HttpsError };

/** Whether a youth profile may be processed (has explicit guardian consent). */
export async function hasYouthConsent(youthId: string): Promise<boolean> {
  const snap = await adminDb.collection('youthProfiles').doc(youthId).get();
  if (!snap.exists) return false;
  const data = snap.data();
  return data?.consentStatus === 'granted';
}

/** Whether a club is youth-verified and not expired right now. */
export async function isYouthVerifiedNow(clubId: string): Promise<{ verified: boolean; reason?: string }> {
  const snap = await adminDb.collection('clubs').doc(clubId).get();
  if (!snap.exists) return { verified: false, reason: 'club_not_found' };
  const club = snap.data();
  if (club.verifiedYouth !== true) return { verified: false, reason: 'not_youth_verified' };
  const expiresAt = club.youthVerificationExpiresAt;
  if (expiresAt) {
    const expiryMs = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt.seconds ? expiresAt.seconds * 1000 : Number.NaN;
    if (!Number.isNaN(expiryMs) && expiryMs < Date.now()) {
      return { verified: false, reason: 'verification_expired' };
    }
  }
  return { verified: true };
}