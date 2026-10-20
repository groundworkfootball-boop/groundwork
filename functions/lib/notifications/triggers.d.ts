/**
 * When an application's status changes, notify the player.
 * (Clubs are notified on creation via the create trigger below.)
 */
export declare const onApplicationStatusChanged: import("firebase-functions").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    appId: string;
}>>;
/** Notify the club when a new application arrives. */
export declare const onApplicationCreated: import("firebase-functions").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    appId: string;
}>>;
/** Notify the player when a trial invitation/status changes. */
export declare const onTrialUpdated: import("firebase-functions").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    trialId: string;
}>>;
/**
 * Cancel outstanding matching jobs when a youth profile consent changes to
 * withdrawn (deferred execution safeguard).
 */
export declare const onConsentWithdrawnCancelJobs: import("firebase-functions").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    youthId: string;
}>>;
