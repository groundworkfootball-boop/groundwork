/**
 * Server-side plan catalogue. Clients can only reference these keys — prices
 * are NEVER accepted from the client.
 */
export declare const PLAN_CATALOG: Record<string, {
    priceIdEnv: string;
    defaultPriceId: string;
    planName: string;
}>;
/**
 * Creates a Stripe Checkout session for a subscription plan. The price comes
 * from the server-side catalogue keyed by the requested plan name.
 */
export declare const createCheckoutSession: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    url: string | null;
    sessionId: string;
}>, unknown>;
/** Create a Stripe Billing Portal session so clubs can manage/cancel. */
export declare const createBillingPortalSession: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    url: string;
}>, unknown>;
