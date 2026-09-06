import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
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

export async function getPlayerRecord(uid: string): Promise<PlayerRecord | null> {
  const snapshot = await getDoc(doc(db, 'players', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<PlayerRecord, 'id'>) };
}

export async function listPlayerApplications(uid: string): Promise<ApplicationItem[]> {
  const snapshot = await getDocs(
    query(collection(db, 'applications'), where('playerId', '==', uid), orderBy('createdAt', 'desc'), limit(20))
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) } as ApplicationItem));
}

export async function listPlayerNotifications(uid: string): Promise<NotificationItem[]> {
  const snapshot = await getDocs(
    query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20))
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) } as NotificationItem));
}
