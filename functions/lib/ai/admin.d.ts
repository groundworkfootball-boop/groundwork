export interface AIUsageStats {
    totalCalls: number;
    cachedHits: number;
    cacheHitRate: number;
    promptTokens: number;
    completionTokens: number;
    totalCostUsd: number;
    byPurpose: Array<{
        purpose: string;
        calls: number;
        costUsd: number;
    }>;
    provider: string;
}
/** Aggregated AI usage statistics for the admin dashboard. */
export declare const getAIUsageStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<AIUsageStats>, unknown>;
/** Round-trip connectivity test for the configured AI provider. */
export declare const testAIConnection: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    provider: string;
    model: string;
    latencyMs: null;
    cached: boolean;
    error?: undefined;
} | {
    ok: false;
    provider: string;
    error: string;
    model?: undefined;
    latencyMs?: undefined;
    cached?: undefined;
}>, unknown>;
/** Invalidate cached AI responses (admin maintenance). */
export declare const clearAICache: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    deleted: number;
    requestedBy: string;
    digest: string;
}>, unknown>;
