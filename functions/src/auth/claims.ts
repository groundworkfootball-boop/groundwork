import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../shared/firebaseAdmin.js';
import { requireAdmin, requireSuperAdmin } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';

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

/**
 * Authoritative role + internal-flag assignment.
 * Only a super admin (`isSuperAdmin === true` in custom claims) may grant or
 * revoke admin roles or internal admin flags, preventing privilege escalation.
 */
export const adminSetUserRole = onCall(async (request) => {
  const callerUid = await requireSuperAdmin(request);

  const { uid, role, flags, reason } = (request.data ?? {}) as RoleUpdatePayload;
  if (!uid || typeof uid !== 'string') throw new HttpsError('invalid-argument', 'uid is required.');
  if (role && !BASE_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `Unknown role: ${role}`);
  }

  if (uid === callerUid && role && role !== 'admin') {
    throw new HttpsError('failed-precondition', 'You cannot remove your own admin role.');
  }
  if (uid === callerUid && flags && flags.isSuperAdmin === false) {
    throw new HttpsError('failed-precondition', 'You cannot revoke your own super-admin privileges.');
  }

  const userRecord = await adminAuth.getUser(uid).catch(() => null);
  if (!userRecord) throw new HttpsError('not-found', 'User not found.');

  const existing = (userRecord.customClaims ?? {}) as Record<string, unknown>;
  const nextClaims: Record<string, unknown> = { ...existing };

  if (role) nextClaims.role = role;

  const requestedFlags = flags ?? {};
  for (const flag of ADMIN_FLAGS) {
    if (flag in requestedFlags) {
      if (requestedFlags[flag] === true) nextClaims[flag] = true;
      else delete nextClaims[flag];
    }
  }

  // Dropping the admin role must also drop every admin flag so a demoted user
  // cannot keep privileged access through a stale claim.
  if (role && role !== 'admin') {
    for (const flag of ADMIN_FLAGS) delete nextClaims[flag];
  }

  await adminAuth.setCustomUserClaims(uid, nextClaims);
  await adminAuth.revokeRefreshTokens(uid);

  const flagSync = Object.fromEntries(ADMIN_FLAGS.map((flag) => [flag, nextClaims[flag] === true]));
  await adminDb.collection('users').doc(uid).set(
    {
      role: nextClaims.role ?? 'player',
      ...flagSync,
      claimsVersion: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeAuditLog({
    action: 'role_changed',
    resourceType: 'users',
    resourceId: uid,
    actorId: callerUid,
    actorRole: 'admin',
    metadata: {
      previousRole: existing.role ?? null,
      nextRole: nextClaims.role ?? null,
      previousFlags: ADMIN_FLAGS.filter((f) => existing[f] === true),
      nextFlags: ADMIN_FLAGS.filter((f) => nextClaims[f] === true),
      reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
    },
  });

  return { ok: true, claims: nextClaims };
});

/** Reads authoritative claims for a user so the admin UI never trusts Firestore. */
export const adminGetUserClaims = onCall(async (request) => {
  await requireAdmin(request);
  const { uid } = (request.data ?? {}) as { uid?: string };
  if (!uid || typeof uid !== 'string') throw new HttpsError('invalid-argument', 'uid is required.');

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

/**
 * Legacy-compatible role claim setter, now strictly locked to super-admins
 * and delegating the same privilege checks and token revocation.
 */
export const setUserRoleClaims = onCall(async (request) => {
  const callerUid = await requireSuperAdmin(request);

  const { uid, role, extras } = (request.data ?? {}) as {
    uid?: string;
    role?: BaseRole;
    extras?: Record<string, boolean>;
  };
  if (!uid || !role || !BASE_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'Valid uid and role are required.');
  }
  if (uid === callerUid && role !== 'admin') {
    throw new HttpsError('failed-precondition', 'You cannot remove your own admin role.');
  }

  const nextClaims: Record<string, unknown> = { role };
  if (role === 'admin' && extras) {
    for (const flag of ADMIN_FLAGS) {
      if (extras[flag] === true) nextClaims[flag] = true;
    }
  }

  await adminAuth.setCustomUserClaims(uid, nextClaims);
  await adminAuth.revokeRefreshTokens(uid);

  await adminDb.collection('users').doc(uid).set(
    {
      role,
      ...Object.fromEntries(ADMIN_FLAGS.map((f) => [f, nextClaims[f] === true])),
      claimsVersion: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeAuditLog({
    action: 'role_changed',
    resourceType: 'users',
    resourceId: uid,
    actorId: callerUid,
    actorRole: 'admin',
    metadata: { role, flags: ADMIN_FLAGS.filter((f) => nextClaims[f] === true) },
  });

  return { ok: true };
});

/**
 * Suspend or reinstate a user across Firebase Auth + Firestore.
 * Revokes refresh tokens and hides player profiles from search immediately.
 */
export const adminSuspendUser = onCall(async (request) => {
  const callerUid = await requireAdmin(request, ['isSuperAdmin', 'isModerator']);
  const { uid, disabled, reason } = (request.data ?? {}) as {
    uid?: string;
    disabled?: boolean;
    reason?: string;
  };
  if (!uid || typeof uid !== 'string') throw new HttpsError('invalid-argument', 'uid is required.');
  if (typeof disabled !== 'boolean') throw new HttpsError('invalid-argument', 'disabled must be boolean.');
  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', 'You cannot suspend your own account.');
  }

  const target = await adminAuth.getUser(uid).catch(() => null);
  if (!target) throw new HttpsError('not-found', 'User not found.');

  const targetClaims = (target.customClaims ?? {}) as Record<string, unknown>;
  const callerIsSuper = request.auth?.token?.isSuperAdmin === true;
  if ((targetClaims.role === 'admin' || targetClaims.isSuperAdmin === true) && !callerIsSuper) {
    throw new HttpsError('permission-denied', 'Only a super admin can suspend an administrator.');
  }

  await adminAuth.updateUser(uid, { disabled });
  await adminAuth.revokeRefreshTokens(uid);

  await adminDb.collection('users').doc(uid).set(
    {
      disabled,
      suspended: disabled,
      suspensionReason: disabled ? String(reason ?? '').slice(0, 500) : null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (disabled) {
    const playerRef = adminDb.collection('players').doc(uid);
    const playerSnap = await playerRef.get();
    if (playerSnap.exists) {
      await playerRef.update({ searchable: false, suspended: true, updatedAt: FieldValue.serverTimestamp() });
    }
  } else {
    const playerRef = adminDb.collection('players').doc(uid);
    const playerSnap = await playerRef.get();
    if (playerSnap.exists) {
      await playerRef.update({ suspended: false, updatedAt: FieldValue.serverTimestamp() });
    }
  }

  await writeAuditLog({
    action: disabled ? 'user_suspended' : 'user_reinstated',
    resourceType: 'users',
    resourceId: uid,
    actorId: callerUid,
    actorRole: 'admin',
    metadata: { reason: typeof reason === 'string' ? reason.slice(0, 500) : null },
  });

  return { ok: true, uid, disabled };
});
