import { onCall } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireAdmin } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
import { validateWeightsSum, invalidateConfigCache, getActiveMatchConfig } from '../shared/config.js';
import { WEIGHT_KEYS } from '../shared/types.js';
import { recalcAll } from './queue.js';
const WEIGHT_KEYS_SET = new Set(WEIGHT_KEYS);
const schema = z.object({
    positionWeight: z.number().min(0).max(1),
    distanceWeight: z.number().min(0).max(1),
    levelWeight: z.number().min(0).max(1),
    attributesWeight: z.number().min(0).max(1),
    availabilityWeight: z.number().min(0).max(1),
    boostWeight: z.number().min(0).max(1),
    recalculate: z.boolean().default(true),
});
const normalizeWeight = (v) => Math.round(v * 10000) / 10000;
/**
 * Admin-only: create a new matching configuration version.
 * Validates that weights total 100% before persisting. Historical match
 * results keep their configVersion; recalculation is enqueued on request.
 */
export const updateMatchingConfig = onCall(async (request) => {
    const adminUid = await requireAdmin(request);
    const parsed = schema.safeParse(request.data ?? {});
    if (!parsed.success) {
        return { error: 'invalid weights', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
    }
    const weights = parsed.data;
    const inputs = {
        positionWeight: normalizeWeight(weights.positionWeight),
        distanceWeight: normalizeWeight(weights.distanceWeight),
        levelWeight: normalizeWeight(weights.levelWeight),
        attributesWeight: normalizeWeight(weights.attributesWeight),
        availabilityWeight: normalizeWeight(weights.availabilityWeight),
        boostWeight: normalizeWeight(weights.boostWeight),
    };
    if (!validateWeightsSum(inputs)) {
        return { error: 'weights must sum to 1.0 (100%)', data: inputs };
    }
    const current = await getActiveMatchConfig();
    const nextVersion = current.version + 1;
    const activeDoc = adminDb.collection('matchingConfigs').doc('default');
    const versionDoc = adminDb.collection('matchingConfigVersions').doc(String(nextVersion));
    await adminDb.runTransaction(async (tx) => {
        tx.set(activeDoc, { ...inputs, version: nextVersion, updatedAt: FieldValue.serverTimestamp(), updatedBy: adminUid }, { merge: true });
        tx.set(versionDoc, { ...inputs, version: nextVersion, createdAt: FieldValue.serverTimestamp(), createdBy: adminUid });
    });
    invalidateConfigCache();
    await writeAuditLog({
        action: 'matching_config_updated',
        resourceType: 'matchingConfigs',
        resourceId: String(nextVersion),
        actorId: adminUid,
        actorRole: 'admin',
        metadata: { weights: inputs, previousVersion: current.version },
    });
    if (parsed.data.recalculate) {
        // Fire-and-forget full recalculation; the admin API returns immediately.
        void recalcAll();
    }
    return { ok: true, version: nextVersion, weights: inputs };
});
/** Get current + history for the admin matching config page. */
export const getMatchingConfigState = onCall(async (request) => {
    await requireAdmin(request);
    const configSnap = await adminDb.collection('matchingConfigs').doc('default').get();
    const versions = await adminDb.collection('matchingConfigVersions').orderBy('createdAt', 'desc').limit(20).get();
    return {
        active: configSnap.exists ? configSnap.data() : null,
        versions: versions.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
});
