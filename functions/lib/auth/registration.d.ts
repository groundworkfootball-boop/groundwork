export interface AccountResult {
    uid: string;
    role: string;
    isYouth: boolean;
    clubCode?: string;
}
/** Server-side account registration. Admin accounts can never be created here. */
export declare const createAccount: import("firebase-functions/v2/https").CallableFunction<any, Promise<AccountResult>, unknown>;
/** Deterministic minor detection: under 18 on 31 Dec of the DOB year's Jan 1? Use exact date. */
export declare function isUnder18(dob: string): boolean;
/** Sync custom claims whenever the users/{uid} document is created. */
export declare const syncClaimsOnUserCreated: import("firebase-functions").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    userId: string;
}>>;
