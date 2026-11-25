/** Authenticated user submits a GDPR export or erasure request. */
export declare const submitGdprRequest: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    requestId: string;
}>, unknown>;
/**
 * Compliance / Super-Admin processes a GDPR export or deletion request.
 * Statutory `consentAudits` and `auditLogs` are retained per legal requirements.
 */
export declare const adminProcessGdprRequest: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    status: string;
    exportPath?: undefined;
} | {
    ok: boolean;
    status: string;
    exportPath: string;
}>, unknown>;
/** Authenticated user files a moderation report. */
export declare const createModerationReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    reportId: string;
}>, unknown>;
/** Moderator or Super-Admin reviews a moderation report and optionally acts on target. */
export declare const adminModerateReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    reportId: string;
    status: "investigating" | "resolved" | "dismissed";
    actionTaken: "none" | "hide_player" | "hide_video" | "suspend_user" | "suspend_club";
}>, unknown>;
/** Super-admin updates global platform settings with validation and audit logging. */
export declare const adminUpdatePlatformSettings: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
