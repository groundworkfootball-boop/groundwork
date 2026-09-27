/**
 * Stripe webhook endpoint. Verifies the `stripe-signature` header against
 * STRIPE_WEBHOOK_SECRET using the raw request body, then processes events
 * idempotently via `processedStripeEvents`.
 */
export declare const stripeWebhook: import("firebase-functions/v2/https").HttpsFunction;
