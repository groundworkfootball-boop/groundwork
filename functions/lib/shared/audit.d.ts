export interface AuditEntry {
    action: string;
    resourceType: string;
    resourceId?: string;
    actorId?: string;
    actorRole?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Append-only audit log. Documents must never be mutated or deleted by any
 * client — the Firestore rules deny writes; this runs with Admin SDK.
 */
export declare function writeAuditLog(entry: AuditEntry): Promise<void>;
export declare function writeConsentAudit(entry: {
    youthId: string;
    guardianId: string;
    action: 'granted' | 'withdrawn' | 're-granted';
    hashedIp?: string;
    privacyNoticeVersion: string;
    source: string;
    metadata?: Record<string, unknown>;
}): Promise<void>;
