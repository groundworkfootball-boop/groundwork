import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';

/**
 * AI provider abstraction.
 *
 * IMPORTANT PRODUCT INVARIANT: AI output is advisory only. Nothing in this
 * module may ever read or write `matchResults`, `playerScores`, or any field
 * consumed by the deterministic matching engine.
 */

export interface AIUsage {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  cached: boolean;
}

export interface AIRequest {
  /** Human-readable purpose, recorded in usage logs. */
  purpose: string;
  systemPrompt: string;
  /** Bump when the prompt changes so caches invalidate. */
  systemPromptVersion: string;
  userPrompt: string;
  /** Optional JSON schema hint sent to capable providers. */
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  /** Skip cache read (force fresh generation). */
  noCache?: boolean;
}

export interface AIResult<T> {
  data: T;
  usage: AIUsage;
}

export interface AIProvider {
  readonly name: string;
  readonly models: Record<string, string>;
  completeJSON<T>(req: AIRequest): Promise<AIResult<T>>;
}

/** SHA-256 content hash used for cache keys and idempotency. */
export function hashContent(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function cacheKey(req: AIRequest): string {
  return hashContent({
    sys: req.systemPromptVersion,
    sysPrompt: req.systemPrompt,
    user: req.userPrompt,
    schema: req.jsonSchema ?? null,
    purpose: req.purpose,
  });
}

/** Load a cached AI response if present and not expired (default 30 days). */
async function readCache<T>(key: string): Promise<{ data: T; usage: AIUsage } | null> {
  const snap = await adminDb.collection('aiCache').doc(key).get();
  if (!snap.exists) return null;
  const data = snap.data() as { data: T; usage?: Partial<AIUsage>; expiresAtMs?: number };
  if (data.expiresAtMs && data.expiresAtMs < Date.now()) return null;
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

async function writeCache<T>(key: string, data: T, usage: AIUsage, ttlDays = 30): Promise<void> {
  await adminDb.collection('aiCache').doc(key).set({
    data,
    usage,
    purpose: usage.model,
    expiresAtMs: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Persist per-call usage for cost tracking / quotas. */
export async function recordUsage(
  purpose: string,
  usage: AIUsage,
  meta?: Record<string, unknown>,
): Promise<void> {
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
export function extractJSON<T>(text: string): T {
  const trimmed = text.trim();
  // Strip markdown fences if present.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  const start = candidate.search(/[{[]/);
  if (start === -1) throw new Error('AI response contained no JSON.');
  const open = candidate[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) {
      depth += 1;
    } else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(candidate.slice(start, i + 1)) as T;
      }
    }
  }
  throw new Error('AI response contained unbalanced JSON.');
}

/**
 * Shared request pipeline: cache lookup → provider call → parse → cache write.
 */
export async function runCachedJSON<T>(
  provider: AIProvider,
  req: AIRequest,
  invoke: () => Promise<{ text: string; usage: Omit<AIUsage, 'cached'> }>,
): Promise<AIResult<T>> {
  const key = cacheKey(req);
  if (!req.noCache) {
    const hit = await readCache<T>(key);
    if (hit) {
      await recordUsage(req.purpose, hit.usage, { cacheHit: true });
      return { data: hit.data, usage: hit.usage };
    }
  }

  const { text, usage: rawUsage } = await invoke();
  const data = extractJSON<T>(text);
  const usage: AIUsage = { ...rawUsage, cached: false };
  await writeCache(key, data, usage);
  await recordUsage(req.purpose, usage, { cacheHit: false });
  return { data, usage };
}
