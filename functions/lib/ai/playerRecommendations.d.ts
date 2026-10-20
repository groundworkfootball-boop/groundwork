export interface PlayerRecommendation {
    action: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}
export declare const getPlayerRecommendations: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    recommendations: PlayerRecommendation[];
    advisoryOnly: true;
    source: "blocked-consent";
} | {
    recommendations: PlayerRecommendation[];
    advisoryOnly: true;
    source: "cache";
} | {
    recommendations: PlayerRecommendation[];
    advisoryOnly: true;
    source: "generated";
}>, unknown>;
