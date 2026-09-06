import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { adminDb } from '../shared/firebaseAdmin';
import { calculateMatchResult } from './calculateMatchResult';

export const onPlayerProfileChanged = onDocumentWritten('players/{playerId}', async (event) => {
  const after = event.data?.after.data();
  if (!after) return;

  const clubs = await adminDb.collection('clubs').get();
  const writes = clubs.docs.map(async (clubDoc) => {
    const club = clubDoc.data() as { uid: string; region?: string; targetPositions?: string[]; targetPlayingLevels?: number[] };
    const result = calculateMatchResult(
      { uid: event.params.playerId, ...after },
      { uid: club.uid ?? clubDoc.id, ...club },
    );

    await adminDb.collection('matchResults').doc(`${club.uid ?? clubDoc.id}_${event.params.playerId}`).set(
      {
        clubId: club.uid ?? clubDoc.id,
        playerId: event.params.playerId,
        matchScore: result.matchScore,
        scoreBreakdown: result.scoreBreakdown,
        updatedAt: new Date(),
        calculationVersion: 1,
      },
      { merge: true },
    );
  });

  await Promise.all(writes);
});
