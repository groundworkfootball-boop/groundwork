import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { ClubRecord, MatchResultRecord } from '../../app/types';

export interface ClubApplicationItem {
  id: string;
  clubId?: string;
  playerId?: string;
  status?: string;
  playerName?: string;
  opportunityTitle?: string;
  createdAt?: { seconds: number };
  [key: string]: unknown;
}

export interface ClubOpportunityItem {
  id: string;
  clubId?: string;
  title?: string;
  position?: string;
  status?: string;
  region?: string;
  createdAt?: { seconds: number };
  [key: string]: unknown;
}

export async function getClubRecord(uid: string): Promise<ClubRecord | null> {
  const snapshot = await getDoc(doc(db, 'clubs', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<ClubRecord, 'id'>) };
}

export async function listClubMatches(uid: string): Promise<MatchResultRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, 'matchResults'), where('clubId', '==', uid), orderBy('matchScore', 'desc'), limit(50))
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<MatchResultRecord, 'id'>) }));
}

export async function listClubApplications(uid: string): Promise<ClubApplicationItem[]> {
  const snapshot = await getDocs(
    query(collection(db, 'applications'), where('clubId', '==', uid), orderBy('createdAt', 'desc'), limit(20))
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) } as ClubApplicationItem));
}

export async function listClubOpportunities(uid: string): Promise<ClubOpportunityItem[]> {
  const snapshot = await getDocs(
    query(collection(db, 'opportunities'), where('clubId', '==', uid), orderBy('createdAt', 'desc'), limit(20))
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) } as ClubOpportunityItem));
}
