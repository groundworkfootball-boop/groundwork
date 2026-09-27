import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebaseAdmin.js';

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
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  await adminDb.collection('auditLogs').add({
    ...entry,
    timestamp: FieldValue.serverTimestamp(),
    metadata: entry.metadata ?? {},
  });
}

export async function writeConsentAudit(entry: {
  youthId: string;
  guardianId: string;
  action: 'granted' | 'withdrawn' | 're-granted';
  hashedIp?: string;
  privacyNoticeVersion: string;
  source: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await adminDb.collection('consentAudit').add({
    youthId: entry.youthId,
    guardianId: entry.guardianId,
    action: entry.action,
    timestamp: FieldValue.serverTimestamp(),
    hashedIp: entry.hashedIp ?? '',
    privacyNoticeVersion: entry.privacyNoticeVersion,
    source: entry.source,
    metadata: entry.metadata ?? {},
  });
}