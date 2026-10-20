import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireAdminToken } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
import { enqueueMatchJob } from '../matching/queue.js';

interface VisibilityInput {
  playerId?: unknown;
  searchable?: unknown;
  reason?: unknown;
}

/**
 * Administrative player visibility toggle.
 *
 * `searchable` is a server-owned field: it is derived from consent for youth
 * players and must never be writable by the client. This callable is the only
 * sanctioned way for an administrator to override it, and it always audits.
 */
export const adminSetPlayerVisibility = onCall(async (request) => {
  const adminUid = requireAdminToken(request);
  const data = (request.data ?? {}) as VisibilityInput;

  const playerId = typeof data.playerId === 'string' ? data.playerId : '';
  if (!playerId) throw new HttpsError('invalid-argument', 'playerId is required.');
  if (typeof data.searchable !== 'boolean') {
    throw new HttpsError('invalid-argument', 'searchable must be a boolean.');
  }

  const playerRef = adminDb.collection('players').doc(playerId);
  const snap = await playerRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Player not found.');
  const player = snap.data() ?? {};

  // Safeguarding invariant: a youth profile can never be made searchable
  // without granted guardian consent, regardless of admin intent.
  if (data.searchable === true && player.isYouth === true && player.consentStatus !== 'granted') {
    throw new HttpsError(
      'failed-precondition',
      'Youth profiles cannot be made searchable without granted guardian consent.',
    );
  }

  await playerRef.update({
    searchable: data.searchable,
    visibilityUpdatedBy: adminUid,
    visibilityUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await enqueueMatchJob('player', playerId);

  await writeAuditLog({
    action: data.searchable ? 'player_visibility_enabled' : 'player_visibility_disabled',
    resourceType: 'players',
    resourceId: playerId,
    actorId: adminUid,
    actorRole: 'admin',
    metadata: { reason: typeof data.reason === 'string' ? data.reason.slice(0, 500) : '' },
  });

  return { ok: true, playerId, searchable: data.searchable };
});
