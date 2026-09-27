import { invalidateConfigCache } from '../shared/config.js';
/** Enqueue a recalculation when a player's scoring-relevant fields change. */
export declare const onPlayerProfileChanged: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    playerId: string;
}>>;
/** Clean up match results when a player account is deleted. */
export declare const onPlayerDeleted: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    playerId: string;
}>>;
/** Enqueue a club-wide recalculation when a club's preferences change. */
export declare const onClubProfileChanged: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    clubId: string;
}>>;
/**
 * Worker: processes enqueued matching jobs. A job is marked processing first;
 * if a newer job for the same entity exists, the stale run aborts early.
 */
export declare const onMatchJobCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    jobId: string;
}>>;
/** When the active matching config changes, bump the version and recalc. */
export declare function getCurrentConfigVersion(): Promise<number>;
export { invalidateConfigCache };
