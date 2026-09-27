import { onObjectFinalized, onObjectDeleted } from 'firebase-functions/v2/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '../shared/firebaseAdmin.js';
import { VIDEO_LIMITS } from './uploads.js';
const RAW_SEGMENT = '/raw';
/**
 * Storage trigger: a raw upload landed under videos/{uid}/{videoId}/raw*.
 * Re-validates size/format server-side, enqueues the (Cloud Run / worker
 * backed) processing job, and flips `processingStatus` to `processing`.
 */
export const onVideoRawUpload = onObjectFinalized({ region: 'europe-west1' }, async (event) => {
    const objectPath = event.data.name ?? '';
    if (!objectPath.startsWith('videos/'))
        return;
    if (!objectPath.includes(RAW_SEGMENT))
        return;
    // videos/{playerId}/{videoId}/raw.mp4
    const parts = objectPath.split('/');
    if (parts.length < 4)
        return;
    const [, playerId, videoId] = parts;
    const videoRef = adminDb.collection('playerVideos').doc(videoId);
    const snap = await videoRef.get();
    if (!snap.exists) {
        // Orphan upload — remove it.
        await getStorage().bucket().file(objectPath).delete().catch(() => undefined);
        return;
    }
    const video = snap.data();
    if (video.playerId !== playerId) {
        // Path/owner mismatch — never process it.
        await getStorage().bucket().file(objectPath).delete().catch(() => undefined);
        await videoRef.update({ processingStatus: 'failed', error: 'owner_mismatch' });
        return;
    }
    const size = Number(event.data.size ?? 0);
    if (size <= 0 || size > VIDEO_LIMITS.maxBytes) {
        await getStorage().bucket().file(objectPath).delete().catch(() => undefined);
        await videoRef.update({ processingStatus: 'failed', error: 'file_too_large' });
        return;
    }
    const contentType = event.data.contentType ?? '';
    if (contentType &&
        !VIDEO_LIMITS.allowedMimeTypes.includes(contentType)) {
        await getStorage().bucket().file(objectPath).delete().catch(() => undefined);
        await videoRef.update({ processingStatus: 'failed', error: 'unsupported_format' });
        return;
    }
    // Enqueue the heavy processing job for the worker (Cloud Run / FFmpeg).
    await adminDb.collection('videoProcessingJobs').doc(videoId).set({
        videoId,
        playerId,
        sourcePath: objectPath,
        status: 'pending',
        attempts: FieldValue.increment(1),
        createdAt: FieldValue.serverTimestamp(),
        updatedAtMs: Date.now(),
    }, { merge: true });
    await videoRef.update({
        processingStatus: 'processing',
        url: '',
        updatedAt: FieldValue.serverTimestamp(),
    });
});
/** Raw object deleted (e.g. consent withdrawal cascade) → mark deleted. */
export const onVideoObjectDeleted = onObjectDeleted({ region: 'europe-west1' }, async (event) => {
    const objectPath = event.data.name ?? '';
    if (!objectPath.startsWith('videos/'))
        return;
    const parts = objectPath.split('/');
    if (parts.length < 4)
        return;
    const videoId = parts[2];
    const videoRef = adminDb.collection('playerVideos').doc(videoId);
    const snap = await videoRef.get();
    if (!snap.exists)
        return;
    // Only mark fully deleted when no other storage objects remain for it.
    const bucket = getStorage().bucket();
    const [remaining] = await bucket.getFiles({ prefix: `videos/${parts[1]}/${videoId}/` });
    if (remaining.length === 0) {
        await videoRef.update({
            processingStatus: 'deleted',
            published: false,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }
});
/**
 * Called by the video-processing worker when FFmpeg validation/transcoding is
 * complete. Records duration/thumbnail, sets `processingStatus: ready`, and
 * points `url` at the optimized output.
 */
export const completeVideoProcessing = async (videoId, result) => {
    await adminDb.collection('playerVideos').doc(videoId).update({
        processingStatus: 'ready',
        url: result.playbackUrl,
        thumbnailUrl: result.thumbnailUrl ?? '',
        durationSec: result.durationSec ?? 0,
        updatedAt: FieldValue.serverTimestamp(),
    });
    await adminDb.collection('videoProcessingJobs').doc(videoId).set({ status: 'ready', updatedAtMs: Date.now() }, { merge: true });
};
