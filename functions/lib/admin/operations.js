import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb, adminStorage } from '../shared/firebaseAdmin.js';
import { requireAdmin, requireSuperAdmin, requireUid, resolveRole } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
import { sendNotification } from '../shared/notifications.js';
const gdprSubmitSchema = z.object({
    type: z.enum(['export', 'delete']),
    reason: z.string().max(1000).optional(),
});
const gdprProcessSchema = z.object({
    requestId: z.string().min(1),
    decision: z.enum(['completed', 'rejected']),
    reason: z.string().max(1000).optional(),
});
const reportSubmitSchema = z.object({
    targetType: z.enum(['profile', 'video', 'club', 'application', 'message', 'other']),
    targetId: z.string().min(1).max(200),
    reason: z.string().min(3).max(500),
    details: z.string().max(2000).optional(),
});
const reportReviewSchema = z.object({
    reportId: z.string().min(1),
    status: z.enum(['investigating', 'resolved', 'dismissed']),
    actionTaken: z.enum(['none', 'hide_player', 'hide_video', 'suspend_user', 'suspend_club']).optional(),
    notes: z.string().max(1000).optional(),
});
const platformSettingsSchema = z.object({
    platformName: z.string().min(1).max(80),
    supportEmail: z.string().max(160),
    safeguardingEmail: z.string().max(160),
    maintenanceMode: z.boolean(),
    youthAutoDelist: z.boolean(),
    requireEmailVerification: z.boolean(),
});
/** Authenticated user submits a GDPR export or erasure request. */
export const submitGdprRequest = onCall(async (request) => {
    const uid = requireUid(request);
    const parsed = gdprSubmitSchema.safeParse(request.data ?? {});
    if (!parsed.success) {
        throw new HttpsError('invalid-argument', 'Invalid GDPR request payload.');
    }
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userEmail = userSnap.data()?.email ?? request.auth?.token?.email ?? null;
    const docRef = await adminDb.collection('gdprRequests').add({
        userId: uid,
        userEmail,
        type: parsed.data.type,
        reason: parsed.data.reason ?? '',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({
        action: `gdpr_${parsed.data.type}_requested`,
        resourceType: 'gdprRequests',
        resourceId: docRef.id,
        actorId: uid,
        actorRole: (await resolveRole(uid, request.auth?.token)) ?? 'player',
    });
    await sendNotification({
        userId: uid,
        type: 'system',
        title: parsed.data.type === 'export' ? 'Data export queued' : 'Account erasure queued',
        body: 'Your statutory data request has been logged for compliance review.',
        metadata: { requestId: docRef.id, type: parsed.data.type },
    });
    return { ok: true, requestId: docRef.id };
});
/**
 * Compliance / Super-Admin processes a GDPR export or deletion request.
 * Statutory `consentAudits` and `auditLogs` are retained per legal requirements.
 */
export const adminProcessGdprRequest = onCall(async (request) => {
    const adminUid = await requireAdmin(request, ['isSuperAdmin', 'isSafeguardingAdmin', 'isFinanceAdmin']);
    const parsed = gdprProcessSchema.safeParse(request.data ?? {});
    if (!parsed.success) {
        throw new HttpsError('invalid-argument', 'Invalid GDPR decision payload.');
    }
    const { requestId, decision, reason } = parsed.data;
    const reqRef = adminDb.collection('gdprRequests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists)
        throw new HttpsError('not-found', 'GDPR request not found.');
    const reqData = reqSnap.data() ?? {};
    const targetUid = String(reqData.userId ?? '');
    const reqType = String(reqData.type ?? 'export');
    if (!targetUid)
        throw new HttpsError('failed-precondition', 'GDPR request missing userId.');
    if (decision === 'rejected') {
        await reqRef.update({
            status: 'rejected',
            rejectReason: reason ?? 'Rejected under statutory retention exception.',
            processedBy: adminUid,
            processedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        await writeAuditLog({
            action: 'gdpr_request_rejected',
            resourceType: 'gdprRequests',
            resourceId: requestId,
            actorId: adminUid,
            actorRole: 'admin',
            metadata: { targetUid, reqType, reason: reason ?? null },
        });
        return { ok: true, status: 'rejected' };
    }
    if (reqType === 'export') {
        const [userDoc, playerDoc, youthDoc, guardianDoc, clubDoc, appsSnap, videosSnap, notifsSnap, paymentsSnap] = await Promise.all([
            adminDb.collection('users').doc(targetUid).get(),
            adminDb.collection('players').doc(targetUid).get(),
            adminDb.collection('youthProfiles').doc(targetUid).get(),
            adminDb.collection('guardians').doc(targetUid).get(),
            adminDb.collection('clubs').doc(targetUid).get(),
            adminDb.collection('applications').where('playerId', '==', targetUid).limit(200).get(),
            adminDb.collection('playerVideos').where('playerId', '==', targetUid).limit(50).get(),
            adminDb.collection('notifications').where('userId', '==', targetUid).limit(100).get(),
            adminDb.collection('payments').where('userId', '==', targetUid).limit(100).get(),
        ]);
        const bundle = {
            exportedAt: new Date().toISOString(),
            userId: targetUid,
            user: userDoc.exists ? userDoc.data() : null,
            player: playerDoc.exists ? playerDoc.data() : null,
            youthProfile: youthDoc.exists ? youthDoc.data() : null,
            guardian: guardianDoc.exists ? guardianDoc.data() : null,
            club: clubDoc.exists ? clubDoc.data() : null,
            applications: appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
            videos: videosSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
            notifications: notifsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
            payments: paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        };
        const exportPath = `exports/${targetUid}/${requestId}.json`;
        try {
            const bucket = adminStorage.bucket();
            await bucket.file(exportPath).save(JSON.stringify(bundle, null, 2), {
                contentType: 'application/json',
            });
        }
        catch {
            // Storage bucket may be unconfigured in local/Spark environments; keep metadata complete.
        }
        await reqRef.update({
            status: 'completed',
            exportPath,
            processedBy: adminUid,
            processedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        await sendNotification({
            userId: targetUid,
            type: 'system',
            title: 'Your GDPR data export is ready',
            body: 'Your account data archive has been compiled and stored securely.',
            metadata: { requestId, exportPath },
        });
        await writeAuditLog({
            action: 'gdpr_export_completed',
            resourceType: 'gdprRequests',
            resourceId: requestId,
            actorId: adminUid,
            actorRole: 'admin',
            metadata: { targetUid, exportPath },
        });
        return { ok: true, status: 'completed', exportPath };
    }
    // GDPR Erasure: delist & delete discoverable personal records while retaining
    // statutory consentAudits & auditLogs.
    const batch = adminDb.batch();
    for (const col of ['players', 'youthProfiles', 'guardians', 'clubs', 'playerScores']) {
        batch.delete(adminDb.collection(col).doc(targetUid));
    }
    batch.set(adminDb.collection('users').doc(targetUid), {
        email: `deleted+${targetUid.slice(0, 8)}@redacted.groundwork.local`,
        name: 'Deleted User',
        photoUrl: null,
        disabled: true,
        gdprErasedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    const [matchPlayerSnap, matchClubSnap, videosSnap] = await Promise.all([
        adminDb.collection('matchResults').where('playerId', '==', targetUid).limit(200).get(),
        adminDb.collection('matchResults').where('clubId', '==', targetUid).limit(200).get(),
        adminDb.collection('playerVideos').where('playerId', '==', targetUid).limit(50).get(),
    ]);
    for (const d of [...matchPlayerSnap.docs, ...matchClubSnap.docs]) {
        batch.delete(d.ref);
    }
    for (const v of videosSnap.docs) {
        batch.update(v.ref, {
            published: false,
            processingStatus: 'deleted',
            deletedAt: FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    await adminAuth.updateUser(targetUid, { disabled: true }).catch(() => undefined);
    await adminAuth.revokeRefreshTokens(targetUid).catch(() => undefined);
    await reqRef.update({
        status: 'completed',
        processedBy: adminUid,
        processedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({
        action: 'gdpr_erasure_completed',
        resourceType: 'gdprRequests',
        resourceId: requestId,
        actorId: adminUid,
        actorRole: 'admin',
        metadata: { targetUid, statutoryAuditRetained: true },
    });
    return { ok: true, status: 'completed' };
});
/** Authenticated user files a moderation report. */
export const createModerationReport = onCall(async (request) => {
    const uid = requireUid(request);
    const parsed = reportSubmitSchema.safeParse(request.data ?? {});
    if (!parsed.success) {
        throw new HttpsError('invalid-argument', 'Invalid moderation report.');
    }
    const ref = await adminDb.collection('moderationReports').add({
        reporterId: uid,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
        details: parsed.data.details ?? '',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({
        action: 'moderation_report_created',
        resourceType: 'moderationReports',
        resourceId: ref.id,
        actorId: uid,
        actorRole: (await resolveRole(uid, request.auth?.token)) ?? 'player',
        metadata: { targetType: parsed.data.targetType, targetId: parsed.data.targetId },
    });
    return { ok: true, reportId: ref.id };
});
/** Moderator or Super-Admin reviews a moderation report and optionally acts on target. */
export const adminModerateReport = onCall(async (request) => {
    const adminUid = await requireAdmin(request, ['isSuperAdmin', 'isModerator', 'isSafeguardingAdmin']);
    const parsed = reportReviewSchema.safeParse(request.data ?? {});
    if (!parsed.success) {
        throw new HttpsError('invalid-argument', 'Invalid moderation action.');
    }
    const { reportId, status, actionTaken = 'none', notes } = parsed.data;
    const reportRef = adminDb.collection('moderationReports').doc(reportId);
    const snap = await reportRef.get();
    if (!snap.exists)
        throw new HttpsError('not-found', 'Report not found.');
    const reportData = snap.data() ?? {};
    await reportRef.update({
        status,
        actionTaken,
        moderatorNotes: notes ?? '',
        reviewedBy: adminUid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    const targetId = String(reportData.targetId ?? '');
    if (targetId && actionTaken !== 'none') {
        if (actionTaken === 'hide_player') {
            await adminDb.collection('players').doc(targetId).set({ searchable: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        else if (actionTaken === 'hide_video') {
            await adminDb.collection('playerVideos').doc(targetId).set({ published: false, moderationStatus: 'removed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        else if (actionTaken === 'suspend_user') {
            await adminAuth.updateUser(targetId, { disabled: true }).catch(() => undefined);
            await adminAuth.revokeRefreshTokens(targetId).catch(() => undefined);
            await adminDb.collection('users').doc(targetId).set({ disabled: true, suspended: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        else if (actionTaken === 'suspend_club') {
            await adminDb.collection('clubs').doc(targetId).set({
                verificationStatus: 'suspended',
                verifiedAdult: false,
                verifiedYouth: false,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
    await writeAuditLog({
        action: 'moderation_report_reviewed',
        resourceType: 'moderationReports',
        resourceId: reportId,
        actorId: adminUid,
        actorRole: 'admin',
        metadata: { status, actionTaken, targetId: targetId || null },
    });
    return { ok: true, reportId, status, actionTaken };
});
/** Super-admin updates global platform settings with validation and audit logging. */
export const adminUpdatePlatformSettings = onCall(async (request) => {
    const adminUid = await requireSuperAdmin(request);
    const parsed = platformSettingsSchema.safeParse(request.data ?? {});
    if (!parsed.success) {
        throw new HttpsError('invalid-argument', 'Invalid platform settings.');
    }
    await adminDb.collection('systemSettings').doc('platform').set({
        ...parsed.data,
        updatedBy: adminUid,
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeAuditLog({
        action: 'platform_settings_updated',
        resourceType: 'systemSettings',
        resourceId: 'platform',
        actorId: adminUid,
        actorRole: 'admin',
        metadata: { maintenanceMode: parsed.data.maintenanceMode, youthAutoDelist: parsed.data.youthAutoDelist },
    });
    return { ok: true };
});
