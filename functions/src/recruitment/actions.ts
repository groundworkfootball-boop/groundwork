import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole, requireUid, resolveRole, isYouthVerifiedNow } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';
import { sendNotification } from '../shared/notifications.js';

const sendMessageSchema = z.object({
  recipientId: z.string().min(1).max(128),
  content: z.string().min(1).max(2000),
  conversationId: z.string().max(200).optional(),
});

const trialResponseSchema = z.object({
  trialId: z.string().min(1),
  decision: z.enum(['accepted', 'declined']),
});

/**
 * Safeguarded messaging between authorized users.
 * Youth players cannot receive direct unapproved adult messages: if the target
 * is a minor, only a verified guardian or live youth-verified club with
 * active guardian consent can message, and conversations are flagged.
 */
export const sendSafeguardedMessage = onCall(async (request) => {
  const senderId = requireUid(request);
  const senderRole = await resolveRole(senderId, request.auth?.token as Record<string, unknown>);
  if (!senderRole) throw new HttpsError('permission-denied', 'No active role.');

  const parsed = sendMessageSchema.safeParse(request.data ?? {});
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Message content and recipientId are required.');
  }
  const { recipientId, content } = parsed.data;
  if (recipientId === senderId) {
    throw new HttpsError('invalid-argument', 'Cannot message yourself.');
  }

  const [senderSnap, recipientPlayerSnap, recipientUserSnap] = await Promise.all([
    adminDb.collection('users').doc(senderId).get(),
    adminDb.collection('players').doc(recipientId).get(),
    adminDb.collection('users').doc(recipientId).get(),
  ]);

  if (!recipientUserSnap.exists) {
    throw new HttpsError('not-found', 'Recipient not found.');
  }

  // Enforce strict youth messaging safeguarding server-side.
  const isRecipientYouth = recipientPlayerSnap.exists && recipientPlayerSnap.data()?.isYouth === true;
  if (isRecipientYouth) {
    if (senderRole === 'club') {
      const clubCheck = await isYouthVerifiedNow(senderId);
      const consentOk = recipientPlayerSnap.data()?.consentStatus === 'granted';
      if (!clubCheck.verified || !consentOk) {
        throw new HttpsError(
          'permission-denied',
          'Youth safeguarding blocks messaging without live youth verification and guardian consent.',
        );
      }
      // Route youth-related outreach to guardian email record and mark thread.
      throw new HttpsError(
        'permission-denied',
        'Direct messaging to minor players is disabled. Route trial invitations through the official trial & guardian workflow.',
      );
    } else if (senderRole !== 'guardian' && senderRole !== 'admin') {
      throw new HttpsError(
        'permission-denied',
        'Direct adult-to-youth messaging is blocked by safeguarding policy.',
      );
    }
  }

  const pair = [senderId, recipientId].sort();
  const conversationId = parsed.data.conversationId || `${pair[0]}_${pair[1]}`;
  const convRef = adminDb.collection('conversations').doc(conversationId);

  const senderName = (senderSnap.data()?.name as string | undefined) ?? 'Member';
  const recipientName = (recipientUserSnap.data()?.name as string | undefined) ?? 'Member';

  await convRef.set(
    {
      participantIds: pair,
      participantNames: { [senderId]: senderName, [recipientId]: recipientName },
      isYouthConversation: isRecipientYouth,
      lastMessagePreview: content.slice(0, 140),
      lastMessageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const msgRef = await convRef.collection('messages').add({
    senderId,
    senderName,
    senderRole,
    recipientId,
    content: content.trim(),
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendNotification({
    userId: recipientId,
    type: 'system',
    title: `New message from ${senderName}`,
    body: content.slice(0, 120),
    metadata: { conversationId, messageId: msgRef.id },
  });

  return { ok: true, conversationId, messageId: msgRef.id };
});

/** Player accepts or declines a scheduled trial invitation. */
export const respondToTrial = onCall(async (request) => {
  const playerId = await requireRole(request, 'player');
  const parsed = trialResponseSchema.safeParse(request.data ?? {});
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Valid trialId and decision are required.');
  }

  const { trialId, decision } = parsed.data;
  const trialRef = adminDb.collection('trials').doc(trialId);
  const snap = await trialRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Trial not found.');

  const trial = snap.data() ?? {};
  if (trial.playerId && trial.playerId !== playerId) {
    throw new HttpsError('permission-denied', 'You are not invited to this trial.');
  }

  await trialRef.update({
    playerResponse: decision,
    status: decision === 'accepted' ? 'confirmed' : 'declined',
    respondedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (trial.clubId) {
    await sendNotification({
      userId: String(trial.clubId),
      type: 'trial_invitation',
      title: `Trial ${decision}`,
      body: `A player ${decision} the invitation for ${trial.title ?? 'your trial'}.`,
      metadata: { trialId, decision, playerId },
    });
  }

  await writeAuditLog({
    action: `trial_${decision}`,
    resourceType: 'trials',
    resourceId: trialId,
    actorId: playerId,
    actorRole: 'player',
  });

  return { ok: true, trialId, decision };
});
