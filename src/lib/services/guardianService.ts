import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { queryWithSortFallback } from '../firestoreQuery';
import type { ConsentAuditRecord, GuardianRecord, PlayerRecord } from '../../app/types';

export async function getGuardianRecord(uid: string): Promise<GuardianRecord | null> {
  const snapshot = await getDoc(doc(db, 'guardians', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<GuardianRecord, 'id'>) };
}

export interface GuardianYouthProfile extends PlayerRecord {
  consentStatus: 'granted' | 'pending' | 'withdrawn';
}

import { PermissionDeniedError, isPermissionDenied } from '../errors';

/**
 * Youth profiles linked to a guardian email.
 *
 * Firestore rules permit this read only when the guardian's verified email
 * matches the profile's `guardianEmail` field. When the deployed ruleset is
 * older than the app (a real deployment-order hazard) the read is refused; we
 * surface that as a typed error so the dashboard can show a precise, actionable
 * message rather than a generic failure.
 */
export async function listGuardianYouth(guardianEmail: string): Promise<GuardianYouthProfile[]> {
  if (!guardianEmail) return [];
  try {
    const snapshot = await getDocs(
      query(collection(db, 'players'), where('guardianEmail', '==', guardianEmail), limit(20)),
    );
    return snapshot.docs.map((entry) => ({
      id: entry.id,
      ...(entry.data() as Omit<GuardianYouthProfile, 'id'>),
    }));
  } catch (err) {
    if (isPermissionDenied(err)) throw new PermissionDeniedError('players');
    throw err;
  }
}

export async function listGuardianConsentAudits(guardianId: string): Promise<ConsentAuditRecord[]> {
  try {
    return await queryWithSortFallback<ConsentAuditRecord>(
      (constraints) => query(collection(db, 'consentAudits'), where('guardianId', '==', guardianId), ...constraints),
      'timestamp',
      'desc',
      30,
      (id, data) => ({ id, ...data }) as ConsentAuditRecord,
    );
  } catch (err) {
    if (isPermissionDenied(err)) throw new PermissionDeniedError('consentAudits');
    throw err;
  }
}

export async function listGuardianNotifications(uid: string) {
  try {
    return await queryWithSortFallback<Record<string, unknown>>(
      (constraints) => query(collection(db, 'notifications'), where('userId', '==', uid), ...constraints),
      'createdAt',
      'desc',
      20,
      (id, data) => ({ id, ...data }),
    );
  } catch (err) {
    if (isPermissionDenied(err)) return [];
    throw err;
  }
}
