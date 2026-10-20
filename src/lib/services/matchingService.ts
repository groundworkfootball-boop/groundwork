import { collection, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { queryWithSortFallback } from '../firestoreQuery';
import type { MatchResultRecord } from '../../app/types';

export interface PlayerMatchItem extends MatchResultRecord {
  clubName?: string;
  clubLogoUrl?: string;
}

/**
 * Reads precomputed match results for a player.
 * Scores are produced exclusively by the deterministic Cloud Function engine —
 * never calculated in the browser.
 */
export async function listPlayerMatches(playerId: string, max = 25): Promise<PlayerMatchItem[]> {
  return queryWithSortFallback<PlayerMatchItem>(
    (constraints) => query(collection(db, 'matchResults'), where('playerId', '==', playerId), ...constraints),
    'matchScore',
    'desc',
    max,
    (id, data) => ({ id, ...data }) as PlayerMatchItem,
  );
}

export async function getMatchResult(clubId: string, playerId: string): Promise<MatchResultRecord | null> {
  const snapshot = await getDoc(doc(db, 'matchResults', `${clubId}_${playerId}`));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<MatchResultRecord, 'id'>) };
}

export interface MatchingConfig {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
  version: number;
}

export async function getMatchingConfig(): Promise<MatchingConfig | null> {
  const snapshot = await getDoc(doc(db, 'matchingConfigs', 'default'));
  if (!snapshot.exists()) return null;
  return snapshot.data() as MatchingConfig;
}

