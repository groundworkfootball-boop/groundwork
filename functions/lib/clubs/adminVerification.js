import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireAdminToken } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
import { enqueueMatchJob } from '../matching/queue.js';
const DEFAULT_YOUTH_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;
/**
 * Administrative club verification decision.
 *
 * Writes verification state (never client-writable), enqueues a match
 * recalculation so youth listings appear/disappear immediately, and records an
 * immutable audit entry.
 */
export const adminReviewClubVerification = onCall(async (request) => {
    const adminUid = requireAdminToken(request);
    const data = (request.data ?? {});
    const clubId = typeof data.clubId === 'string' ? data.clubId : '';
    const decision = data.decision === 'approved' || data.decision === 'rejected' ? data.decision : null;
    if (!clubId)
        throw new HttpsError('invalid-argument', 'clubId is required.');
    if (!decision)
        throw new HttpsError('invalid-argument', 'decision must be approved or rejected.');
    const clubRef = adminDb.collection('clubs').doc(clubId);
    const clubSnap = await clubRef.get();
    if (!clubSnap.exists)
        throw new HttpsError('not-found', 'Club not found.');
    const now = Date.now();
    const grantYouth = decision === 'approved' && data.grantYouthVerification === true;
    const updates = {
        verificationStatus: decision,
        verifiedAdult: decision === 'approved',
        verifiedYouth: grantYouth,
        verificationReviewedBy: adminUid,
        verificationReviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
    };
    if (grantYouth) {
        const requested = typeof data.youthVerificationExpiresAtMs === 'number' ? data.youthVerificationExpiresAtMs : 0;
        const expiresAtMs = requested > now ? requested : now + DEFAULT_YOUTH_VALIDITY_MS;
        updates.youthVerificationExpiresAt = new Date(expiresAtMs);
        updates.youthVerificationGrantedAtMs = now;
    }
    else {
        updates.youthVerificationExpiresAt = null;
    }
    if (decision === 'rejected') {
        updates.verificationRejectReason =
            typeof data.reason === 'string' ? data.reason.slice(0, 1000) : 'Documents did not meet requirements.';
    }
    await clubRef.update(updates);
    // Youth visibility changed → recompute this club's match results.
    await enqueueMatchJob('club', clubId);
    await writeAuditLog({
        action: `club_verification_${decision}`,
        resourceType: 'clubs',
        resourceId: clubId,
        actorId: adminUid,
        actorRole: 'admin',
        metadata: { grantYouthVerification: grantYouth },
    });
    return { ok: true, clubId, decision, verifiedYouth: grantYouth };
});
