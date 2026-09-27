import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole, requireAdminToken, requireUid } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
import { enqueueMatchJob } from '../matching/queue.js';
/** Fields a club may update on its own profile (never verification fields). */
const CLUB_PROFILE_FIELDS = [
    'name', 'region', 'country', 'badgeUrl', 'description', 'website',
    'foundedYear', 'league', 'groundName', 'contactEmail', 'contactPhone',
    'targetPositions', 'targetPlayingLevels', 'preferredRadiusKm',
    'trainingAvailability', 'trialAvailability', 'ageGroups', 'facilities',
];
/** Scoring-relevant club fields — when any change, matches must be recalculated. */
const SCORING_FIELDS = new Set([
    'region', 'preferredRadiusKm', 'targetPositions', 'targetPlayingLevels',
    'trainingAvailability', 'trialAvailability',
]);
/**
 * Club updates its own profile. Verification / trust fields are stripped so a
 * club can never self-assign `verifiedYouth`, `verifiedAdult`, etc.
 */
export const updateClubProfile = onCall(async (request) => {
    const uid = await requireRole(request, 'club');
    const input = (request.data ?? {});
    const updates = {};
    let scoringChanged = false;
    for (const key of CLUB_PROFILE_FIELDS) {
        if (key in input) {
            updates[key] = input[key];
            if (SCORING_FIELDS.has(key))
                scoringChanged = true;
        }
    }
    if (Object.keys(updates).length === 0) {
        throw new HttpsError('invalid-argument', 'No updatable fields supplied.');
    }
    updates.updatedAt = FieldValue.serverTimestamp();
    updates.updatedAtMs = Date.now();
    await adminDb.collection('clubs').doc(uid).update(updates);
    if (scoringChanged) {
        await enqueueMatchJob('club', uid);
    }
    await writeAuditLog({
        action: 'club_profile_updated',
        resourceType: 'clubs',
        resourceId: uid,
        actorId: uid,
        actorRole: 'club',
        metadata: { fields: Object.keys(updates) },
    });
    return { ok: true, scoringChanged };
});
/**
 * Club submits verification documents for review. Moves verificationStatus to
 * `under_review` and records an immutable submission entry for admins.
 */
