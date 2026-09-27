import { onDocumentWritten, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { enqueueMatchJob, recalcClub, recalcPlayer, MatchJob } from './queue.js';
import { getActiveMatchConfig, invalidateConfigCache } from '../shared/config.js';

/** Fields that affect the deterministic score. Only these trigger recalculation. */
const SCORING_FIELDS = new Set([
  'positions',
  'region',
  'playingLevel',
  'profileCompleteness',
  'skillRatings',
  'physicalAttributes',
  'mentalAttributes',
  'availability',
  'trainingAvailability',
  'trialAvailability',
  'boostsActive',
  'searchable',
  'isYouth',
  'consentStatus',
]);

function hasScoringChange(after: Record<string, unknown>, before: Record<string, unknown>): boolean {
  for (const key of SCORING_FIELDS) {
    const beforeVal = JSON.stringify(before[key] ?? null);
    const afterVal = JSON.stringify(after[key] ?? null);
    if (beforeVal !== afterVal) return true;
  }
  return false;
}

/** Enqueue a recalculation when a player's scoring-relevant fields change. */
export const onPlayerProfileChanged = onDocumentWritten('players/{playerId}', async (event) => {
  const before = event.data?.before.data() ?? {};
  const after = event.data?.after.data() ?? {};
  if (!hasScoringChange(after, before)) return;
  await enqueueMatchJob('player', event.params.playerId);
});

/** Clean up match results when a player account is deleted. */
export const onPlayerDeleted = onDocumentDeleted('players/{playerId}', async (event) => {
  const { removePlayerMatchResults } = await import('./queue.js');
  await removePlayerMatchResults(event.params.playerId);
});

/** Enqueue a club-wide recalculation when a club's preferences change. */
export const onClubProfileChanged = onDocumentWritten('clubs/{clubId}', async (event) => {
  const before = event.data?.before.data() ?? {};
  const after = event.data?.after.data() ?? {};
  const clubScoringFields = new Set(['region', 'preferredRadiusKm', 'targetPositions', 'targetPlayingLevels', 'trainingAvailability', 'trialAvailability', 'verifiedYouth', 'youthVerificationExpiresAt']);
  const touched = [...clubScoringFields].some((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null));
  if (!touched) return;
  await enqueueMatchJob('club', event.params.clubId);
});

/**
 * Worker: processes enqueued matching jobs. A job is marked processing first;
 * if a newer job for the same entity exists, the stale run aborts early.
 */
export const onMatchJobCreated = onDocumentWritten('matchingJobs/{jobId}', async (event) => {
  const after = event.data?.after.data();
  if (!after) return;
  if (after.status !== 'pending') return;

  const job = after as MatchJob;
  await adminDb.collection('matchingJobs').doc(event.params.jobId).update({ status: 'processing', startedAt: FieldValue.serverTimestamp() });

  try {
    if (job.jobType === 'player' && job.playerId) {
      await recalcPlayer(job.playerId);
    } else if (job.jobType === 'club' && job.clubId) {
      await recalcClub(job.clubId);
    } else {
      throw new Error('Unknown matching job');
    }
    await adminDb.collection('matchingJobs').doc(event.params.jobId).update({ status: 'done', finishedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.error('Match job failed', event.params.jobId, err);
    const doc = await adminDb.collection('matchingJobs').doc(event.params.jobId).get();
    const attempts = Number(doc.data()?.attempts ?? 0) + 1;
    if (attempts >= 5) {
      await adminDb.collection('matchingJobs').doc(event.params.jobId).update({
        status: 'failed',
        attempts,
        error: String(err),
        finishedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await adminDb.collection('matchingJobs').doc(event.params.jobId).update({
        status: 'pending',
        attempts,
        error: String(err),
      });
    }
  }
});

/** When the active matching config changes, bump the version and recalc. */
export async function getCurrentConfigVersion(): Promise<number> {
  const config = await getActiveMatchConfig();
  return config.version;
}

export { invalidateConfigCache };
