/** Server-enforced limits — the frontend limits are NOT the security mechanism. */
export declare const VIDEO_LIMITS: {
    maxClips: number;
    maxDurationSec: number;
    maxBytes: number;
    allowedMimeTypes: readonly ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
    allowedExtensions: readonly [".mp4", ".mov", ".webm", ".m4v"];
};
/**
 * Player requests upload permission. Validates ownership, clip count, youth
 * consent, and declared file metadata, then creates a `pending` playerVideos
 * doc plus the canonical Storage path the client may upload to.
 */
export declare const initiateVideoUpload: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    videoId: string;
    storagePath: string;
    maxBytes: number;
    maxDurationSec: number;
}>, unknown>;
