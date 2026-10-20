import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { queryWithSortFallback } from '../firestoreQuery';
import type { VideoRecord } from '../../app/types';

/**
 * Player-owned video clips.
 * Firestore rules allow this read only for the owning player (or an admin).
 */
export async function listPlayerVideos(playerId: string, max = 30): Promise<VideoRecord[]> {
  return queryWithSortFallback<VideoRecord>(
    (constraints) => query(collection(db, 'playerVideos'), where('playerId', '==', playerId), ...constraints),
    'createdAt',
    'desc',
    max,
    (id, data) => ({ id, ...data }) as VideoRecord,
  );
}

export async function getVideo(videoId: string): Promise<VideoRecord | null> {
  const snapshot = await getDoc(doc(db, 'playerVideos', videoId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<VideoRecord, 'id'>) };
}

/**
 * Published, ready clips for a player — used by club-facing profile views.
 * Rules additionally require live club verification and, for youth clips,
 * granted consent.
 */
export async function listPublishedVideos(playerId: string, max = 12): Promise<VideoRecord[]> {
  const snapshot = await getDocs(
    query(
      collection(db, 'playerVideos'),
      where('playerId', '==', playerId),
      where('published', '==', true),
      where('processingStatus', '==', 'ready'),
      limit(max),
    ),
  );
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...(entry.data() as Omit<VideoRecord, 'id'>),
  }));
}
