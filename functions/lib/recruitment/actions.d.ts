/**
 * Safeguarded messaging between authorized users.
 * Youth players cannot receive direct unapproved adult messages: if the target
 * is a minor, only a verified guardian or live youth-verified club with
 * active guardian consent can message, and conversations are flagged.
 */
export declare const sendSafeguardedMessage: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    conversationId: string;
    messageId: string;
}>, unknown>;
/** Player accepts or declines a scheduled trial invitation. */
export declare const respondToTrial: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    trialId: string;
    decision: "accepted" | "declined";
}>, unknown>;
