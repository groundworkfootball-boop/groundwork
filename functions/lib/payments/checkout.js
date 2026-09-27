import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole } from '../shared/authz.js';
/**
 * Server-side plan catalogue. Clients can only reference these keys — prices
 * are NEVER accepted from the client.
 */
export const PLAN_CATALOG = {
    standard: {
        priceIdEnv: 'STRIPE_PRICE_STANDARD',
        defaultPriceId: 'price_standard_mock',
        planName: 'standard',
    },
    premium: {
        priceIdEnv: 'STRIPE_PRICE_PREMIUM',
        defaultPriceId: 'price_premium_mock',
        planName: 'premium',
    },
};
function getStripeOrThrow() {
    const key = process.env.STRIPE_SECRET_KEY ?? '';
    if (!key)
        throw new HttpsError('failed-precondition', 'Stripe is not configured.');
    return new Stripe(key);
}
/**
 * Creates a Stripe Checkout session for a subscription plan. The price comes
 * from the server-side catalogue keyed by the requested plan name.
 */
export const createCheckoutSession = onCall(async (request) => {
    const uid = await requireRole(request, 'club');
    const { plan, successUrl, cancelUrl } = (request.data ?? {});
    const planKey = typeof plan === 'string' ? plan.toLowerCase() : '';
    const catalogEntry = PLAN_CATALOG[planKey];
    if (!catalogEntry) {
        throw new HttpsError('invalid-argument', 'Unknown plan. Use standard or premium.');
    }
    const priceId = process.env[catalogEntry.priceIdEnv] || catalogEntry.defaultPriceId;
    const stripe = getStripeOrThrow();
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const email = userSnap.data()?.email ?? undefined;
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: typeof successUrl === 'string' && successUrl.startsWith('https://')
            ? successUrl
            : 'https://example.invalid/billing/success',
        cancel_url: typeof cancelUrl === 'string' && cancelUrl.startsWith('https://')
            ? cancelUrl
            : 'https://example.invalid/billing/cancel',
        metadata: { userId: uid, clubId: uid, plan: catalogEntry.planName },
        subscription_data: { metadata: { userId: uid, clubId: uid, plan: catalogEntry.planName } },
    });
    return { url: session.url, sessionId: session.id };
});
/** Create a Stripe Billing Portal session so clubs can manage/cancel. */
export const createBillingPortalSession = onCall(async (request) => {
    const uid = await requireRole(request, 'club');
    const stripe = getStripeOrThrow();
    // Resolve the customer id from our subscriptions collection.
    const subsSnap = await adminDb
        .collection('subscriptions')
        .where('userId', '==', uid)
        .limit(1)
        .get();
    const customerId = subsSnap.empty
        ? null
        : subsSnap.docs[0].data().stripeCustomerId;
    if (!customerId) {
        throw new HttpsError('failed-precondition', 'No billing account found for this club.');
    }
    const returnUrl = typeof request.data?.returnUrl === 'string'
        ? String(request.data.returnUrl)
        : 'https://example.invalid/billing';
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl.startsWith('https://') ? returnUrl : 'https://example.invalid/billing',
    });
    return { url: session.url };
});
