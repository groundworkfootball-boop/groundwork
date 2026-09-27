/** Publish / unpublish a clip (owner only, only when processing is ready). */
export declare const setVideoPublished: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    published: boolean;
}>, unknown>;
/**
 * Delete a clip: removes the playerVideos doc (marks deleted), deletes all
 * Storage objects, and removes the processing job.
 */
export declare const deleteVideo: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    deleted: boolean;
}>, unknown>;
/** Admin moderation: force-unpublish an inappropriate clip. */
export declare const moderateVideo: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    moderated: boolean;
}>, unknown>;
