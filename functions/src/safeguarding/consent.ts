import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { adminDb } from '../shared/firebaseAdmin';

export const onConsentChange = onDocumentWritten('youthProfiles/{youthId}', async (event) => {
  const after = event.data?.after.data();
  if (!after) return;

  if (after.consentStatus === 'withdrawn') {
    await adminDb.collection('auditLogs').add({
      action: 'consent_withdrawn',
      resourceType: 'youthProfiles',
      resourceId: event.params.youthId,
      timestamp: new Date(),
      metadata: { searchable: false },
    });
  }
});
