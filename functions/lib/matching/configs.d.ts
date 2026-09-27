/**
 * Admin-only: create a new matching configuration version.
 * Validates that weights total 100% before persisting. Historical match
 * results keep their configVersion; recalculation is enqueued on request.
 */
export declare const updateMatchingConfig: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    error: string;
    issues: string[];
    data?: undefined;
    ok?: undefined;
    version?: undefined;
    weights?: undefined;
} | {
    error: string;
    data: Record<string, number>;
    issues?: undefined;
    ok?: undefined;
    version?: undefined;
    weights?: undefined;
} | {
    ok: boolean;
    version: number;
    weights: Record<string, number>;
    error?: undefined;
    issues?: undefined;
    data?: undefined;
}>, unknown>;
/** Get current + history for the admin matching config page. */
export declare const getMatchingConfigState: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    active: FirebaseFirestore.DocumentData | null | undefined;
    versions: {
        id: string;
    }[];
}>, unknown>;
