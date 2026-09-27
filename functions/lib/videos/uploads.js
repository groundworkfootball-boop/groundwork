import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireUid, hasYouthConsent } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
/** Server-enforced limits — the frontend limits are NOT the security mechanism. */
export const VIDEO_LIMITS = {
    maxClips: 10,
    maxDurationSec: 180,
    maxBytes: 100 * 1024 * 1024, // 100 MB
    allowedMimeTypes: [
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-m4v',
    ],
    allowedExtensions: ['.mp4', '.mov', '.webm', '.m4v'],
};
function extOf(filename) {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}
/**
 * Player requests upload permission. Validates ownership, clip count, youth
 * consent, and declared file metadata, then creates a `pending` playerVideos
 * doc plus the canonical Storage path the client may upload to.
 */
export const initiateVideoUpload = onCall(async (request) => {
    const uid = requireUid(request);
    const data = (request.data ?? {});
    const title = typeof data.title === 'string' ? data.title.trim().slice(0, 120) : '';
    const fileName = typeof data.fileName === 'string' ? data.fileName : '';
    const mimeType = typeof data.mimeType === 'string' ? data.mimeType : '';
    const sizeBytes = typeof data.sizeBytes === 'number' ? data.sizeBytes : 0;
    const durationSec = typeof data.durationSec === 'number' ? data.durationSec : 0;
    if (!title)
        throw new HttpsError('invalid-argument', 'A title is required.');
    if (!fileName)
        throw new HttpsError('invalid-argument', 'A file name is required.');
    if (!VIDEO_LIMITS.allowedMimeTypes.includes(mimeType)) {
        throw new HttpsError('invalid-argument', 'Unsupported video format.');
    }
    if (!VIDEO_LIMITS.allowedExtensions.includes(extOf(fileName))) {
        throw new HttpsError('invalid-argument', 'Unsupported file extension.');
    }
    if (sizeBytes <= 0 || sizeBytes > VIDEO_LIMITS.maxBytes) {
        throw new HttpsError('invalid-argument', 'File exceeds the maximum size of 100 MB.');
    }
    if (durationSec > VIDEO_LIMITS.maxDurationSec) {
        throw new HttpsError('invalid-argument', 'Clips must be 180 seconds or shorter.');
    }
    // Ownership / account-state checks.
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const role = userSnap.data()?.role;
    if (role !== 'player') {
        throw new HttpsError('permission-denied', 'Only player accounts can upload clips.');
    }
    // Youth consent gate: under-18 accounts require granted guardian consent.
    const youthSnap = await adminDb.collection('youthProfiles').doc(uid).get();
    if (youthSnap.exists && !(await hasYouthConsent(uid))) {
        throw new HttpsError('permission-denied', 'Guardian consent is required before uploading videos.');
    }
    // Clip count limit (only counting clips not yet deleted).
    const existing = await adminDb
        .collection('playerVideos')
        .where('playerId', '==', uid)
        .where('processingStatus', '!=', 'deleted')
        .limit(VIDEO_LIMITS.maxClips + 1)
        .get();
    if (existing.size >= VIDEO_LIMITS.maxClips) {
        throw new HttpsError('resource-exhausted', `You can store at most ${VIDEO_LIMITS.maxClips} clips.`);
    }
    const videoRef = adminDb.collection('playerVideos').doc();
    const storagePath = `videos/${uid}/${videoRef.id}/raw${extOf(fileName)}`;
    await videoRef.set({
        playerId: uid,
        title,
        url: '',
        storagePath,
        mimeType,
        sizeBytes,
        durationSec,
        processingStatus: 'pending',
        published: false,
        aiTags: [],
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: Date.now(),
    });
    await writeAuditLog({
        action: 'video_upload_initiated',
        resourceType: 'playerVideos',
        resourceId: videoRef.id,
        actorId: uid,
        actorRole: 'player',
        metadata: { sizeBytes, mimeType },
    });
    return {
        videoId: videoRef.id,
        storagePath,
        maxBytes: VIDEO_LIMITS.maxBytes,
        maxDurationSec: VIDEO_LIMITS.maxDurationSec,
    };
});
