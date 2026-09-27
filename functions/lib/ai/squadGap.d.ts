export interface SquadGapInput {
    clubId?: string;
}
export interface SquadGapResult {
    gaps: Array<{
        position: string;
        severity: 'low' | 'medium' | 'high';
        note: string;
    }>;
    summary: string;
    advisoryOnly: true;
}
/**
 * AI squad gap analysis for a club's own squad. Reads only the caller's squad
 * data and returns advisory output — it never writes to match/score data.
 */
export declare const analyzeSquadGaps: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    advisoryOnly: true;
    squadSize: number;
    gaps: Array<{
        position: string;
        severity: "low" | "medium" | "high";
        note: string;
    }>;
    summary: string;
}>, unknown>;
