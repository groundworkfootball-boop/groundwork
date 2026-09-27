import { HttpsError } from 'firebase-functions/v2/https';
import { adminDb } from './firebaseAdmin.js';
/** Resolve the authoritative role for a uid from the users collection + claims. */
export async function resolveRole(uid) {
    const snap = await adminDb.collection('users').doc(uid).get();
    if (!snap.exists())
        return null;
    const role = snap.data()?.role;
    return typeof role === 'string' ? role : null;
}
/** Returns the authenticated uid or throws permission-denied. */
export function requireUid(req) {
    const uid = req.auth?.uid;
    if (!uid)
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    return uid;
}
/** Throws unless the current user has the expected role. */
export async function requireRole(req, role) {
    const uid = requireUid(req);
    const actual = await resolveRole(uid);
    if (actual !== role) {
        throw new HttpsError('permission-denied', `This action requires the ${role} role.`);
    }
    return uid;
}
/** Throws unless the current user is an admin (with optional sub-roles). */
export async function requireAdmin(req, allowedSubRoles = ['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin', 'isFinanceAdmin']) {
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
    if (!snap.exists())
        return false;
    const data = snap.data();
    return data?.consentStatus === 'granted';
}
/** Whether a club is youth-verified and not expired right now. */
export async function isYouthVerifiedNow(clubId) {
    const snap = await adminDb.collection('clubs').doc(clubId).get();
    if (!snap.exists())
        return { verified: false, reason: 'club_not_found' };
    const club = snap.data();
    if (club.verifiedYouth !== true)
        return { verified: false, reason: 'not_youth_verified' };
    const expiresAt = club.youthVerificationExpiresAt;
    if (expiresAt) {
        const expiryMs = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt.seconds ? expiresAt.seconds * 1000 : Number.NaN;
        if (!Number.isNaN(expiryMs) && expiryMs < Date.now()) {
            return { verified: false, reason: 'verification_expired' };
        }
    }
    return { verified: true };
}
