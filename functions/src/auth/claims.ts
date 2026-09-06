import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminAuth, adminDb } from '../shared/firebaseAdmin';

export const setUserRoleClaims = onCall(async (request) => {
  if (request.auth?.token.role !== 'admin' && request.auth?.token.isSuperAdmin !== true) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const { uid, role, extras } = request.data as { uid?: string; role?: string; extras?: Record<string, boolean> };
  if (!uid || !role) throw new HttpsError('invalid-argument', 'uid and role are required.');

  await adminAuth.setCustomUserClaims(uid, {
    role,
    ...(extras ?? {}),
  });

  await adminDb.collection('auditLogs').add({
    action: 'role_changed',
    resourceType: 'users',
    resourceId: uid,
    actorId: request.auth?.uid ?? 'system',
    actorRole: request.auth?.token.role ?? 'system',
    timestamp: new Date(),
    metadata: { role },
  });

  return { ok: true };
});
