import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { queryWithSortFallback } from '../firestoreQuery';
import type { PlayerRecord } from '../../app/types';

export interface ApplicationItem {
  id: string;
  clubId?: string;
  playerId?: string;
  status?: string;
  clubName?: string;
  playerName?: string;
  opportunityTitle?: string;
  createdAt?: { seconds: number };
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  title?: string;
  body?: string;
  read?: boolean;
  createdAt?: { seconds: number };
  [key: string]: unknown;
}

export interface OpportunityItem {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  position?: string;
  region?: string;
  description?: string;
  status?: string;
  createdAt?: { seconds: number };
}

export async function getPlayerRecord(uid: string): Promise<PlayerRecord | null> {
  const snapshot = await getDoc(doc(db, 'players', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<PlayerRecord, 'id'>) };
}

export async function listPlayerApplications(uid: string): Promise<ApplicationItem[]> {
  return queryWithSortFallback<ApplicationItem>(
    (constraints) =>
      query(collection(db, 'applications'), where('playerId', '==', uid), ...constraints),
    'createdAt',
    'desc',
    20,
    (id, data) => ({ id, ...data }) as ApplicationItem,
  );
}

export async function listPlayerNotifications(uid: string): Promise<NotificationItem[]> {
  return queryWithSortFallback<NotificationItem>(
    (constraints) =>
      query(collection(db, 'notifications'), where('userId', '==', uid), ...constraints),
    'createdAt',
    'desc',
    20,
    (id, data) => ({ id, ...data }) as NotificationItem,
  );
}

export async function listOpenOpportunities(max = 30): Promise<OpportunityItem[]> {
  const snapshot = await getDocs(
    query(collection(db, 'opportunities'), where('status', '==', 'active'), limit(max)),
  );
  return snapshot.docs.map(
    (entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) }) as OpportunityItem,
  );
}

export interface SubmitApplicationInput {
  playerId: string;
  clubId: string;
  opportunityId: string;
  opportunityTitle: string;
  message?: string;
}

/**
 * Creates an application. Firestore rules enforce that playerId matches the
 * caller and that the initial status is 'submitted'.
 */
export async function submitApplication(input: SubmitApplicationInput): Promise<string> {
  const { addDoc, serverTimestamp } = await import('firebase/firestore');

  const existing = await getDocs(
    query(
      collection(db, 'applications'),
      where('playerId', '==', input.playerId),
      where('opportunityId', '==', input.opportunityId),
      limit(1),
    ),
  );
  if (!existing.empty) {
    throw new Error('You have already applied to this opportunity.');
  }

  const created = await addDoc(collection(db, 'applications'), {
    playerId: input.playerId,
    clubId: input.clubId,
    opportunityId: input.opportunityId,
    opportunityTitle: input.opportunityTitle,
    message: input.message ?? '',
    status: 'submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function withdrawApplication(applicationId: string): Promise<void> {
  const { updateDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'applications', applicationId), {
    status: 'withdrawn',
    updatedAt: serverTimestamp(),
  });
}
