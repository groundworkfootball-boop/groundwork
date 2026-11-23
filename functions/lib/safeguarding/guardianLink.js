import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole, requireUid } from '../shared/authz.js';
import { writeAuditLog, writeConsentAudit } from '../shared/audit.js';
import { createNotification } from '../shared/notifications.js';
/**
 * Guardian ↔ youth linking and in-app consent.
 *
 * The email-token flow in safeguarding/consent.ts covers remote guardians. These
 * callables cover the signed-in guardian, and are the only path a browser can
 * use to change a youth's consent state — Firestore rules forbid guardians from
 * writing players/{uid} directly.
 */
const PRIVACY_NOTICE_VERSION = '2026.1-EN';
const linkSchema = z.object({
    childEmail: z.string().email().max(200),
    guardianEmail: z.string().email().max(200),
    guardianName: z.string().max(120).optional(),
    relationship: z.string().max(60).optional(),
});
const consentSchema = z.object({
    youthId: z.string().min(4).max(128),
    privacyNoticeVersion: z.string().max(40).optional(),
});
function normaliseEmail(value) {
    return value.trim().toLowerCase();
}
/** Guardian links an existing youth account to their portal. */
export const linkGuardianYouth = onCall(async (request) => {
    const uid = await requireRole(request, 'guardian');
    const parsed = linkSchema.safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'Please provide a valid player email.');
    const childEmail = normaliseEmail(parsed.data.childEmail);
    const tokenEmail = normaliseEmail(String(request.auth?.token.email ?? ''));
    // The signed-in guardian must own the email they claim — never trust a body field.
    if (tokenEmail && childEmail === tokenEmail) {
        throw new HttpsError('invalid-argument', 'A guardian cannot link their own account.');
    }
    const matches = await adminDb.collection('players').where('email', '==', childEmail).limit(1).get();
    if (matches.empty)
        throw new HttpsError('not-found', 'No player account found with that email address.');
    const playerDoc = matches.docs[0];
    const player = playerDoc.data();
    if (player.isYouth !== true) {
        throw new HttpsError('failed-precondition', 'That account is registered as an adult player. Ask an administrator to convert it to a youth profile.');
    }
    if (player.guardianId && player.guardianId !== uid) {
        throw new HttpsError('already-exists', 'That profile is already linked to a different guardian.');
    }
    const now = Date.now();
    await playerDoc.ref.set({
        guardianEmail: tokenEmail || parsed.data.guardianEmail,
        guardianId: uid,
        guardianName: parsed.data.guardianName ?? '',
        guardianRelationship: parsed.data.relationship ?? 'Parent',
        consentStatus: 'pending',
        searchable: false,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        consentInviteSentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
    }, { merge: true });
    await adminDb.collection('guardians').doc(uid).set({
        uid,
        email: tokenEmail,
        name: parsed.data.guardianName ?? '',
        linkedYouthIds: FieldValue.arrayUnion(playerDoc.id),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeAuditLog({
        action: 'guardian_youth_linked',
        resourceType: 'players',
        resourceId: playerDoc.id,
        actorId: uid,
        actorRole: 'guardian',
        metadata: { relationship: parsed.data.relationship ?? 'Parent' },
    });
    await createNotification({
        userId: playerDoc.id,
        type: 'guardian_consent',
        title: 'Guardian linked',
        body: 'Your guardian has linked your profile. It stays hidden until they approve consent.',
    });
    return { ok: true, youthId: playerDoc.id, name: player.name ?? 'your player', consentStatus: 'pending' };
});
/**
 * In-app consent grant. Mirrors the token flow: transaction updates the youth
 * record and the player projection, writes an immutable audit record, then
 * enqueues match recalculation.
 */
export const grantConsentInApp = onCall(async (request) => {
    const uid = await requireUid(request);
    const parsed = consentSchema.safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'A valid youth profile is required.');
    const youthId = parsed.data.youthId;
    const youthRef = adminDb.collection('youthProfiles').doc(youthId);
    const playerRef = adminDb.collection('players').doc(youthId);
    const playerSnap = await playerRef.get();
    if (!playerSnap.exists)
        throw new HttpsError('not-found', 'Youth profile not found.');
    const player = playerSnap.data() ?? {};
    const token = (request.auth?.token ?? {});
    const isAdmin = token.role === 'admin' || token.isSafeguardingAdmin === true;
    const tokenEmail = normaliseEmail(String(token.email ?? ''));
    const isLinkedGuardian = token.role === 'guardian' && tokenEmail && normaliseEmail(String(player.guardianEmail ?? '')) === tokenEmail;
    const isOwner = String(player.uid ?? '') === uid;
    if (!isLinkedGuardian && !isAdmin && !isOwner) {
        throw new HttpsError('permission-denied', 'Only the linked guardian can grant consent.');
    }
    if (player.isYouth !== true) {
        throw new HttpsError('failed-precondition', 'This profile is not a youth profile.');
    }
    const youthSnap = await youthRef.get();
    await adminDb.runTransaction(async (tx) => {
        if (youthSnap.exists) {
            tx.set(youthRef, {
                consentStatus: 'granted',
                consentGrantedAt: FieldValue.serverTimestamp(),
                privacyNoticeVersion: parsed.data.privacyNoticeVersion ?? PRIVACY_NOTICE_VERSION,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        tx.set(playerRef, {
            consentStatus: 'granted',
            searchable: true,
            consentGrantedAt: FieldValue.serverTimestamp(),
            privacyNoticeVersion: parsed.data.privacyNoticeVersion ?? PRIVACY_NOTICE_VERSION,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: Date.now(),
        }, { merge: true });
    });
    await writeConsentAudit({
        youthId,
        guardianId: uid,
        action: 'granted',
        hashedIp: request.rawRequest?.ip ? hashIp(request.rawRequest.ip) : '',
        privacyNoticeVersion: parsed.data.privacyNoticeVersion ?? PRIVACY_NOTICE_VERSION,
        source: 'guardian_portal_in_app',
    });
    const { enqueueMatchJob } = await import('../matching/queue.js');
    await enqueueMatchJob('player', youthId);
    await createNotification({
        userId: uid,
        type: 'guardian_consent',
        title: 'Consent granted',
        body: 'The youth profile can now appear in searches run by clubs with live youth verification.',
    });
    return { ok: true };
});
/** Adds a token to a youth account so the emailed portal link resolves. */
export const issueConsentToken = onCall(async (request) => {
    const uid = await requireUid(request);
    const parsed = consentSchema.safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'A valid youth profile is required.');
    const playerSnap = await adminDb.collection('players').doc(parsed.data.youthId).get();
    if (!playerSnap.exists)
        throw new HttpsError('not-found', 'Youth profile not found.');
    const player = playerSnap.data() ?? {};
    const token = (request.auth?.token ?? {});
    const tokenEmail = normaliseEmail(String(token.email ?? ''));
    const isAdmin = token.role === 'admin' || token.isSafeguardingAdmin === true;
    const isLinkedGuardian = Boolean(tokenEmail) && normaliseEmail(String(player.guardianEmail ?? '')) === tokenEmail;
    const isOwner = String(player.uid ?? '') === uid;
    if (!isLinkedGuardian && !isAdmin && !isOwner) {
        throw new HttpsError('permission-denied', 'You cannot manage this youth profile.');
    }
    const raw = randomBytes(32).toString('base64url');
    await adminDb.collection('consentTokens').doc(raw).set({
        youthId: parsed.data.youthId,
        guardianEmail: player.guardianEmail ?? tokenEmail,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return { ok: true, token: raw };
});
function hashIp(value) {
    let h = 0;
    for (let i = 0; i < value.length; i += 1)
        h = (h * 31 + value.charCodeAt(i)) & 0x7fffffff;
    return `h${h.toString(16)}`;
}
