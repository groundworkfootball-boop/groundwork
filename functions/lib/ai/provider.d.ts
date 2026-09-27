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
export declare function hashContent(value: unknown): string;
/** Persist per-call usage for cost tracking / quotas. */
export declare function recordUsage(purpose: string, usage: AIUsage, meta?: Record<string, unknown>): Promise<void>;
/** Extract the first balanced JSON object/array from a model response. */
export declare function extractJSON<T>(text: string): T;
/**
 * Shared request pipeline: cache lookup → provider call → parse → cache write.
 */
export declare function runCachedJSON<T>(provider: AIProvider, req: AIRequest, invoke: () => Promise<{
    text: string;
    usage: Omit<AIUsage, 'cached'>;
}>): Promise<AIResult<T>>;
