import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole, requireUid } from '../shared/authz.js';
import { writeAuditLog } from '../shared/audit.js';

/**
 * Server-side price catalogue for one-off products. Clients only send a product
 * key; amounts, durations and currency always come from here.
 */
export const BOOST_PACKAGES: Record<string, { days: number; amountPence: number; label: string; priceIdEnv: string }> = {
  '7-day': { days: 7, amountPence: 1900, label: '7-day visibility boost', priceIdEnv: 'STRIPE_PRICE_BOOST_7' },
  '14-day': { days: 14, amountPence: 3500, label: '14-day visibility boost', priceIdEnv: 'STRIPE_PRICE_BOOST_14' },
  '30-day': { days: 30, amountPence: 6500, label: '30-day visibility boost', priceIdEnv: 'STRIPE_PRICE_BOOST_30' },
};

export const PLAYER_PRO = { amountPence: 999, label: 'Player Pro', priceIdEnv: 'STRIPE_PRICE_PLAYER_PRO' };

function getStripeOrThrow(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (!key) throw new HttpsError('failed-precondition', 'Stripe is not configured.');
  return new Stripe(key);
}

function safeUrl(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.startsWith('https://') ? value : fallback;
}

/**
 * Create a Checkout session for a visibility boost. The boost itself is only
 * activated by the webhook (`applyCheckoutCompleted`) — never by this callable
 * and never by the client.
 */
export const createBoostCheckout = onCall(async (request) => {
  const uid = await requireUid(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const packageId = typeof data.packageId === 'string' ? data.packageId : '';
  const pkg = BOOST_PACKAGES[packageId];
  if (!pkg) throw new HttpsError('invalid-argument', 'Unknown boost package.');

  const stripe = getStripeOrThrow();
  const origin = safeUrl(data.origin, 'https://example.invalid');
  const priceId = process.env[pkg.priceIdEnv];

  const session = await stripe.checkout.sessions.create({
    mode: priceId ? 'subscription' : 'payment',
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'gbp',
              unit_amount: pkg.amountPence,
              product_data: { name: pkg.label },
            },
            quantity: 1,
          },
        ],
    success_url: safeUrl(data.successUrl, `${origin}/dashboard?status=success`),
    cancel_url: safeUrl(data.cancelUrl, `${origin}/dashboard?status=cancelled`),
    metadata: {
      userId: uid,
      purpose: 'boost',
      packageId,
      durationDays: String(pkg.days),
      amountPence: String(pkg.amountPence),
    },
    ...(priceId ? { subscription_data: { metadata: { userId: uid, purpose: 'boost', packageId } } } : {}),
  });

  await writeAuditLog({
    action: 'boost_checkout_created',
    resourceType: 'boosts',
    resourceId: session.id,
    actorId: uid,
    actorRole: (request.auth?.token.role as string) ?? 'player',
    metadata: { packageId, amountPence: pkg.amountPence },
  });

  return { url: session.url, sessionId: session.id };
});

/** Player Pro membership checkout. */
export const createPlayerProCheckout = onCall(async (request) => {
  const uid = await requireUid(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const stripe = getStripeOrThrow();
  const priceId = process.env[PLAYER_PRO.priceIdEnv];
  const origin = safeUrl(data.origin, 'https://example.invalid');

  const session = await stripe.checkout.sessions.create({
    mode: priceId ? 'subscription' : 'payment',
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'gbp',
              unit_amount: PLAYER_PRO.amountPence,
              product_data: { name: PLAYER_PRO.label },
            },
            quantity: 1,
          },
        ],
    success_url: safeUrl(data.successUrl, `${origin}/dashboard/subscription?status=success`),
    cancel_url: safeUrl(data.cancelUrl, `${origin}/dashboard/subscription?status=cancelled`),
    metadata: { userId: uid, purpose: 'player_pro', amountPence: String(PLAYER_PRO.amountPence) },
    ...(priceId ? { subscription_data: { metadata: { userId: uid, purpose: 'player_pro' } } } : {}),
  });

  return { url: session.url, sessionId: session.id };
});

/**
 * Activate a boost after payment. Called from the webhook only (or by an admin
 * reconciliation job) so a client can never grant itself visibility.
 */
export async function activateBoost(input: {
  userId: string;
  packageId: string;
  stripePaymentId: string;
  durationDays: number;
}): Promise<void> {
  const now = Date.now();
  const expiresMs = now + input.durationDays * 24 * 60 * 60 * 1000;

  await adminDb.collection('boosts').add({
    userId: input.userId,
    clubId: input.userId,
    packageId: input.packageId,
    status: 'active',
    stripePaymentId: input.stripePaymentId,
    startsAtMs: now,
    endsAtMs: expiresMs,
    boostStartedAt: FieldValue.serverTimestamp(),
    boostExpiresAt: new Date(expiresMs),
    createdAt: FieldValue.serverTimestamp(),
  });

  await adminDb.collection('players').doc(input.userId).set(
    {
      boostStatus: 'active',
      boostProduct: input.packageId,
      boostStartedAt: FieldValue.serverTimestamp(),
      boostExpiresAt: new Date(expiresMs),
      stripePaymentId: input.stripePaymentId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/** Admin-only: manually reconcile a paid session that the webhook missed. */
export const adminActivateBoost = onCall(async (request) => {
  await requireRole(request, 'admin');
  const data = (request.data ?? {}) as Record<string, unknown>;
  const userId = typeof data.userId === 'string' ? data.userId : '';
  const packageId = typeof data.packageId === 'string' ? data.packageId : '';
  const pkg = BOOST_PACKAGES[packageId];
  if (!userId || !pkg) throw new HttpsError('invalid-argument', 'userId and a known packageId are required.');

  await activateBoost({
    userId,
    packageId,
    stripePaymentId: typeof data.stripePaymentId === 'string' ? data.stripePaymentId : 'manual',
    durationDays: pkg.days,
  });

  await writeAuditLog({
    action: 'boost_activated_manually',
    resourceType: 'boosts',
    resourceId: userId,
    actorId: request.auth!.uid,
    actorRole: 'admin',
    metadata: { packageId },
  });

  return { ok: true };
});