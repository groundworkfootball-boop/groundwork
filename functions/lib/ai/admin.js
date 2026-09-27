import { onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireAdminToken } from '../shared/authz.js';
import { getAIProvider } from './claude.js';
import { hashContent } from './provider.js';
/** Aggregated AI usage statistics for the admin dashboard. */
export const getAIUsageStats = onCall(async (request) => {
    requireAdminToken(request);
    const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000; // last 30 days
    const snap = await adminDb
        .collection('aiUsage')
        .where('timestamp', '>=', new Date(sinceMs))
        .limit(5000)
        .get();
    let totalCalls = 0;
    let cachedHits = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalCostUsd = 0;
    const purposeMap = new Map();
    let provider = 'unknown';
    for (const doc of snap.docs) {
        const d = doc.data();
        totalCalls += 1;
        if (d.cached === true)
            cachedHits += 1;
        promptTokens += Number(d.promptTokens ?? 0);
        completionTokens += Number(d.completionTokens ?? 0);
        totalCostUsd += Number(d.costUsd ?? 0);
        if (d.cached !== true && typeof d.provider === 'string')
            provider = d.provider;
        const purpose = String(d.purpose ?? 'unknown');
        const entry = purposeMap.get(purpose) ?? { calls: 0, costUsd: 0 };
        entry.calls += 1;
        entry.costUsd += Number(d.costUsd ?? 0);
        purposeMap.set(purpose, entry);
    }
    const stats = {
        totalCalls,
        cachedHits,
        cacheHitRate: totalCalls > 0 ? Math.round((cachedHits / totalCalls) * 1000) / 10 : 0,
        promptTokens,
        completionTokens,
        totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
        byPurpose: [...purposeMap.entries()]
            .map(([purpose, v]) => ({ purpose, calls: v.calls, costUsd: Math.round(v.costUsd * 10000) / 10000 }))
            .sort((a, b) => b.calls - a.calls),
        provider,
    };
    return stats;
});
/** Round-trip connectivity test for the configured AI provider. */
export const testAIConnection = onCall(async (request) => {
    requireAdminToken(request);
    const provider = getAIProvider();
    try {
        const { usage } = await provider.completeJSON({
            purpose: 'connection_test',
            systemPrompt: 'Reply with {"ok":true}.',
            systemPromptVersion: 'connection-test-v1',
            userPrompt: 'ping',
            maxTokens: 64,
            noCache: true,
        });
        return {
            ok: true,
            provider: provider.name,
            model: usage.model,
            latencyMs: null,
            cached: usage.cached,
        };
    }
    catch (err) {
        return {
            ok: false,
            provider: provider.name,
            error: err instanceof Error ? err.message.slice(0, 500) : 'Unknown error',
        };
    }
});
/** Invalidate cached AI responses (admin maintenance). */
export const clearAICache = onCall(async (request) => {
    const adminUid = requireAdminToken(request);
    const { prefix } = (request.data ?? {});
    const keyPrefix = typeof prefix === 'string' && prefix.length > 0 ? prefix.slice(0, 64) : null;
    let deleted = 0;
    if (keyPrefix) {
        // Deterministic keys start with the hex hash; a purpose prefix isn't part
        // of the key, so this path is used for targeted invalidation by hash.
        const ref = adminDb.collection('aiCache').doc(keyPrefix);
        const snap = await ref.get();
        if (snap.exists) {
            await ref.delete();
            deleted = 1;
        }
    }
    else {
        // Full flush: page through (max 400 docs per call to stay within limits).
        const snap = await adminDb.collection('aiCache').limit(400).get();
        const batch = adminDb.batch();
        for (const doc of snap.docs) {
            batch.delete(doc.ref);
            deleted += 1;
        }
        await batch.commit();
    }
    return { ok: true, deleted, requestedBy: adminUid, digest: hashContent({ prefix: keyPrefix ?? null }) };
});
