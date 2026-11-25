import { HttpsError } from 'firebase-functions/v2/https';
import { adminDb } from './firebaseAdmin.js';
/** Returns the authenticated uid or throws unauthenticated. */
export function requireUid(req) {
    const uid = req.auth?.uid;
    if (!uid)
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    return uid;
}
/**
 * Resolve the authoritative role for a uid.
 * Custom claims are authoritative; Firestore `users` is only consulted as a
 * fallback for non-privileged roles (`player`, `guardian`, `club`) and to
 * verify the account has not been disabled or suspended.
 */
export async function resolveRole(uid, token) {
    const snap = await adminDb.collection('users').doc(uid).get();
    if (snap.exists) {
        const data = snap.data();
        if (data?.disabled === true || data?.suspended === true) {
            throw new HttpsError('permission-denied', 'Your account is suspended.');
        }
    }
    const claimRole = token?.role;
    if (typeof claimRole === 'string' && ['player', 'guardian', 'club', 'admin'].includes(claimRole)) {
        return claimRole;
    }
    // Never elevate to `admin` from a Firestore document field alone.
    if (snap.exists) {
        const docRole = snap.data()?.role;
        if (typeof docRole === 'string' && ['player', 'guardian', 'club'].includes(docRole)) {
            return docRole;
        }
    }
    return null;
}
/** Throws unless the current user has the expected role and is active. */
export async function requireRole(req, role) {
    const uid = requireUid(req);
    const token = (req.auth?.token ?? {});
    const actual = await resolveRole(uid, token);
    if (actual !== role) {
        throw new HttpsError('permission-denied', `This action requires the ${role} role.`);
    }
    return uid;
}
/**
 * Throws unless the current user holds authoritative `admin` custom claims
 * and satisfies at least one allowed sub-role (with `isSuperAdmin` always allowed).
 */
export async function requireAdmin(req, allowedSubRoles = ['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin', 'isFinanceAdmin']) {
    const uid = requireUid(req);
    const token = (req.auth?.token ?? {});
    if (token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Authoritative admin custom claims required.');
    }
    const snap = await adminDb.collection('users').doc(uid).get();
    if (snap.exists) {
        const data = snap.data();
        if (data?.disabled === true || data?.suspended === true) {
            throw new HttpsError('permission-denied', 'Your admin account is disabled.');
        }
    }
    if (token.isSuperAdmin === true) {
        return uid;
    }
    if (allowedSubRoles.length > 0) {
        const hasSubRole = allowedSubRoles.some((key) => token[key] === true);
        if (!hasSubRole) {
            throw new HttpsError('permission-denied', `Insufficient admin privileges. Requires one of: ${allowedSubRoles.join(', ')}.`);
        }
    }
    return uid;
}
/** Throws unless the caller holds `isSuperAdmin === true` in custom claims. */
export async function requireSuperAdmin(req) {
    return requireAdmin(req, ['isSuperAdmin']);
}
/** Require admin using only the auth token (no extra Firestore read). */
export function requireAdminToken(req) {
    const uid = requireUid(req);
    if (req.auth?.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Admin access required.');
    }
    return uid;
}
/** Verify a club belongs to the current user. */
export async function requireClubOwner(req, clubId) {
    const uid = await requireRole(req, 'club');
    if (clubId !== uid) {
        throw new HttpsError('permission-denied', 'You do not own this club.');
    }
    return uid;
}
export { HttpsError };
/** Whether a youth profile may be processed (has explicit guardian consent). */
export async function hasYouthConsent(youthId) {
    const snap = await adminDb.collection('youthProfiles').doc(youthId).get();
    if (!snap.exists)
        return false;
    const data = snap.data();
    return data?.consentStatus === 'granted';
}
/** Whether a club is youth-verified and not expired right now. */
export async function isYouthVerifiedNow(clubId) {
    const snap = await adminDb.collection('clubs').doc(clubId).get();
    if (!snap.exists)
        return { verified: false, reason: 'club_not_found' };
    const club = snap.data();
    if (!club || club.verifiedYouth !== true || club.verificationStatus !== 'approved') {
        return { verified: false, reason: 'not_youth_verified' };
    }
    const expiresAt = club.youthVerificationExpiresAt;
    if (expiresAt) {
        const expiryMs = expiresAt instanceof Date
            ? expiresAt.getTime()
            : typeof expiresAt.seconds === 'number'
                ? expiresAt.seconds * 1000
                : Number.NaN;
        if (!Number.isNaN(expiryMs) && expiryMs < Date.now()) {
            return { verified: false, reason: 'verification_expired' };
        }
    }
    return { verified: true };
}
