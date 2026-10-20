# SECURITY

## Threat model

Assume an attacker has the Firebase SDK, browser DevTools, network inspection,
modified JavaScript and a custom API client. They must still be unable to:

- read unauthorized youth data
- change their own role
- change verification or consent state
- change payment or subscription state
- change match scores
- write admin records
- read private club notes
- access private videos

## Controls

### Authentication

- Firebase Auth (email/password + Google OAuth)
- Email verification required before privileged actions
- Password reset via Firebase's signed link
- Session persistence handled by the SDK

### Authorization

- **Custom claims are authoritative.** `request.auth.token.role` is the only
  role source used by rules and functions.
- The `users/{uid}.role` document field is a display fallback only.
- Admin accounts are never creatable through public registration — the
  `createAccount` callable rejects `role: "admin"`.
- Sub-roles (`isSuperAdmin`, `isModerator`, `isSafeguardingAdmin`,
  `isFinanceAdmin`) gate sensitive admin surfaces.

### Server-owned fields

Firestore rules reject client writes to:

| Collection | Protected fields |
| --- | --- |
| `players` | `profileCompleteness`, `searchable`, `consentStatus`, `consentGrantedAt`, `verified`, `isYouth`, `role`, boost fields, `matchScore`, `suspended`, `disabled` |
| `clubs` | `verificationStatus`, `verifiedAdult`, `verifiedYouth`, `youthVerificationExpiresAt`, `adminNotes`, `suspended`, `role`, subscription fields |
| `users` | `role`, `disabled`, `suspended`, `emailVerified` |

### Server-only collections

Clients cannot write to `matchResults`, `playerScores`, `consentAudits`,
`auditLogs`, `notifications` (create), `subscriptions`, `payments`, `boosts`,
`stripeEvents`, `aiJobs`, `aiResults`, `aiUsage`, `videoProcessingJobs`.

### Rate limiting and validation

- Every callable validates input with Zod schemas (`functions/src/shared/validation.ts`).
- AI calls are content-hashed, cached and rate-limited per user.
- Video uploads are validated server-side (ownership, clip count, MIME, size,
  duration, youth consent) — the client limit is not the security mechanism.

### Payments

- Stripe secret key exists only in Cloud Functions secrets.
- Webhook signature is verified before any processing.
- `processedStripeEvents/{eventId}` provides idempotency: a duplicate event
  returns success without repeating the operation.
- Subscription state is written only by the webhook handler.

### Audit logging

Append-only `auditLogs` records: actor, role, action, resource, timestamp,
metadata. Written exclusively by Cloud Functions. Clients can read (admins only)
but never write.

### Secrets

- No secrets in the repository. `.env` and `functions/.env` are gitignored.
- Cloud Functions secrets are set with `firebase functions:secrets:set`.
- The Firebase web API key is public by design; security is enforced by rules.

## Verification

```bash
npx firebase emulators:exec --only firestore "npx vitest run firestore.test.ts"
```

33 rule tests cover role escalation, youth access, consent states, server-owned
collections, notifications, club privacy, payments, applications, matching
config and GDPR requests.
