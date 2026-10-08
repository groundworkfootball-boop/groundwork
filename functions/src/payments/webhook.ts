import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { writeAuditLog } from '../shared/audit.js';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (!key) return null;
  return new Stripe(key);
}

/**
 * Idempotency gate: returns true only the first time an event ID is seen.
 * Uses a transaction so concurrent deliveries of the same event are safe.
 */
async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
  const ref = adminDb.collection('processedStripeEvents').doc(eventId);
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        throw new Error('already_processed');
      }
      tx.create(ref, {
        eventId,
        eventType,
        processedAt: FieldValue.serverTimestamp(),
        processedAtMs: Date.now(),
      });
    });
    return true;
  } catch (err) {
    if (err instanceof Error && err.message === 'already_processed') return false;
    throw err;
  }
}

interface SubscriptionMeta {
  userId?: string;
  clubId?: string;
}

function metadataOf(obj: { metadata?: Stripe.Metadata | null } | null | undefined): SubscriptionMeta {
  const md = obj?.metadata ?? {};
  return { userId: md.userId || undefined, clubId: md.clubId || undefined };
}

async function applySubscriptionState(sub: Stripe.Subscription): Promise<void> {
  const meta = metadataOf(sub);
  const uid = meta.clubId ?? meta.userId;
  if (!uid) return;

  const status = sub.status;
  const priceId = sub.items.data[0]?.price.id ?? '';
  const currentPeriodEnd = sub.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000);

  await adminDb.collection('subscriptions').doc(sub.id).set(
    {
      userId: uid,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer,
      status,
      priceId,
      currentPeriodEndMs: currentPeriodEnd * 1000,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: Date.now(),
    },
    { merge: true },
  );

  const active = status === 'active' || status === 'trialing';
  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    await userRef.set(
      {
        subscriptionStatus: status,
        subscriptionActive: active,
        plan: active ? (priceId.includes('premium') ? 'premium' : 'standard') : 'free',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}

async function applyCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = metadataOf(session);
  const uid = meta.clubId ?? meta.userId;
  if (session.mode === 'subscription' && session.subscription) {
    const stripe = getStripe();
    if (stripe) {
      const sub = await stripe.subscriptions.retrieve(String(session.subscription));
      await applySubscriptionState(sub);
    }
  } else if (uid && session.payment_status === 'paid') {
    // One-off payment (e.g. visibility boost).
    await adminDb.collection('payments').add({
      userId: uid,
      stripeSessionId: session.id,
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? 'gbp',
      status: 'succeeded',
      purpose: (session.metadata?.purpose as string) ?? 'one_off',
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await writeAuditLog({
    action: 'stripe_checkout_completed',
    resourceType: 'payments',
    resourceId: session.id,
    actorId: uid ?? 'system',
    actorRole: 'system',
    metadata: { mode: session.mode },
  });
}

/**
 * Stripe webhook endpoint. Verifies the `stripe-signature` header against
 * STRIPE_WEBHOOK_SECRET using the raw request body, then processes events
 * idempotently via `processedStripeEvents`.
 */
export const stripeWebhook = onRequest({ region: 'europe-west1' }, async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  const stripe = getStripe();

  if (!stripe || !webhookSecret) {
    res.status(503).json({ error: 'Stripe is not configured.' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header.' });
    return;
  }

  let event: Stripe.Event;
  try {
    // Uses the raw body captured by Functions v2 for signature verification.
    event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
  } catch (err) {
    res.status(400).json({
      error: `Invalid signature: ${err instanceof Error ? err.message : 'unknown'}`,
    });
    return;
  }

  let fresh: boolean;
  try {
    fresh = await claimEvent(event.id, event.type);
  } catch (err) {
    console.error('stripe idempotency check failed', err);
    res.status(500).json({ error: 'Idempotency check failed.' });
    return;
  }
  if (!fresh) {
    // Duplicate delivery — acknowledge without repeating side effects.
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await applyCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applySubscriptionState(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await adminDb.collection('paymentEvents').add({
          type: event.type,
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amountPaid: invoice.amount_paid ?? 0,
          currency: invoice.currency ?? '',
          status: event.type.endsWith('failed') ? 'failed' : 'succeeded',
          stripeEventId: event.id,
          createdAt: FieldValue.serverTimestamp(),
        });
        break;
      }
      default:
        // Recorded but not acted upon.
        break;
    }

    await adminDb.collection('stripeWebhookLog').add({
      eventId: event.id,
      type: event.type,
      processedAt: FieldValue.serverTimestamp(),
      ok: true,
    });
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe webhook handler failed', event.type, err);
    // Do NOT leave the event claimed on failure — remove the claim so Stripe
    // retries are allowed.
    await adminDb
      .collection('processedStripeEvents')
      .doc(event.id)
      .delete()
      .catch(() => undefined);
    res.status(500).json({ error: 'Handler failed.' });
  }
});
