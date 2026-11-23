/**
 * Server-side price catalogue for one-off products. Clients only send a product
 * key; amounts, durations and currency always come from here.
 */
export declare const BOOST_PACKAGES: Record<string, {
    days: number;
    amountPence: number;
    label: string;
    priceIdEnv: string;
}>;
export declare const PLAYER_PRO: {
    amountPence: number;
    label: string;
    priceIdEnv: string;
};
/**
 * Create a Checkout session for a visibility boost. The boost itself is only
 * activated by the webhook (`applyCheckoutCompleted`) — never by this callable
 * and never by the client.
 */
export declare const createBoostCheckout: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    url: string | null;
    sessionId: string;
}>, unknown>;
/** Player Pro membership checkout. */
export declare const createPlayerProCheckout: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    url: string | null;
    sessionId: string;
}>, unknown>;
/**
 * Activate a boost after payment. Called from the webhook only (or by an admin
 * reconciliation job) so a client can never grant itself visibility.
 */
export declare function activateBoost(input: {
    userId: string;
    packageId: string;
    stripePaymentId: string;
    durationDays: number;
}): Promise<void>;
/** Admin-only: manually reconcile a paid session that the webhook missed. */
export declare const adminActivateBoost: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
