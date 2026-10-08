import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireUid, HttpsError } from '../shared/authz.js';
import { writeConsentAudit, writeAuditLog } from '../shared/audit.js';
import { createNotification, sendEmail } from '../shared/notifications.js';
import { EMAIL_SCHEMA, NAME_SCHEMA } from '../shared/validation.js';
import { removePlayerMatchResults } from '../matching/queue.js';
export const PRIVACY_NOTICE_VERSION = '1.0';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const tokenSchema = z.object({ token: z.string().min(24).max(128) });
const inviteSchema = z.object({
    youthId: z.string().min(4).max(128),
    guardianName: NAME_SCHEMA.optional(),
    guardianEmail: EMAIL_SCHEMA.optional(),
    relationship: z.string().max(60).optional(),
});
function hash(value) {
    let h = 0;
    for (let i = 0; i < value.length; i++)
        h = (h * 31 + value.charCodeAt(i)) & 0x7fffffff;
    return `h${h.toString(16)}`;
}
const WEB = () => process.env.WEB_BASE_URL ?? 'https://groundwork.football';
/**
 * (Re)send the guardian consent invitation email for a youth profile.
 * Callable by the youth profile owner, the linked guardian, or a safeguarding admin.
 */
export const sendConsentInvite = onCall(async (request) => {
    requireUid(request);
    const parsed = inviteSchema.safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'Please provide a valid youth profile and guardian contact.');
    const { youthId, guardianName, guardianEmail, relationship } = parsed.data;
    const youthSnap = await adminDb.collection('youthProfiles').doc(youthId).get();
    if (!youthSnap.exists)
        throw new HttpsError('not-found', 'Youth profile not found.');
    const youth = youthSnap.data() ?? {};
    if (youth.consentStatus === 'granted')
        return { ok: true, alreadyGranted: true };
    const uid = request.auth.uid;
    const token = request.auth.token;
    const isOwner = youth.playerId === uid;
    const isLinkedGuardian = token.role === 'guardian' && youth.guardianEmail === token.email;
    const isAdmin = token.role === 'admin' || token.isSafeguardingAdmin === true;
    if (!isOwner && !isLinkedGuardian && !isAdmin) {
        throw new HttpsError('permission-denied', 'You cannot manage this youth profile.');
    }
    const email = guardianEmail ?? youth.guardianEmail;
    if (!email)
        throw new HttpsError('invalid-argument', 'A guardian email is required.');
    const rawToken = randomBytes(32).toString('base64url');
    await adminDb.collection('consentTokens').doc(rawToken).set({
        youthId,
        guardianEmail: email,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });
    const portalUrl = `${WEB()}/consent/${rawToken}`;
    const noticeUrl = `${WEB()}/safeguarding`;
    const displayName = guardianName ?? youth.guardianName ?? 'Guardian';
    try {
        await sendEmail({
            to: email,
            subject: 'GROUNDWORK: parental consent required for your young player',
            html: `<div style="background:#0b1121;padding:24px;border-radius:12px;font-family:Inter,sans-serif">
<h2 style="color:#fff">Parental / Guardian Consent</h2>
<p style="color:#cbd5e1">Hi ${displayName},</p>
<p style="color:#cbd5e1">A GROUNDWORK youth player profile has listed you as their guardian. Before this profile can appear in any club search, your consent is required.</p>
<p style="color:#cbd5e1">You can review our safeguarding policy first: <a href="${noticeUrl}">${noticeUrl}</a></p>
<p style="color:#cbd5e1">Then grant or decline consent here: <a href="${portalUrl}">${portalUrl}</a></p>
<p style="color:#94a3b8;font-size:12px">This link expires in 30 days. You may withdraw consent at any time afterwards.</p>
</div>`,
        });
    }
    catch (err) {
        console.warn('Consent invite email failed', err);
        throw new HttpsError('internal', 'The consent email could not be sent. Please try again.');
    }
    await adminDb.collection('youthProfiles').doc(youthId).update({
        guardianEmail: email,
        guardianName: guardianName ?? youth.guardianName ?? displayName,
        relationship: relationship ?? youth.relationship ?? '',
        consentInviteSentAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({
        action: 'consent_invite_sent',
        resourceType: 'youthProfiles',
        resourceId: youthId,
        actorId: uid,
        actorRole: token.role,
        metadata: { guardianEmailHashed: hash(email) },
    });
    return { ok: true, alreadyGranted: false };
});
/**
 * Guardian grants consent using the emailed token. Public portal — the caller
 * does NOT need to be signed in; the token itself is the authorization credential.
 */
async function executeGrantConsent(token, guardianId, clientIp) {
    const tokenSnap = await adminDb.collection('consentTokens').doc(token).get();
    if (!tokenSnap.exists)
        throw new HttpsError('not-found', 'This consent link is not valid.');
    const tokenRec = tokenSnap.data() ?? {};
    if (tokenRec.status !== 'pending')
        throw new HttpsError('already-exists', 'This consent link has already been used.');
    const expiresAt = tokenRec.expiresAt;
    const expiryMs = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt?.seconds ? expiresAt.seconds * 1000 : Number.NaN;
    if (!Number.isNaN(expiryMs) && expiryMs < Date.now()) {
        throw new HttpsError('deadline-exceeded', 'This consent link has expired. Request a new one.');
    }
    const youthId = String(tokenRec.youthId ?? '');
    const youthRef = adminDb.collection('youthProfiles').doc(youthId);
    const playerRef = adminDb.collection('players').doc(youthId);
    const tokenDocRef = adminDb.collection('consentTokens').doc(token);
    await adminDb.runTransaction(async (tx) => {
        const youthSnap = await tx.get(youthRef);
        if (!youthSnap.exists)
            throw new HttpsError('not-found', 'Youth profile not found.');
        const youth = youthSnap.data() ?? {};
        if (youth.consentStatus === 'granted')
            throw new HttpsError('already-exists', 'Consent is already granted.');
        tx.update(youthRef, {
            consentStatus: 'granted',
            consentGrantedAt: FieldValue.serverTimestamp(),
            consentGrantedByGuardianEmail: tokenRec.guardianEmail,
            privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
            updatedAt: FieldValue.serverTimestamp(),
        });
        tx.update(playerRef, {
            searchable: true,
            consentStatus: 'granted',
            updatedAtMs: Date.now(),
        });
        tx.update(tokenDocRef, { status: 'used', usedAt: FieldValue.serverTimestamp() });
    });
    await writeConsentAudit({
        youthId,
        guardianId: guardianId ?? '',
        action: 'granted',
        hashedIp: clientIp ? hash(clientIp) : '',
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        source: 'consent_token',
    });
    const { enqueueMatchJob } = await import('../matching/queue.js');
    await enqueueMatchJob('player', youthId);
    if (guardianId) {
        await createNotification({
            userId: guardianId,
            type: 'guardian_consent',
            title: 'Consent granted',
            body: 'Your consent for the youth profile is now active. The profile can now appear in searches for verified youth clubs.',
        });
    }
    return { ok: true, youthId };
}
/**
 * Guardian grants consent using the emailed token. Public portal — the caller
 * does NOT need to be signed in; the token itself is the authorization credential.
 */
export const grantConsent = onCall(async (request) => {
    const parsed = tokenSchema.safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'Invalid consent link.');
    return executeGrantConsent(parsed.data.token, request.auth?.uid, request.rawRequest?.ip);
});
/**
 * Guardian or safeguarding admin withdraws consent.
 * Delist immediately server-side: searchable=false, match results removed.
 */
