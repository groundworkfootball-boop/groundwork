# Payments

Stripe is the single source of truth for entitlements. The browser never sends a
price, a status, or a verification flag, and it never activates anything.

## Server-side catalogue

All amounts live in code on the server:

| Product | Where defined | Amount |
| --- | --- | --- |
| Club · Standard | `functions/src/payments/checkout.ts` → `PLAN_CATALOG` | £49/mo |
| Club · Premium | `functions/src/payments/checkout.ts` → `PLAN_CATALOG` | £149/mo |
| Player Pro | `functions/src/payments/boosts.ts` → `PLAYER_PRO` | £9.99/mo |
| Boost 7 / 14 / 30 day | `functions/src/payments/boosts.ts` → `BOOST_PACKAGES` | £19 / £35 / £65 |

Clients reference a **plan key** (`standard`, `premium`, `14-day`, …). The
callable resolves the amount. A tampered client can only request a different
product, never a different price.

Optional Stripe Price IDs can override the inline `price_data`:

```
STRIPE_PRICE_STANDARD
STRIPE_PRICE_PREMIUM
STRIPE_PRICE_PLAYER_PRO
STRIPE_PRICE_BOOST_7
STRIPE_PRICE_BOOST_14
STRIPE_PRICE_BOOST_30
```

## Callables

| Function | Role | Purpose |
| --- | --- | --- |
| `createCheckoutSession` | club | Subscription checkout |
| `createBillingPortalSession` | club | Manage / cancel |
| `createBoostCheckout` | any signed-in | One-off boost |
| `createPlayerProCheckout` | any signed-in | Player Pro membership |

## Webhook

`stripeWebhook` is a plain HTTPS function:

1. Verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` using
   the raw request body.
2. Claims `processedStripeEvents/{eventId}` inside a transaction. A duplicate
   delivery returns `200 {duplicate:true}` without repeating side effects.
3. Handles `checkout.session.completed`, `customer.subscription.*` and
   `invoice.payment_*`.
4. On a one-off boost payment, derives the package from session metadata and
   calls `activateBoost` — the only code path that can grant a boost.
5. If the handler throws, the claim is removed so Stripe's retry is not ignored.

## Entitlement flow

```
Client  ──▶ createCheckoutSession ──▶ Stripe Checkout
                                          │
                                    payment succeeds
                                          │
Stripe  ──▶ stripeWebhook ──▶ subscriptions / boosts / payments
                                          │
                          club.subscriptionTier / players.boostStatus
                                          │
                              UI reads state (read-only)
```

The UI treats `subscriptionTier`, `subscriptionStatus`, `boostStatus` and
`boostExpiresAt` as **server-owned**. Firestore rules reject client writes to
those fields.

## Free (Spark) plan behaviour

Cloud Functions require Blaze. When they are unavailable the client cannot
activate anything, so instead it records intent in a request queue:

| Collection | Written by | Reconcile with |
| --- | --- | --- |
| `subscriptionRequests` | club | `adminActivateBoost` / manual plan update |
| `boostRequests` | club or player | `adminActivateBoost` |
| `consentRequests` | guardian | `grantConsentInApp` / `withdrawConsent` |
| `guardianLinkRequests` | guardian | `linkGuardianYouth` |

Rules pin `status == 'pending'` and `source == 'client_fallback'` on create, and
only an admin can advance them. **No entitlement is ever granted client-side.**

See `src/lib/services/paymentService.ts` and
`src/lib/services/guardianConsentService.ts` for the exact fallbacks.