export const submitVerification = onCall(async (request) => {
    const uid = await requireRole(request, 'club');
    const { documents, notes } = (request.data ?? {});
    const clubSnap = await adminDb.collection('clubs').doc(uid).get();
    if (!clubSnap.exists)
        throw new HttpsError('not-found', 'Club profile not found.');
    const club = clubSnap.data() ?? {};
    if (club.verificationStatus === 'approved') {
        throw new HttpsError('failed-precondition', 'Club is already verified.');
    }
    const docUrls = (documents && typeof documents === 'object'
        ? Object.fromEntries(Object.entries(documents).filter(([, v]) => typeof v === 'string' && v.length < 2048))
        : {});
    const submission = {
        clubId: uid,
        clubName: club.name ?? 'Unknown Club',
        documents: docUrls,
        notes: typeof notes === 'string' ? notes.slice(0, 2000) : '',
        status: 'pending',
        submittedAt: FieldValue.serverTimestamp(),
        submittedAtMs: Date.now(),
    };
    const submissionRef = await adminDb.collection('clubVerificationRequests').add(submission);
    await adminDb.collection('clubs').doc(uid).update({
        verificationStatus: 'under_review',
        verificationRequestId: submissionRef.id,
        updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({
        action: 'club_verification_submitted',
        resourceType: 'clubVerificationRequests',
        resourceId: submissionRef.id,
        actorId: uid,
        actorRole: 'club',
        metadata: { documentCount: Object.keys(docUrls).length },
    });
    return { ok: true, requestId: submissionRef.id };
});
/** Admin approves or rejects a club verification request. */
export const reviewVerification = onCall(async (request) => {
    const adminUid = requireAdminToken(request);
    const { requestId, decision, rejectReason, grantYouthVerification, youthVerificationExpiresAtMs } = (request.data ?? {});
    if (!requestId || typeof requestId !== 'string') {
        throw new HttpsError('invalid-argument', 'requestId is required.');
    }
    if (decision !== 'approved' && decision !== 'rejected') {
        throw new HttpsError('invalid-argument', 'decision must be approved or rejected.');
    }
    const reqRef = adminDb.collection('clubVerificationRequests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists)
        throw new HttpsError('not-found', 'Verification request not found.');
    const reqData = reqSnap.data() ?? {};
    if (reqData.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Request already reviewed.');
    }
    const clubId = String(reqData.clubId ?? '');
    if (!clubId)
        throw new HttpsError('failed-precondition', 'Request has no clubId.');
    const now = Date.now();
    const clubUpdates = {
        verificationStatus: decision === 'approved' ? 'approved' : 'rejected',
        verifiedAdult: decision === 'approved',
        reviewedBy: adminUid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
    };
    if (decision === 'rejected' && typeof rejectReason === 'string') {
        clubUpdates.verificationRejectReason = rejectReason.slice(0, 1000);
    }
    if (decision === 'approved' && grantYouthVerification === true) {
        const expiresAt = typeof youthVerificationExpiresAtMs === 'number' && youthVerificationExpiresAtMs > now
            ? youthVerificationExpiresAtMs
            : now + 365 * 24 * 60 * 60 * 1000; // default 1 year
        clubUpdates.verifiedYouth = true;
        clubUpdates.youthVerificationExpiresAt = new Date(expiresAt);
        clubUpdates.youthVerificationGrantedAtMs = now;
    }
    await adminDb.runTransaction(async (tx) => {
        tx.update(reqRef, {
            status: decision,
            reviewedBy: adminUid,
            reviewedAt: FieldValue.serverTimestamp(),
            rejectReason: decision === 'rejected' ? (rejectReason ?? '') : '',
        });
        tx.update(adminDb.collection('clubs').doc(clubId), clubUpdates);
    });
    // Youth verification state changed → recompute all matches for this club so
    // youth players are (de)listed immediately.
    await enqueueMatchJob('club', clubId);
    await writeAuditLog({
        action: `club_verification_${decision}`,
        resourceType: 'clubVerificationRequests',
        resourceId: requestId,
        actorId: adminUid,
        actorRole: 'admin',
        metadata: {
            clubId,
            grantYouthVerification: grantYouthVerification === true,
            hasYouthExpiry: 'youthVerificationExpiresAt' in clubUpdates,
        },
    });
    return { ok: true, clubId, decision };
});
/** Admin suspends or reinstates a club (suspension removes it from matching). */
export const suspendClub = onCall(async (request) => {
    const adminUid = requireAdminToken(request);
    const { clubId, suspend, reason } = (request.data ?? {});
    if (!clubId || typeof clubId !== 'string') {
        throw new HttpsError('invalid-argument', 'clubId is required.');
    }
    const clubSnap = await adminDb.collection('clubs').doc(clubId).get();
    if (!clubSnap.exists)
        throw new HttpsError('not-found', 'Club not found.');
    const suspended = suspend === true;
    await adminDb.collection('clubs').doc(clubId).update({
        verificationStatus: suspended ? 'suspended' : 'approved',
        verifiedAdult: !suspended,
        verifiedYouth: suspended ? false : (clubSnap.data()?.verifiedYouth ?? false),
        suspensionReason: suspended ? (reason ?? '').slice(0, 1000) : '',
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: Date.now(),
    });
    await enqueueMatchJob('club', clubId);
    await writeAuditLog({
        action: suspended ? 'club_suspended' : 'club_reinstated',
        resourceType: 'clubs',
        resourceId: clubId,
        actorId: adminUid,
        actorRole: 'admin',
        metadata: { reason: (reason ?? '').slice(0, 500) },
    });
    return { ok: true, clubId, suspended };
});
/**
 * Expire youth verifications whose expiry has passed. Runs on a schedule so an
 * expired club immediately loses access to youth players.
 */
export const expireYouthVerifications = onCall(async (request) => {
    requireUid(request); // must be authenticated; caller should be scheduler/admin
    const now = Date.now();
    const youthClubs = await adminDb
        .collection('clubs')
        .where('verifiedYouth', '==', true)
        .get();
    let count = 0;
    const batch = adminDb.batch();
    const expiredIds = [];
    for (const doc of youthClubs.docs) {
        const data = doc.data();
        const expiresAt = data.youthVerificationExpiresAt;
        if (!expiresAt)
            continue;
        const expiryMs = expiresAt instanceof Date
            ? expiresAt.getTime()
            : typeof expiresAt === 'object' && 'seconds' in expiresAt
                ? Number(expiresAt.seconds) * 1000
                : Number.NaN;
        if (!Number.isNaN(expiryMs) && expiryMs < now) {
            batch.update(doc.ref, {
                verifiedYouth: false,
                verificationStatus: 'expired',
                updatedAt: FieldValue.serverTimestamp(),
                updatedAtMs: now,
            });
            expiredIds.push(doc.id);
            count += 1;
        }
    }
    if (count > 0) {
        await batch.commit();
        for (const clubId of expiredIds) {
            await enqueueMatchJob('club', clubId);
        }
        await writeAuditLog({
            action: 'youth_verifications_expired',
            resourceType: 'clubs',
            actorId: 'system',
            actorRole: 'system',
            metadata: { count, clubIds: expiredIds },
        });
    }
    return { ok: true, expired: count };
});
