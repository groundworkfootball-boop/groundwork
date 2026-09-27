/**
 * Worker/player-facing callable: runs advisory AI tagging for a processed
 * clip. Requires the caller to own the video (or be the video worker token
 * holder — in practice the processing worker calls this with the player's
 * context via Admin SDK instead).
 */
export declare const tagVideoContent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    tags: string[];
    caption: string;
    advisoryOnly: true;
    usage: import("./provider.js").AIUsage;
}>, unknown>;
