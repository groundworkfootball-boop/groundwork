import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
/** SHA-256 content hash used for cache keys and idempotency. */
export function hashContent(value) {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function cacheKey(req) {
    return hashContent({
        sys: req.systemPromptVersion,
        sysPrompt: req.systemPrompt,
        user: req.userPrompt,
        schema: req.jsonSchema ?? null,
        purpose: req.purpose,
    });
}
/** Load a cached AI response if present and not expired (default 30 days). */
async function readCache(key) {
    const snap = await adminDb.collection('aiCache').doc(key).get();
    if (!snap.exists)
        return null;
    const data = snap.data();
    if (data.expiresAtMs && data.expiresAtMs < Date.now())
        return null;
    return {
        data: data.data,
        usage: {
            provider: data.usage?.provider ?? 'cache',
            model: data.usage?.model ?? 'cache',
            promptTokens: 0,
            completionTokens: 0,
            costUsd: 0,
            cached: true,
        },
    };
}
async function writeCache(key, data, usage, ttlDays = 30) {
    await adminDb.collection('aiCache').doc(key).set({
        data,
        usage,
        purpose: usage.model,
        expiresAtMs: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
        createdAt: FieldValue.serverTimestamp(),
    });
}
/** Persist per-call usage for cost tracking / quotas. */
export async function recordUsage(purpose, usage, meta) {
    await adminDb.collection('aiUsage').add({
        purpose,
        provider: usage.provider,
        model: usage.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        costUsd: usage.costUsd,
        cached: usage.cached,
        metadata: meta ?? {},
        timestamp: FieldValue.serverTimestamp(),
    });
}
/** Extract the first balanced JSON object/array from a model response. */
export function extractJSON(text) {
    const trimmed = text.trim();
    // Strip markdown fences if present.
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
    const candidate = fenced ? fenced[1].trim() : trimmed;
    const start = candidate.search(/[{[]/);
    if (start === -1)
        throw new Error('AI response contained no JSON.');
    const open = candidate[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < candidate.length; i++) {
        const ch = candidate[i];
        if (inString) {
            if (escaped)
                escaped = false;
            else if (ch === '\\')
                escaped = true;
            else if (ch === '"')
                inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === open) {
            depth += 1;
        }
        else if (ch === close) {
            depth -= 1;
            if (depth === 0) {
                return JSON.parse(candidate.slice(start, i + 1));
            }
        }
    }
    throw new Error('AI response contained unbalanced JSON.');
}
/**
 * Shared request pipeline: cache lookup → provider call → parse → cache write.
 */
export async function runCachedJSON(provider, req, invoke) {
    const key = cacheKey(req);
    if (!req.noCache) {
        const hit = await readCache(key);
        if (hit) {
            await recordUsage(req.purpose, hit.usage, { cacheHit: true });
            return { data: hit.data, usage: hit.usage };
        }
    }
    const { text, usage: rawUsage } = await invoke();
    const data = extractJSON(text);
    const usage = { ...rawUsage, cached: false };
    await writeCache(key, data, usage);
    await recordUsage(req.purpose, usage, { cacheHit: false });
    return { data, usage };
}