export const withdrawConsent = onCall(async (request) => {
    const parsed = z.object({ youthId: z.string().min(4).max(128) }).safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'Invalid youth profile id.');
    const uid = request.auth?.uid;
    if (!uid)
        throw new HttpsError('unauthenticated', 'Please sign in to withdraw consent.');
    const youthSnap = await adminDb.collection('youthProfiles').doc(parsed.data.youthId).get();
    if (!youthSnap.exists)
        throw new HttpsError('not-found', 'Youth profile not found.');
    const youth = youthSnap.data() ?? {};
    const isGuardian = request.auth?.token.role === 'guardian';
    const isAdmin = request.auth?.token.role === 'admin' || request.auth?.token.isSafeguardingAdmin === true;
    const isLinkedGuardian = isGuardian && youth.guardianEmail === request.auth?.token.email;
    if (!isLinkedGuardian && !isAdmin) {
        throw new HttpsError('permission-denied', 'Only the linked guardian or a safeguarding admin can withdraw consent.');
    }
    const youthRef = adminDb.collection('youthProfiles').doc(parsed.data.youthId);
    const playerRef = adminDb.collection('players').doc(parsed.data.youthId);
    await adminDb.runTransaction(async (tx) => {
        tx.update(youthRef, {
            consentStatus: 'withdrawn',
            withdrawnAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        tx.update(playerRef, {
            searchable: false,
            consentStatus: 'withdrawn',
            updatedAtMs: Date.now(),
        });
    });
    await removePlayerMatchResults(parsed.data.youthId);
    await queueYouthMediaDeletion(parsed.data.youthId);
    await writeConsentAudit({
        youthId: parsed.data.youthId,
        guardianId: uid,
        action: 'withdrawn',
        hashedIp: request.rawRequest?.ip ? hash(request.rawRequest.ip) : '',
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        source: 'guardian_portal',
    });
    await createNotification({
        userId: uid,
        type: 'guardian_consent',
        title: 'Consent withdrawn',
        body: 'The youth profile is now hidden from all club searches and its media has been queued for deletion.',
    });
    return { ok: true };
});
export const reGrantConsent = onCall(async (request) => {
    const parsed = tokenSchema.safeParse(request.data ?? {});
    if (!parsed.success)
        throw new HttpsError('invalid-argument', 'Invalid consent link.');
    const res = await executeGrantConsent(parsed.data.token, request.auth?.uid, request.rawRequest?.ip);
    if (res.youthId) {
        await writeConsentAudit({
            youthId: res.youthId,
            guardianId: request.auth?.uid ?? '',
            action: 're-granted',
            hashedIp: request.rawRequest?.ip ? hash(request.rawRequest.ip) : '',
            privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
            source: 'guardian_portal',
        });
    }
    return { ok: true };
});
/** Queue all videos belonging to a youth for deletion (consent withdrawal). */
export async function queueYouthMediaDeletion(youthId) {
    const videos = await adminDb.collection('playerVideos').where('playerId', '==', youthId).get();
    const batch = adminDb.batch();
    for (const video of videos.docs) {
        batch.update(video.ref, { processingStatus: 'deleted', deletedReason: 'consent_withdrawn' });
    }
    await batch.commit();
}
/**
 * Defense-in-depth trigger attached to every youthProfiles write: if a
 * malicious client (or mismatched trigger) flips consent state directly, this
 * reconciles the players document, match results, and media visibility.
 */
export const onConsentChange = onDocumentWritten('youthProfiles/{youthId}', async (event) => {
    const after = event.data?.after.data() ?? {};
    const before = event.data?.before.data() ?? {};
    const status = after.consentStatus;
    if (status === 'granted' && before.consentStatus !== 'granted') {
        await adminDb.collection('players').doc(event.params.youthId).update({
            searchable: true,
            consentStatus: 'granted',
            updatedAtMs: Date.now(),
        });
        const { enqueueMatchJob } = await import('../matching/queue.js');
        await enqueueMatchJob('player', event.params.youthId);
        await writeAuditLog({ action: 'consent_granted', resourceType: 'youthProfiles', resourceId: event.params.youthId, actorId: 'system', actorRole: 'system' });
    }
    if (status === 'withdrawn' && before.consentStatus !== 'withdrawn') {
        await adminDb.collection('players').doc(event.params.youthId).update({
            searchable: false,
            consentStatus: 'withdrawn',
            updatedAtMs: Date.now(),
        });
        const { removePlayerMatchResults } = await import('../matching/queue.js');
        await removePlayerMatchResults(event.params.youthId);
        await queueYouthMediaDeletion(event.params.youthId);
        await writeAuditLog({
            action: 'consent_withdrawn',
            resourceType: 'youthProfiles',
            resourceId: event.params.youthId,
            actorId: 'system',
            actorRole: 'system',
            metadata: { searchable: false },
        });
    }
});
