import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { GuardianRecord } from '../../app/types';

export async function getGuardianRecord(uid: string): Promise<GuardianRecord | null> {
  const snapshot = await getDoc(doc(db, 'guardians', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<GuardianRecord, 'id'>) };
}

export async function listGuardianNotifications(uid: string) {
  const snapshot = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) }));
}
