import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminAuth, adminDb } from '../shared/firebaseAdmin.js';

const BASE_ROLES = ['player', 'guardian', 'club', 'admin'] as const;
const ADMIN_FLAGS = ['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin', 'isFinanceAdmin'] as const;

type BaseRole = (typeof BASE_ROLES)[number];
type AdminFlag = (typeof ADMIN_FLAGS)[number];

interface RoleUpdatePayload {
  uid?: string;
  role?: BaseRole;
  flags?: Partial<Record<AdminFlag, boolean>>;
  reason?: string;
}

function assertAdmin(request: { auth?: { token?: Record<string, unknown> } }): void {
  const token = (request.auth?.token ?? {}) as Record<string, unknown>;
  const isAdmin = token.role === 'admin' || token.isSuperAdmin === true;
  if (!isAdmin) throw new HttpsError('permission-denied', 'Admin access required.');
}

/**
 * Authoritative role + internal-flag assignment. Only a super admin may grant
 * or revoke admin-level flags, so a moderator cannot escalate themselves.
 */
export const adminSetUserRole = onCall(async (request) => {
  assertAdmin(request);

  const { uid, role, flags, reason } = (request.data ?? {}) as RoleUpdatePayload;
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required.');
  if (role && !BASE_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `Unknown role: ${role}`);
  }

  const callerToken = (request.auth?.token ?? {}) as Record<string, unknown>;
  const callerIsSuperAdmin = callerToken.isSuperAdmin === true;

  const requestedFlags = flags ?? {};
  const touchesAdminFlags = Object.keys(requestedFlags).length > 0;
  const grantsAdminRole = role === 'admin';

  if ((touchesAdminFlags || grantsAdminRole) && !callerIsSuperAdmin) {
    throw new HttpsError('permission-denied', 'Only a super admin can change administrative roles.');
  }

  if (uid === request.auth?.uid && role && role !== 'admin') {
    throw new HttpsError('failed-precondition', 'You cannot remove your own admin role.');
  }

  const userRecord = await adminAuth.getUser(uid).catch(() => null);
  if (!userRecord) throw new HttpsError('not-found', 'User not found.');

  const existing = (userRecord.customClaims ?? {}) as Record<string, unknown>;
  const nextClaims: Record<string, unknown> = { ...existing };

  if (role) nextClaims.role = role;
  for (const flag of ADMIN_FLAGS) {
    if (flag in requestedFlags) {
      if (requestedFlags[flag]) nextClaims[flag] = true;
      else delete nextClaims[flag];
    }
  }

  // Dropping the admin role must also drop every admin flag, otherwise a
  // demoted user would keep privileged access through a stale claim.
  if (role && role !== 'admin') {
    for (const flag of ADMIN_FLAGS) delete nextClaims[flag];
  }

  await adminAuth.setCustomUserClaims(uid, nextClaims);
  await adminAuth.revokeRefreshTokens(uid);

  await adminDb.collection('auditLogs').add({
    action: 'role_changed',
    resourceType: 'users',
    resourceId: uid,
    actorId: request.auth?.uid ?? 'system',
    actorRole: (callerToken.role as string) ?? 'system',
    timestamp: new Date(),
    metadata: {
      previousRole: existing.role ?? null,
      nextRole: nextClaims.role ?? null,
      previousFlags: ADMIN_FLAGS.filter((f) => existing[f] === true),
      nextFlags: ADMIN_FLAGS.filter((f) => nextClaims[f] === true),
      reason: reason ?? null,
    },
  });

  return { ok: true, claims: nextClaims };
});

/** Reads authoritative claims for a user so the admin UI never trusts Firestore. */
export const adminGetUserClaims = onCall(async (request) => {
  assertAdmin(request);
  const { uid } = (request.data ?? {}) as { uid?: string };
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required.');

  const userRecord = await adminAuth.getUser(uid).catch(() => null);
  if (!userRecord) throw new HttpsError('not-found', 'User not found.');

  const claims = (userRecord.customClaims ?? {}) as Record<string, unknown>;
  return {
    uid,
    role: (claims.role as string) ?? null,
    flags: Object.fromEntries(ADMIN_FLAGS.map((f) => [f, claims[f] === true])),
    disabled: userRecord.disabled,
  };
});

export const setUserRoleClaims = onCall(async (request) => {
  assertAdmin(request);

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

