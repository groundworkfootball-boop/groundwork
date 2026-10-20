import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { queryWithSortFallback } from '../firestoreQuery';
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

export interface ClubMatchItem extends MatchResultRecord {
  playerName?: string;
}

export async function getClubRecord(uid: string): Promise<ClubRecord | null> {
  const snapshot = await getDoc(doc(db, 'clubs', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<ClubRecord, 'id'>) };
}

export async function listClubMatches(uid: string, max = 50): Promise<ClubMatchItem[]> {
  return queryWithSortFallback<ClubMatchItem>(
    (constraints) => query(collection(db, 'matchResults'), where('clubId', '==', uid), ...constraints),
    'matchScore',
    'desc',
    max,
    (id, data) => ({ id, ...data }) as ClubMatchItem,
  );
}

export async function listClubApplications(uid: string): Promise<ClubApplicationItem[]> {
  return queryWithSortFallback<ClubApplicationItem>(
    (constraints) => query(collection(db, 'applications'), where('clubId', '==', uid), ...constraints),
    'createdAt',
    'desc',
    20,
    (id, data) => ({ id, ...data }) as ClubApplicationItem,
  );
}

export async function listClubOpportunities(uid: string): Promise<ClubOpportunityItem[]> {
  return queryWithSortFallback<ClubOpportunityItem>(
    (constraints) => query(collection(db, 'opportunities'), where('clubId', '==', uid), ...constraints),
    'createdAt',
    'desc',
    20,
    (id, data) => ({ id, ...data }) as ClubOpportunityItem,
  );
}

export async function listClubSquad(clubId: string) {
  const snapshot = await getDocs(
    query(collection(db, 'squadMembers'), where('clubId', '==', clubId), limit(100)),
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) }));
}
