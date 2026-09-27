import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireUid, requireAdmin } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';

async function requireVideoOwner(videoId: string, uid: string, isAdmin = false) {
  const snap = await adminDb.collection('playerVideos').doc(videoId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Video not found.');
  const video = snap.data()!;
  if (!isAdmin && video.playerId !== uid) {
    throw new HttpsError('permission-denied', 'You do not own this video.');
  }
  return { ref: snap.ref, video };
}

/** Publish / unpublish a clip (owner only, only when processing is ready). */
export const setVideoPublished = onCall(async (request) => {
  const uid = requireUid(request);
  const { videoId, published } = (request.data ?? {}) as {
    videoId?: unknown;
    published?: unknown;
  };
  if (typeof videoId !== 'string' || !videoId) {
    throw new HttpsError('invalid-argument', 'videoId is required.');
  }
  if (typeof published !== 'boolean') {
    throw new HttpsError('invalid-argument', 'published must be a boolean.');
  }

  const { ref, video } = await requireVideoOwner(videoId, uid);
  if (video.processingStatus !== 'ready') {
    throw new HttpsError('failed-precondition', 'Video is not ready yet.');
  }

  await ref.update({ published, updatedAt: FieldValue.serverTimestamp() });
  await writeAuditLog({
    action: published ? 'video_published' : 'video_unpublished',
    resourceType: 'playerVideos',
    resourceId: videoId,
    actorId: uid,
    actorRole: 'player',
  });
  return { published };
});

/**
 * Delete a clip: removes the playerVideos doc (marks deleted), deletes all
 * Storage objects, and removes the processing job.
 */
export const deleteVideo = onCall(async (request) => {
  const uid = requireUid(request);
  const { videoId } = (request.data ?? {}) as { videoId?: unknown };
  if (typeof videoId !== 'string' || !videoId) {
    throw new HttpsError('invalid-argument', 'videoId is required.');
  }

  const { ref, video } = await requireVideoOwner(videoId, uid);

  // Best-effort storage cleanup across raw + processed outputs.
  const bucket = getStorage().bucket();
  try {
    const [files] = await bucket.getFiles({ prefix: `videos/${video.playerId}/${videoId}/` });
    await Promise.all(files.map((f) => f.delete().catch(() => undefined)));
  } catch (err) {
    console.warn('storage cleanup failed for video', videoId, err);
  }

  await ref.update({
    processingStatus: 'deleted',
    published: false,
    url: '',
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection('videoProcessingJobs').doc(videoId).delete().catch(() => undefined);

  await writeAuditLog({
    action: 'video_deleted',
    resourceType: 'playerVideos',
    resourceId: videoId,
    actorId: uid,
    actorRole: 'player',
  });
  return { deleted: true };
});

/** Admin moderation: force-unpublish an inappropriate clip. */
export const moderateVideo = onCall(async (request) => {
  const adminUid = await requireAdmin(request, ['isModerator', 'isSafeguardingAdmin']);
  const { videoId, reason } = (request.data ?? {}) as {
    videoId?: unknown;
    reason?: unknown;
  };
  if (typeof videoId !== 'string' || !videoId) {
    throw new HttpsError('invalid-argument', 'videoId is required.');
  }
  const { ref } = await requireVideoOwner(videoId, adminUid, true);

  await ref.update({
    published: false,
    moderated: true,
    moderationReason: typeof reason === 'string' ? reason.slice(0, 500) : '',
    updatedAt: FieldValue.serverTimestamp(),
  });
  await writeAuditLog({
    action: 'video_moderated',
    resourceType: 'playerVideos',
    resourceId: videoId,
    actorId: adminUid,
    actorRole: 'admin',
    metadata: { reason: typeof reason === 'string' ? reason : '' },
  });
  return { moderated: true };
});
