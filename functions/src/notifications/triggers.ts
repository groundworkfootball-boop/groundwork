import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { createNotification } from '../shared/notifications.js';
import { writeAuditLog } from '../shared/audit.js';

/**
 * When an application's status changes, notify the player.
 * (Clubs are notified on creation via the create trigger below.)
 */
export const onApplicationStatusChanged = onDocumentUpdated('applications/{appId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status) return;

  const playerId = String(after.playerId ?? '');
  if (!playerId) return;

  const statusMessages: Record<string, string> = {
    viewed: 'A club has viewed your application.',
    shortlisted: 'Congratulations — you have been shortlisted!',
    trial_invited: 'You have been invited to a trial.',
    rejected: 'Your application was not taken forward this time.',
    accepted: 'Your application was accepted — check your messages.',
    withdrawn: 'Your application has been withdrawn.',
  };
  const body = statusMessages[after.status] ?? `Your application status changed to ${after.status}.`;

  await createNotification({
    userId: playerId,
    type: 'application_status_changed',
    title: 'Application update',
    body,
    metadata: {
      applicationId: event.params.appId,
      clubId: after.clubId ?? '',
      from: before.status ?? '',
      to: after.status ?? '',
    },
    email: after.status === 'accepted' || after.status === 'trial_invited',
  });
});

/** Notify the club when a new application arrives. */
export const onApplicationCreated = onDocumentCreated('applications/{appId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const clubId = String(data.clubId ?? '');
  if (!clubId) return;

  await createNotification({
    userId: clubId,
    type: 'application_received',
    title: 'New application received',
    body: 'A player has applied to your club.',
    metadata: { applicationId: event.params.appId, playerId: data.playerId ?? '' },
  });
});

/** Notify the player when a trial invitation/status changes. */
export const onTrialUpdated = onDocumentUpdated('trials/{trialId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status) return;

  const playerId = String(after.playerId ?? '');
  if (!playerId) return;

  await createNotification({
    userId: playerId,
    type: after.status === 'scheduled' ? 'trial_invitation' : 'trial_reminder',
    title: 'Trial update',
    body: `Your trial is now ${after.status}.`,
    metadata: { trialId: event.params.trialId, clubId: after.clubId ?? '' },
    email: after.status === 'scheduled',
  });
});

/**
 * Cancel outstanding matching jobs when a youth profile consent changes to
 * withdrawn (deferred execution safeguard).
 */
export const onConsentWithdrawnCancelJobs = onDocumentUpdated('youthProfiles/{youthId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.consentStatus === after.consentStatus) return;
  if (after.consentStatus !== 'withdrawn') return;

  const youthId = event.params.youthId;

  // 1) Cancel queued/processing matching jobs for this youth.
  const jobs = await adminDb
    .collection('matchingJobs')
    .where('playerId', '==', youthId)
    .where('status', 'in', ['pending', 'processing'])
    .get();
  const batch = adminDb.batch();
  for (const doc of jobs.docs) {
    batch.update(doc.ref, { status: 'failed', error: 'consent_withdrawn' });
  }
  await batch.commit();

  // 2) Remove pre-computed match results so youth data disappears immediately.
  const results = await adminDb
    .collection('matchResults')
    .where('playerId', '==', youthId)
    .get();
  const delBatch = adminDb.batch();
  for (const doc of results.docs) delBatch.delete(doc.ref);
  await delBatch.commit();

  await writeAuditLog({
    action: 'youth_consent_withdrawn_cascade',
    resourceType: 'youthProfiles',
    resourceId: youthId,
    actorId: 'system',
    actorRole: 'system',
    metadata: { jobsCancelled: jobs.size, resultsDeleted: results.size },
  });
});
