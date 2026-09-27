/**
 * Storage trigger: a raw upload landed under videos/{uid}/{videoId}/raw*.
 * Re-validates size/format server-side, enqueues the (Cloud Run / worker
 * backed) processing job, and flips `processingStatus` to `processing`.
 */
export declare const onVideoRawUpload: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/storage").StorageEvent>;
/** Raw object deleted (e.g. consent withdrawal cascade) → mark deleted. */
export declare const onVideoObjectDeleted: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/storage").StorageEvent>;
/**
 * Called by the video-processing worker when FFmpeg validation/transcoding is
 * complete. Records duration/thumbnail, sets `processingStatus: ready`, and
 * points `url` at the optimized output.
 */
export declare const completeVideoProcessing: (videoId: string, result: {
    playbackUrl: string;
    thumbnailUrl?: string;
    durationSec?: number;
}) => Promise<void>;
