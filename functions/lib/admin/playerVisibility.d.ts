/**
 * Administrative player visibility toggle.
 *
 * `searchable` is a server-owned field: it is derived from consent for youth
 * players and must never be writable by the client. This callable is the only
 * sanctioned way for an administrator to override it, and it always audits.
 */
export declare const adminSetPlayerVisibility: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    playerId: string;
    searchable: boolean;
}>, unknown>;
