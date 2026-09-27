export interface AIRecommendation {
    playerId: string;
    displayName: string;
    headline: string;
    reasons: string[];
}
/** Read-only server-side recommendations for a club's top matches. */
export declare const getAIRecommendations: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    recommendations: AIRecommendation[];
    advisoryOnly: true;
    source: string;
}>, unknown>;
