# GROUNDWORK Security Model & Policies

## 1. Zero Trust Architecture
Security in GROUNDWORK is designed under the assumption that clients may be running modified JavaScript or attacking through raw API/SDK calls.

- **Frontend is Untrusted:** The client never authorizes itself. All critical checks are enforced server-side via Firestore Security Rules and Firebase Custom Claims.
- **Role Escalation Protection:** Normal users cannot grant themselves admin, club, or verification privileges. Custom claims can only be written by Cloud Functions using the Firebase Admin SDK.
- **Payment Integrity:** Client cannot specify prices or self-fulfill subscriptions/boosts. Stripe webhooks with cryptographic signature verification (`stripe-signature`) and idempotency checks (`processedStripeEvents`) are authoritative.

## 2. Firestore Security Rules Breakdown
- `users/{uid}`: Read by owner, write restricted; roles cannot be modified directly.
- `players/{uid}`: Read allowed for search if searchable; private contact fields protected. Youth profiles strictly require guardian consent and club youth verification.
- `clubs/{uid}`: Club details publicly visible; verification flags (`verifiedAdult`, `verifiedYouth`) read-only to club and only modifiable by admins.
- `clubInvites/{id}`: Club owners manage invitations; public read of active code links.
- `consentAudit/{id}`: Strictly append-only. No edits or deletes permitted under any circumstances.
- `auditLogs/{id}`: Immutable administrative activity log.

## 3. Storage Security Rules
- Max file size: 50MB for video highlights, 5MB for profile photos and verification certificates.
- Path-based ownership check: `/users/{userId}/*` can only be written by authenticated user `{userId}`.
- Private document directories for club verification certificates, accessible solely by the submitting club and platform administrators.
